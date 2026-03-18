import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { UpdateContentDto } from './dto/update-content.dto';
import {
  SectionText,
  AllSectionTexts,
  PersonalizationContent,
  CarouselSlide,
  GenreOption,
  CarouselSettings,
} from './home-content.types';

// ── Valeurs par défaut ───────────────────────────────────────────────────────

const DEFAULT_SECTION_TEXTS: AllSectionTexts = {
  designs:       { title: 'Nos Designs',       description: 'Découvrez nos créations uniques',            buttonText: 'Voir tout'  },
  influencers:   { title: 'Nos Influenceurs',   description: 'Des créateurs de contenu inspirants',        buttonText: 'Découvrir'  },
  merchandising: { title: 'Merchandising',      description: 'Produits personnalisés de qualité',          buttonText: 'Commander'  },
};

const DEFAULT_PERSONALIZATION: PersonalizationContent = {
  videoUrl:   null,
  title:      'PERSONNALISEZ UN PRODUIT QUI VOUS IDENTIFIE',
  subtitle:   'Chaque étape est pensée pour que vous soyez le créateur et créatif !',
  steps: [
    'Choisissez votre produit',
    'Sélectionnez ou importez un design',
    'Personnalisez à votre façon',
    'Validez votre commande',
    'Recevez votre création chez vous',
  ],
  buttonText: 'Choisir son produit',
};

const DEFAULT_CAROUSEL_SLIDES_DATA = [
  {
    order: 0, title: "CRÉER OU TROUVER VOTRE STYLE,", subtitle: "NOUS L'IMPRIMONS.",
    collection: 'Collection', collectionName: 'StreetWear', collectionSubtitle: 'Pour les fans de street fashion',
    primaryBtn: 'Je personnalise', secondaryBtn: 'Je Découvre',
    buttonColor: '#F2D12E', buttonTextColor: '#000000', bgColor: '#1a1a2e',
    mediaUrl: null, mediaType: 'image', isActive: true,
  },
  {
    order: 1, title: 'LE STYLE', subtitle: "OUI NOUS L'IMPRIMONS.",
    collection: 'Collection', collectionName: 'Otaku', collectionSubtitle: 'Pour les fans de manga',
    primaryBtn: 'Je personnalise', secondaryBtn: 'Je Découvre',
    buttonColor: '#049BE5', buttonTextColor: '#ffffff', bgColor: '#16213e',
    mediaUrl: null, mediaType: 'image', isActive: true,
  },
  {
    order: 2, title: 'SUMMER VIBE ÇA VOUS PARLE ?', subtitle: "OUI NOUS L'IMPRIMONS.",
    collection: 'Collection', collectionName: 'été 2025', collectionSubtitle: 'Pour les beaux jours',
    primaryBtn: 'Je personnalise', secondaryBtn: 'Je Découvre',
    buttonColor: '#E5042B', buttonTextColor: '#ffffff', bgColor: '#1a1a2e',
    mediaUrl: null, mediaType: 'image', isActive: true,
  },
];

const DEFAULT_GENRE_OPTIONS: GenreOption[] = [
  { value: 'homme',   label: 'Homme'   },
  { value: 'femme',   label: 'Femme'   },
  { value: 'enfant',  label: 'Enfant'  },
  { value: 'unisexe', label: 'Unisexe' },
];

@Injectable()
export class HomeContentService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // ── Validation URL ─────────────────────────────────────────────────────────

  private isValidImageUrl(url: string): boolean {
    if (url.startsWith('/')) return true;
    const allowedDomains = [
      'res.cloudinary.com',
      'images.unsplash.com',
      'tse2.mm.bing.net',
      'lh3.googleusercontent.com',
      'firebasestorage.googleapis.com',
    ];
    try {
      const urlObj = new URL(url);
      return allowedDomains.some((d) => urlObj.hostname.includes(d));
    } catch {
      return false;
    }
  }

  // ── Contenu principal (HomeContent) ───────────────────────────────────────

  async getContent() {
    try {
      const content = await this.prisma.homeContent.findMany({ orderBy: { order: 'asc' } });
      return {
        designs:       content.filter((i) => i.type === 'DESIGN').map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl })),
        influencers:   content.filter((i) => i.type === 'INFLUENCER').map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl })),
        merchandising: content.filter((i) => i.type === 'MERCHANDISING').map((i) => ({ id: i.id, name: i.name, imageUrl: i.imageUrl })),
      };
    } catch (error) {
      console.error('Erreur getContent:', error);
      throw new BadRequestException('Erreur lors du chargement du contenu');
    }
  }

  async updateContent(updateDto: UpdateContentDto) {
    try {
      const allItems = [
        ...updateDto.designs.map((item) => ({ ...item, type: 'DESIGN' as const })),
        ...updateDto.influencers.map((item) => ({ ...item, type: 'INFLUENCER' as const })),
        ...updateDto.merchandising.map((item) => ({ ...item, type: 'MERCHANDISING' as const })),
      ];

      for (const item of allItems) {
        if (item.imageUrl && item.imageUrl.trim() !== '' && !this.isValidImageUrl(item.imageUrl)) {
          throw new BadRequestException(`URL invalide pour l'item ${item.id}`);
        }
        await this.prisma.homeContent.upsert({
          where: { id: item.id },
          create: { id: item.id, name: item.name, imageUrl: item.imageUrl || '', type: item.type, order: 0 },
          update: { name: item.name, imageUrl: item.imageUrl || '' },
        });
      }
      return { success: true, message: 'Contenu mis à jour avec succès' };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException('Erreur lors de la mise à jour du contenu');
    }
  }

  async uploadContentImage(file: Express.Multer.File, section: string) {
    try {
      const result = await this.cloudinaryService.uploadImageWithOptions(file, {
        folder: `home_content/${section}`,
        public_id: `${section}_${Date.now()}`,
      });
      return { url: result.secure_url, publicId: result.public_id };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Erreur lors de l'upload de l'image");
    }
  }

  async initializeContent() {
    try {
      const existingCount = await this.prisma.homeContent.count();
      if (existingCount > 0) throw new BadRequestException('Le contenu existe déjà');

      await this.prisma.homeContent.createMany({
        data: [
          { name: 'Pap Musa',       imageUrl: '', type: 'DESIGN',        order: 0 },
          { name: 'Ceeneer',        imageUrl: '', type: 'DESIGN',        order: 1 },
          { name: 'K & C',          imageUrl: '', type: 'DESIGN',        order: 2 },
          { name: 'Breadwinner',    imageUrl: '', type: 'DESIGN',        order: 3 },
          { name: 'Meissa Biguey',  imageUrl: '', type: 'DESIGN',        order: 4 },
          { name: 'DAD',            imageUrl: '', type: 'DESIGN',        order: 5 },
          { name: 'Ebu Jomlong',    imageUrl: '', type: 'INFLUENCER',    order: 0 },
          { name: 'Dip Poundou',    imageUrl: '', type: 'INFLUENCER',    order: 1 },
          { name: 'Massamba',       imageUrl: '', type: 'INFLUENCER',    order: 2 },
          { name: 'Amina Abed',     imageUrl: '', type: 'INFLUENCER',    order: 3 },
          { name: 'Mut Cash',       imageUrl: '', type: 'INFLUENCER',    order: 4 },
          { name: 'Bathie Drizzy',  imageUrl: '', type: 'MERCHANDISING', order: 0 },
          { name: 'Latzo Dozé',     imageUrl: '', type: 'MERCHANDISING', order: 1 },
          { name: 'Jaaw Ketchup',   imageUrl: '', type: 'MERCHANDISING', order: 2 },
          { name: 'Dudu FDV',       imageUrl: '', type: 'MERCHANDISING', order: 3 },
          { name: 'Adja Everywhere',imageUrl: '', type: 'MERCHANDISING', order: 4 },
          { name: 'Pape Sidy Fall', imageUrl: '', type: 'MERCHANDISING', order: 5 },
        ],
      });
      return { success: true, message: 'Contenu initialisé avec succès', count: 17 };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new BadRequestException("Erreur lors de l'initialisation du contenu");
    }
  }

  // ── Section Texts ──────────────────────────────────────────────────────────

  async getSectionTexts(): Promise<AllSectionTexts> {
    // Insertion paresseuse des valeurs par défaut si les lignes n'existent pas encore
    for (const [section, defaults] of Object.entries(DEFAULT_SECTION_TEXTS)) {
      await this.prisma.sectionText.upsert({
        where: { section },
        create: { section, ...defaults },
        update: {}, // ne rien écraser si déjà présent
      });
    }
    const rows = await this.prisma.sectionText.findMany();
    const toObj = (s: string): SectionText => {
      const r = rows.find((x) => x.section === s);
      return r
        ? { title: r.title, description: r.description, buttonText: r.buttonText }
        : DEFAULT_SECTION_TEXTS[s as keyof AllSectionTexts];
    };
    return { designs: toObj('designs'), influencers: toObj('influencers'), merchandising: toObj('merchandising') };
  }

  async updateSectionTexts(
    section: 'designs' | 'influencers' | 'merchandising',
    data: Partial<SectionText>,
  ): Promise<AllSectionTexts> {
    await this.prisma.sectionText.upsert({
      where: { section },
      create: { section, ...DEFAULT_SECTION_TEXTS[section], ...data },
      update: { ...data },
    });
    return this.getSectionTexts();
  }

  // ── Personnalisation ───────────────────────────────────────────────────────

  async getPersonalizationContent(): Promise<PersonalizationContent> {
    const row = await this.prisma.personalizationSection.upsert({
      where:  { id: 1 },
      create: { id: 1, ...DEFAULT_PERSONALIZATION, videoUrl: null, steps: DEFAULT_PERSONALIZATION.steps },
      update: {},
    });

    const steps = row.steps as string[];

    // Migration automatique : si la ligne existe avec moins de 5 étapes (ancienne valeur par défaut),
    // on complète avec les étapes manquantes des defaults
    if (steps.length < DEFAULT_PERSONALIZATION.steps.length) {
      const mergedSteps = DEFAULT_PERSONALIZATION.steps.map((def, i) => steps[i] ?? def);
      await this.prisma.personalizationSection.update({
        where: { id: 1 },
        data:  { steps: mergedSteps },
      });
      return {
        videoUrl:   row.videoUrl ?? null,
        title:      row.title,
        subtitle:   row.subtitle,
        steps:      mergedSteps,
        buttonText: row.buttonText,
      };
    }

    return {
      videoUrl:   row.videoUrl ?? null,
      title:      row.title,
      subtitle:   row.subtitle,
      steps:      steps,
      buttonText: row.buttonText,
    };
  }

  async updatePersonalizationContent(data: Partial<PersonalizationContent>): Promise<PersonalizationContent> {
    const updatePayload: Record<string, unknown> = {};
    if (data.videoUrl   !== undefined) updatePayload.videoUrl   = data.videoUrl;
    if (data.title      !== undefined) updatePayload.title      = data.title;
    if (data.subtitle   !== undefined) updatePayload.subtitle   = data.subtitle;
    if (data.steps      !== undefined) updatePayload.steps      = data.steps;
    if (data.buttonText !== undefined) updatePayload.buttonText = data.buttonText;

    await this.prisma.personalizationSection.upsert({
      where:  { id: 1 },
      create: { id: 1, ...DEFAULT_PERSONALIZATION, videoUrl: null, steps: DEFAULT_PERSONALIZATION.steps, ...updatePayload },
      update: updatePayload,
    });
    return this.getPersonalizationContent();
  }

  async uploadPersonalizationVideo(file: Express.Multer.File): Promise<{ url: string; publicId: string }> {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
    if (!allowedTypes.includes(file.mimetype)) throw new BadRequestException('Format vidéo non supporté. Utilisez MP4, WebM, OGG ou MOV');
    if (file.size > 100 * 1024 * 1024) throw new BadRequestException('Vidéo trop volumineuse (max 100MB)');

    const result = await this.cloudinaryService.uploadImageWithOptions(file, {
      folder: 'home_content/personalization',
      resource_type: 'video',
      public_id: `personalization_video_${Date.now()}`,
    });
    return { url: result.secure_url, publicId: result.public_id };
  }

  // ── Carousel : slides ──────────────────────────────────────────────────────

  private rowToSlide(row: any): CarouselSlide {
    return {
      id:                 row.id,
      order:              row.order,
      title:              row.title,
      subtitle:           row.subtitle,
      collection:         row.collection,
      collectionName:     row.collectionName,
      collectionSubtitle: row.collectionSubtitle,
      primaryBtn:         row.primaryBtn,
      secondaryBtn:       row.secondaryBtn,
      buttonColor:        row.buttonColor,
      buttonTextColor:    row.buttonTextColor ?? undefined,
      bgColor:            row.bgColor ?? undefined,
      mediaUrl:           row.mediaUrl ?? undefined,
      mediaType:          row.mediaType as 'image' | 'video',
      cloudinaryPublicId: row.cloudinaryPublicId ?? undefined,
      isActive:           row.isActive,
      createdAt:          row.createdAt instanceof Date ? row.createdAt.toISOString() : row.createdAt,
      updatedAt:          row.updatedAt instanceof Date ? row.updatedAt.toISOString() : row.updatedAt,
    };
  }

  async getCarouselSlides(adminMode = false): Promise<CarouselSlide[]> {
    const rows = await this.prisma.carouselSlide.findMany({
      where:   adminMode ? {} : { isActive: true },
      orderBy: { order: 'asc' },
    });
    return rows.map((r) => this.rowToSlide(r));
  }

  async initializeCarouselSlides(): Promise<{ success: boolean; message: string; count: number }> {
    const existing = await this.prisma.carouselSlide.count();
    if (existing > 0) throw new BadRequestException('Les slides sont déjà initialisés');

    await this.prisma.carouselSlide.createMany({ data: DEFAULT_CAROUSEL_SLIDES_DATA as any });
    return { success: true, message: 'Slides initialisés avec succès', count: DEFAULT_CAROUSEL_SLIDES_DATA.length };
  }

  async addCarouselSlide(data: Partial<Omit<CarouselSlide, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CarouselSlide[]> {
    const maxOrderRow = await this.prisma.carouselSlide.findFirst({ orderBy: { order: 'desc' } });
    const newOrder = (maxOrderRow?.order ?? -1) + 1;

    await this.prisma.carouselSlide.create({
      data: {
        order:              newOrder,
        title:              data.title              ?? 'Nouveau Slide',
        subtitle:           data.subtitle           ?? "OUI NOUS L'IMPRIMONS.",
        collection:         data.collection         ?? 'Collection',
        collectionName:     data.collectionName     ?? '',
        collectionSubtitle: data.collectionSubtitle ?? '',
        primaryBtn:         data.primaryBtn         ?? 'Je personnalise',
        secondaryBtn:       data.secondaryBtn       ?? 'Je Découvre',
        buttonColor:        data.buttonColor        ?? '#F2D12E',
        buttonTextColor:    data.buttonTextColor    ?? '#000000',
        bgColor:            data.bgColor            ?? null,
        mediaUrl:           data.mediaUrl           ?? null,
        mediaType:          data.mediaType          ?? 'image',
        isActive:           data.isActive           ?? true,
      },
    });
    return this.getCarouselSlides(true);
  }

  async updateCarouselSlide(
    id: string,
    data: Partial<Omit<CarouselSlide, 'id' | 'createdAt' | 'cloudinaryPublicId'>>,
  ): Promise<CarouselSlide> {
    const existing = await this.prisma.carouselSlide.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Slide ${id} non trouvé`);

    // Construire un payload propre (exclure les champs non éditables)
    const { id: _id, createdAt: _c, cloudinaryPublicId: _cpId, ...safeData } = data as any;
    const updated = await this.prisma.carouselSlide.update({ where: { id }, data: safeData });
    return this.rowToSlide(updated);
  }

  async deleteCarouselSlide(id: string): Promise<CarouselSlide[]> {
    const existing = await this.prisma.carouselSlide.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Slide ${id} non trouvé`);
    await this.prisma.carouselSlide.delete({ where: { id } });
    return this.getCarouselSlides(true);
  }

  async uploadCarouselMedia(
    slideId: string,
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string; mediaType: 'image' | 'video' }> {
    const isVideo = file.mimetype.startsWith('video/');
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) throw new BadRequestException(`Fichier trop volumineux (max ${isVideo ? '50MB' : '10MB'})`);

    const result = await this.cloudinaryService.uploadImageWithOptions(file, {
      folder:        'home_content/carousel',
      resource_type: isVideo ? 'video' : 'image',
      public_id:     `carousel_${slideId}_${Date.now()}`,
    });

    const existing = await this.prisma.carouselSlide.findUnique({ where: { id: slideId } });
    if (existing) {
      await this.prisma.carouselSlide.update({
        where: { id: slideId },
        data:  { mediaUrl: result.secure_url, mediaType: isVideo ? 'video' : 'image', cloudinaryPublicId: result.public_id },
      });
    }
    return { url: result.secure_url, publicId: result.public_id, mediaType: isVideo ? 'video' : 'image' };
  }

  // ── Carousel : paramètres ─────────────────────────────────────────────────

  async getCarouselSettings(): Promise<CarouselSettings> {
    const row = await this.prisma.carouselConfig.upsert({
      where:  { id: 1 },
      create: { id: 1, autoPlayInterval: 5000 },
      update: {},
    });
    return { autoPlayInterval: row.autoPlayInterval ?? null };
  }

  async updateCarouselSettings(data: Partial<CarouselSettings>): Promise<CarouselSettings> {
    const row = await this.prisma.carouselConfig.upsert({
      where:  { id: 1 },
      create: { id: 1, autoPlayInterval: data.autoPlayInterval ?? 5000 },
      update: { autoPlayInterval: data.autoPlayInterval },
    });
    return { autoPlayInterval: row.autoPlayInterval ?? null };
  }

  // ── Options de genre ──────────────────────────────────────────────────────

  async getGenreOptions(): Promise<GenreOption[]> {
    const count = await this.prisma.contentGenreOption.count();
    if (count === 0) {
      await this.prisma.contentGenreOption.createMany({ data: DEFAULT_GENRE_OPTIONS });
    }
    const rows = await this.prisma.contentGenreOption.findMany({ orderBy: { id: 'asc' } });
    return rows.map((r) => ({ value: r.value, label: r.label }));
  }

  async addGenreOption(value: string, label: string): Promise<GenreOption[]> {
    const existing = await this.prisma.contentGenreOption.findUnique({ where: { value } });
    if (existing) throw new BadRequestException(`L'option "${value}" existe déjà`);
    await this.prisma.contentGenreOption.create({ data: { value, label } });
    return this.getGenreOptions();
  }

  async deleteGenreOption(value: string): Promise<GenreOption[]> {
    const existing = await this.prisma.contentGenreOption.findUnique({ where: { value } });
    if (!existing) throw new NotFoundException(`Option "${value}" non trouvée`);
    await this.prisma.contentGenreOption.delete({ where: { value } });
    return this.getGenreOptions();
  }
}
