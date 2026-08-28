import { Controller, Post, Get, Body } from '@nestjs/common';
import { createPlaylist, getPlaylists } from './services/playlist';

@Controller('playlists')
export class PlaylistController {
  // POST /playlists → créer une playlist
  @Post()
  async create(@Body() body: any) {
    return await createPlaylist(body.name, body.ownerId);
  }

  // GET /playlists → lister les playlists
  @Get()
  async findAll() {
    return await getPlaylists();
  }
}
