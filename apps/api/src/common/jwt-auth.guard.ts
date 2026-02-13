import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const auth = req.headers.authorization as string | undefined;
    if (!auth) {
      throw new UnauthorizedException("Missing authorization header");
    }
    const token = auth.replace("Bearer ", "");
    try {
      req.user = this.jwtService.verify(token, { secret: process.env.JWT_SECRET || "dev-secret" });
      return true;
    } catch {
      throw new UnauthorizedException("Invalid token");
    }
  }
}

