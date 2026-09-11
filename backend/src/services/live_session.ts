import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function deleteSessionTrack(SessionId: string, TrackId: string) {
	await prisma.liveSessionTrack.delete({
		where: {
			liveSessionId_trackId: {
				liveSessionId: SessionId,
				trackId: TrackId
			},
		},
	});
}

export async function createLiveSession(name: string, ownerId: string) {
	const host = await prisma.user.findUnique({ where: { id: ownerId } });
	if (!host) {
		throw new Error('Host user not found');
	}

	return prisma.liveSession.create({
		data: {
			name,
			hostUserId: ownerId,
			invitedUsers: {
				connect: { id: ownerId },
			},
		},
	});
}


export async function getNextTrack(SessionId: string) {
	const tracks = await prisma.liveSessionTrack.findMany({
		where: { liveSessionId: SessionId },
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

export async function voteForTrack(SessionId: string, TrackId: string, userId: string) {
	await prisma.vote.create({
		data: {
			liveSessionId: SessionId,
			trackId: TrackId,
			userId: userId
		},
	});
}

export async function inviteUser(SessionId: string, userId: string) {
	return prisma.liveSession.update({
		where: { id: SessionId },
		data: {
			invitedUsers: {
				connect: { id: userId },
			},
		},
	});
}


export async function endLiveSession(SessionId: string) {
	await prisma.vote.deleteMany({ where: { liveSessionId: SessionId } });
	await prisma.liveSession.delete({ where: { id: SessionId } });
}