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

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || "redis://localhost:6379",
      },
    }),
    PrismaModule,
    AuthModule,
    AdminModule,
    IntegrationsModule,
    StorageModule,
    BillingModule,
    GenerationsModule,
    StoriesModule,
  ],
})
export class AppModule {}

