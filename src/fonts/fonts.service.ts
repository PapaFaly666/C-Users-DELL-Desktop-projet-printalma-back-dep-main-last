import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateFontDto } from './dto/create-font.dto';
import { UpdateFontDto } from './dto/update-font.dto';

@Injectable()
export class FontsService {
  constructor(private prisma: PrismaService) {}

  // ── Public ─────────────────────────────────────────────────────────────────

  /** Polices actives pour le sélecteur côté client */
  async getActiveFonts() {
    return this.prisma.font.findMany({
      where:   { isActive: true },
      orderBy: { name: 'asc' },
      select:  { id: true, name: true, value: true, googleFontUrl: true, isActive: true, createdAt: true, updatedAt: true },
    });
  }

  // ── Admin ──────────────────────────────────────────────────────────────────

  /** Toutes les polices (actives et inactives) */
  async getAllFonts() {
    return this.prisma.font.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createFont(dto: CreateFontDto) {
    const existing = await this.prisma.font.findUnique({ where: { value: dto.value } });
    if (existing) throw new ConflictException(`Une police avec la valeur CSS "${dto.value}" existe déjà`);

    return this.prisma.font.create({
      data: {
        name:          dto.name.trim(),
        value:         dto.value.trim(),
        googleFontUrl: dto.googleFontUrl?.trim() || null,
        isActive:      dto.isActive ?? true,
      },
    });
  }

  async updateFont(id: number, dto: UpdateFontDto) {
    await this.findOrFail(id);

    // Vérifier l'unicité de la valeur CSS si elle change
    if (dto.value) {
      const conflict = await this.prisma.font.findFirst({ where: { value: dto.value, id: { not: id } } });
      if (conflict) throw new ConflictException(`Une police avec la valeur CSS "${dto.value}" existe déjà`);
    }

    return this.prisma.font.update({
      where: { id },
      data: {
        ...(dto.name          !== undefined && { name:          dto.name.trim()          }),
        ...(dto.value         !== undefined && { value:         dto.value.trim()         }),
        ...(dto.googleFontUrl !== undefined && { googleFontUrl: dto.googleFontUrl.trim() || null }),
        ...(dto.isActive      !== undefined && { isActive:      dto.isActive             }),
      },
    });
  }

  async toggleFont(id: number) {
    const font = await this.findOrFail(id);
    return this.prisma.font.update({
      where: { id },
      data:  { isActive: !font.isActive },
    });
  }

  async deleteFont(id: number) {
    await this.findOrFail(id);
    return this.prisma.font.delete({ where: { id } });
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private async findOrFail(id: number) {
    const font = await this.prisma.font.findUnique({ where: { id } });
    if (!font) throw new NotFoundException(`Police #${id} non trouvée`);
    return font;
  }
}
