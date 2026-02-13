import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser } from "../common/current-user.decorator";
import { GenerationsService } from "./generations.service";
import { createGenerationSchema } from "@ai-pl/shared";

@Controller()
@UseGuards(JwtAuthGuard)
export class GenerationsController {
  constructor(private readonly generationsService: GenerationsService) {}

  @Get("complexes")
  listComplexes() {
    return this.generationsService.listComplexes();
  }

  @Get("complexes/:id/room-types")
  listRoomTypes(@Param("id") complexId: string) {
    return this.generationsService.listRoomTypes(complexId);
  }

  @Get("limits/today")
  getTodayLimit(@CurrentUser() user: { sub: string }) {
    return this.generationsService.getTodayLimit(user.sub);
  }

  @Post("generations")
  async createGeneration(
    @CurrentUser() user: { sub: string },
    @Body() body: { complexId: string; roomTypeId: string; offerText: string },
  ) {
    const payload = createGenerationSchema.parse(body);
    return this.generationsService.createGeneration(user.sub, payload);
  }

  @Get("generations/:id")
  getGeneration(@CurrentUser() user: { sub: string }, @Param("id") id: string) {
    return this.generationsService.getGeneration(user.sub, id);
  }

  @Get("stories")
  getStories(@CurrentUser() user: { sub: string }) {
    return this.generationsService.getRecentStories(user.sub);
  }
}

