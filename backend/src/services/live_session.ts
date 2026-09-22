import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

function getDistanceInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371e3; 
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; 
}

@Injectable()
export class LiveSessionService {
    private prisma = new PrismaClient();

    constructor() {}

    async createLiveSession(
        name: string, 
        ownerId: string, 
        isPublic: boolean, 
        license: any, 
        invitedUserIds: string[] = [],
        latitude?: number,
        longitude?: number,
        startTime?: string,
        endTime?: string
    ) {
        if (name && name.length > 15) throw new BadRequestException("Username cannot be longer than 15 characters.");

        const invitees = invitedUserIds.map(id => ({ id }));
        invitees.push({ id: ownerId });

        return await this.prisma.liveSession.create({
            data: { 
                name, 
                hostUserId: ownerId, 
                isPublic,
                license,
                latitude: latitude ? parseFloat(latitude as any) : null,
                longitude: longitude ? parseFloat(longitude as any) : null,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                invitedUsers: { connect: invitees },
            },
        });
    }

    async updateLiveSession(
        sessionId: string, 
        name: string, 
        isPublic: boolean, 
        license: any, 
        invitedUserIds: string[] = [],
        latitude?: number,
        longitude?: number,
        startTime?: string,
        endTime?: string
    ) {
        if (name && name.length > 15) throw new BadRequestException("Username cannot be longer than 15 characters.");
        const invitees = invitedUserIds.map(id => ({ id }));
        
        return await this.prisma.liveSession.update({
            where: { id: sessionId },
            data: {
                name,
                isPublic,
                license,
                latitude: latitude ? parseFloat(latitude as any) : null,
                longitude: longitude ? parseFloat(longitude as any) : null,
                startTime: startTime ? new Date(startTime) : null,
                endTime: endTime ? new Date(endTime) : null,
                invitedUsers: { connect: invitees }
            }
        });
    }

    async getAvailableSessions(userId: string) {
        return await this.prisma.liveSession.findMany({
            where: {
                OR: [
                    { isPublic: true },
                    { hostUserId: userId },
                    { invitedUsers: { some: { id: userId } } }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async inviteiUser(sessionId: string, userId: string) {
        return this.prisma.liveSession.update({
            where: { id: sessionId },
            data: {
                invitedUsers: {
                    connect: { id: userId },
                },
            },
        });
    }

    async voteForTrack(sessionId: string, trackId: string, userId: string, userLat?: number, userLon?: number) {
        const session = await this.prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: { invitedUsers: true }
        });

        if (!session) throw new NotFoundException('Impossible to find session');

        const isHost = session.hostUserId === userId;
        const isInvited = session.invitedUsers.some(user => user.id === userId);

        if (!session.isPublic && !isInvited && !isHost) {
                throw new ForbiddenException("You do not have access to this event.");
        }

        if (session.license === 'INVITED_ONLY' && !isInvited && !isHost) {
                throw new ForbiddenException("Only users invited can vote.");
        }

        if (session.license === 'LOCATION_TIME') {
            const now = new Date();
            
            // 1. Le temps s'applique à tout le monde, même l'hôte
            if (session.startTime && now < session.startTime) {
                throw new ForbiddenException("Event has not started yet.");
            }
            if (session.endTime && now > session.endTime) {
                throw new ForbiddenException("Event is finished.");
            }

            // 2. La localisation s'applique UNIQUEMENT aux invités
            if (!isHost && session.latitude && session.longitude) {
                if (userLat === undefined || userLon === undefined) {
                    throw new BadRequestException("GPS tracking is mandatory to vote for this event.");
                }

                const distance = getDistanceInMeters(session.latitude, session.longitude, userLat, userLon);
                
                if (distance > 3) {
                    throw new ForbiddenException(`You have to be on the event's site to vote and add tracks (less than 3 meters).`);
                }
            }
        }

        const existingVote = await this.prisma.vote.findUnique({
            where: {
                liveSessionId_trackId_userId: { liveSessionId: sessionId, trackId, userId }
            }
        });

        if (existingVote) {
            return await this.prisma.vote.delete({
                where: {
                    liveSessionId_trackId_userId: { liveSessionId: sessionId, trackId, userId }
                }
            });
        }

        return await this.prisma.vote.create({
            data: { liveSessionId: sessionId, trackId, userId }
        });
    }

    async getNextTrack(sessionId: string) {
        const tracks = await this.prisma.liveSessionTrack.findMany({
            where: { liveSessionId: sessionId },
            include: {
                track: true,
                _count: { select: { votes: true } },
            },
        });

        if (tracks.length === 0) return null;

        return tracks.sort((a, b) => {
            const voteDiff = b._count.votes - a._count.votes;
            if (voteDiff !== 0) return voteDiff;
            return a.addedAt.getTime() - b.addedAt.getTime();
        })[0];
    }

    async deleteSessionTrack(sessionId: string, trackId: string) {
        await this.prisma.liveSessionTrack.delete({
            where: {
                liveSessionId_trackId: {
                    liveSessionId: sessionId,
                    trackId,
                },
            },
        });
    }

    async endLiveSession(sessionId: string) {
        await this.prisma.liveSession.delete({ where: { id: sessionId } });
    }

    async getSessionById(sessionId: string) {
        return await this.prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: {
                liveSessionTracks: {
                    orderBy: {
                        votes: { _count: 'desc' }
                    },
                    include: { track: true, votes: true }
                },
                invitedUsers: true
            }
        });
    }
    
    async addTrackToLiveSession(
        sessionId: string, 
        userId: string, 
        title: string, 
        artist: string, 
        sourceId: string, 
        userLat?: number, 
        userLon?: number
    ) {
        const session = await this.prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: { invitedUsers: true }
        });

        if (!session) throw new NotFoundException('Impossible to find this session.');

        const isHost = session.hostUserId === userId;
        const isInvited = session.invitedUsers.some(user => user.id === userId);

        if (!session.isPublic && !isInvited && !isHost) {
            throw new ForbiddenException("You do not have access to this event.");
        }

        if (session.license === 'INVITED_ONLY' && !isInvited && !isHost) {
            throw new ForbiddenException("Only users invited can vote.");
        }

        if (session.license === 'LOCATION_TIME') {
            const now = new Date();
            
            if (session.startTime && now < session.startTime) {
                throw new ForbiddenException("Event has not started yet.");
            }
            if (session.endTime && now > session.endTime) {
                throw new ForbiddenException("Event is finished.");
            }

            // 2. La localisation s'applique UNIQUEMENT aux invités
            if (!isHost && session.latitude && session.longitude) {
                if (userLat === undefined || userLon === undefined) {
                    throw new BadRequestException("GPS tracking is mandatory to add tracks to this event.");
                }

                const distance = getDistanceInMeters(session.latitude, session.longitude, userLat, userLon);
                
                if (distance > 1) {
                    throw new ForbiddenException(`You have to be on the event's site to vote and add tracks (less than 3 meters)..`);
                }
            }
        }

        let track = await this.prisma.track.findFirst({ where: { sourceId } });
                  
        if (!track) {
            track = await this.prisma.track.create({
                data: { title, artist: artist || "", sourceId }
            });
        }

        return await this.prisma.liveSessionTrack.create({
            data: {
                liveSessionId: sessionId,
                trackId: track.id,
            }
        });
    }
}