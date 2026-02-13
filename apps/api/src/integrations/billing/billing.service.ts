import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async createPayment(userId: string) {
    const paymentId = `mock_${Date.now()}`;
    await this.prisma.subscription.create({
      data: {
        userId,
        provider: "yookassa",
        status: "PENDING",
        amount: 150000,
        externalPaymentId: paymentId,
      },
    });

    return {
      paymentId,
      confirmationUrl: `${process.env.YOOKASSA_RETURN_URL || "http://localhost:3000"}?paymentId=${paymentId}`,
    };
  }

  async handleWebhook(payload: { paymentId: string; status: "ACTIVE" | "FAILED" | "CANCELED"; userId?: string }) {
    const subscription = await this.prisma.subscription.findFirst({
      where: { externalPaymentId: payload.paymentId },
    });

    if (!subscription) {
      return { ok: false, reason: "subscription_not_found" };
    }

    const mapped = payload.status === "ACTIVE" ? "ACTIVE" : payload.status === "FAILED" ? "FAILED" : "CANCELED";

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: mapped },
    });

    if (mapped === "ACTIVE") {
      await this.prisma.user.update({
        where: { id: subscription.userId },
        data: { plan: "PRO", planExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
      });
    }

    return { ok: true };
  }
}

