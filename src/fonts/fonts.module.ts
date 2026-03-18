import { Module } from '@nestjs/common';
import { FontsService } from './fonts.service';
import { PublicFontsController, AdminFontsController } from './fonts.controller';
import { PrismaService } from '../prisma.service';

@Module({
  controllers: [PublicFontsController, AdminFontsController],
  providers:   [FontsService, PrismaService],
  exports:     [FontsService],
})
export class FontsModule {}
