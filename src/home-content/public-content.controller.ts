import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { HomeContentService } from './home-content.service';
import { AllSectionTexts, PersonalizationContent, CarouselSlide, GenreOption, CarouselSettings } from './home-content.types';

@Controller('public/content')
export class PublicContentController {
  constructor(private readonly homeContentService: HomeContentService) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  async health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /** GET /public/content */
  @Get()
  @HttpCode(HttpStatus.OK)
  async getPublicContent() {
    return this.homeContentService.getContent();
  }

  /** GET /public/content/section-texts */
  @Get('section-texts')
  @HttpCode(HttpStatus.OK)
  async getSectionTexts(): Promise<{ success: boolean; data: AllSectionTexts }> {
    const data = await this.homeContentService.getSectionTexts();
    return { success: true, data };
  }

  /** GET /public/content/personalization */
  @Get('personalization')
  @HttpCode(HttpStatus.OK)
  async getPersonalization(): Promise<{ success: boolean; data: PersonalizationContent }> {
    const data = await this.homeContentService.getPersonalizationContent();
    return { success: true, data };
  }

  /** GET /public/content/carousel */
  @Get('carousel')
  @HttpCode(HttpStatus.OK)
  async getCarousel(): Promise<{ success: boolean; data: CarouselSlide[] }> {
    const data = await this.homeContentService.getCarouselSlides(false);
    return { success: true, data };
  }

  /** GET /public/content/genre-options */
  @Get('genre-options')
  @HttpCode(HttpStatus.OK)
  async getGenreOptions(): Promise<{ success: boolean; data: GenreOption[] }> {
    const data = await this.homeContentService.getGenreOptions();
    return { success: true, data };
  }

  /** GET /public/content/carousel/settings */
  @Get('carousel/settings')
  @HttpCode(HttpStatus.OK)
  async getCarouselSettings(): Promise<{ success: boolean; data: CarouselSettings }> {
    const data = await this.homeContentService.getCarouselSettings();
    return { success: true, data };
  }
}
