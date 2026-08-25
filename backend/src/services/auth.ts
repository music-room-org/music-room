import { validateEmail, validatePassword } from "../utils/validators";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import crypto from "crypto";

const prisma = new PrismaClient();

// NodeMailer configuration 
const transporter = nodemailer.createTransport({
	host: 'localhost',
	port: 1025,
	secure: false,
});

// Enregistrement du User EN ASynchrone pour qu ele serveur execute la tache en arriere plan
export async function registerUser(email: string, password: string) {

	if (!validateEmail(email)) 
		throw new Error("Invalid email");
	if (!validatePassword(password))
		throw new Error("Invalid password");
	
	const user = await prisma.user.findUnique({where: {email: email}});
	if (user)
		throw new Error("Email is already taken");

	const hashedPassword = await bcrypt.hash(password, 10);
	const verificationToken = crypto.randomBytes(32).toString('hex');

	const newUser = await prisma.user.create({
		data: {
			email: email,
			passwordHash: hashedPassword,
			verificationToken: verificationToken,
			emailVerified: false
		}
	});

	const verifyUrl = `http://localhost:3000/auth/verify?token=${verificationToken}&email=${email}`;

	await transporter.sendMail({
		from: '"Music-Room" <noreply@music-room.com>',
		to: email,
		subject: 'Verify your email address',
		text: `Click on this link to activate your account: ${verifyUrl}`,
		html: `<p>Welcome !</p><p>Please, click on this link to activate your account: <a href="${verifyUrl}">Activate my account</a></p>`
	});

	return newUser;
}

export async function verifyEmail(email: string, token: string) {
	const user = await prisma.user.findUnique({ where: { email } });

	if (!user || user.verificationToken !== token) {
		throw new Error("Verification link invalid or expired");
	}

	await prisma.user.update({
		where: { email },
		data: { emailVerified: true, verificationToken: null }
	});

	return { message: "Account successfully activated"};
}

export async function loginUser(email: string, password: string) {
	const user = await prisma.user.findUnique({ where: { email: email } });
	if (!user)
		throw new Error("User not found");

	if (!user.emailVerified) {
		throw new Error("Please verify your email address before logging in");
	}

	const isPasswordValid = await bcrypt.compare(password, user.passwordHash!);
	if (!isPasswordValid)
		throw new Error("Invalid password");

	const token = jwt.sign(
		{ id: user.id },
		process.env.JWT_SECRET!,
		{ expiresIn: "1h" }
	);
	return token;
	
}

export async function requestPasswordReset(email: string) {
	const user = await prisma.user.findUnique({ where: { email } });
	if (!user)
		throw new Error("User not found");

	const resetToken = crypto.randomBytes(32).toString('hex');
	const resetTokenExpiry = new Date(Date.now() + 360000); // valide opur 1h

	await prisma.user.update({
		where: { email },
		data: { verificationToken: resetToken }
	});

	const resetUrl = `musicroom://?action=reset-password&token=${resetToken}&email=${email}`;

	await transporter.sendMail({
		from: '"Music-Room" <noreply@music-room.com>',
		to: email,
		subject: 'Reset your password',
		text: `Click to reset your password: ${resetUrl}`,
		html: `<p>Please click this link to reset your password: <a href="${resetUrl}">Reset Password</a></p>`
	});

	return { message: "Reset email sent" };
}

export async function resetPassword(email: string, token: string, newPassword: string) {
	if (!validatePassword(newPassword))
		throw new Error("Invalid password format");

	const user = await prisma.user.findUnique({ where: { email } });
	if (!user || user.verificationToken !== token)
		throw new Error("Invalid or expired token");

	const hashedPassword = await bcrypt.hash(newPassword, 10);
	await prisma.user.update({
		where: { email },
		data: {
			passwordHash: hashedPassword,
			verificationToken: null
		}
	});

	return { message: "Password successfully updated"};
}