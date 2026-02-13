import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import { StoriesService } from "./stories.service";
import { patchStoryLinesSchema } from "@ai-pl/shared";

@Controller("stories")
@UseGuards(JwtAuthGuard)
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Patch(":id/lines")
  updateLines(
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: { lines: unknown },
  ) {
    const payload = patchStoryLinesSchema.parse(body);
    return this.storiesService.updateLines(user.sub, id, payload.lines);
  }

  @Post(":id/render")
  rerender(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.storiesService.rerender(user.sub, id);
  }

  @Get(":id/download")
  download(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.storiesService.download(user.sub, id);
  }

  @Post(":id/send-telegram")
  sendTelegram(
    @CurrentUser() user: { sub: string },
    @Param("id") id: string,
    @Body() body: { telegramId?: string; caption?: string },
  ) {
    return this.storiesService.sendTelegram(user.sub, id, body);
  }
}

