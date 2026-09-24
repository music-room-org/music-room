import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';
import { PlaylistModule } from './playlist/playlist.module';
import { PlayerModule } from './player/player.module';
import { LiveSessionModule } from './live_session/live_session.module';
import { LiveSessionService } from './live_session/live_session.service';
import { PrismaModule } from './prisma/prisma.module';

@Module({
	imports: [
		PlayerModule,
		PrismaModule,
		FriendsModule,
		AuthModule,
		LiveSessionModule,
		PlayerModule
	],
	controllers: [
		AppController,
		HealthController,
	],
	providers: [AppService, LiveSessionService],
})
export class AppModule { }

