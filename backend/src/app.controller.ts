import { Controller, Get, Patch, Body, Request, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { Guard } from './security/guard';

@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	getHello(): string {
		return this.appService.getHello();
	}

	@UseGuards(Guard)
	@Patch('profile')
	async updateProfile(
		@Request() req,
		@Body() body: {
			username?: string;
			email?: string;
			currentPassword?: string;
			newPassword?: string;
			profileImage: string;
		},
	) {
		const { username, email, currentPassword, newPassword, profileImage } = body;

		return this.appService.updateProfile(
			req.userId,
			username,
			email,
			currentPassword,
			newPassword,
			profileImage,
		);
	}
}