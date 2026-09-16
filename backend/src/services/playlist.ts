import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Créer une playlist
export async function createPlaylist(name: string, ownerId: string) {
  if (!name) throw new Error('Le nom de la playlist est obligatoire');
  const playlist = await prisma.playlist.create({
	data: {
	  name: name,
	  ownerId: ownerId,
	  imageUrl: "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"
	}
  });
  return playlist;
}

// Récupérer UNE playlist par son id
export async function getPlaylistById(id: string) {
  const playlist = await prisma.playlist.findUnique({
	where: { id: id },
	include: { 
	  owner: true,
	  playlistTracks: {
		include: {
		  track: true,
		  addedBy: true,
		}
	  }
	}
  });

  if (!playlist) return null;

  return {
	...playlist,
	tracks: playlist.playlistTracks.map((pt) => ({
	  id: pt.track.sourceId,
	  title: pt.track.title,
	  artist: pt.track.artist,
	  thumbnail: `https://i.ytimg.com/vi/${pt.track.sourceId}/hqdefault.jpg`,
	  addedBy: pt.addedBy
	})),
  };
}

// Récupérer les playlists d'un utilisateur (les siennes ET celles qu'il a acceptées)
export async function getMyPlaylists(ownerId: string) {
  return await prisma.playlist.findMany({
	where: {
	  OR: [
		{ ownerId: ownerId },
		{
		  collaborators: {
			some: {
			  userId: ownerId,
			  status: "ACCEPTED"
			}
		  }
		}
	  ]
	},
	include: {
		owner: true,
	}
  });
}

// Récupérer les playlists PUBLIQUES
export async function getPublicPlaylists() {
  return await prisma.playlist.findMany({
	where: { isPublic: true },
  });
}

// Playlists PUBLIQUES d'un autre utilisateur
export async function getUserPublicPlaylists(ownerId: string) {
  return await prisma.playlist.findMany({
	where: {
	  ownerId: ownerId,
	  isPublic: true,
	},
  });
}

export async function addTrackToPlaylist(playlistId: string, title: string, artist: string, sourceId: string, addedById: string) {
  let track = await prisma.track.findFirst({
	where: { sourceId },
  });

  if (!track) {
	track = await prisma.track.create({
	  data: { title, artist, sourceId },
	});
  }

  return prisma.playlistTrack.create({
	data: {
	  playlistId,
	  trackId: track.id,
	  position: 0,
	  addedById,
	},
  });
}

export async function updatePlaylist(
  playlistId: string, 
  name: string,
  imageUrl: string,
  isPublic: boolean,
) {
  return await prisma.playlist.update({
	where: { id: playlistId },
	data: { name, imageUrl, isPublic },
  });
}

export async function inviteCollaborator(
  playlistId: string,
  userId: string,
) {
  return await prisma.playlistCollaborator.create({
	data: {
	  playlistId,
	  userId,
	  status: "PENDING",
	}
  });
}

export async function updateCollaborationStatus(
  collaborationId: string,
  status: "PENDING" | "ACCEPTED" | "REJECTED",
) {
  return await prisma.playlistCollaborator.update({
	where: { id: collaborationId },
	data: { status },
  });
}

// Récupérer les demandes de collaboration en attente pour la notification
export async function getPendingCollaborations(userId: string) {
  return await prisma.playlistCollaborator.findMany({
	where: {
	  userId: userId,
	  status: "PENDING"
	},
	include: {
	  playlist: {
		include: { owner: true }
	  }
	}
  });
}