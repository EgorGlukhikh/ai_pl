import { Module } from "@nestjs/common";
import { StoriesController } from "./stories.controller";
import { StoriesService } from "./stories.service";
import { StorageModule } from "../storage/storage.module";
import { IntegrationsModule } from "../integrations/integrations.module";

@Module({
  imports: [StorageModule, IntegrationsModule],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}

