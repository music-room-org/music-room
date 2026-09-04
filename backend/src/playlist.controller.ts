import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  createPlaylist,
  getPublicPlaylists,
  getMyPlaylists,
  getPlaylistById,
  getUserPublicPlaylists,
} from './services/playlist';
import { Guard } from './security/guard';

@Controller('playlists')
export class PlaylistController {
  @UseGuards(Guard)
  @Post()
  async create(@Body() body: any, @Request() request: any) {
    return await createPlaylist(body.name, request.userId);
  }

  @Get()
  async findAll() {
    return await getPublicPlaylists();
  }

  @UseGuards(Guard)
  @Get('mine')
  async findMine(@Request() request: any) {
    return await getMyPlaylists(request.userId);
  }

  // GET /playlists/user/:ownerId → playlists publiques d'un autre user
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
}
