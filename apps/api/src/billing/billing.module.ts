import { Module } from "@nestjs/common";
import { BillingController } from "./billing.controller";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [IntegrationsModule],
  controllers: [BillingController],
})
export class BillingModule {}

