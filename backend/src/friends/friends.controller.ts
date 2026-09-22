import { Body, Controller, Get, Post, Delete, Patch, Query, Request, UseGuards, Param } from '@nestjs/common';
import { Guard } from 'src/security/guard';
import { FriendsService } from './friends.service';
import { FriendshipStatus } from '@prisma/client';

@UseGuards(Guard)
@Controller('friends')
export class FriendsController {
    constructor(private readonly friendsService: FriendsService) {}

    @Get('search')
    searchUsers(@Query('q') q: string, @Request() req) {
        return this.friendsService.searchUsers(q, req.userId);
    }

    @Post('request')
    async sendFriendRequest(
        @Request() req,
        @Body() body: { receiverId: string },
    ) {
        return this.friendsService.sendFriendRequest(req.userId, body.receiverId);
    }

    @Get('pending')
    getPendingRequest(@Request() req) {
        return this.friendsService.getPendingRequests(req.userId);
    }

    @Patch('manage')
    updateRequestStatus(
        @Body() body: { friendshipId: string; status: FriendshipStatus; }
    ) {
        return this.friendsService.updateRequestStatus(body.friendshipId, body.status);
    }

    @Get('list')
    getFriendsList(@Request() req) {
        return this.friendsService.getFriendsList(req.userId);
    }

    // Nouvelle route exposée pour le profil de l'ami
    @Get('profile/:id')
    getFriendProfilePreview(@Param('id') id: string) {
        return this.friendsService.getFriendProfilePreview(id);
    }

    @Delete(':friendshipId')
    removeFriend(@Param('friendshipId') friendshipId: string) {
        return this.friendsService.removeFriend(friendshipId);
    }
}