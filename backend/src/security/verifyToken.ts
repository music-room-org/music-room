import jwt from "jsonwebtoken";

// Retrieve token from header and verify it matches user's one
export function verifyToken(request: any, response: any, next: any) {
	const authHeader = request.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer "))
		return response.status(401).json({ error: "Unauthorized "});

	const token = authHeader.split(" ")[1];

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET!);
		request.userId = (decoded as any).id;
		next();
	} catch {
		return response.status(403).json({ error : "Forbidden"});
	}
}