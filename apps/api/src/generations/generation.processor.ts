import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";
import { GigaChatService } from "../integrations/gigachat/gigachat.service";
import { RenderService } from "../storage/render.service";
import { StorageService } from "../storage/storage.service";
import { StoryTemplateKey } from "@ai-pl/shared";

@Processor("generation")
export class GenerationProcessor extends WorkerHost {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gigaChat: GigaChatService,
    private readonly renderService: RenderService,
    private readonly storageService: StorageService,
  ) {
    super();
  }

  async process(job: Job<{ generationId: string }>): Promise<void> {
    const generation = await this.prisma.generationRequest.findUnique({
      where: { id: job.data.generationId },
      include: { complex: true, roomType: true },
    });
    if (!generation) return;

    await this.prisma.generationRequest.update({
      where: { id: generation.id },
      data: { status: "PROCESSING", error: null },
    });

    try {
      const variants = await this.gigaChat.generateVariants({
        offerText: generation.offerText,
        roomLabel: generation.roomType.label,
        complexName: generation.complex.name,
        developerName: generation.complex.developerName,
      });

      const templates: StoryTemplateKey[] = ["T1", "T2", "T3", "T4", "T5", "T6"];

      await this.prisma.storyVariant.deleteMany({ where: { generationRequestId: generation.id } });

      for (let i = 0; i < templates.length; i++) {
        const lines = variants[i];
        const png = this.renderService.renderPng(lines, templates[i]);
        const stored = await this.storageService.savePng(png);

        await this.prisma.storyVariant.create({
          data: {
            generationRequestId: generation.id,
            templateKey: templates[i],
            linesJson: lines,
            previewPngUrl: stored.url,
            finalPngUrl: stored.url,
          },
        });
      }

      await this.prisma.generationRequest.update({
        where: { id: generation.id },
        data: { status: "DONE" },
      });
    } catch (error) {
      await this.prisma.generationRequest.update({
        where: { id: generation.id },
        data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" },
      });
    }
  }
}

