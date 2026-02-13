import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { CreateGenerationDto } from "@ai-pl/shared";

@Injectable()
export class GenerationsService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue("generation") private readonly generationQueue: Queue,
  ) {}

  listComplexes() {
    return this.prisma.residentialComplex.findMany({ where: { isActive: true } });
  }

  listRoomTypes(complexId: string) {
    return this.prisma.roomType.findMany({ where: { complexId }, orderBy: { rooms: "asc" } });
  }

  async getTodayLimit(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const day = this.startOfBusinessDay();
    const usage = await this.prisma.usageDaily.findUnique({
      where: { userId_date: { userId, date: day } },
    });

    const used = usage?.count ?? 0;
    const total = user.plan === "PRO" ? -1 : 5;
    return { plan: user.plan, used, total, remaining: total === -1 ? -1 : Math.max(0, total - used) };
  }

  async createGeneration(userId: string, payload: CreateGenerationDto) {
    const limit = await this.getTodayLimit(userId);
    if (limit.total !== -1 && limit.remaining <= 0) {
      throw new ForbiddenException("Daily generation limit reached");
    }

    const generation = await this.prisma.generationRequest.create({
      data: {
        userId,
        complexId: payload.complexId,
        roomTypeId: payload.roomTypeId,
        offerText: payload.offerText,
        status: "QUEUED",
      },
    });

    const day = this.startOfBusinessDay();
    await this.prisma.usageDaily.upsert({
      where: { userId_date: { userId, date: day } },
      update: { count: { increment: 1 } },
      create: { userId, date: day, count: 1 },
    });

    await this.generationQueue.add("generate", { generationId: generation.id });

    return generation;
  }

  async getGeneration(userId: string, id: string) {
    const generation = await this.prisma.generationRequest.findFirst({
      where: { id, userId },
      include: { variants: true },
    });
    if (!generation) throw new NotFoundException("Generation not found");
    return generation;
  }

  async getRecentStories(userId: string) {
    const rows = await this.prisma.storyVariant.findMany({
      where: { generationRequest: { userId } },
      include: { generationRequest: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return rows;
  }

  private startOfBusinessDay() {
    const now = new Date();
    const moscowOffsetMs = 3 * 60 * 60 * 1000;
    const shifted = new Date(now.getTime() + moscowOffsetMs);
    shifted.setUTCHours(0, 0, 0, 0);
    return new Date(shifted.getTime() - moscowOffsetMs);
  }
}

