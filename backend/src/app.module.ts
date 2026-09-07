import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthController } from './health.controller';
import { AuthController } from './controller';
import { FriendsModule } from './friends/friends.module';

@Module({
  imports: [FriendsModule],
  controllers: [AppController, HealthController, AuthController],
  providers: [AppService],
})
export class AppModule {}