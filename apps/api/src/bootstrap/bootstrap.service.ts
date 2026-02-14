import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { RoomCount } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class BootstrapService implements OnModuleInit {
  private readonly logger = new Logger(BootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if (process.env.AUTO_SEED === "false") {
      this.logger.log("AUTO_SEED is disabled");
      return;
    }

    try {
      const admin = await this.prisma.user.upsert({
        where: { email: "admin@ai-pl.local" },
        update: {},
        create: {
          email: "admin@ai-pl.local",
          name: "Admin",
          role: "ADMIN",
          plan: "PRO",
        },
      });

      const user = await this.prisma.user.upsert({
        where: { email: "user@ai-pl.local" },
        update: {},
        create: {
          email: "user@ai-pl.local",
          name: "Demo User",
          role: "USER",
          plan: "FREE",
        },
      });

      const existing = await this.prisma.residentialComplex.findFirst({
        where: { developerName: "INGRAD", name: "FORIVER" },
      });

      const complex =
        existing ??
        (await this.prisma.residentialComplex.create({
          data: {
            developerName: "INGRAD",
            name: "FORIVER",
            city: "Moscow",
            description: "Modern residential complex",
          },
        }));

      const roomTypes: Array<{ rooms: RoomCount; label: string }> = [
        { rooms: RoomCount.ONE, label: "1-room" },
        { rooms: RoomCount.TWO, label: "2-room" },
        { rooms: RoomCount.THREE, label: "3-room" },
        { rooms: RoomCount.FOUR_PLUS, label: "4-room+" },
      ];

      for (const roomType of roomTypes) {
        await this.prisma.roomType.upsert({
          where: { complexId_rooms: { complexId: complex.id, rooms: roomType.rooms } },
          update: { label: roomType.label },
          create: {
            complexId: complex.id,
            rooms: roomType.rooms,
            label: roomType.label,
          },
        });
      }

      const assetCount = await this.prisma.complexAsset.count({ where: { complexId: complex.id } });
      if (assetCount === 0) {
        await this.prisma.complexAsset.createMany({
          data: [
            { complexId: complex.id, type: "PHOTO", url: "https://picsum.photos/1080/1920?random=1" },
            { complexId: complex.id, type: "PLAN", url: "https://picsum.photos/400/240?random=2" },
          ],
        });
      }

      this.logger.log(`Bootstrap seed ready. admin=${admin.id} user=${user.id} complex=${complex.id}`);
    } catch (error) {
      this.logger.error(`Bootstrap seed failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
