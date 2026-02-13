import "dotenv/config";
import { PrismaClient, RoomCount } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@ai-pl.local" },
    update: {},
    create: {
      email: "admin@ai-pl.local",
      name: "Admin",
      role: "ADMIN",
      plan: "PRO",
    },
  });

  const user = await prisma.user.upsert({
    where: { email: "user@ai-pl.local" },
    update: {},
    create: {
      email: "user@ai-pl.local",
      name: "Demo User",
      role: "USER",
      plan: "FREE",
    },
  });

  const complex = await prisma.residentialComplex.create({
    data: {
      developerName: "INGRAD",
      name: "FORIVER",
      city: "Moscow",
      description: "РЎРѕРІСЂРµРјРµРЅРЅС‹Р№ Р¶РёР»РѕР№ РєРѕРјРїР»РµРєСЃ",
      roomTypes: {
        create: [
          { rooms: RoomCount.ONE, label: "1-РєРѕРјРЅР°С‚РЅР°СЏ" },
          { rooms: RoomCount.TWO, label: "2-РєРѕРјРЅР°С‚РЅР°СЏ" },
          { rooms: RoomCount.THREE, label: "3-РєРѕРјРЅР°С‚РЅР°СЏ" },
          { rooms: RoomCount.FOUR_PLUS, label: "4-РєРѕРјРЅР°С‚РЅР°СЏ+" },
        ],
      },
      assets: {
        create: [
          { type: "PHOTO", url: "https://picsum.photos/1080/1920?random=1" },
          { type: "PLAN", url: "https://picsum.photos/400/240?random=2" },
        ],
      },
    },
  });

  console.log({ admin: admin.id, user: user.id, complex: complex.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

