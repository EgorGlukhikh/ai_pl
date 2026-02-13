import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import { BillingService } from "../integrations/billing/billing.service";

@Controller("billing")
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Post("create-payment")
  @UseGuards(JwtAuthGuard)
  createPayment(@CurrentUser() user: { sub: string }) {
    return this.billingService.createPayment(user.sub);
  }

  @Post("yookassa-webhook")
  yookassaWebhook(@Body() body: { paymentId: string; status: "ACTIVE" | "FAILED" | "CANCELED" }) {
    return this.billingService.handleWebhook(body);
  }
}

