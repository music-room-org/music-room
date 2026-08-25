import { Controller, Post, Body, Get, Request, UseGuards, Query, Res } from '@nestjs/common';
import { registerUser, loginUser, verifyEmail, requestPasswordReset, resetPassword } from './services/auth';
import { Guard } from './security/guard';
import type { Response } from 'express';

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

	// Pour la vériciation de l'eamil
	@Get('verify')
	async verify(
		@Query('token') token: string, 
		@Query('email') email: string,
		@Res() res: Response
	) {
		try {
			await verifyEmail(email, token);
			return res.status(200).send(`
				<html>
					<head>
						<meta charset="utf-8">
						<title>Vérification réussie</title>
					</head>
					<body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
						<h1 style="color: #EA9900;">Compte vérifié avec succès !</h1>
						<p>Vous pouvez fermer cette page et retourner vous connecter sur l'application.</p>
					</body>
				</html>
			`);
		} catch (error) {
			return res.status(400).send((error as Error).message);
		}
	}

	@Post('forgot-password')
	async forgotPassword(@Body() body: any) {
		return await requestPasswordReset(body.email);
	}

	@Post('reset-password')
	async resetPasswordEndpoint(@Body() body: any) {
		return await resetPassword(body.email, body.token, body.newPassword);
	}

	@Get('reset-password')
	async resetPasswordPage(
		@Query('token') token: string, 
		@Query('email') email: string,
		@Res() res: Response
	) {
		// Pour l'instant, on affiche une page simple ou on redirige vers l'app avec le token
		return res.status(200).send(`
			<html>
				<head>
					<meta charset="utf-8">
					<title>Réinitialisation du mot de passe</title>
					<script>
						// Redirige vers votre app mobile avec les paramètres si nécessaire
						window.location.href = "musicroom://reset-password?token=${token}&email=${email}";
					</script>
				</head>
				<body style="font-family: Arial, sans-serif; text-align: center; margin-top: 50px;">
					<h1 style="color: #EA9900;">Réinitialisation du mot de passe</h1>
					<p>Veuillez retourner sur l'application mobile pour saisir votre nouveau mot de passe.</p>
				</body>
			</html>
		`);
	}
}