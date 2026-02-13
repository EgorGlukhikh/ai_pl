import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { StoryLines } from "@ai-pl/shared";
import { PrismaService } from "../prisma/prisma.service";
import { RenderService } from "../storage/render.service";
import { StorageService } from "../storage/storage.service";
import { TelegramService } from "../integrations/telegram/telegram.service";

@Injectable()
export class StoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly renderService: RenderService,
    private readonly storageService: StorageService,
    private readonly telegramService: TelegramService,
  ) {}

  async updateLines(userId: string, storyId: string, lines: StoryLines) {
    const variant = await this.findOwnedVariant(userId, storyId);
    return this.prisma.storyVariant.update({
      where: { id: variant.id },
      data: { linesJson: lines },
    });
  }

  async rerender(userId: string, storyId: string) {
    const variant = await this.findOwnedVariant(userId, storyId);
    const lines = variant.linesJson as StoryLines;
    const png = this.renderService.renderPng(lines, variant.templateKey);
    const stored = await this.storageService.savePng(png);

    return this.prisma.storyVariant.update({
      where: { id: variant.id },
      data: { finalPngUrl: stored.url, previewPngUrl: stored.url },
    });
  }

  async download(userId: string, storyId: string) {
    const variant = await this.findOwnedVariant(userId, storyId);
    return {
      storyId: variant.id,
      url: variant.finalPngUrl || variant.previewPngUrl,
      format: "png",
      size: "1080x1920",
    };
  }

  async sendTelegram(userId: string, storyId: string, body: { telegramId?: string; caption?: string }) {
    const variant = await this.findOwnedVariant(userId, storyId);
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found");

    const telegramId = body.telegramId || user.telegramId;
    if (!telegramId) throw new ForbiddenException("Telegram is not linked");

    const imageUrl = `http://localhost:4000${variant.finalPngUrl || variant.previewPngUrl}`;
    return this.telegramService.sendStory({
      telegramId,
      imageUrl,
      caption: body.caption || "Your story is ready",
    });
  }

  private async findOwnedVariant(userId: string, storyId: string) {
    const variant = await this.prisma.storyVariant.findFirst({
      where: {
        id: storyId,
        generationRequest: { userId },
      },
    });
    if (!variant) throw new NotFoundException("Story variant not found");
    return variant;
  }
}

