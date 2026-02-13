import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import { AuthService } from "./auth.service";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sber/callback")
  async sberCallback(@Body() body: { sberSub: string; email?: string; name?: string }) {
    return this.authService.loginWithSber(body);
  }

  @Post("telegram/callback")
  async telegramCallback(@Body() body: { telegramId: string; name?: string }) {
    return this.authService.loginWithTelegram(body);
  }

  @Post("mock-login")
  async mockLogin(@Body() body: { email: string; role?: "USER" | "ADMIN" }) {
    return this.authService.mockLogin(body);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { sub: string }) {
    return this.authService.getProfile(user.sub);
  }
}

