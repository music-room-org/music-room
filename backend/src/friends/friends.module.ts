import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { FriendsGateway } from './friends.gateway';

@Module({
  providers: [FriendsService, FriendsGateway],
  controllers: [FriendsController]
})
export class FriendsModule {}
