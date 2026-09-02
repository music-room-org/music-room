import { Controller, Post, Body, Get, Query, Request, UseGuards } from '@nestjs/common';
import { registerUser, loginUser, verifyUserEmail, loginWithGoogle, getUserProfile } from './services/auth';
import { Guard } from './security/guard';

@Controller('auth')
export class AuthController {
	// Creation of POST route /auth/register
	@Post('register')
	async register(@Body() body: any) {
	return await registerUser(body.email, body.password, body.username);
	}

	// Verification route
	@Get('verify')
	async verifyEmail(@Query('token') token: string) {
	return await verifyUserEmail(token);
	}

	// Creation of POST route /auth/login
	@Post('login')
	async login(@Body() body: any) {
	const token = await loginUser(body.email, body.password);
	return { token: token };
	}

	@UseGuards(Guard)
	@Get('profil')
	async getProfile(@Request() request: any) {
	// Si on arrive ici, alors le token est valide 
	const result = await getUserProfile(request.userId);
	return result;
	}

	@Post('google')
	async googleLogin(@Body() body: any) {
	const token = await loginWithGoogle(body.token);

	return {
		token,
	};
	}
}