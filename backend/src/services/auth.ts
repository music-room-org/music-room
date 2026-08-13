import { validateEmail, validatePassword } from "../utils/validators";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();


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
	const newUser = await prisma.user.create({
		data: {
			email: email,
			passwordHash: hashedPassword,
		},
	});
	return newUser;
}

export async function loginUser(email: string, password: string) {
	const user = await prisma.user.findUnique({ where: { email: email } });
	if (!user)
		throw new Error("User not found");

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
