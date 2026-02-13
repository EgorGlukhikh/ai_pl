import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { AdminGuard } from "../common/admin.guard";
import { AdminService } from "./admin.service";

@Controller("admin")
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("complexes")
  listComplexes() {
    return this.adminService.listComplexes();
  }

  @Post("complexes")
  createComplex(@Body() body: { developerName: string; name: string; city: string; description?: string }) {
    return this.adminService.createComplex(body);
  }

  @Patch("complexes/:id")
  updateComplex(@Param("id") id: string, @Body() body: { developerName?: string; name?: string; city?: string; description?: string; isActive?: boolean }) {
    return this.adminService.updateComplex(id, body);
  }

  @Delete("complexes/:id")
  deleteComplex(@Param("id") id: string) {
    return this.adminService.deleteComplex(id);
  }

  @Post("room-types")
  createRoomType(@Body() body: { complexId: string; rooms: "ONE" | "TWO" | "THREE" | "FOUR_PLUS"; label: string }) {
    return this.adminService.createRoomType(body);
  }

  @Delete("room-types/:id")
  deleteRoomType(@Param("id") id: string) {
    return this.adminService.deleteRoomType(id);
  }

  @Post("assets")
  createAsset(@Body() body: { complexId: string; type: "PHOTO" | "PLAN"; url: string; meta?: Record<string, unknown> }) {
    return this.adminService.createAsset(body);
  }

  @Delete("assets/:id")
  deleteAsset(@Param("id") id: string) {
    return this.adminService.deleteAsset(id);
  }

  @Patch("users/:id/subscription")
  setSubscription(@Param("id") userId: string, @Body() body: { plan: "FREE" | "PRO" }) {
    return this.adminService.setSubscription(userId, body.plan);
  }
}

