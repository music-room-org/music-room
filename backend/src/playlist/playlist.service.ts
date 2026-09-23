import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaylistService {
	constructor(private readonly prisma: PrismaService) {}

	// Créer une playlist
	async createPlaylist(name: string, ownerId: string) {
		if (!name) throw new Error('Le nom de la playlist est obligatoire');
		if (name.length > 15) throw new Error("Username cannot be longer than 15 characters.");
		const playlist = await this.prisma.playlist.create({
			data: {
				name: name,
				ownerId: ownerId,
				imageUrl: "https://blog.landr.com/wp-content/uploads/2017/07/how-to-get-on-a-playlist-feature.png"
			}
		});
		return playlist;
	}

	// Récupérer UNE playlist par son id
	async getPlaylistById(id: string) {
		const playlist = await this.prisma.playlist.findUnique({
		where: { id: id },
		include: { 
			owner: true,
			collaborators: true,
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
	async getMyPlaylists(ownerId: string) {
	  return await this.prisma.playlist.findMany({
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
		  collaborators: true, // <-- Ajoute cette ligne
		},
	  });
	}

	// Récupérer les playlists PUBLIQUES
	async getPublicPlaylists() {
	  return await this.prisma.playlist.findMany({
		where: { 
			isPublic: true ,
			owner: {
				email: {
					not: 'admin@music-room.com'
				}
			}
		},
		include: { owner: true },
	  });
	}

	// Playlists PUBLIQUES d'un autre utilisateur
	async getUserPublicPlaylists(ownerId: string) {
	  return await this.prisma.playlist.findMany({
		where: {
		  ownerId: ownerId,
		  isPublic: true,
		},
	  });
	}

	async addTrackToPlaylist(playlistId: string, title: string, artist: string, sourceId: string, addedById: string) {
	  let track = await this.prisma.track.findFirst({
		where: { sourceId },
	  });

	  if (!track) {
		track = await this.prisma.track.create({
		  data: { title, artist, sourceId },
		});
	  }

	  return this.prisma.playlistTrack.create({
		data: {
		  playlistId,
		  trackId: track.id,
		  position: 0,
		  addedById,
		},
	  });
	}

	async updatePlaylist(
	  playlistId: string, 
	  name: string,
	  imageUrl: string,
	  isPublic: boolean,
	) {
		if (name.length > 15) throw new Error("Username cannot be longer than 15 characters.");
		return await this.prisma.playlist.update({
			where: { id: playlistId },
			data: { name, imageUrl, isPublic },
		});
	}

	async inviteCollaborator(
	  playlistId: string,
	  userId: string,
	) {
	  return await this.prisma.playlistCollaborator.create({
		data: {
		  playlistId,
		  userId,
		  status: "PENDING",
		}
	  });
	}

	async updateCollaborationStatus(
	  collaborationId: string,
	  status: "PENDING" | "ACCEPTED" | "REJECTED",
	) {
	  return await this.prisma.playlistCollaborator.update({
		where: { id: collaborationId },
		data: { status },
	  });
	}

	// Récupérer les demandes de collaboration en attente pour la notification
	async getPendingCollaborations(userId: string) {
	  return await this.prisma.playlistCollaborator.findMany({
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

	async getRecommendedPlaylists() {
	  return await this.prisma.playlist.findMany({
		where: { 
			owner: { email: 'admin@music-room.com' } 
		},
		include: { owner: true },
	  });
	}

	async removeTrackFromPlaylist(playlistId: string, trackId: string, userId: string) {
		const playlist = await this.prisma.playlist.findUnique({
			where: { id: playlistId },
			include: { owner: true }
		});

		if (!playlist) {
			throw new Error("Playlist introuvable.");
		}

		if (playlist.owner.username === 'Music-Room' && playlist.ownerId !== userId) {
			throw new Error("Les playlists officielles de Music-Room ne peuvent pas être modifiées.");
		}

		await this.prisma.playlistTrack.deleteMany({
			where: { playlistId: playlistId, trackId: trackId }
		});
		return { message: 'Track deleted' };
	}

	async searchPublicPlaylists(query: string) {
		return await this.prisma.playlist.findMany({
			where: {
				isPublic: true,
				name: { contains: query, mode: 'insensitive' },
				owner: {
					email: { not: 'admin@music-room.com' }
				}
			},
			include: { owner: true },
		});
	}

	async deletePlaylist(playlistId: string) {
		await this.prisma.playlistTrack.deleteMany({
			where: { playlistId: playlistId }
		});

		await this.prisma.playlistCollaborator.deleteMany({
			where: { playlistId: playlistId }
		});

		return await this.prisma.playlist.delete({
			where: { id: playlistId }
		});
	}
}