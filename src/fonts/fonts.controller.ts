import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, ParseIntPipe, HttpCode, HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FontsService } from './fonts.service';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

// ── Public ────────────────────────────────────────────────────────────────────

@Controller('public/fonts')
export class PublicFontsController {
  constructor(private readonly fontsService: FontsService) {}

  /** GET /public/fonts — polices actives pour le sélecteur de personnalisation */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getActiveFonts() {
    const data = await this.fontsService.getActiveFonts();
    return { success: true, data };
  }
}

// ── Admin ─────────────────────────────────────────────────────────────────────

@Controller('admin/fonts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class AdminFontsController {
  constructor(private readonly fontsService: FontsService) {}

  /** GET /admin/fonts */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllFonts() {
    const data = await this.fontsService.getAllFonts();
    return { success: true, data };
  }

  /** POST /admin/fonts */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createFont(@Body() dto: CreateFontDto) {
    const data = await this.fontsService.createFont(dto);
    return { success: true, data };
  }

  /** PUT /admin/fonts/:id */
  @Put(':id')
  @HttpCode(HttpStatus.OK)
  async updateFont(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateFontDto) {
    const data = await this.fontsService.updateFont(id, dto);
    return { success: true, data };
  }

  /** PATCH /admin/fonts/:id/toggle */
  @Patch(':id/toggle')
  @HttpCode(HttpStatus.OK)
  async toggleFont(@Param('id', ParseIntPipe) id: number) {
    const data = await this.fontsService.toggleFont(id);
    return { success: true, data };
  }

  /** DELETE /admin/fonts/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async deleteFont(@Param('id', ParseIntPipe) id: number) {
    await this.fontsService.deleteFont(id);
    return { success: true, message: 'Police supprimée' };
  }
}
