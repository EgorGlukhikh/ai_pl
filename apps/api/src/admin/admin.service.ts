import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  listComplexes() {
    return this.prisma.residentialComplex.findMany({
      include: { roomTypes: true, assets: true },
      orderBy: { createdAt: "desc" },
    });
  }

  createComplex(data: { developerName: string; name: string; city: string; description?: string }) {
    return this.prisma.residentialComplex.create({ data });
  }

  updateComplex(id: string, data: { developerName?: string; name?: string; city?: string; description?: string; isActive?: boolean }) {
    return this.prisma.residentialComplex.update({ where: { id }, data });
  }

  deleteComplex(id: string) {
    return this.prisma.residentialComplex.delete({ where: { id } });
  }

  createRoomType(data: { complexId: string; rooms: "ONE" | "TWO" | "THREE" | "FOUR_PLUS"; label: string }) {
    return this.prisma.roomType.create({ data });
  }

  deleteRoomType(id: string) {
    return this.prisma.roomType.delete({ where: { id } });
  }

  createAsset(data: { complexId: string; type: "PHOTO" | "PLAN"; url: string; meta?: Record<string, unknown> }) {
    return this.prisma.complexAsset.create({
      data: {
        ...data,
        meta: data.meta as Prisma.InputJsonValue | undefined,
      },
    });
  }

  deleteAsset(id: string) {
    return this.prisma.complexAsset.delete({ where: { id } });
  }

  async setSubscription(userId: string, plan: "FREE" | "PRO") {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        plan,
        planExpiresAt: plan === "PRO" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
      },
    });
    return { userId: user.id, plan: user.plan };
  }
}

