import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class LiveSessionService {
	private prisma = new PrismaClient();
  constructor() {}

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
// 	try {
// 	  return await this.prisma.vote.create({
// 		data: {
// 		  liveSessionId: sessionId,
// 		  trackId,
// 		  userId,
// 		},
// 	  });
// 	} catch (err) {
// 	  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
// 		throw new BadRequestException('User has already voted for this track');
// 	  }
// 	  throw err;
// 	}
//   }

  // version faustoche
  async voteForTrack(sessionId: string, trackId: string, userId: string) {
    // 1. On vérifie si le vote existe déjà pour cet utilisateur et ce morceau
    const existingVote = await this.prisma.vote.findUnique({
      where: {
        liveSessionId_trackId_userId: {
          liveSessionId: sessionId,
          trackId: trackId,
          userId: userId,
        }
      }
    });

    // 2. S'il existe, on le supprime (Retrait du Like)
    if (existingVote) {
      return await this.prisma.vote.delete({
        where: {
          liveSessionId_trackId_userId: {
            liveSessionId: sessionId,
            trackId: trackId,
            userId: userId,
          }
        }
      });
    }

    // 3. S'il n'existe pas, on le crée (Ajout du Like)
    return await this.prisma.vote.create({
      data: {
        liveSessionId: sessionId,
        trackId: trackId,
        userId: userId,
      }
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
// 	return await this.prisma.liveSession.findUnique({ where: {id: sessionId } });
//   }


  // VERSION FAUSTINE!!!!
  // Récupérer la session AVEC les musiques et les votes
  async getSessionById(sessionId: string) {
    return await this.prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        liveSessionTracks: {
          include: {
            track: true,
            votes: true,
          }
        }
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