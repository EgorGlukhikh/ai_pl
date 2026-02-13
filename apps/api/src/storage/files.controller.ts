import { Controller, Get, Param, Res } from "@nestjs/common";
import { Response } from "express";
import { StorageService } from "./storage.service";

@Controller("files")
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Get(":name")
  async download(@Param("name") name: string, @Res() res: Response) {
    const file = await this.storageService.readFile(name);
    res.setHeader("Content-Type", "image/png");
    res.send(file);
  }
}

