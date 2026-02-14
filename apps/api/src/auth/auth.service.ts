import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async loginWithSber(input: { sberSub: string; email?: string; name?: string }) {
    const user = await this.prisma.user.upsert({
      where: { sberSub: input.sberSub },
      update: { email: input.email, name: input.name },
      create: { sberSub: input.sberSub, email: input.email, name: input.name },
    });
    return this.issueToken(user.id, user.role);
  }

  async loginWithTelegram(input: { telegramId: string; name?: string }) {
    // Проверка на ADMIN ID из переменных окружения
    const adminTelegramId = process.env.TELEGRAM_ADMIN_ID || "798456148";
    const isAdmin = input.telegramId === adminTelegramId;
    const role = isAdmin ? "ADMIN" : "USER";
    const plan = isAdmin ? "PRO" : "FREE";

    const user = await this.prisma.user.upsert({
      where: { telegramId: input.telegramId },
      update: {
        name: input.name,
        // Обновляем роль и план при каждом входе для ADMIN
        ...(isAdmin && { role, plan }),
      },
      create: {
        telegramId: input.telegramId,
        name: input.name,
        role,
        plan,
      },
    });
    return this.issueToken(user.id, user.role);
  }

  async mockLogin(input: { email: string; role?: "USER" | "ADMIN" }) {
    const user = await this.prisma.user.upsert({
      where: { email: input.email },
      update: { role: input.role || "USER" },
      create: { email: input.email, role: input.role || "USER" },
    });
    return this.issueToken(user.id, user.role);
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");
    return user;
  }

  private issueToken(userId: string, role: "USER" | "ADMIN") {
    return {
      accessToken: this.jwt.sign({ sub: userId, role }),
      userId,
      role,
    };
  }
}

