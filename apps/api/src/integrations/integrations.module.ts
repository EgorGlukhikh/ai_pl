import { Module } from "@nestjs/common";
import { GigaChatService } from "./gigachat/gigachat.service";
import { TelegramService } from "./telegram/telegram.service";
import { BillingService } from "./billing/billing.service";
import { TelegramController } from "./telegram/telegram.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule],
  controllers: [TelegramController],
  providers: [GigaChatService, TelegramService, BillingService],
  exports: [GigaChatService, TelegramService, BillingService],
})
export class IntegrationsModule {}

