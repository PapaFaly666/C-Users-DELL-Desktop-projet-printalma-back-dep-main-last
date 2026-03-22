import { Injectable, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomizationDto, UpdateCustomizationDto } from './dto/create-customization.dto';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { OrderMockupGeneratorService } from '../order/services/order-mockup-generator.service';
import { ProductPreviewGeneratorService } from '../vendor-product/services/product-preview-generator.service';
import { MailService } from '../core/mail/mail.service';

@Injectable()
export class CustomizationService {
  private readonly logger = new Logger(CustomizationService.name);

  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private mockupGenerator: OrderMockupGeneratorService,
    private previewGenerator: ProductPreviewGeneratorService,
    private mailService: MailService
  ) {}

  /**
   * Créer ou mettre à jour une personnalisation
   * Si une personnalisation existe déjà pour le même produit/user/session, la mettre à jour
   */
  async upsertCustomization(
    dto: CreateCustomizationDto,
    userId?: number,
    customizationId?: number
  ) {
    this.logger.log(`Sauvegarde personnalisation - Product: ${dto.productId}, User: ${userId || 'guest'}, CustomizationId: ${customizationId || 'new'}`);

    // Debug: vérifier ce qui arrive dans le service
    this.logger.log(`📥 DTO reçu dans service:`);
    this.logger.log(`  - designElements: ${dto.designElements ? `présent (${dto.designElements.length} éléments)` : 'absent'}`);
    this.logger.log(`  - elementsByView: ${dto.elementsByView ? `présent (${Object.keys(dto.elementsByView).length} vues)` : 'absent'}`);

    // Normaliser les données - Convertir designElements en elementsByView si nécessaire
    let normalizedElementsByView: Record<string, any[]>;

    if (dto.elementsByView) {
      // Format multi-vues fourni directement
      normalizedElementsByView = dto.elementsByView;
      this.logger.log(`  - Utilisation de elementsByView (${Object.keys(dto.elementsByView).length} vues)`);
    } else if (dto.designElements) {
      // Format simple - Convertir en format multi-vues
      const viewKey = `${dto.colorVariationId}-${dto.viewId}`;
      normalizedElementsByView = {
        [viewKey]: dto.designElements
      };
      this.logger.log(`  - Conversion de designElements vers elementsByView[${viewKey}] (${dto.designElements.length} éléments)`);
    } else {
      // Aucun élément fourni
      const viewKey = `${dto.colorVariationId}-${dto.viewId}`;
      normalizedElementsByView = {
        [viewKey]: []
      };
      this.logger.warn(`  ⚠️ Aucun élément de design fourni!`);
    }

    // 🔧 VALIDATION: Détecter et corriger les arrays imbriqués dans elementsByView
    Object.keys(normalizedElementsByView).forEach(viewKey => {
      const elements = normalizedElementsByView[viewKey];

      if (elements.length > 0 && Array.isArray(elements[0])) {
        this.logger.warn(`⚠️ BUG DÉTECTÉ dans vue ${viewKey}: array imbriqué! Correction automatique...`);

        // Si c'est [[]], extraire le contenu
        if (elements.length === 1 && Array.isArray(elements[0])) {
          normalizedElementsByView[viewKey] = elements[0];
        }
      }

      // Filtrer les éléments invalides
      normalizedElementsByView[viewKey] = normalizedElementsByView[viewKey].filter(el => {
        if (!el || typeof el !== 'object' || Array.isArray(el)) {
          this.logger.warn(`⚠️ Élément invalide filtré dans vue ${viewKey}: ${JSON.stringify(el)}`);
          return false;
        }
        return true;
      });
    });

    // Compter le total d'éléments
    const totalElements = Object.values(normalizedElementsByView).reduce((sum, elements) => sum + elements.length, 0);
    this.logger.debug(`  - Total éléments: ${totalElements}`);
    if (totalElements > 0) {
      const firstView = Object.keys(normalizedElementsByView)[0];
      const firstElement = normalizedElementsByView[firstView][0];
      this.logger.debug(`  - Premier élément (vue ${firstView}): ${JSON.stringify(firstElement).substring(0, 150)}...`);
    }

    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId }
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    // Calculer le prix total (si sizeSelections fourni)
    const totalQuantity = dto.sizeSelections?.reduce((sum, s) => sum + s.quantity, 0) || 0;
    const totalPrice = totalQuantity * Number(product.price);

    // Préparer designElements pour Prisma (pour compatibilité)
    // On stocke les éléments de la première vue comme designElements
    const firstViewKey = Object.keys(normalizedElementsByView)[0];
    let designElementsForPrisma = normalizedElementsByView[firstViewKey] || [];

    // 🔧 VALIDATION: Détecter et corriger le bug du double array wrapping
    if (designElementsForPrisma.length > 0 && Array.isArray(designElementsForPrisma[0])) {
      this.logger.warn(`⚠️ BUG DÉTECTÉ: designElements contient un array imbriqué! Correction automatique...`);
      this.logger.debug(`  Avant: ${JSON.stringify(designElementsForPrisma).substring(0, 100)}`);

      // Si c'est [[]], on doit utiliser le premier élément (qui est lui-même un array)
      // Si c'est [[{...}]], extraire le contenu
      if (designElementsForPrisma.length === 1 && Array.isArray(designElementsForPrisma[0])) {
        designElementsForPrisma = designElementsForPrisma[0];
      }

      this.logger.debug(`  Après: ${JSON.stringify(designElementsForPrisma).substring(0, 100)}`);
    }

    // 🔧 VALIDATION: S'assurer que designElementsForPrisma est un array d'objets valides
    if (Array.isArray(designElementsForPrisma)) {
      // Filtrer les éléments qui ne sont pas des objets valides
      designElementsForPrisma = designElementsForPrisma.filter(el => {
        if (!el || typeof el !== 'object' || Array.isArray(el)) {
          this.logger.warn(`⚠️ Élément invalide filtré: ${JSON.stringify(el)}`);
          return false;
        }
        return true;
      });
    }

    // Données communes pour update - Cast en type Prisma compatible
    const updateData = {
      colorVariationId: dto.colorVariationId,
      viewId: dto.viewId,
      designElements: designElementsForPrisma as any,  // Format simple (compatibilité)
      elementsByView: normalizedElementsByView as any,  // Format multi-vues (nouveau)
      delimitations: (dto.delimitations as any) || null,
      sizeSelections: (dto.sizeSelections as any) || null,
      previewImageUrl: dto.previewImageUrl,
      totalPrice,
      timestamp: dto.timestamp ? BigInt(dto.timestamp) : null,
      sessionId: userId ? null : dto.sessionId,
      status: 'draft',
      ...(dto.vendorProductId && { vendorProductId: dto.vendorProductId }),
      ...(dto.clientEmail && { clientEmail: dto.clientEmail }),
      ...(dto.clientName && { clientName: dto.clientName }),
    };

    // Données pour create (inclut productId et userId)
    const createData = {
      ...updateData,
      productId: dto.productId,
      ...(userId && { userId }),  // Seulement si userId existe
    };

    this.logger.debug(`📦 Data to save:`);
    this.logger.debug(`  - elementsByView vues: ${Object.keys(normalizedElementsByView).join(', ')}`);
    this.logger.debug(`  - designElements count (compat): ${designElementsForPrisma.length}`);
    this.logger.debug(`  - Total éléments (toutes vues): ${totalElements}`);
    if (totalElements > 0) {
      this.logger.debug(`  - First element keys: ${Object.keys(normalizedElementsByView[firstViewKey][0]).join(', ')}`);
    }

    // Si un customizationId est fourni, mettre à jour directement cette personnalisation
    if (customizationId) {
      const existingCustomization = await this.prisma.productCustomization.findUnique({
        where: { id: customizationId }
      });

      if (!existingCustomization) {
        throw new NotFoundException(`Customization with ID ${customizationId} not found`);
      }

      // Vérifier les permissions (l'utilisateur doit être propriétaire ou c'est une session guest)
      if (userId && existingCustomization.userId !== userId) {
        throw new NotFoundException(`Customization not found or access denied`);
      }

      if (!userId && existingCustomization.sessionId !== dto.sessionId) {
        throw new NotFoundException(`Customization not found or access denied`);
      }

      this.logger.log(`Mise à jour personnalisation spécifique: ${customizationId}`);
      const updated = await this.prisma.productCustomization.update({
        where: { id: customizationId },
        data: updateData,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });

      // Debug: vérifier ce qui est retourné
      this.logger.debug(`✅ Updated customization ${updated.id}:`);
      this.logger.debug(`  - designElements: ${Array.isArray(updated.designElements) ? (updated.designElements as any[]).length : 0} éléments`);
      this.logger.debug(`  - elementsByView: ${updated.elementsByView ? JSON.stringify(updated.elementsByView).substring(0, 200) + '...' : 'null'}`);

      // 🎨 Générer mockup et envoyer email si un email est fourni
      await this.generateAndSendCustomizationEmail(updated, dto.clientEmail);

      return updated;
    }

    // Sinon, chercher une personnalisation existante pour ce produit
    const existingCustomization = await this.prisma.productCustomization.findFirst({
      where: {
        productId: dto.productId,
        ...(userId ? { userId } : { sessionId: dto.sessionId }),
        status: 'draft'
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    if (existingCustomization) {
      // Mettre à jour la plus récente
      this.logger.log(`Mise à jour personnalisation existante: ${existingCustomization.id}`);
      const updated = await this.prisma.productCustomization.update({
        where: { id: existingCustomization.id },
        data: updateData,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });

      this.logger.debug(`✅ Updated draft ${updated.id}:`);
      this.logger.debug(`  - designElements: ${Array.isArray(updated.designElements) ? (updated.designElements as any[]).length : 0} éléments`);
      this.logger.debug(`  - elementsByView: ${updated.elementsByView ? JSON.stringify(updated.elementsByView).substring(0, 200) + '...' : 'null'}`);

      // 🎨 Générer mockup et envoyer email si un email est fourni
      await this.generateAndSendCustomizationEmail(updated, dto.clientEmail);

      return updated;
    } else {
      // Créer nouveau
      this.logger.log('Création nouvelle personnalisation');
      const created = await this.prisma.productCustomization.create({
        data: createData,
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });

      this.logger.debug(`✅ Created customization ${created.id}:`);
      this.logger.debug(`  - designElements: ${Array.isArray(created.designElements) ? (created.designElements as any[]).length : 0} éléments`);
      this.logger.debug(`  - elementsByView: ${created.elementsByView ? JSON.stringify(created.elementsByView).substring(0, 200) + '...' : 'null'}`);

      // 🎨 Générer mockup et envoyer email si un email est fourni
      await this.generateAndSendCustomizationEmail(created, dto.clientEmail);

      return created;
    }
  }

  /**
   * Récupérer une personnalisation par ID
   */
  async getCustomizationById(id: number) {
    const customization = await this.prisma.productCustomization.findUnique({
      where: { id },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });

    if (!customization) {
      throw new NotFoundException(`Customization with ID ${id} not found`);
    }

    return customization;
  }

  /**
   * Récupérer toutes les personnalisations d'un utilisateur
   */
  async getUserCustomizations(userId: number, status?: string) {
    return this.prisma.productCustomization.findMany({
      where: {
        userId,
        ...(status && { status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   */
  async getSessionCustomizations(sessionId: string, status?: string) {
    return this.prisma.productCustomization.findMany({
      where: {
        sessionId,
        ...(status && { status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Mettre à jour une personnalisation
   */
  async updateCustomization(id: number, dto: UpdateCustomizationDto) {
    // Vérifier que la personnalisation existe
    await this.getCustomizationById(id);

    return this.prisma.productCustomization.update({
      where: { id },
      data: {
        ...(dto.designElements && { designElements: JSON.parse(JSON.stringify(dto.designElements)) }),
        ...(dto.sizeSelections && { sizeSelections: JSON.parse(JSON.stringify(dto.sizeSelections)) }),
        ...(dto.previewImageUrl && { previewImageUrl: dto.previewImageUrl }),
        ...(dto.status && { status: dto.status })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Supprimer une personnalisation
   */
  async deleteCustomization(id: number) {
    await this.getCustomizationById(id);

    return this.prisma.productCustomization.delete({
      where: { id }
    });
  }

  /**
   * Marquer une personnalisation comme commandée
   */
  async markAsOrdered(id: number, orderId: number) {
    return this.prisma.productCustomization.update({
      where: { id },
      data: {
        status: 'ordered',
        orderId
      }
    });
  }

  /**
   * Migrer les personnalisations d'une session guest vers un utilisateur connecté
   * Utilisé lors de la connexion/inscription
   */
  async migrateGuestCustomizations(sessionId: string, userId: number) {
    this.logger.log(`Migration des personnalisations de session ${sessionId} vers utilisateur ${userId}`);

    // Récupérer toutes les personnalisations de la session
    const guestCustomizations = await this.prisma.productCustomization.findMany({
      where: {
        sessionId,
        userId: null, // S'assurer que ce sont bien des personnalisations guest
      }
    });

    if (guestCustomizations.length === 0) {
      this.logger.log('Aucune personnalisation guest à migrer');
      return { migrated: 0, customizations: [] };
    }

    // Mettre à jour toutes les personnalisations pour les lier à l'utilisateur
    const updatePromises = guestCustomizations.map(customization =>
      this.prisma.productCustomization.update({
        where: { id: customization.id },
        data: {
          userId,
          sessionId: null, // Retirer le sessionId car l'utilisateur est maintenant connecté
        }
      })
    );

    const migratedCustomizations = await Promise.all(updatePromises);

    this.logger.log(`${migratedCustomizations.length} personnalisation(s) migrée(s) avec succès`);

    return {
      migrated: migratedCustomizations.length,
      customizations: migratedCustomizations
    };
  }

  /**
   * Récupérer une personnalisation draft pour un produit spécifique
   * Utile pour continuer une personnalisation en cours
   */
  async getDraftCustomizationForProduct(
    productId: number,
    userId?: number,
    sessionId?: string
  ) {
    const customization = await this.prisma.productCustomization.findFirst({
      where: {
        productId,
        status: 'draft',
        ...(userId ? { userId } : { sessionId })
      },
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    return customization;
  }

  /**
   * Rechercher des personnalisations avec filtres
   * GET /api/customizations?productId=123&sessionId=guest_abc123&userId=789
   */
  async findCustomizations(filters: {
    productId?: number;
    sessionId?: string;
    userId?: number;
    status?: string;
  }) {
    const where: any = {};

    if (filters.productId) {
      where.productId = filters.productId;
    }

    if (filters.userId) {
      where.userId = filters.userId;
    } else if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    return this.prisma.productCustomization.findMany({
      where,
      include: {
        product: {
          include: {
            colorVariations: {
              include: {
                images: true
              }
            }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  }

  /**
   * Upload d'une image pour une personnalisation (legacy - utilise uploadClientImage)
   * POST /api/customizations/upload-image
   */
  async uploadCustomizationImage(file: Express.Multer.File) {
    this.logger.log(`Upload image personnalisation: ${file.originalname}`);

    // Valider le fichier
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    // Vérifier le type MIME
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}. Allowed: ${allowedMimes.join(', ')}`);
    }

    // Upload vers Cloudinary
    const result = await this.cloudinaryService.uploadImage(file, 'customizations');

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height
    };
  }

  /**
   * Upload d'une image client pour personnalisation
   * POST /api/customizations/upload-image
   * Supporte les utilisateurs connectés et les guests
   */
  async uploadClientImage(
    file: Express.Multer.File,
    userId?: number,
    sessionId?: string
  ) {
    this.logger.log(`📤 [Customization] Upload image client:`, {
      filename: file.originalname,
      size: (file.size / 1024).toFixed(2) + ' KB',
      mimetype: file.mimetype,
      userId: userId || 'guest',
      sessionId: sessionId?.substring(0, 8) + '...'
    });

    // Valider le fichier
    if (!file) {
      throw new BadRequestException('Aucun fichier fourni');
    }

    // Vérifier la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('La taille du fichier dépasse 10MB');
    }

    // Vérifier le type MIME
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Type de fichier invalide: ${file.mimetype}. Formats acceptés: ${allowedMimes.join(', ')}`);
    }

    try {
      // Upload vers Cloudinary avec tracking user/session
      const result = await this.cloudinaryService.uploadClientImage(
        file.buffer,
        file.originalname,
        userId,
        sessionId
      );

      this.logger.log('✅ [Customization] Image client uploadée avec succès:', {
        url: result.url,
        publicId: result.publicId,
        dimensions: `${result.width}x${result.height}`
      });

      return {
        success: true,
        ...result
      };
    } catch (error) {
      this.logger.error('❌ [Customization] Erreur upload image client:', error);
      throw new BadRequestException(
        error.message || 'Erreur lors de l\'upload de l\'image'
      );
    }
  }

  /**
   * Upload d'une image de prévisualisation (mockup)
   */
  async uploadPreviewImage(base64Data: string) {
    this.logger.log('Upload preview image');

    if (!base64Data) {
      throw new BadRequestException('No image data provided');
    }

    // Vérifier le format base64
    if (!base64Data.startsWith('data:image/')) {
      throw new BadRequestException('Invalid base64 format');
    }

    const result = await this.cloudinaryService.uploadBase64(base64Data, {
      folder: 'customization-previews',
      quality: 'auto:good'
    });

    return {
      url: result.secure_url,
      publicId: result.public_id
    };
  }

  /**
   * Valider les éléments de design selon la spécification
   * IMPORTANT: Les retours à la ligne (\n) dans le texte DOIVENT être préservés
   */
  validateDesignElements(elements: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxElements = 50; // Limite le nombre d'éléments par personnalisation

    if (!Array.isArray(elements)) {
      return { valid: false, errors: ['designElements must be an array'] };
    }

    if (elements.length > maxElements) {
      errors.push(`Too many elements: ${elements.length}. Maximum is ${maxElements}`);
    }

    elements.forEach((element, index) => {
      // Champs obligatoires pour tous les éléments
      if (!element.id || typeof element.id !== 'string') {
        errors.push(`Element ${index}: id is required and must be a string`);
      }

      if (!element.type || !['text', 'image'].includes(element.type)) {
        errors.push(`Element ${index}: type must be "text" or "image"`);
      }

      // Vérifier les coordonnées (0-1)
      if (typeof element.x !== 'number' || element.x < 0 || element.x > 1) {
        errors.push(`Element ${index}: x must be a number between 0 and 1 (got ${element.x})`);
      }
      if (typeof element.y !== 'number' || element.y < 0 || element.y > 1) {
        errors.push(`Element ${index}: y must be a number between 0 and 1 (got ${element.y})`);
      }

      // Vérifier les dimensions
      if (typeof element.width !== 'number' || element.width <= 0) {
        errors.push(`Element ${index}: width must be a positive number`);
      }
      if (typeof element.height !== 'number' || element.height <= 0) {
        errors.push(`Element ${index}: height must be a positive number`);
      }

      // Rotation
      if (typeof element.rotation !== 'number') {
        errors.push(`Element ${index}: rotation must be a number`);
      }

      // zIndex
      if (typeof element.zIndex !== 'number') {
        errors.push(`Element ${index}: zIndex must be a number`);
      }

      // Validations spécifiques au type
      if (element.type === 'text') {
        // Texte - IMPORTANT: peut contenir des \n pour les retours à la ligne
        if (typeof element.text !== 'string') {
          errors.push(`Element ${index}: text must be a string`);
        }
        if (element.text && element.text.length > 500) {
          errors.push(`Element ${index}: text exceeds 500 characters`);
        }

        // Taille de police (10-100 selon la spec)
        if (typeof element.fontSize !== 'number' || element.fontSize < 10 || element.fontSize > 100) {
          errors.push(`Element ${index}: fontSize must be a number between 10 and 100 (got ${element.fontSize})`);
        }

        // Police
        if (!element.fontFamily || typeof element.fontFamily !== 'string') {
          errors.push(`Element ${index}: fontFamily is required and must be a string`);
        }

        // Couleur (format hex strict)
        if (!element.color || !/^#[0-9A-Fa-f]{6}$/.test(element.color)) {
          errors.push(`Element ${index}: color must be a valid hex color (e.g., #000000)`);
        }

        // fontWeight
        if (!['normal', 'bold'].includes(element.fontWeight)) {
          errors.push(`Element ${index}: fontWeight must be "normal" or "bold"`);
        }

        // fontStyle
        if (!['normal', 'italic'].includes(element.fontStyle)) {
          errors.push(`Element ${index}: fontStyle must be "normal" or "italic"`);
        }

        // textDecoration
        if (!['none', 'underline'].includes(element.textDecoration)) {
          errors.push(`Element ${index}: textDecoration must be "none" or "underline"`);
        }

        // textAlign
        if (!['left', 'center', 'right'].includes(element.textAlign)) {
          errors.push(`Element ${index}: textAlign must be "left", "center", or "right"`);
        }
      }

      if (element.type === 'image') {
        // URL d'image requise
        if (!element.imageUrl) {
          errors.push(`Element ${index}: imageUrl is required for image elements`);
        }

        // Vérifier que l'URL est valide (domaines autorisés)
        if (element.imageUrl) {
          const allowedDomains = ['res.cloudinary.com', 'localhost', '127.0.0.1'];
          try {
            const url = new URL(element.imageUrl);
            const isAllowed = allowedDomains.some(domain => url.hostname.includes(domain));
            if (!isAllowed && !element.imageUrl.startsWith('/')) {
              errors.push(`Element ${index}: imageUrl domain not allowed`);
            }
          } catch {
            // URL relative ou invalide
            if (!element.imageUrl.startsWith('/')) {
              errors.push(`Element ${index}: invalid imageUrl`);
            }
          }
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Version améliorée de upsertCustomization avec validation
   */
  async upsertCustomizationWithValidation(
    dto: CreateCustomizationDto,
    userId?: number,
    customizationId?: number
  ) {
    // Valider les éléments de design
    const validation = this.validateDesignElements(dto.designElements);
    if (!validation.valid) {
      throw new BadRequestException({
        message: 'Invalid design elements',
        errors: validation.errors
      });
    }

    // Appeler la méthode existante
    return this.upsertCustomization(dto, userId, customizationId);
  }

  /**
   * 🎨📧 Générer le mockup de la personnalisation et envoyer un email au client
   *
   * @param customization - Personnalisation sauvegardée
   * @param clientEmail - Email du client (optionnel)
   */
  private async generateAndSendCustomizationEmail(customization: any, clientEmail?: string): Promise<void> {
    this.logger.log(`\n🎨 ===== GÉNÉRATION MOCKUP =====`);
    if (clientEmail) {
      this.logger.log(`📧 Email client: ${clientEmail}`);
    }
    this.logger.log(`🆔 Customization ID: ${customization.id}`);

    try {
      // 1. Récupérer TOUTES les vues de elementsByView (y compris celles sans éléments)
      const elementsByView = customization.elementsByView || {};
      const allViewKeys = Object.keys(elementsByView);

      if (allViewKeys.length === 0) {
        this.logger.warn(`⚠️  Aucune vue dans elementsByView - pas de mockup à générer`);
        return;
      }

      this.logger.log(`🗂️ ${allViewKeys.length} vue(s) à traiter: ${allViewKeys.join(', ')}`);

      const delimitations: any[] = Array.isArray(customization.delimitations) ? customization.delimitations : [];
      const mockupUrlsByView: Record<string, string> = {};

      // 2. Traiter CHAQUE vue - avec ou sans éléments de design
      for (const viewKey of allViewKeys) {
        const elements = elementsByView[viewKey];
        const hasElements = Array.isArray(elements) && elements.length > 0;

        // Extraire colorVariationId et imageId depuis la clé "colorId-imageId"
        const [colorVariationId, imageId] = viewKey.split('-').map(Number);

        // Trouver l'image du produit pour cette vue
        const colorVariation = customization.product?.colorVariations?.find(
          (cv: any) => cv.id === colorVariationId
        );
        const productImage = colorVariation?.images?.find((img: any) => img.id === imageId)
          ?? colorVariation?.images?.[0];

        if (!productImage?.url) {
          this.logger.warn(`⚠️  [Vue ${viewKey}] Image produit introuvable - vue ignorée`);
          continue;
        }

        // Si pas d'éléments, utiliser directement l'URL de l'image produit
        if (!hasElements) {
          mockupUrlsByView[viewKey] = productImage.url;
          this.logger.log(`📷 [Vue ${viewKey}] Pas d'éléments - image produit brute: ${productImage.url}`);
          continue;
        }

        // Trouver la délimitation correspondant à cette vue (par viewId ou productImageId)
        const delimitation = delimitations.find(
          d => d.viewId === imageId || d.productImageId === imageId
        ) ?? delimitations[0];

        this.logger.log(`🎨 [Vue ${viewKey}] ${elements.length} élément(s) sur image: ${productImage.url}`);
        if (delimitation) {
          this.logger.log(`📐 [Vue ${viewKey}] Délimitation: ${delimitation.width}x${delimitation.height}px`);
        }

        try {
          const url = await this.mockupGenerator.generateOrderMockup({
            productImageUrl: productImage.url,
            elements,
            delimitation: delimitation ? {
              x: delimitation.x,
              y: delimitation.y,
              width: delimitation.width,
              height: delimitation.height
            } : undefined
          });

          mockupUrlsByView[viewKey] = url;
          this.logger.log(`✅ [Vue ${viewKey}] Mockup généré: ${url}`);
        } catch (error) {
          this.logger.error(`❌ [Vue ${viewKey}] Erreur génération mockup: ${error.message}`);
          // En cas d'erreur, utiliser l'image produit brute comme fallback
          mockupUrlsByView[viewKey] = productImage.url;
        }
      }

      if (Object.keys(mockupUrlsByView).length === 0) {
        this.logger.warn(`⚠️  Aucun mockup généré - rien à sauvegarder`);
        return;
      }

      // 3. Sauvegarder : priorité aux vues avec éléments générés par Sharp pour finalImageUrlCustom
      // On cherche d'abord une vue customisée (non image brute) comme URL principale
      const customizedViewKeys = allViewKeys.filter(k => {
        const els = elementsByView[k];
        return Array.isArray(els) && els.length > 0;
      });
      const primaryKey = customizedViewKeys[0] ?? allViewKeys[0];
      const primaryUrl = mockupUrlsByView[primaryKey] ?? Object.values(mockupUrlsByView)[0];

      await this.prisma.productCustomization.update({
        where: { id: customization.id },
        data: {
          previewImageUrl: primaryUrl,
          finalImageUrlCustom: primaryUrl,
          mockupUrlsByView: mockupUrlsByView as any,
        }
      });

      this.logger.log(`💾 Mockups sauvegardés: ${Object.keys(mockupUrlsByView).length} vue(s) dans mockupUrlsByView, finalImageUrlCustom = vue principale`);

      // 4. Envoyer l'email au client (seulement si email fourni)
      if (clientEmail) {
        this.logger.log(`📧 Envoi de l'email à ${clientEmail}...`);

        await this.mailService.sendCustomizationEmail({
          email: clientEmail,
          productName: customization.product?.name || 'Produit personnalisé',
          mockupUrl: primaryUrl,
          clientName: customization.clientName
        });

        this.logger.log(`✅ Email envoyé avec succès à ${clientEmail}`);
      }

      this.logger.log(`===== FIN GÉNÉRATION =====\n`);

    } catch (error) {
      this.logger.error(`❌ Erreur lors de la génération/envoi:`, error.message);
      this.logger.error(`   Stack:`, error.stack);
      // Ne pas faire échouer la sauvegarde si l'email échoue
    }
  }

  /**
   * 🔄 RÉGÉNÉRER LE MOCKUP D'UNE PERSONNALISATION
   * Force la génération de finalImageUrlCustom même sans email
   *
   * @param customizationId - ID de la personnalisation
   */
  async regenerateCustomizationMockup(customizationId: number) {
    this.logger.log(`🔄 Régénération mockup pour customization ${customizationId}`);

    try {
      // 1. Récupérer la personnalisation avec toutes les données
      const customization = await this.prisma.productCustomization.findUnique({
        where: { id: customizationId },
        include: {
          product: {
            include: {
              colorVariations: {
                include: {
                  images: true
                }
              }
            }
          }
        }
      });

      if (!customization) {
        throw new NotFoundException(`Personnalisation ${customizationId} introuvable`);
      }

      this.logger.log(`✅ Personnalisation trouvée: ${customization.id}`);

      // 2. Vérifier qu'il y a des éléments de design
      const elementsByView = (customization.elementsByView as Record<string, any[]>) || {};
      const allViewKeys = Object.keys(elementsByView);

      if (allViewKeys.length === 0) {
        throw new BadRequestException('Aucune vue dans elementsByView - impossible de générer le mockup');
      }

      this.logger.log(`🗂️ ${allViewKeys.length} vue(s) à régénérer: ${allViewKeys.join(', ')}`);

      const delimitations: any[] = Array.isArray(customization.delimitations) ? customization.delimitations as any[] : [];
      const mockupUrlsByView: Record<string, string> = {};

      // 3. Traiter CHAQUE vue - avec ou sans éléments
      for (const viewKey of allViewKeys) {
        const elements = elementsByView[viewKey];
        const hasElements = Array.isArray(elements) && elements.length > 0;
        const [colorVariationId, imageId] = viewKey.split('-').map(Number);

        const colorVariation = customization.product?.colorVariations?.find(
          (cv: any) => cv.id === colorVariationId
        );
        const productImage = colorVariation?.images?.find((img: any) => img.id === imageId)
          ?? colorVariation?.images?.[0];

        if (!productImage?.url) {
          this.logger.warn(`⚠️  [Vue ${viewKey}] Image produit introuvable - vue ignorée`);
          continue;
        }

        // Pas d'éléments → image produit brute directement
        if (!hasElements) {
          mockupUrlsByView[viewKey] = productImage.url;
          this.logger.log(`📷 [Vue ${viewKey}] Pas d'éléments - image produit brute: ${productImage.url}`);
          continue;
        }

        const delimitation = delimitations.find(
          d => d.viewId === imageId || d.productImageId === imageId
        ) ?? delimitations[0];

        this.logger.log(`🎨 [Vue ${viewKey}] Génération sur image: ${productImage.url}`);

        try {
          const url = await this.mockupGenerator.generateOrderMockup({
            productImageUrl: productImage.url,
            elements,
            delimitation: delimitation ? {
              x: delimitation.x,
              y: delimitation.y,
              width: delimitation.width,
              height: delimitation.height
            } : undefined
          });
          mockupUrlsByView[viewKey] = url;
          this.logger.log(`✅ [Vue ${viewKey}] Mockup généré: ${url}`);
        } catch (error) {
          this.logger.error(`❌ [Vue ${viewKey}] Erreur: ${error.message}`);
          mockupUrlsByView[viewKey] = productImage.url;
        }
      }

      if (Object.keys(mockupUrlsByView).length === 0) {
        throw new BadRequestException('Échec de génération pour toutes les vues');
      }

      // Priorité aux vues customisées pour l'URL principale
      const customizedKeys = allViewKeys.filter(k => {
        const els = elementsByView[k];
        return Array.isArray(els) && els.length > 0;
      });
      const primaryKey = customizedKeys[0] ?? allViewKeys[0];
      const primaryUrl = mockupUrlsByView[primaryKey] ?? Object.values(mockupUrlsByView)[0];

      // 4. Mettre à jour la personnalisation
      await this.prisma.productCustomization.update({
        where: { id: customization.id },
        data: {
          previewImageUrl: primaryUrl,
          finalImageUrlCustom: primaryUrl,
          mockupUrlsByView: mockupUrlsByView as any,
        }
      });

      this.logger.log(`💾 ${Object.keys(mockupUrlsByView).length} mockup(s) sauvegardés dans mockupUrlsByView`);

      return {
        success: true,
        customizationId: customization.id,
        finalImageUrlCustom: primaryUrl,
        mockupUrlsByView,
        message: `Mockups régénérés avec succès (${Object.keys(mockupUrlsByView).length} vue(s))`
      };

    } catch (error) {
      this.logger.error(`❌ Erreur lors de la régénération:`, error.message);
      throw error;
    }
  }
}
