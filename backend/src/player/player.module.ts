import { Module } from '@nestjs/common';
import { PlayerController } from './player.controller';
import { PlayerService } from './player.service';
import { YtApiService } from './yt-api.service';

@Module({
  controllers: [PlayerController],
  providers: [PlayerService, YtApiService],
  exports: [PlayerService, YtApiService],
})
export class PlayerModule {}
