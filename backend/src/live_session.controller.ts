import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { LiveSessionService } from './services/live_session';
import { Guard } from './security/guard';

@Controller('live_session')
export class LiveSessionController {
    constructor(private readonly liveSessionService: LiveSessionService) {}

    @UseGuards(Guard)
    // @Post()
    // async create(@Body() body: any, @Req() request: any) {
    //  return await this.liveSessionService.createLiveSession(body.name, request.userId);
    // }

    // version faustine 
    @Post()
    async create(@Body() body: any, @Req() request: any) {
        return await this.liveSessionService.createLiveSession(
            body.name, 
            request.userId, 
            body.isPublic, 
            body.license, 
            body.invitedUsers,
            body.latitude,
            body.longitude,
            body.startTime,
            body.endTime
        );
    }

    @UseGuards(Guard)
    @Patch(':id')
    async updateSession(@Param('id') sessionId: string, @Body() body: any, @Req() req: any) {
        const session = await this.liveSessionService.getSessionById(sessionId);
        
        if (!session) {
            throw new NotFoundException('Live session not found');
        }
        if (session.hostUserId !== req.userId) {
            throw new ForbiddenException('Only the host can modify this session');
        }

        return await this.liveSessionService.updateLiveSession(
            sessionId,
            body.name,
            body.isPublic,
            body.license,
            body.invitedUsers || [],
            body.latitude,
            body.longitude,
            body.startTime,
            body.endTime
        );
    }

    // Permet d'afficher les sessions sur la page d'accueil
    @UseGuards(Guard)
    @Get('available/all')
    async getAvailable(@Req() req: any) {
        return await this.liveSessionService.getAvailableSessions(req.userId);
    }

    @UseGuards(Guard)
    @Post('vote')
    async vote(@Body() body: any, @Req() request: any) {
        return await this.liveSessionService.voteForTrack(
            body.sessionId,
            body.trackId,
            request.userId,
        );
    }

    @UseGuards(Guard)
    @Get('track/:id')
    async nextTrack(@Param('id') sessionId: string) {
        const track = await this.liveSessionService.getNextTrack(sessionId);
        if (!track) {
            throw new NotFoundException('No tracks in queue');
        }

        await this.liveSessionService.deleteSessionTrack(sessionId, track.trackId);
        return track;
    }

    @UseGuards(Guard)
    @Get(':id')
    async getSession(@Param('id') id: string) {
        const session = await this.liveSessionService.getSessionById(id);
        if (!session) {
            throw new NotFoundException('Session not found');
        }
        return session;
    }

    @UseGuards(Guard)
    @Post(':id/tracks')
    async addTrack(
        @Param('id') sessionId: string,
        @Body('title') title: string,
        @Body('artist') artist: string,
        @Body('sourceId') sourceId: string
    ) {
        return await this.liveSessionService.addTrackToLiveSession(
            sessionId, 
            title, 
            artist, 
            sourceId
        );
    }

    @UseGuards(Guard)
    @Delete(':id')
    async endLiveSession(@Param('id') sessionId: string, @Req() req: any) {
        const session = await this.liveSessionService.getSessionById(sessionId);
        if (!session) {
            throw new NotFoundException('Live session not found');
        }
        if (session.hostUserId !== req.userId) {
            throw new ForbiddenException('Only the host can end this session');
        }

        await this.liveSessionService.endLiveSession(sessionId);
        return { message: 'Live session ended' };
    }
}