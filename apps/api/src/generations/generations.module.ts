import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { GenerationsController } from "./generations.controller";
import { GenerationsService } from "./generations.service";
import { GenerationProcessor } from "./generation.processor";
import { IntegrationsModule } from "../integrations/integrations.module";
import { StorageModule } from "../storage/storage.module";

@Module({
  imports: [BullModule.registerQueue({ name: "generation" }), IntegrationsModule, StorageModule],
  controllers: [GenerationsController],
  providers: [GenerationsService, GenerationProcessor],
  exports: [GenerationsService],
})
export class GenerationsModule {}

