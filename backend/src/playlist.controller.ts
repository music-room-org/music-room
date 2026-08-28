import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { createPlaylist, getPlaylists } from './services/playlist';
import { Guard } from './security/guard'; // on importe le Guard

@Controller('playlists')
export class PlaylistController {
  // POST /playlists → créer une playlist (protégée)
  @UseGuards(Guard) // protection : faut être connecté
  @Post()
  async create(@Body() body: any, @Request() request: any) {
    // ownerId vient du TOKEN (la personne connectée), pas du body
    return await createPlaylist(body.name, request.userId);
  }

  // GET /playlists → lister (protégée aussi)
  @UseGuards(Guard) // protection
  @Get()
  async findAll() {
    return await getPlaylists();
  }
}
