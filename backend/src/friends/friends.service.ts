import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaClient, FriendshipStatus } from '@prisma/client';
import { FriendsGateway } from './friends.gateway';

@Injectable()
export class FriendsService {
	private prisma = new PrismaClient();
	constructor(private readonly friendsGateway: FriendsGateway) {}

	async sendFriendRequest(senderId: string, receiverId: string) {
		const existingFriendship = await this.prisma.friendship.findFirst({
			where: {
				OR: [
					{ senderId: senderId, receiverId: receiverId },
					{ senderId: receiverId, receiverId: senderId }
				]
			}
		});

		if (existingFriendship) {
			throw new BadRequestException("Friendship or request already exist with this user.")
		}

		const friendship = await this.prisma.friendship.create({
			data: { senderId, receiverId, status: FriendshipStatus.PENDING },
		});
		const receiverSocketId = this.friendsGateway.activeUsers.get(receiverId);
		if (receiverSocketId) {
			this.friendsGateway.server.to(receiverSocketId).emit('newRequest', friendship);
		}
		return friendship;
	}

	async searchUsers(query: string, currentUserId: string) {
		return this.prisma.user.findMany({
			where: { 
				id: { not: currentUserId },
				username: { contains: query, mode: 'insensitive' }
			},
			select: { id: true, username: true, profileImage: true },
		});
	}

	async getPendingRequests(userId: string) {
		return this.prisma.friendship.findMany({
			where: { receiverId: userId, status: FriendshipStatus.PENDING },
			include: { sender: true },
		});
	}

	async updateRequestStatus(friendshipId: string, status: FriendshipStatus) {
		const friendship = await this.prisma.friendship.update({
			where: { id: friendshipId },
			data: { status },
		});
		if (status === FriendshipStatus.ACCEPTED) {
			const senderSocketId = this.friendsGateway.activeUsers.get(friendship.senderId);
			const receiverSocketId = this.friendsGateway.activeUsers.get(friendship.receiverId);
			if (senderSocketId) {
				this.friendsGateway.server.to(senderSocketId).emit('friendAccepted', friendship);
			}
			if (receiverSocketId) {
				this.friendsGateway.server.to(receiverSocketId).emit('friendAccepted', friendship);
			}
		}
		return friendship;
	}

	async getFriendsList(userId: string) {
		return this.prisma.friendship.findMany({
			where: { 
				status: FriendshipStatus.ACCEPTED,
				OR: [{ senderId: userId }, { receiverId: userId }]
			},
			include: { sender: true, receiver: true },
		});
	}

	// Nouvelle fonction pour l'aperçu du profil
	async getFriendProfilePreview(userId: string) {
		const friendCount = await this.prisma.friendship.count({
			where: {
				status: FriendshipStatus.ACCEPTED,
				OR: [{ senderId: userId }, { receiverId: userId }],
			},
		});

		const playlists = await this.prisma.playlist.findMany({
			where: { ownerId: userId, isPublic: true },
			take: 3,
			orderBy: { id: 'desc' }, // Remonte les plus récentes sans nécessiter un champ createdAt
		});

		return { friendCount, playlists };
	}
}