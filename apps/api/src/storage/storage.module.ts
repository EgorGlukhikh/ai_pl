import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { RenderService } from "./render.service";
import { FilesController } from "./files.controller";

@Module({
  providers: [StorageService, RenderService],
  controllers: [FilesController],
  exports: [StorageService, RenderService],
})
export class StorageModule {}

