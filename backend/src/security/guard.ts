import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import * as jwt from 'jsonwebtoken';
import { Observable } from "rxjs";

@Injectable()
export class Guard implements CanActivate {
	canActivate(context: ExecutionContext): boolean {
		const request = context.switchToHttp().getRequest();
		const authHeader = request.headers.authorization;

		if (!authHeader || !authHeader.startsWith("Bearer")) {
			throw new UnauthorizedException("Access non authorized");
		}

		const token = authHeader.split(" ")[1];

		try {
			// Verify token with env variable
			const decoded = jwt.verify(token, process.env.JWT_SECRET!);
			request.userId = (decoded as any).id;
			return true;
		} catch {
			throw new UnauthorizedException("Forbidden access");
		}
	}
}