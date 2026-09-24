import { Global, Module } from '@nestjs/common';
import { PlaylistService } from './playlist.service';
import { PlaylistController } from './playlist.controller';

@Global()
@Module({
	controllers: [PlaylistController],
	providers: [PlaylistService],
})
export class PlaylistModule {}