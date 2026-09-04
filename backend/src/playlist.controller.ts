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
} from './services/playlist';
import { Guard } from './security/guard';

@Controller('playlists')
export class PlaylistController {
  // POST /playlists → créer une playlist (protégée)
  @UseGuards(Guard)
  @Post()
  async create(@Body() body: any, @Request() request: any) {
    return await createPlaylist(body.name, request.userId);
  }

  // GET /playlists → les playlists publiques
  @Get()
  async findAll() {
    return await getPublicPlaylists();
  }

  // GET /playlists/mine → MES playlists
  @UseGuards(Guard)
  @Get('mine')
  async findMine(@Request() request: any) {
    return await getMyPlaylists(request.userId);
  }

  // GET /playlists/:id → UNE playlist
  @UseGuards(Guard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await getPlaylistById(id);
  }
}