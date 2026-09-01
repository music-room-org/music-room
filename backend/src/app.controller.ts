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
			displayName?: string;
			email?: string;
			currentPassword?: string;
			newPassword?: string;
		},
	) {
		const { displayName, email, currentPassword, newPassword } = body;

		return this.appService.updateProfile(
			req.userId,
			displayName,
			email,
			currentPassword,
			newPassword,
		);
	}
}