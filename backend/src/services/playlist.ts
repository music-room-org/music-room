import { PrismaService } from 'src/prisma/prisma.service';

const prisma = new PrismaService();

// Créer une playlist
export async function createPlaylist(name: string, ownerId: string) {
	if (!name) throw new Error('Le nom de la playlist est obligatoire');

	const playlist = await prisma.playlist.create({
		data: {
			name: name,
			ownerId: ownerId,
			imageUrl: "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"
		},
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
				},
			},
		},
	});

	if (!playlist)
		return null;

	return {
		...playlist,
		tracks: playlist.playlistTracks.map((pt) => ({
			id: pt.track.sourceId,
			title: pt.track.title,
			artist: pt.track.artist,
			thumbnail: `https://i.ytimg.com/vi/${pt.track.sourceId}/hqdefault.jpg`,
		})),
	};
}

// Récupérer les playlists d'un utilisateur (les siennes)
export async function getMyPlaylists(ownerId: string) {
	return await prisma.playlist.findMany({
		where: { ownerId: ownerId },
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

export async function addTrackToPlaylist(playlistId: string, title: string, artist: string, sourceId: string) {
	let track = await prisma.track.findFirst({
		where: {
			sourceId,
		},
	});

	if (!track) {
		track = await prisma.track.create({
			data: {
				title,
				artist,
				sourceId,
			},
		});
	}
	
	return prisma.playlistTrack.create({
		data: {
			playlistId,
			trackId: track.id,
			position: 0,
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
		where: {
			id: playlistId,
		},
		data: {
			name,
			imageUrl,
			isPublic,
		},
	});
}