import { validateEmail, validatePassword } from "../utils/validators";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import * as nodemailer from "nodemailer";

const prisma = new PrismaClient();
const client = new OAuth2Client("119307991318-6q08olkvff98ol795k125ff5boh9ng8l.apps.googleusercontent.com")

const transporter = nodemailer.createTransport({
  host: "127.0.0.1",
  port: 1025,
  secure: false,
  ignoreTLS: true,
});

export async function registerUser(email: string, password: string, username: string) {
  if (!validateEmail(email)) throw new Error("Invalid email");
  if (!validatePassword(password)) throw new Error("Invalid password");

  const user = await prisma.user.findUnique({ where: { email: email } });
  if (user) throw new Error("Email is already taken");

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
	data: {
	  email: email,
	  passwordHash: hashedPassword,
	  username: username,
	  profileImage: "https://static.wixstatic.com/media/3c3602_b3624d3df2e34b27823234bbeb7ac298~mv2.jpg/v1/fill/w_485,h_485,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Joe-Cool---color.jpg"
	},
  });

  const verificationToken = jwt.sign(
	{ email: newUser.email },
	process.env.JWT_SECRET!,
	{ expiresIn: "1d" }
  );

  const verificationLink = `http://localhost:3000/auth/verify?token=${verificationToken}`;

  await transporter.sendMail({
	from: '"App" <noreply@app.com>',
	to: email,
	subject: "Verify your email address",
	html: `<p>Welcome! Click on this link to verify your account: <a href="${verificationLink}">Verify my account</a></p>`,
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
	
	return "Email verified successfully. You can now close this page and log in.";
  } catch (error) {
	throw new Error("The verification link is invalid or has expired.");
  }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email: email } });
  if (!user) throw new Error("User not found");

  const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
  if (!isPasswordValid) throw new Error("Invalid password");

  if (!user.emailVerified) throw new Error("Please verify your email before logging in");

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
		throw new Error("Unable to retrieve Google email");
	}

	const email = payload.email;
	let user = await prisma.user.findUnique({
		where: { email },
	});

	if (!user) {
		user = await prisma.user.create({
			data: {
			email,
			emailVerified: true,
			AuthProvider: "GOOGLE",
			profileImage: "https://static.wixstatic.com/media/3c3602_b3624d3df2e34b27823234bbeb7ac298~mv2.jpg/v1/fill/w_485,h_485,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/Joe-Cool---color.jpg"
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
	}
}