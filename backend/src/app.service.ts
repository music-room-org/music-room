import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

@Injectable()
export class AppService {
	private prisma = new PrismaClient();

	getHello(): string {
		return 'Hello World!';
	}

	async updateProfile(
		userId: string,
		displayName?: string,
		email?: string,
		currentPassword?: string,
		newPassword?: string,
	) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new Error('User not found');
		}

		let passwordHash: string | undefined;

		if (newPassword && currentPassword) {
			if (!user.passwordHash) {
				throw new Error('User has no password');
			}

			const isValid = await bcrypt.compare(
				currentPassword,
				user.passwordHash,
			);

			if (!isValid) {
				throw new Error('Current password is incorrect');
			}

			passwordHash = await bcrypt.hash(newPassword, 10);
		}

		return this.prisma.user.update({
			where: { id: userId },
			data: {
				...(displayName && { displayName }),
				...(email && { email }),
				...(passwordHash && { passwordHash }),
			},
		});
	}
}