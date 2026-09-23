import { Controller, Post, Body, Get, Query, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Guard } from '../security/guard';

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}
	// Creation of POST route /auth/register
	@Post('register')
	async register(@Body() body: any) {
	return await this.authService.registerUser(body.email, body.password, body.username);
	}

	// Verification route
	@Get('verify')
	async verifyEmail(@Query('token') token: string) {
	return await this.authService.verifyUserEmail(token);
	}

	// Creation of POST route /auth/login
	@Post('login')
	async login(@Body() body: any) {
	const token = await this.authService.loginUser(body.email, body.password);
	return { token: token };
	}

	@UseGuards(Guard)
	@Get('profil')
	async getProfile(@Request() request: any) {
	// Si on arrive ici, alors le token est valide 
	const result = await this.authService.getUserProfile(request.userId);
	return result;
	}

	@Post('google')
	async googleLogin(@Body() body: any) {
	const token = await this.authService.loginWithGoogle(body.token);

	return {
		token,
	};
	}
}