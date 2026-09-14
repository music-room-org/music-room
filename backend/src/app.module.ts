import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthController } from './controller';
import { PlaylistController } from './playlist.controller';

@Module({
  imports: [],
  controllers: [
    AppController,
    HealthController,
    AuthController,
    PlaylistController,
  ],
  providers: [AppService],
})
export class AppModule {}
