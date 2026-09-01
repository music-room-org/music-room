import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { addTrack, getTracks } from './services/track';
import { Guard } from './security/guard';

@Controller()
export class TrackController {
  @UseGuards(Guard)
  @Post('playlists/:id/tracks')
  async add(@Param('id') playlistId: string, @Body() body: any) {
    return await addTrack(playlistId, body.title, body.sourceId, body.artist);
  }

  @UseGuards(Guard)
  @Get('playlists/:id/tracks')
  async list(@Param('id') playlistId: string) {
    return await getTracks(playlistId);
  }
}
