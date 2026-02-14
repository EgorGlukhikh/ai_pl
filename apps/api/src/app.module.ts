import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { BullModule } from "@nestjs/bullmq";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AdminModule } from "./admin/admin.module";
import { GenerationsModule } from "./generations/generations.module";
import { StoriesModule } from "./stories/stories.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { StorageModule } from "./storage/storage.module";
import { BillingModule } from "./billing/billing.module";
import { BootstrapModule } from "./bootstrap/bootstrap.module";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
const isTlsRedis = redisUrl.startsWith("rediss://");

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        url: redisUrl,
        ...(isTlsRedis ? { tls: { rejectUnauthorized: false } } : {}),
      },
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    IntegrationsModule,
    StorageModule,
    BillingModule,
    BootstrapModule,
    GenerationsModule,
    StoriesModule,
  ],
})
export class AppModule {}

