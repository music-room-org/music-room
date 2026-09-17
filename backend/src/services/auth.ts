import { validateEmail, validatePassword } from "../utils/validators";
import bcrypt from "bcrypt";
import { AuthProvider, PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import * as nodemailer from "nodemailer";
import { BadRequestException, UnauthorizedException } from "@nestjs/common";

const prisma = new PrismaClient();
const client = new OAuth2Client("119307991318-6q08olkvff98ol795k125ff5boh9ng8l.apps.googleusercontent.com")

const transporter = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 1025,
  secure: false,
  ignoreTLS: true,
});

export async function registerUser(email: string, password: string, username: string) {
  if (!validateEmail(email)) throw new BadRequestException("Invalid email");
  if (!validatePassword(password)) throw new UnauthorizedException("Invalid password");

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) throw new BadRequestException("Email is already taken");

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
	data: {
	  email: email,
	  passwordHash: hashedPassword,
	  username: username,
	  profileImage: "https://static.wixstatic.com/media/5fdc83_7f6f3eb17d5d4e1584497cffd749463c~mv2.jpg/v1/fill/w_970,h_500,al_c,q_85,enc_avif,quality_auto/The_Snoopy_Show_970x500.jpg"
	},
  });

  const verificationToken = jwt.sign(
	{ email: newUser.email },
	process.env.JWT_SECRET!,
	{ expiresIn: "1d" }
  );

  const verificationLink = `http://localhost:3000/auth/verify?token=${verificationToken}`;

  await transporter.sendMail({
	from: '"Music Room" <noreply@musicroom.com>',
	to: email,
	subject: "Verify your email address",
	html: `
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="UTF-8">
	</head>
	<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
		<table width="100%" cellpadding="0" cellspacing="0">
			<tr>
				<td align="center" style="padding:40px 20px;">
					<table width="600" cellpadding="0" cellspacing="0"
						style="background:white;border-radius:24px;padding:40px;">
						<tr>
							<td align="center">
								<h1 style="font-size:42px;margin:0;color:#111;">
									Welcome
								</h1>

								<p style="font-size:20px;color:#666;">
									Where music meets collaboration
								</p>

								<div
									style="
										background:#fafafa;
										border-radius:24px;
										padding:40px;
										margin-top:30px;
									"
								>
									<h2 style="color:#F2A100;margin-top:0;">
										Check your inbox!
									</h2>

									<hr
										style="
											border:none;
											height:4px;
											background:#F2A100;
											border-radius:10px;
										"
									/>

									<p style="color:#666;font-size:18px;">
										Welcome to Music Room.
									</p>

									<p style="color:#666;font-size:18px;">
										Click the button below to verify your account.
									</p>

									<a
										href="${verificationLink}"
										style="
											display:inline-block;
											margin-top:20px;
											padding:16px 40px;
											background:#F2A100;
											color:white;
											text-decoration:none;
											border-radius:18px;
											font-weight:bold;
											font-size:18px;
										"
									>
										Verify my account
									</a>
								</div>
							</td>
						</tr>
					</table>
				</td>
			</tr>
		</table>
	</body>
	</html>
	`,
});

  return newUser;
}

export async function verifyUserEmail(token: string) {
  try {
	const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { email: string };
	
	await prisma.user.update({
	  where: { email: decoded.email },
	  data: { emailVerified: true },
	});
	
	return `
		<!DOCTYPE html>
		<html>
		<head>
		<meta charset="UTF-8">
		<title>Email verified</title>
		<style>
		body{
			background:#f5f5f5;
			font-family:Arial,sans-serif;
			display:flex;
			justify-content:center;
			align-items:center;
			height:100vh;
			margin:0;
		}
		.card{
			background:white;
			padding:50px;
			border-radius:30px;
			width:500px;
			text-align:center;
			box-shadow:0 10px 30px rgba(0,0,0,0.08);
		}
		.title{
			font-size:32px;
			font-weight:bold;
			color:#111;
		}
		.success{
			color:#F2A100;
			font-size:28px;
			font-weight:bold;
			margin-top:20px;
		}
		.line{
			height:4px;
			background:#F2A100;
			border-radius:20px;
			margin:20px 0;
		}
		.text{
			color:#666;
			font-size:18px;
			line-height:1.6;
		}
		.button{
			display:inline-block;
			margin-top:30px;
			padding:16px 40px;
			background:#F2A100;
			color:white;
			text-decoration:none;
			border-radius:18px;
			font-weight:bold;
		}
		</style>
		</head>
		<body>
			<div class="card">
				<div class="title">Welcome</div>

				<div class="success">
					Account verified!
				</div>

				<div class="line"></div>

				<p class="text">
					Your email has been successfully verified.
					You can now return to the application and log in.
				</p>

				<a href="musicroom://login" class="button">
					Open App
				</a>
			</div>
		</body>
		</html>
		`;
  } catch (error) {
	throw new UnauthorizedException("The verification link is invalid or has expired.");
  }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) throw new UnauthorizedException("User not found");

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
  if (!isPasswordValid) throw new BadRequestException("Invalid password");

  if (!user.emailVerified) throw new UnauthorizedException("Please verify your email before logging in");

  const token = jwt.sign(
	{ id: user.id },
	process.env.JWT_SECRET!,
	{ expiresIn: "1h" }
  );
  return token;
}

export async function loginWithGoogle(googleToken: string) {
	const ticket = await client.verifyIdToken({
		idToken: googleToken,
		audience: [
			"119307991318-6q08olkvff98ol795k125ff5boh9ng8l.apps.googleusercontent.com", // web
			"119307991318-0drk1nlrgs2q2iq1o8of1r4v1cnivin9.apps.googleusercontent.com" // ios
		],
	});

	const payload = ticket.getPayload();
	if (!payload?.email) {
		throw new UnauthorizedException("Unable to retrieve Google email");
	}

	const email = payload.email;
	let user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {

		const randomUsername = "user" + Math.floor(Math.random() * 1000);

		user = await prisma.user.create({
			data: {
			email,
			emailVerified: true,
			AuthProvider: "GOOGLE",
			username: randomUsername,
			profileImage: "https://static.wixstatic.com/media/5fdc83_7f6f3eb17d5d4e1584497cffd749463c~mv2.jpg/v1/fill/w_970,h_500,al_c,q_85,enc_avif,quality_auto/The_Snoopy_Show_970x500.jpg"
			},
		});
	}

	const token = jwt.sign(
		{ id: user.id },
		process.env.JWT_SECRET!,
		{ expiresIn: "1h" }
	);

	return token;
}

export async function getUserProfile(userId: string) {
	const user = await prisma.user.findUnique({
		where: {
			id: userId,
		},
	});

	return {
		username: user?.username,
		email: user?.email,
		profileImage: user?.profileImage,
		AuthProvider: user?.AuthProvider,
	}
}