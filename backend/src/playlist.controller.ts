import { Controller, Post, Get, Patch, Body, Param, UseGuards, Request } from '@nestjs/common';
import { createPlaylist, getPublicPlaylists, getMyPlaylists, getPlaylistById, updatePlaylist, getUserPublicPlaylists, addTrackToPlaylist, inviteCollaborator, updateCollaborationStatus, getPendingCollaborations } from './services/playlist';
import { Guard } from './security/guard';
import { FriendsGateway } from './friends/friends.gateway';

@Controller('playlists')
export class PlaylistController {
  constructor(
	private readonly friendsGateway: FriendsGateway,
  ) {}

  @UseGuards(Guard)
  @Post()
  async create(@Body() body: any, @Request() request: any) {
	return await createPlaylist(body.name, request.userId);
  }

  // La route "pending" doit ABSOLUMENT être ici pour faire fonctionner la cloche
  @UseGuards(Guard)
  @Get('collaborators/pending')
  async getPendingCollabs(@Request() request: any) {
	return await getPendingCollaborations(request.userId);
  }

  @Get()
  async findAll() {
	return await getPublicPlaylists();
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
	return addTrackToPlaylist(
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
	return await getMyPlaylists(request.userId);
  }

  @UseGuards(Guard)
  @Get('user/:ownerId')
  async findUserPlaylists(@Param('ownerId') ownerId: string) {
	return await getUserPublicPlaylists(ownerId);
  }

  @UseGuards(Guard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
	return await getPlaylistById(id);
  }

  @UseGuards(Guard)
  @Patch(':id')
  async update(
	@Param('id') id: string,
	@Body('name') name: string,
	@Body('imageUrl') imageUrl: string,
	@Body('isPublic') isPublic: boolean,
  ) {
	return updatePlaylist(id, name, imageUrl, isPublic);
  }

  @UseGuards(Guard)
  @Post(':id/collaborators')
  async addCollaborator(
	@Param('id') playlistId: string,
	@Body('userId') userId: string,
  ) {
	const collaboration = await inviteCollaborator(playlistId, userId);

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
	return await updateCollaborationStatus(collabId, status);
  }
}