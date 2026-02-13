import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../common/jwt-auth.guard";
import { TelegramService } from "./telegram.service";

@Controller("telegram")
@UseGuards(JwtAuthGuard)
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Get("me")
  getMe() {
    return this.telegramService.getMe();
  }
}
