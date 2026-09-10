import { PrismaClient } from '@prisma/client';
import { Session } from 'node:inspector';

const prisma = new PrismaClient();

async function deleteLiveSessionTrack(SessionId: string, TrackId: string) {
}

export async function createLiveSession(name: string, ownerId: string) {
	
}


export async function getNextTrackId(SessionId: string) {

}

export async function voteForTrack(SessionId: string, TrackId: string, userId: string) {

}

export async function inviteUser(SessionId: string, userId: string) {

}


export async function endLiveSession(SessionId: string) {
	const LiveSession = await prisma.LiveSession.findUnique({
		where: {id: SessionId}
	})
}