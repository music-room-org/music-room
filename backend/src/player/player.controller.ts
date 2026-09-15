import {
  Controller,
  Get,
  Delete,
  Query,
  Param,
  Req,
  Res,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { YtApiService } from './yt-api.service';
import { PlayerService } from './player.service';

@Controller('player')
export class PlayerController {
  constructor(
    private readonly ytApiService: YtApiService,
    private readonly playerService: PlayerService,
  ) {}

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query) {
      throw new HttpException('Query parameter "q" is required', HttpStatus.BAD_REQUEST);
    }
    return this.ytApiService.searchTracks(query);
  }

  @Get('artists')
  async searchArtists(@Query('q') query: string) {
    if (!query) {
      throw new HttpException('Query parameter "q" is required', HttpStatus.BAD_REQUEST);
    }
    return this.ytApiService.searchArtists(query);
  }

  @Get('stream/:videoId')
  async stream(
    @Param('videoId') videoId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!videoId) {
      throw new HttpException('Param "videoId" is required', HttpStatus.BAD_REQUEST);
    }
    try {
      await this.playerService.streamAudioFile(videoId, req.headers, res);
    } catch (error: any) {
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: error.message || 'Failed to stream audio',
        });
      }
    }
  }

  @Delete('clean/:videoId')
  async clean(@Param('videoId') videoId: string) {
    const deleted = await this.playerService.deleteAudioFile(videoId);
    return { success: deleted, videoId };
  }
}
