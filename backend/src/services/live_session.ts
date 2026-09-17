import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class LiveSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async createLiveSession(name: string, ownerId: string) {
    const host = await this.prisma.user.findUnique({ where: { id: ownerId } });
    if (!host) {
      throw new NotFoundException('Host user not found');
    }

    return this.prisma.liveSession.create({
      data: {
        name,
        hostUserId: ownerId,
        invitedUsers: {
          connect: { id: ownerId },
        },
      },
    });
  }

  async inviteUser(sessionId: string, userId: string) {
    return this.prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        invitedUsers: {
          connect: { id: userId },
        },
      },
    });
  }

  async voteForTrack(sessionId: string, trackId: string, userId: string) {
    try {
      return await this.prisma.vote.create({
        data: {
          liveSessionId: sessionId,
          trackId,
          userId,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new BadRequestException('User has already voted for this track');
      }
      throw err;
    }
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
	return await this.prisma.liveSession.findUnique({ where: {id: sessionId } });
  })
}