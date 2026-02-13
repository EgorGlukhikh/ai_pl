import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { IntegrationsModule } from "../integrations/integrations.module";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [IntegrationsModule, AuthModule],
  controllers: [BillingController],
})
export class BillingModule {}

