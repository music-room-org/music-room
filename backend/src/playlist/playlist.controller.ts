import { Controller, Post, Query, Get, Patch, NotFoundException, ForbiddenException, Body, Delete, Param, UseGuards, Request } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { Guard } from '../security/guard';
import { FriendsGateway } from '../friends/friends.gateway';

@Controller('playlists')
export class PlaylistController {
	constructor(
	private readonly friendsGateway: FriendsGateway,
	private readonly playlistService: PlaylistService
	) {}

	@UseGuards(Guard)
	@Post()
	async create(@Body() body: any, @Request() request: any) {
	return await this.playlistService.createPlaylist(body.name, request.userId);
	}

	// La route "pending" doit ABSOLUMENT être ici pour faire fonctionner la cloche
	@UseGuards(Guard)
	@Get('collaborators/pending')
	async getPendingCollabs(@Request() request: any) {
	return await this.playlistService.getPendingCollaborations(request.userId);
	}

	@UseGuards(Guard)
	@Get('search')
	async searchPlaylists(@Query('q') query: string) {
		if (!query) return [];
		return await this.playlistService.searchPublicPlaylists(query);
	}

	@Get()
	async findAll() {
	return await this.playlistService.getPublicPlaylists();
	}

	@UseGuards(Guard)
	@Delete(':id/tracks/:trackId')
	async removeTrack(@Param('id') playlistId: string, @Param('trackId') trackId: string, @Request() request: any) {
		return await this.playlistService.removeTrackFromPlaylist(playlistId, trackId, request.userId);
	}

  @UseGuards(Guard)
  @Delete(':id')
  async deletePlaylistRoute(@Param('id') id: string, @Request() request: any) {
      const playlist = await this.playlistService.getPlaylistById(id);
      if (!playlist) throw new NotFoundException("Playlist introuvable.");
      if (playlist.ownerId !== request.userId) throw new ForbiddenException("Seul le créateur peut supprimer la playlist.");

      await this.playlistService.deletePlaylist(id);
      return { message: 'Playlist supprimée' };
  }

	@UseGuards(Guard)
	@Post(':id/tracks')
	async addTrack(
	@Param('id') playlistId: string,
	@Body('title') title: string,
	@Body('artist') artist: string,
	@Body('sourceId') sourceId: string,
	@Request() request: any,
	) {
	return this.playlistService.addTrackToPlaylist(
		playlistId,
		title,
		artist,
		sourceId,
		request.userId,
	);
	}

	@UseGuards(Guard)
	@Get('mine')
	async findMine(@Request() request: any) {
	return await this.playlistService.getMyPlaylists(request.userId);
	}

	@UseGuards(Guard)
	@Get('user/:ownerId')
	async findUserPlaylists(@Param('ownerId') ownerId: string) {
	return await this.playlistService.getUserPublicPlaylists(ownerId);
	}

	@Get('recommended')
		async findRecommended() {
				return await this.playlistService.getRecommendedPlaylists();
		}

	@UseGuards(Guard)
	@Get(':id')
	async findOne(@Param('id') id: string) {
	return await this.playlistService.getPlaylistById(id);
	}

	@UseGuards(Guard)
	@Patch(':id')
	async update(
	@Param('id') id: string,
	@Body('name') name: string,
	@Body('imageUrl') imageUrl: string,
	@Body('isPublic') isPublic: boolean,
	) {
	return this.playlistService.updatePlaylist(id, name, imageUrl, isPublic);
	}

	@UseGuards(Guard)
	@Post(':id/collaborators')
	async addCollaborator(
	@Param('id') playlistId: string,
	@Body('userId') userId: string,
	) {
	const collaboration = await this.playlistService.inviteCollaborator(playlistId, userId);

	const socketId = this.friendsGateway.activeUsers.get(userId);
	if (socketId) {
		this.friendsGateway.server.to(socketId).emit('newCollabRequest');
	}

	return collaboration;
	}

	@UseGuards(Guard)
	@Patch('collaborators/:collabId')
	async updateCollaboration(
	@Param('collabId') collabId: string,
	@Body('status') status: 'PENDING' | 'ACCEPTED' | 'REJECTED',
	) {
	return await this.playlistService.updateCollaborationStatus(collabId, status);
	}

	
}