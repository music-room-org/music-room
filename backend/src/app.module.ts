import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthController } from './controller';
import { PlaylistController } from './playlist.controller';
import { TrackController } from './track.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    HealthController,
    AuthController,
    PlaylistController,
    TrackController,
  ],
  providers: [AppService],
})
export class AppModule {}
