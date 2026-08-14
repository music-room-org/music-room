import { Controller, Post, Body, Get, Request, UseGuards } from '@nestjs/common';
import { registerUser, loginUser } from './services/auth';
import { Guard } from './security/guard';

@Controller('auth')
export class AuthController {
	// Creation of POST route /auth/register
	@Post('register')
	async register(@Body() body: any) {
		return await registerUser(body.email, body.password);
	}

	// Creation of POST route /auth/login
	@Post('login')
	async login(@Body() body: any) {
		const token = await loginUser(body.email, body.password);
		return { token: token };
	}

	@UseGuards(Guard)
	@Get('profil')
	getProfile(@Request() request: any) {
		// Si on arrive ici, alors le token est valide 

		return {
			message: "You are authentified",
			userId: request.userId
		};
	}
}