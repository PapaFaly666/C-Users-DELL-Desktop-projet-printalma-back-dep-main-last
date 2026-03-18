import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Body,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { HomeContentService } from './home-content.service';
import { UpdateContentDto } from './dto/update-content.dto';
import { SectionText, AllSectionTexts, PersonalizationContent, CarouselSlide, GenreOption, CarouselSettings } from './home-content.types';

@Controller('admin/content')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class AdminContentController {
  constructor(private readonly homeContentService: HomeContentService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** GET /admin/content */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getContent() {
    return this.homeContentService.getContent();
  }

  /** PUT /admin/content */
  @Put()
  @HttpCode(HttpStatus.OK)
  async updateContent(@Body() updateDto: UpdateContentDto) {
    return this.homeContentService.updateContent(updateDto);
  }

  /** POST /admin/content/upload */
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'text/xml'];
        if (allowed.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.svg')) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Format non supporté. Utilisez JPG, PNG, WEBP ou SVG'), false);
        }
      },
    })
  )
  @HttpCode(HttpStatus.OK)
  async uploadContentImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('section') section: string,
  ) {
    if (!file) return { success: false, message: 'Aucun fichier fourni' };
    const result = await this.homeContentService.uploadContentImage(file, section);
    return { success: true, data: result };
  }

  /** POST /admin/content/initialize */
  @Post('initialize')
  @HttpCode(HttpStatus.CREATED)
  async initializeContent() {
    return this.homeContentService.initializeContent();
  }

  // ── Section Texts ──────────────────────────────────────────────────────────

  /** PATCH /admin/content/section-texts/:section */
  @Patch('section-texts/:section')
  @HttpCode(HttpStatus.OK)
  async updateSectionTexts(
    @Param('section') section: 'designs' | 'influencers' | 'merchandising',
    @Body() data: Partial<SectionText>,
  ): Promise<{ success: boolean; data: AllSectionTexts }> {
    const valid = ['designs', 'influencers', 'merchandising'];
    if (!valid.includes(section)) throw new BadRequestException('Section invalide');
    const result = await this.homeContentService.updateSectionTexts(section, data);
    return { success: true, data: result };
  }

  // ── Personalization ────────────────────────────────────────────────────────

  /** PATCH /admin/content/personalization */
  @Patch('personalization')
  @HttpCode(HttpStatus.OK)
  async updatePersonalization(@Body() data: Partial<PersonalizationContent>): Promise<{ success: boolean; data: PersonalizationContent }> {
    const result = await this.homeContentService.updatePersonalizationContent(data);
    return { success: true, data: result };
  }

  /** POST /admin/content/personalization/upload-video */
  @Post('personalization/upload-video')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('video/')) cb(null, true);
        else cb(new BadRequestException('Seuls les fichiers vidéo sont acceptés'), false);
      },
    })
  )
  @HttpCode(HttpStatus.OK)
  async uploadPersonalizationVideo(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { success: false, message: 'Aucun fichier fourni' };
    const result = await this.homeContentService.uploadPersonalizationVideo(file);
    return { success: true, data: result };
  }

  // ── Carousel ───────────────────────────────────────────────────────────────
  // IMPORTANT: static routes MUST be defined before parameterized ones (:id)
  // so NestJS doesn't match "settings" or "slides" as a dynamic :id segment.

  /** GET /admin/content/carousel */
  @Get('carousel')
  @HttpCode(HttpStatus.OK)
  async getCarouselSlides(): Promise<{ success: boolean; data: CarouselSlide[] }> {
    const slides = await this.homeContentService.getCarouselSlides(true);
    return { success: true, data: slides };
  }

  /** GET /admin/content/carousel/settings */
  @Get('carousel/settings')
  @HttpCode(HttpStatus.OK)
  async getCarouselSettings(): Promise<{ success: boolean; data: CarouselSettings }> {
    const data = await this.homeContentService.getCarouselSettings();
    return { success: true, data };
  }

  /** PATCH /admin/content/carousel/settings */
  @Patch('carousel/settings')
  @HttpCode(HttpStatus.OK)
  async updateCarouselSettings(@Body() data: Partial<CarouselSettings>): Promise<{ success: boolean; data: CarouselSettings }> {
    const result = await this.homeContentService.updateCarouselSettings(data);
    return { success: true, data: result };
  }

  /** POST /admin/content/carousel/initialize */
  @Post('carousel/initialize')
  @HttpCode(HttpStatus.CREATED)
  async initializeCarousel() {
    return this.homeContentService.initializeCarouselSlides();
  }

  /** POST /admin/content/carousel/slides */
  @Post('carousel/slides')
  @HttpCode(HttpStatus.CREATED)
  async addCarouselSlide(@Body() data: Partial<CarouselSlide>): Promise<{ success: boolean; data: CarouselSlide[] }> {
    const result = await this.homeContentService.addCarouselSlide(data);
    return { success: true, data: result };
  }

  /** DELETE /admin/content/carousel/slides/:id */
  @Delete('carousel/slides/:id')
  @HttpCode(HttpStatus.OK)
  async deleteCarouselSlide(@Param('id') id: string): Promise<{ success: boolean; data: CarouselSlide[] }> {
    const result = await this.homeContentService.deleteCarouselSlide(id);
    return { success: true, data: result };
  }

  /** PATCH /admin/content/carousel/:id  ← MUST come after all static /carousel/* routes */
  @Patch('carousel/:id')
  @HttpCode(HttpStatus.OK)
  async updateCarouselSlide(@Param('id') id: string, @Body() data: Partial<CarouselSlide>): Promise<{ success: boolean; data: CarouselSlide }> {
    const result = await this.homeContentService.updateCarouselSlide(id, data);
    return { success: true, data: result };
  }

  /** POST /admin/content/carousel/:slideId/upload  ← MUST come after static /carousel/* routes */
  @Post('carousel/:slideId/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
        if (allowed.includes(file.mimetype) || file.mimetype.startsWith('video/')) cb(null, true);
        else cb(new BadRequestException('Format non supporté'), false);
      },
    })
  )
  @HttpCode(HttpStatus.OK)
  async uploadCarouselMedia(
    @Param('slideId') slideId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) return { success: false, message: 'Aucun fichier fourni' };
    const result = await this.homeContentService.uploadCarouselMedia(slideId, file);
    return { success: true, data: result };
  }

  // ── Genre Options ──────────────────────────────────────────────────────────

  /** POST /admin/content/genre-options */
  @Post('genre-options')
  @HttpCode(HttpStatus.CREATED)
  async addGenreOption(@Body() body: { value: string; label: string }): Promise<{ success: boolean; data: GenreOption[] }> {
    if (!body.value || !body.label) throw new BadRequestException('value et label sont requis');
    const result = await this.homeContentService.addGenreOption(body.value, body.label);
    return { success: true, data: result };
  }

  /** DELETE /admin/content/genre-options/:value */
  @Delete('genre-options/:value')
  @HttpCode(HttpStatus.OK)
  async deleteGenreOption(@Param('value') value: string): Promise<{ success: boolean; data: GenreOption[] }> {
    const result = await this.homeContentService.deleteGenreOption(decodeURIComponent(value));
    return { success: true, data: result };
  }
}
