// import {
//     Controller,
//     Post,
//     Get,
//     Delete,
//     Body,
//     Param,
//     UseGuards,
//     Req,
//     NotFoundException,
//     ForbiddenException,
// } from '@nestjs/common';
// import { LiveSessionService } from './services/live_session';
// import { Guard } from './security/guard';

// @Controller('live_session')
// export class LiveSessionController {
//     constructor(private readonly liveSessionService: LiveSessionService) {}

//     @UseGuards(Guard)
//     @Post()
//     async create(@Body() body: any, @Req() request: any) {
//         return await this.liveSessionService.createLiveSession(body.name, request.userId);
//     }

//     @UseGuards(Guard)
//     @Post('vote')
//     async vote(@Body() body: any, @Req() request: any) {
//         return await this.liveSessionService.voteForTrack(
//             body.sessionId,
//             body.trackId,
//             request.userId,
//         );
//     }

//     @UseGuards(Guard)
//     @Get('track/:id')
//     async nextTrack(@Param('id') sessionId: string) {
//         const track = await this.liveSessionService.getNextTrack(sessionId);
//         if (!track) {
//             throw new NotFoundException('No tracks in queue');
//         }

//         await this.liveSessionService.deleteSessionTrack(sessionId, track.trackId);
//         return track;
//     }

//     @UseGuards(Guard)
//     @Delete(':id')
//     async endLiveSession(@Param('id') sessionId: string, @Req() req: any) {
//         const session = await this.liveSessionService.getSessionById(sessionId);
//         if (!session) {
//             throw new NotFoundException('Live session not found');
//         }
//         if (session.hostUserId !== req.userId) {
//             throw new ForbiddenException('Only the host can end this session');
//         }

//         await this.liveSessionService.endLiveSession(sessionId);
//         return { message: 'Live session ended' };
//     }
// }