import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class LiveSessionService {
    private prisma = new PrismaClient();
    constructor() {}

    // async createLiveSession(name: string, ownerId: string) {
    // const host = await this.prisma.user.findUnique({ where: { id: ownerId } });
    // if (!host) {
    //   throw new NotFoundException('Host user not found');
    // }

    // return this.prisma.liveSession.create({
    //   data: {
    //  name,
    //  hostUserId: ownerId,
    //  invitedUsers: {
    //    connect: { id: ownerId },
    //  },
    //   },
    // });
    // }

    // version faustine
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
        // On lie le créateur ET les utilisateurs invités
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

    // version faustine
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

//   async voteForTrack(sessionId: string, trackId: string, userId: string) {
//  try {
//    return await this.prisma.vote.create({
//      data: {
//        liveSessionId: sessionId,
//        trackId,
//        userId,
//      },
//    });
//  } catch (err) {
//    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
//      throw new BadRequestException('User has already voted for this track');
//    }
//    throw err;
//  }
//   }

    // version faustoche
    async voteForTrack(sessionId: string, trackId: string, userId: string) {
        const session = await this.prisma.liveSession.findUnique({
            where: { id: sessionId },
            include: { invitedUsers: true }
        });

        if (!session) throw new NotFoundException('Session introuvable');

        const isHost = session.hostUserId === userId;
        const isInvited = session.invitedUsers.some(user => user.id === userId);

        if (!session.isPublic && !isInvited && !isHost) {
                throw new ForbiddenException("Vous n'avez pas accès à cet événement.");
        }

        if (session.license === 'INVITED_ONLY' && !isInvited && !isHost) {
                throw new ForbiddenException("Seuls les invités peuvent voter.");
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

//   async getSessionById(sessionId: string) {
//  return await this.prisma.liveSession.findUnique({ where: {id: sessionId } });
//   }

    // VERSION FAUSTINE!!!!
    // Récupérer la session AVEC les musiques et les votes
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
    
    async addTrackToLiveSession(sessionId: string, title: string, artist: string, sourceId: string) {
        // Vérifie si la piste existe déjà dans la base globale
        let track = await this.prisma.track.findFirst({ where: { sourceId } });
        
        if (!track) {
            track = await this.prisma.track.create({
                data: { title, artist: artist || "", sourceId }
            });
        }

        // Lie la piste à la session live
        return await this.prisma.liveSessionTrack.create({
            data: {
                liveSessionId: sessionId,
                trackId: track.id,
            }
        });
    }
}