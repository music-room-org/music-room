import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthController } from './controller';
import { FriendsModule } from './friends/friends.module';
import { PlaylistController } from './playlist.controller';
import { PlayerModule } from './player/player.module';
import { LiveSessionController } from './live_session.controller';
import { LiveSessionService } from './services/live_session';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PlayerModule, PrismaModule, FriendsModule],
  controllers: [
    AppController,
    HealthController,
    AuthController,
    PlaylistController,
    LiveSessionController
  ],
  providers: [AppService, LiveSessionService],
})
export class AppModule {}

