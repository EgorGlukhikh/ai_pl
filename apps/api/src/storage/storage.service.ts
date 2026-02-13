import { Injectable } from "@nestjs/common";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

@Injectable()
export class StorageService {
  private readonly baseDir = join(process.cwd(), "uploads");

  async savePng(buffer: Buffer) {
    await fs.mkdir(this.baseDir, { recursive: true });
    const name = `${randomUUID()}.png`;
    const path = join(this.baseDir, name);
    await fs.writeFile(path, buffer);
    return { name, url: `/files/${name}` };
  }

  async readFile(name: string) {
    const path = join(this.baseDir, name);
    return fs.readFile(path);
  }
}

