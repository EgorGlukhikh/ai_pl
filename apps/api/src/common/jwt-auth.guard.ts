import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;
    if (!auth) {
      throw new UnauthorizedException("Missing authorization header");
    }
    const token = auth.replace("Bearer ", "");
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

