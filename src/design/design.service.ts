import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { QueryDesignsDto, DesignStatus } from './dto/query-design.dto';
import { DesignResponseDto, DesignListResponseDto } from './dto/design-response.dto';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { UploadApiResponse } from 'cloudinary';
import { PublicationStatus, VendorProductStatus } from '@prisma/client';
import { MailService } from '../core/mail/mail.service';
import { DesignAutoValidationService } from './design-auto-validation.service';

@Injectable()
export class DesignService {
  private readonly logger = new Logger(DesignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
    private readonly mailService: MailService,
    @Inject(forwardRef(() => DesignAutoValidationService))
    private readonly autoValidationService: DesignAutoValidationService,
  ) {}

  async createDesign(
    vendorId: number,
    createDesignDto: CreateDesignDto,
    file: Express.Multer.File,
  ): Promise<DesignResponseDto> {
    // Validation du fichier
    this.validateFile(file);

    // Traitement des tags (string JSON depuis FormData)
    let tags: string[] = [];
    if (createDesignDto.tags) {
      try {
        const parsed = JSON.parse(createDesignDto.tags);
        tags = Array.isArray(parsed)
          ? parsed.map(tag => String(tag).trim()).filter(tag => tag.length > 0)
          : [];
      } catch {
        // Fallback: essayer de parser comme chaîne séparée par virgules
        tags = createDesignDto.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
    }

    // Vérifier si le vendeur est un vendeur Printalma (validation automatique)
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: { isPrintalmaVendor: true },
    });
    const isPrintalmaVendor = vendor?.isPrintalmaVendor === true;

    try {
      // Upload de l'image originale
      const originalUpload = await this.cloudinaryService.uploadImageWithOptions(file, {
        folder: `designs/${vendorId}`,
        transformation: [
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      // Génération de la miniature
      const thumbnailUpload = await this.cloudinaryService.uploadImageWithOptions(file, {
        folder: `designs/${vendorId}/thumbnails`,
        transformation: [
          { width: 400, height: 400, crop: 'fill' },
          { quality: 'auto', fetch_format: 'auto' }
        ]
      });

      // Extraction des métadonnées
      const dimensions = {
        width: originalUpload.width,
        height: originalUpload.height
      };

      // Vérifier que la catégorie existe et est active
      const category = await this.prisma.designCategory.findFirst({
        where: { 
          id: createDesignDto.categoryId,
          isActive: true 
        },
      });
      
      if (!category) {
        throw new BadRequestException('Catégorie non trouvée ou inactive');
      }

      // Création du design en base
      const design = await this.prisma.design.create({
        data: {
          vendorId,
          name: createDesignDto.name,
          description: createDesignDto.description || null,
          price: isPrintalmaVendor ? 0 : createDesignDto.price,
          categoryId: createDesignDto.categoryId,
          imageUrl: originalUpload.secure_url,
          thumbnailUrl: thumbnailUpload.secure_url,
          cloudinaryPublicId: originalUpload.public_id,
          thumbnailPublicId: thumbnailUpload.public_id,
          fileSize: file.size,
          originalFileName: file.originalname,
          dimensions,
          format: originalUpload.format,
          tags,
          isDraft: !isPrintalmaVendor,
          isPublished: isPrintalmaVendor,
          isPending: false,
          isValidated: isPrintalmaVendor,
          validatedAt: isPrintalmaVendor ? new Date() : null,
          publishedAt: isPrintalmaVendor ? new Date() : null,
        },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      // 🆕 NOTIFICATION EMAIL AUTOMATIQUE AUX ADMINS À LA CRÉATION
      this.logger.log(`📧 Envoi notification email aux admins pour nouveau design: ${design.name}`);
      await this.notifyAdminsNewDesignCreation(design);

      return this.formatDesignResponse(design);
    } catch (error) {
      // Nettoyage en cas d'erreur
      console.error('Erreur lors de la création du design:', error);
      throw new BadRequestException('Erreur lors de la création du design');
    }
  }

  async findAllByVendor(
    vendorId: number,
    queryDto: QueryDesignsDto,
  ): Promise<DesignListResponseDto> {
    const { page, limit, categoryId, status, search, sortBy, sortOrder } = queryDto;
    const currentPage = page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const take = limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;
    const skip = (currentPage - 1) * take;

    // Construction des filtres
    const where: any = {
      vendorId,
    };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status && status !== DesignStatus.ALL) {
      switch (status) {
        case DesignStatus.PUBLISHED:
          where.isPublished = true;
          where.isValidated = true;
          break;
        case DesignStatus.PENDING:
          where.isPending = true;
          break;
        case DesignStatus.DRAFT:
          where.isDraft = true;
          break;
        case DesignStatus.PENDING_VALIDATION:
          where.isPending = true;
          where.isValidated = false;
          break;
        case DesignStatus.VALIDATED:
          where.isValidated = true;
          break;
        case DesignStatus.REJECTED:
          where.isValidated = false;
          where.isPending = false;
          where.isDraft = false;
          where.rejectionReason = { not: null };
          break;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Construction du tri
    const orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'views':
        orderBy.views = sortOrder;
        break;
      case 'likes':
        orderBy.likes = sortOrder;
        break;
      case 'earnings':
        orderBy.earnings = sortOrder;
        break;
      default:
        orderBy.createdAt = sortOrder;
    }

    // Récupération des designs avec count des produits vendeur
    const [designs, totalCount] = await Promise.all([
      this.prisma.design.findMany({
        where: { ...where, isDelete: false },
        skip,
        take: take,
        orderBy,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          category: true,
          _count: {
            select: {
              vendorProducts: {
                where: {
                  isDelete: false
                }
              }
            }
          }
        }
      }),
      this.prisma.design.count({ where: { ...where, isDelete: false } })
    ]);

    // Calcul des statistiques
    const stats = await this.getVendorDesignStats(vendorId);

    // Calcul de la pagination
    const totalPages = Math.ceil(totalCount / take);

    return {
      designs: designs.map(design => this.formatDesignResponse(design)),
      pagination: {
        currentPage: currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: take
      },
      stats
    };
  }

  async findOne(id: number, vendorId: number): Promise<DesignResponseDto> {
    const design = await this.prisma.design.findFirst({
      where: {
        id,
        vendorId,
        isDelete: false
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!design) {
      throw new NotFoundException('Design non trouvé');
    }

    // Incrémenter les vues
    await this.incrementViews(id);

    return this.formatDesignResponse(design);
  }

  async updateDesign(
    id: number,
    vendorId: number,
    updateDesignDto: UpdateDesignDto,
  ): Promise<DesignResponseDto> {
    // Vérifier que le design appartient au vendeur
    const existingDesign = await this.prisma.design.findFirst({
      where: { id, vendorId, isDelete: false }
    });

    if (!existingDesign) {
      throw new NotFoundException('Design non trouvé');
    }

    // Traitement des tags si fournis
    const updateData: any = { ...updateDesignDto };

    if (updateDesignDto.tags !== undefined) {
      let tags: string[];
      try {
        const parsed = JSON.parse(updateDesignDto.tags);
        tags = Array.isArray(parsed)
          ? parsed.map(tag => String(tag).trim()).filter(tag => tag.length > 0)
          : [];
      } catch {
        // Fallback: essayer de parser comme chaîne séparée par virgules
        tags = updateDesignDto.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      }
      updateData.tags = tags;
    }

    if (updateDesignDto.categoryId) {
      // Vérifier que la nouvelle catégorie existe et est active
      const category = await this.prisma.designCategory.findFirst({
        where: { 
          id: updateDesignDto.categoryId,
          isActive: true 
        },
      });
      
      if (!category) {
        throw new BadRequestException('Catégorie non trouvée ou inactive');
      }

      updateData.categoryId = updateDesignDto.categoryId;

      // Si on change la catégorie d'un design qui était déjà validé, le remettre en validé
      if (existingDesign.validatedAt) {
        updateData.isValidated = true;
        updateData.isPending = false;
        updateData.isPublished = true;
      }
    }

    // Mise à jour du design
    const updatedDesign = await this.prisma.design.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return this.formatDesignResponse(updatedDesign);
  }

  async publishDesign(
    id: number,
    vendorId: number,
    isPublished: boolean,
  ): Promise<DesignResponseDto> {
    const existingDesign = await this.prisma.design.findFirst({
      where: { id, vendorId, isDelete: false }
    });

    if (!existingDesign) {
      throw new NotFoundException('Design non trouvé');
    }

    const updatedDesign = await this.prisma.design.update({
      where: { id },
      data: {
        isPublished,
        isDraft: !isPublished,
        publishedAt: isPublished ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    return this.formatDesignResponse(updatedDesign);
  }

  async deleteDesign(id: number, vendorId: number): Promise<void> {
    const existingDesign = await this.prisma.design.findFirst({
      where: { id, vendorId, isDelete: false }
    });

    if (!existingDesign) {
      throw new NotFoundException('Design non trouvé');
    }

    // Vérifier que le design n'est pas utilisé
    if (existingDesign.usageCount > 0) {
      throw new BadRequestException('Impossible de supprimer un design utilisé dans des commandes');
    }

    try {
      // Suppression des images de Cloudinary
      if (existingDesign.cloudinaryPublicId) {
        await this.cloudinaryService.deleteImage(existingDesign.cloudinaryPublicId);
      }
      if (existingDesign.thumbnailPublicId) {
        await this.cloudinaryService.deleteImage(existingDesign.thumbnailPublicId);
      }

      // Suppression du design en base
      await this.prisma.design.update({
        where: { id },
        data: { isDelete: true }
      });
    } catch (error) {
      console.error('Erreur lors de la suppression du design:', error);
      throw new BadRequestException('Erreur lors de la suppression du design');
    }
  }

  private validateFile(file: Express.Multer.File): void {
    // Validation minimale - seulement vérifier que le fichier existe
    if (!file) {
      throw new BadRequestException('Fichier requis');
    }
    // Plus de validation de type MIME ou de taille - accepter tous les fichiers
  }


  private formatDesignResponse(design: any): DesignResponseDto {
    // Déterminer le statut de validation selon la logique demandée
    let validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
    
    if (design.isValidated && design.validatedAt) {
      validationStatus = 'VALIDATED';
    } else if (!design.isValidated && design.validatedAt && design.rejectionReason) {
      validationStatus = 'REJECTED';
    } else {
      validationStatus = 'PENDING';
    }

    const vendorInfo = design.vendor ? {
      id: design.vendor.id,
      firstName: design.vendor.firstName,
      lastName: design.vendor.lastName,
      email: design.vendor.email,
      shop_name: design.vendor.shop_name || null,
      phone: design.vendor.phone || null,
      profile_photo_url: design.vendor.profile_photo_url || null,
      country: design.vendor.country || null,
      address: design.vendor.address || null,
    } : undefined;

    return {
      id: design.id,
      name: design.name,
      description: design.description || undefined,
      price: design.price,
      categoryId: design.categoryId,
      category: design.category ? {
        id: design.category.id,
        name: design.category.name,
        slug: design.category.slug,
        icon: design.category.icon,
        color: design.category.color,
      } : undefined,
      imageUrl: design.imageUrl,
      thumbnailUrl: design.thumbnailUrl || undefined,
      fileSize: design.fileSize || undefined,
      dimensions: design.dimensions || undefined,
      isPublished: design.isPublished,
      isPending: design.isPending,
      isDraft: design.isDraft,
      isValidated: design.isValidated,
      validationStatus, // Nouveau champ avec logique claire
      validatedAt: design.validatedAt ? design.validatedAt.toISOString() : undefined,
      validatorName: design.validator ? `${design.validator.firstName} ${design.validator.lastName}` : undefined,
      rejectionReason: design.rejectionReason || undefined,
      submittedForValidationAt: design.submittedForValidationAt ? design.submittedForValidationAt.toISOString() : undefined,
      tags: design.tags || [],
      usageCount: design.usageCount || 0,
      earnings: design.earnings || 0,
      views: design.views || 0,
      likes: design.likes || 0,
      createdAt: design.createdAt.toISOString(),
      updatedAt: design.updatedAt.toISOString(),
      publishedAt: design.publishedAt ? design.publishedAt.toISOString() : undefined,
      vendor: vendorInfo,
      vendorProductsCount: design._count?.vendorProducts || 0,
    };
  }

  private async incrementViews(designId: number): Promise<void> {
    await this.prisma.design.update({
      where: { id: designId },
      data: {
        views: {
          increment: 1
        }
      }
    });
  }

  private async getVendorDesignStats(vendorId: number) {
    const [total, published, pending, draft, earnings] = await Promise.all([
      this.prisma.design.count({ where: { vendorId, isDelete: false } }),
      this.prisma.design.count({ where: { vendorId, isPublished: true, isDelete: false } }),
      this.prisma.design.count({ where: { vendorId, isPending: true, isDelete: false } }),
      this.prisma.design.count({ where: { vendorId, isDraft: true, isDelete: false } }),
      this.prisma.design.aggregate({
        where: { vendorId, isDelete: false },
        _sum: { earnings: true, views: true, likes: true }
      })
    ]);

    return {
      total,
      published,
      pending,
      draft,
      totalEarnings: earnings._sum.earnings || 0,
      totalViews: earnings._sum.views || 0,
      totalLikes: earnings._sum.likes || 0,
    };
  }

  async updateEarnings(designId: number, amount: number): Promise<void> {
    await this.prisma.design.update({
      where: { id: designId },
      data: {
        earnings: {
          increment: amount
        },
        usageCount: {
          increment: 1
        }
      }
    });
  }

  /**
   * Soumet un design pour validation
   * Tous les VendorProducts liés sont impactés selon le forcedStatus
   */
  async submitForValidation(id: number, vendorId: number): Promise<DesignResponseDto> {
    const existingDesign = await this.prisma.design.findUnique({
      where: { id, isDelete: false },
      include: { vendor: true }
    });

    if (!existingDesign) {
      throw new NotFoundException('Design non trouvé');
    }

    if (existingDesign.vendorId !== vendorId) {
      throw new ForbiddenException('Ce design ne vous appartient pas');
    }

    if (existingDesign.isPending) {
      throw new BadRequestException('Ce design est déjà en attente de validation');
    }

    if (existingDesign.isValidated) {
      throw new BadRequestException('Ce design est déjà validé');
    }

    const updatedDesign = await this.prisma.design.update({
      where: { id },
      data: {
        isPending: true,
        isDraft: false,
        submittedForValidationAt: new Date(),
        rejectionReason: null,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // ✅ CORRECTION ARCHITECTURE V2: Plus de designId dans VendorProduct
    // Les designs sont maintenant stockés en base64 dans designBase64
    // Pas de mise à jour nécessaire car structure décorrélée

    // Notifier les admins par email
    await this.notifyAdminsNewDesignSubmission(updatedDesign);

    return this.formatDesignResponse(updatedDesign);
  }

  /**
   * Valide ou rejette un design (Admin seulement)
   * Logique: VALIDATED si approuvé, REJECTED si refusé, PENDING par défaut
   */
  async validateDesign(
    id: number, 
    adminId: number, 
    action: 'VALIDATE' | 'REJECT',
    rejectionReason?: string
  ): Promise<DesignResponseDto> {
    // Vérifier que l'utilisateur est admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      throw new ForbiddenException('Seuls les administrateurs peuvent valider les designs');
    }

    const existingDesign = await this.prisma.design.findUnique({
      where: { id, isDelete: false },
      include: { vendor: true }
    });

    if (!existingDesign) {
      throw new NotFoundException('Design non trouvé');
    }

    // Vérifier que le design est en PENDING (pas encore validé/rejeté)
    const isCurrentlyPending = !existingDesign.isValidated && 
                               !existingDesign.validatedAt && 
                               !existingDesign.rejectionReason;

    if (!isCurrentlyPending) {
      throw new BadRequestException('Ce design a déjà été traité (validé ou rejeté)');
    }

    const isApproved = action === 'VALIDATE';
    
    // Validation des données selon l'action
    if (action === 'REJECT' && (!rejectionReason || rejectionReason.trim() === '')) {
      throw new BadRequestException('Une raison de rejet est obligatoire pour rejeter un design');
    }

    const updatedDesign = await this.prisma.design.update({
      where: { id },
      data: {
        // Logique claire selon vos exigences
        isValidated: isApproved, // true si VALIDATE, false si REJECT
        validatedAt: new Date(), // Toujours set quand on traite
        validator: {
          connect: { id: adminId },
        },
        rejectionReason: isApproved ? null : rejectionReason, // null si validé, raison si rejeté
        
        // Mise à jour des autres champs
        isPending: false, // Plus en attente
        isPublished: isApproved, // Publié seulement si validé
        publishedAt: isApproved ? new Date() : null,
        updatedAt: new Date()
      },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        validator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // 🆕 NOUVEAU: Auto-validation des VendorProducts selon guidefr.md
    let autoValidationResult = null;
    if (isApproved) {
      try {
        // Déclencher l'auto-validation automatiquement après validation du design
        autoValidationResult = await this.autoValidationService.autoValidateProductsForDesign(id);
        this.logger.log(`🤖 Auto-validation: ${autoValidationResult.message}`);
      } catch (error) {
        // Ne pas faire échouer la validation du design si l'auto-validation échoue
        this.logger.warn(`⚠️ Erreur auto-validation après validation design ${id}:`, error.message);
      }
    }

    if (isApproved) {
      await this.notifyVendorDesignApproved(updatedDesign);
    } else {
      await this.notifyVendorDesignRejected(updatedDesign, rejectionReason);
    }

    // Inclure les résultats de l'auto-validation dans la réponse
    const response = this.formatDesignResponse(updatedDesign);
    if (autoValidationResult) {
      // Cast temporaire pour ajouter les données d'auto-validation
      (response as any).autoValidation = {
        updatedProducts: autoValidationResult.data.updatedProducts,
        count: autoValidationResult.data.updatedProducts.length
      };
    }

    return response;
  }

  /**
   * 🆕 MÉTHODE CASCADE VALIDATION AMÉLIORÉE V3
   * Utilise prioritairement designId et DesignProductLink, avec fallback URL
   */
  private async applyValidationActionToProducts(designImageUrl: string, vendorId: number, adminId: number): Promise<void> {
    try {
      this.logger.log(`🔍 === DÉBUT CASCADE VALIDATION V3 ===`);
      this.logger.log(`🎯 Design URL: ${designImageUrl}`);
      this.logger.log(`👤 Vendeur ID: ${vendorId}`);
      this.logger.log(`👨‍💼 Admin ID: ${adminId}`);

      // 🔍 ÉTAPE 1: Trouver le design par URL
      const design = await this.prisma.design.findFirst({
        where: {
          imageUrl: designImageUrl,
          vendorId: vendorId,
          isDelete: false
        }
      });

      if (!design) {
        this.logger.log(`⚠️ Design non trouvé avec URL: ${designImageUrl}`);
        
        // 🔄 FALLBACK: Méthode ancienne par URL
        this.logger.log(`🔄 Tentative fallback par URL...`);
        await this.applyValidationActionToProductsByUrl(designImageUrl, vendorId, adminId);
        return;
      }

      this.logger.log(`✅ Design trouvé: ${design.name} (ID: ${design.id})`);

      // 🔍 ÉTAPE 2A: Méthode principale - Trouver via DesignProductLink
      let linkedProducts = await this.prisma.designProductLink.findMany({
        where: {
          designId: design.id
        },
        include: {
          vendorProduct: {
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
                  email: true
                }
              }
            }
          }
        }
      });

      this.logger.log(`📋 Produits liés via DesignProductLink: ${linkedProducts.length}`);

      // 🔍 ÉTAPE 2B: Fallback - Trouver via designId direct
      if (linkedProducts.length === 0) {
        this.logger.log(`🔄 Recherche via designId direct...`);
        
        const directProducts = await this.prisma.vendorProduct.findMany({
          where: {
            designId: design.id
          },
          include: {
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        // Convertir au format DesignProductLink pour uniformiser
        linkedProducts = directProducts.map(product => ({
          id: 0, // Pas important pour le traitement
          designId: design.id,
          vendorProductId: product.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: product
        }));

        this.logger.log(`📋 Produits trouvés via designId direct: ${linkedProducts.length}`);
      }

      // 🔍 ÉTAPE 2C: Double fallback - Recherche par URL
      if (linkedProducts.length === 0) {
        this.logger.log(`🔄 Recherche par designCloudinaryUrl...`);
        
        const urlProducts = await this.prisma.vendorProduct.findMany({
          where: {
            designCloudinaryUrl: designImageUrl,
            vendorId: vendorId
          },
          include: {
            vendor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        });

        // Convertir au format DesignProductLink
        linkedProducts = urlProducts.map(product => ({
          id: 0,
          designId: design.id,
          vendorProductId: product.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          vendorProduct: product
        }));

        this.logger.log(`📋 Produits trouvés via URL: ${linkedProducts.length}`);

        // Créer les liens manquants pour les produits trouvés par URL
        for (const product of urlProducts) {
          try {
            // Mettre à jour designId si manquant
            if (!product.designId) {
              await this.prisma.vendorProduct.update({
                where: { id: product.id },
                data: { designId: design.id }
              });
              this.logger.log(`🔗 designId mis à jour pour produit ${product.id}`);
            }

            // Créer le lien DesignProductLink
            await this.prisma.designProductLink.create({
              data: {
                designId: design.id,
                vendorProductId: product.id
              }
            });
            this.logger.log(`🔗 Lien créé pour produit ${product.id}`);
          } catch (linkError) {
            if (linkError.code !== 'P2002') { // Ignorer les doublons
              this.logger.error(`❌ Erreur création lien produit ${product.id}:`, linkError);
            }
          }
        }
      }

      if (linkedProducts.length === 0) {
        this.logger.log(`⚠️ AUCUN PRODUIT TROUVÉ pour le design ${design.id}`);
        return;
      }

      // 🔍 ÉTAPE 3: Filtrer les produits éligibles (PENDING + non validés)
      const eligibleProducts = linkedProducts.filter(link => {
        const product = link.vendorProduct;
        const isEligible = product.status === 'PENDING' && !product.isValidated;
        
        this.logger.log(`🔍 Produit ${product.id}:`);
        this.logger.log(`   - Status: ${product.status} (PENDING requis)`);
        this.logger.log(`   - Validé: ${product.isValidated} (false requis)`);
        this.logger.log(`   - Éligible: ${isEligible}`);
        
        return isEligible;
      });

      this.logger.log(`🎯 Produits éligibles: ${eligibleProducts.length}`);

      if (eligibleProducts.length === 0) {
        this.logger.log(`⚠️ Aucun produit éligible (tous déjà validés ou non PENDING)`);
        return;
      }

      // 🔍 ÉTAPE 4: Traitement de chaque produit éligible
      let successCount = 0;
      let errorCount = 0;

      for (const link of eligibleProducts) {
        const product = link.vendorProduct;
        
        try {
          this.logger.log(`🔄 === TRAITEMENT PRODUIT ${product.id} ===`);
          this.logger.log(`   Nom: ${product.name}`);
          this.logger.log(`   Action: ${product.postValidationAction}`);
          
          const newStatus: VendorProductStatus = product.postValidationAction === 'AUTO_PUBLISH'
            ? VendorProductStatus.PUBLISHED
            : VendorProductStatus.DRAFT;
          this.logger.log(`   Nouveau statut: ${newStatus}`);

          // 🔄 MISE À JOUR AVEC TRANSACTION
          const updatedProduct = await this.prisma.$transaction(async (tx) => {
            // Vérifier que le produit existe encore
            const currentProduct = await tx.vendorProduct.findUnique({
              where: { id: product.id },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
                    email: true
                  }
                }
              }
            });

            if (!currentProduct) {
              throw new Error(`Produit ${product.id} introuvable`);
            }

            if (currentProduct.isValidated) {
              throw new Error(`Produit ${product.id} déjà validé`);
            }

            // ✅ LOGIQUE MISE À JOUR SELON CHOIX VENDEUR
            // Si AUTO_PUBLISH: passe directement en PUBLISHED avec isValidated=true
            // Si TO_DRAFT: passe en DRAFT avec isValidated=true (admin peut publier plus tard)
            const updateData = {
                status: newStatus,
              isValidated: true, // ✅ TOUJOURS true après validation admin
                validatedAt: new Date(),
              validator: {
                connect: { id: adminId },
              },
                updatedAt: new Date()
            };

            // Mise à jour garantie avec tous les champs critiques
            return await tx.vendorProduct.update({
              where: { id: product.id },
              data: updateData,
              include: {
                vendor: {
            select: {
              id: true,
              firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            });
          });

          // 🔍 VÉRIFICATION POST-MISE À JOUR
          this.logger.log(`✅ Produit ${product.id} mis à jour avec succès:`);
          this.logger.log(`   - status: ${updatedProduct.status}`);
          this.logger.log(`   - isValidated: ${updatedProduct.isValidated}`);
          this.logger.log(`   - validatedAt: ${updatedProduct.validatedAt}`);
          this.logger.log(`   - validatorId: ${adminId}`);
          this.logger.log(`   - postValidationAction: ${product.postValidationAction}`);

          // 📧 NOTIFICATION VENDEUR
          try {
            await this.sendCascadeNotification(updatedProduct, product.postValidationAction);
            this.logger.log(`📧 Notification envoyée pour produit ${product.id}`);
          } catch (notifError) {
            this.logger.error(`❌ Erreur notification produit ${product.id}:`, notifError);
          }

          successCount++;

        } catch (productError) {
          this.logger.error(`❌ Erreur traitement produit ${product.id}:`, productError);
          errorCount++;
        }
      }

      // 🎯 RÉSUMÉ FINAL
      this.logger.log(`🎉 === RÉSUMÉ CASCADE VALIDATION V3 ===`);
      this.logger.log(`✅ Produits traités avec succès: ${successCount}`);
      this.logger.log(`❌ Erreurs: ${errorCount}`);
      this.logger.log(`📊 Total: ${eligibleProducts.length}`);
      
      if (successCount > 0) {
        this.logger.log(`🚀 CASCADE VALIDATION V3 RÉUSSIE !`);
      } else {
        this.logger.log(`⚠️ Aucun produit traité - vérifiez les liaisons`);
      }

    } catch (error) {
      this.logger.error('❌ ERREUR CRITIQUE CASCADE VALIDATION V3:', error);
      
      // 🔄 FALLBACK ULTIME: Méthode ancienne
      this.logger.log(`🔄 Tentative fallback par URL en cas d'erreur...`);
      try {
        await this.applyValidationActionToProductsByUrl(designImageUrl, vendorId, adminId);
      } catch (fallbackError) {
        this.logger.error('❌ Erreur fallback également:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * 🔄 MÉTHODE FALLBACK: Ancienne logique par URL
   * Conservée pour compatibilité et cas d'urgence
   */
  private async applyValidationActionToProductsByUrl(designImageUrl: string, vendorId: number, adminId: number): Promise<void> {
    try {
      this.logger.log(`🔄 === FALLBACK CASCADE PAR URL ===`);
      
      // Recherche large - tous les produits du vendeur
      const allVendorProducts = await this.prisma.vendorProduct.findMany({
        where: {
          vendorId: vendorId
        },
        select: {
          id: true,
          name: true,
          status: true,
          isValidated: true,
          designCloudinaryUrl: true,
          postValidationAction: true,
          createdAt: true
        }
      });

      this.logger.log(`📋 Total produits vendeur: ${allVendorProducts.length}`);

      // Filtrage par URL exacte ET statut PENDING
      const matchingProducts = allVendorProducts.filter(product => {
        const urlMatch = product.designCloudinaryUrl === designImageUrl;
        const statusMatch = product.status === 'PENDING';
        const notValidated = !product.isValidated;
        
        return urlMatch && statusMatch && notValidated;
      });

      this.logger.log(`🎯 Produits correspondants (URL): ${matchingProducts.length}`);

      if (matchingProducts.length === 0) {
        this.logger.log(`⚠️ AUCUN PRODUIT TROUVÉ PAR URL`);
        return;
      }

      // Traitement des produits trouvés
      let successCount = 0;
      let errorCount = 0;

      for (const product of matchingProducts) {
        try {
          const newStatus: VendorProductStatus = product.postValidationAction === 'AUTO_PUBLISH'
            ? VendorProductStatus.PUBLISHED
            : VendorProductStatus.DRAFT;
          
          const updatedProduct = await this.prisma.$transaction(async (tx) => {
            const currentProduct = await tx.vendorProduct.findUnique({
              where: { id: product.id },
              include: {
                vendor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            });

            if (!currentProduct || currentProduct.isValidated) {
              throw new Error(`Produit ${product.id} déjà traité`);
            }

            return await tx.vendorProduct.update({
              where: { id: product.id },
              data: {
                status: newStatus,
                isValidated: true,
                validatedAt: new Date(),
                validator: {
                  connect: { id: adminId },
                },
                updatedAt: new Date()
              },
              include: {
                vendor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            });
          });

          this.logger.log(`✅ Produit ${product.id} mis à jour (fallback)`);

          // Notification
          try {
            await this.sendCascadeNotification(updatedProduct, product.postValidationAction);
          } catch (notifError) {
            this.logger.error(`❌ Erreur notification fallback produit ${product.id}:`, notifError);
          }

          successCount++;

        } catch (productError) {
          this.logger.error(`❌ Erreur traitement fallback produit ${product.id}:`, productError);
          errorCount++;
        }
      }

      this.logger.log(`🎉 === RÉSUMÉ FALLBACK ===`);
      this.logger.log(`✅ Produits traités: ${successCount}`);
      this.logger.log(`❌ Erreurs: ${errorCount}`);

    } catch (error) {
      this.logger.error('❌ ERREUR FALLBACK CASCADE:', error);
      throw error;
    }
  }

  /**
   * 📧 Méthode helper pour les notifications de cascade
   */
  private async sendCascadeNotification(product: any, action: string): Promise<void> {
    const vendor = await this.prisma.user.findUnique({
      where: { id: product.vendorId },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    if (!vendor) {
      throw new Error(`Vendeur ${product.vendorId} introuvable`);
    }

    const productWithVendor = { ...product, vendor };

    if (action === 'AUTO_PUBLISH') {
      await this.notifyVendorProductAutoPublished(productWithVendor);
    } else {
      await this.notifyVendorProductValidatedToDraft(productWithVendor);
    }
  }

  /**
   * 🆕 Notification: Produit publié automatiquement après validation design
   */
  private async notifyVendorProductAutoPublished(product: any): Promise<void> {
    try {
      const subject = '🎉 Votre produit a été publié automatiquement - Printalma';
      const vendorName = `${product.vendor.firstName} ${product.vendor.lastName}`;
      
      await this.mailService.sendEmail({
        to: product.vendor.email,
        subject: subject,
        template: 'vendor-product-auto-published',
        context: {
          vendorName: vendorName,
          productName: product.vendorName || 'Produit sans nom',
          productPrice: (product.vendorPrice / 100).toFixed(2),
          dashboardUrl: `${process.env.FRONTEND_URL}/vendor/products`
        }
      });
      
      this.logger.log(`📧 Notification envoyée à ${product.vendor.email} pour produit auto-publié ${product.id}`);
    } catch (error) {
      this.logger.error('❌ Erreur envoi notification produit auto-publié:', error);
    }
  }

  /**
   * 🆕 Notification: Produit validé et mis en brouillon
   */
  private async notifyVendorProductValidatedToDraft(product: any): Promise<void> {
    try {
      const subject = '✅ Votre produit a été validé - Prêt à publier - Printalma';
      const vendorName = `${product.vendor.firstName} ${product.vendor.lastName}`;
      
      await this.mailService.sendEmail({
        to: product.vendor.email,
        subject: subject,
        template: 'vendor-product-validated-draft',
        context: {
          vendorName: vendorName,
          productName: product.vendorName || 'Produit sans nom',
          productPrice: (product.vendorPrice / 100).toFixed(2),
          dashboardUrl: `${process.env.FRONTEND_URL}/vendor/products`
        }
      });
      
      this.logger.log(`📧 Notification envoyée à ${product.vendor.email} pour produit validé en brouillon ${product.id}`);
    } catch (error) {
      this.logger.error('❌ Erreur envoi notification produit validé en brouillon:', error);
    }
  }

  /**
   * 🆕 Notifie les admins qu'un nouveau design a été créé (notification immédiate)
   */
  private async notifyAdminsNewDesignCreation(design: any): Promise<void> {
    try {
      // Récupérer tous les admins
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPERADMIN'] },
          status: true
        }
      });

      // Envoyer un email à chaque admin
      for (const admin of admins) {
        await this.mailService.sendEmail({
          to: admin.email,
          subject: '🎨 Nouveau design créé - Validation requise - Printalma',
          template: 'design-creation-notification',
          context: {
            adminName: `${admin.firstName} ${admin.lastName}`,
            vendorName: `${design.vendor.firstName} ${design.vendor.lastName}`,
            vendorEmail: design.vendor.email,
            designName: design.name,
            designDescription: design.description || 'Aucune description',
            designPrice: `${design.price.toLocaleString('fr-FR')} FCFA`,
            designCategory: design.category,
            creationDate: new Date().toLocaleDateString('fr-FR'),
            designUrl: design.imageUrl,
            thumbnailUrl: design.thumbnailUrl,
            validationUrl: `${process.env.FRONTEND_URL}/admin/designs/pending`,
            fileSizeMB: (design.fileSize / 1024 / 1024).toFixed(2),
            dimensions: `${design.dimensions.width}x${design.dimensions.height}px`,
            format: design.format,
            tags: design.tags?.length > 0 ? design.tags.join(', ') : 'Aucun tag'
          }
        });
      }

      this.logger.log(`📧 Email de notification envoyé à ${admins.length} admin(s) pour le design: ${design.name}`);
    } catch (error) {
      this.logger.error('Erreur lors de l\'envoi des notifications aux admins:', error);
    }
  }

  /**
   * Récupère les designs du vendeur avec filtres par statut de validation
   */
  async getVendorDesignsByValidationStatus(
    vendorId: number,
    validationStatus?: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ALL',
    page: number = 1,
    limit: number = 10
  ): Promise<DesignListResponseDto> {
    const take = Math.min(Math.max(limit, 1), 50); // Limiter entre 1 et 50
    const skip = (Math.max(page, 1) - 1) * take;

    // Construction des filtres selon le statut de validation
    const where: any = { vendorId };

    if (validationStatus && validationStatus !== 'ALL') {
      switch (validationStatus) {
        case 'PENDING':
          where.isValidated = false;
          where.validatedAt = null;
          where.rejectionReason = null;
          break;
        case 'VALIDATED':
          where.isValidated = true;
          where.validatedAt = { not: null };
          break;
        case 'REJECTED':
          where.isValidated = false;
          where.validatedAt = { not: null };
          where.rejectionReason = { not: null };
          break;
      }
    }

    const [designs, totalCount] = await Promise.all([
      this.prisma.design.findMany({
        where: { ...where, isDelete: false },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          validator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          _count: {
            select: {
              vendorProducts: {
                where: {
                  isDelete: false
                }
              }
            }
          }
        }
      }),
      this.prisma.design.count({ where: { ...where, isDelete: false } })
    ]);

    // Calcul des statistiques
    const stats = await this.getVendorDesignValidationStats(vendorId);
    const totalPages = Math.ceil(totalCount / take);

    return {
      designs: designs.map(design => this.formatDesignResponse(design)),
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: take
      },
      stats
    };
  }

  /**
   * Calcule les statistiques de validation des designs d'un vendeur
   */
  private async getVendorDesignValidationStats(vendorId: number) {
    const [totalCount, validatedCount, pendingCount, rejectedCount, totals] = await Promise.all([
      this.prisma.design.count({ where: { vendorId, isDelete: false } }),
      this.prisma.design.count({ 
        where: { 
          vendorId, 
          isValidated: true, 
          validatedAt: { not: null }, 
          isDelete: false 
        } 
      }),
      this.prisma.design.count({ 
        where: { 
          vendorId, 
          isValidated: false, 
          validatedAt: null, 
          rejectionReason: null,
          isDelete: false
        } 
      }),
      this.prisma.design.count({ 
        where: { 
          vendorId, 
          isValidated: false, 
          validatedAt: { not: null }, 
          rejectionReason: { not: null },
          isDelete: false
        } 
      }),
      this.prisma.design.aggregate({
        where: { vendorId, isDelete: false },
        _sum: {
          earnings: true,
          views: true,
          likes: true,
          usageCount: true
        }
      })
    ]);

    return {
      total: totalCount,
      published: validatedCount, // Les designs validés sont considérés comme publiés
      pending: pendingCount,
      draft: rejectedCount, // Utiliser draft pour les designs rejetés
      totalEarnings: totals._sum.earnings || 0,
      totalViews: totals._sum.views || 0,
      totalLikes: totals._sum.likes || 0,
      totalUsage: totals._sum.usageCount || 0
    };
  }

  /**
   * Vérifie qu'un design peut être utilisé pour créer un VendorProduct
   * Le design doit être VALIDATED (isValidated = true et validatedAt non null)
   */
  async validateDesignForProductUse(designId: number, vendorId: number): Promise<void> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId, isDelete: false }
    });

    if (!design) {
      throw new NotFoundException('Design non trouvé');
    }

    if (design.vendorId !== vendorId) {
      throw new ForbiddenException('Ce design n\'appartient pas à ce vendeur');
    }

    // Vérifier que le design est VALIDATED selon notre logique
    const isValidated = design.isValidated && design.validatedAt && !design.rejectionReason;
    
    if (!isValidated) {
      if (design.rejectionReason) {
        throw new BadRequestException(
          `Ce design a été rejeté et ne peut pas être utilisé. Raison: ${design.rejectionReason}`
        );
      } else {
        throw new BadRequestException(
          'Ce design doit être validé par un administrateur avant d\'être utilisé dans un produit'
        );
      }
    }
  }

  /**
   * Récupère tous les VendorProducts qui utilisent un design donné
   * ✅ CORRECTION ARCHITECTURE V2: Plus de relation directe designId
   */
  async getProductsUsingDesign(designId: number, vendorId?: number) {
    const design = await this.prisma.design.findUnique({
      where: { id: designId, isDelete: false },
      include: {
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!design) {
      throw new NotFoundException('Design non trouvé');
    }

    // Si un vendorId est fourni, vérifier que le design lui appartient
    if (vendorId && design.vendorId !== vendorId) {
      throw new ForbiddenException('Ce design n\'appartient pas à ce vendeur');
    }

    // ✅ ARCHITECTURE V2: Recherche par vendorId car plus de designId
    // Les designs sont stockés en base64, pas de relation directe
    const vendorProducts = await this.prisma.vendorProduct.findMany({
      where: { 
        vendorId: design.vendorId,
        // En v2, on peut chercher par présence de designBase64
        designBase64: { not: null }
      },
      include: {
        baseProduct: {
          select: {
            id: true,
            name: true,
            description: true
          }
        },
        vendor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return {
      design: {
        id: design.id,
        name: design.name,
        validationStatus: this.getValidationStatus(design),
        usageCount: design.usageCount || 0,
        earnings: design.earnings || 0
      },
      vendorProducts: vendorProducts.map(vp => ({
        id: vp.id,
        baseProductId: vp.baseProductId, // ✅ CORRECTION: baseProductId au lieu de baseProduct
        vendorId: vp.vendorId, // ✅ CORRECTION: vendorId au lieu de vendor
        price: vp.price,
        status: vp.status,
        isValidated: vp.isValidated,
        createdAt: vp.createdAt.toISOString(),
        // ✅ CORRECTION ARCHITECTURE V2: Plus de designUrl/mockupUrl
        designApplicationMode: vp.designApplicationMode,
        designPositioning: vp.designPositioning
      }))
    };
  }

  /**
   * Méthode utilitaire pour déterminer le statut de validation d'un design
   */
  private getValidationStatus(design: any): 'PENDING' | 'VALIDATED' | 'REJECTED' {
    if (design.isValidated && design.validatedAt) {
      return 'VALIDATED';
    } else if (!design.isValidated && design.validatedAt && design.rejectionReason) {
      return 'REJECTED';
    } else {
      return 'PENDING';
    }
  }

  /**
   * Récupère le statut de validation d'un design (endpoint léger)
   */
  async getDesignValidationStatus(designId: number): Promise<{
    id: number;
    name: string;
    isValidated: boolean;
    isPending: boolean;
    isDraft: boolean;
    rejectionReason: string | null;
    validatedAt: string | null;
  }> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId, isDelete: false },
      select: {
        id: true,
        name: true,
        isValidated: true,
        isPending: true,
        isDraft: true,
        rejectionReason: true,
        validatedAt: true,
      },
    });

    if (!design) {
      throw new NotFoundException('Design non trouvé');
    }

    return {
      id: design.id,
      name: design.name,
      isValidated: design.isValidated,
      isPending: design.isPending,
      isDraft: design.isDraft,
      rejectionReason: design.rejectionReason,
      validatedAt: design.validatedAt ? design.validatedAt.toISOString() : null,
    };
  }

  /**
   * Récupère tous les designs en attente de validation (pour les admins)
   */
  async getPendingDesigns(adminId: number, queryDto: QueryDesignsDto): Promise<DesignListResponseDto> {
    // Vérifier que l'utilisateur est admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      throw new ForbiddenException('Seuls les administrateurs peuvent voir les designs en attente');
    }

    const { page, limit, search, sortBy, sortOrder } = queryDto;
    const currentPage = page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const take = limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;
    const skip = (currentPage - 1) * take;

    // Construction des filtres pour designs en attente
    const where: any = {
      isPending: true,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }

    // Construction du tri
    const orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'views':
        orderBy.views = sortOrder;
        break;
      default:
        orderBy.submittedForValidationAt = sortOrder;
    }

    const [designs, totalCount] = await Promise.all([
      this.prisma.design.findMany({
        where: { ...where, isDelete: false },
        skip,
        take: take,
        orderBy,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
              phone: true,
              profile_photo_url: true,
              country: true,
              address: true,
            }
          }
        }
      }),
      this.prisma.design.count({ where: { ...where, isDelete: false } })
    ]);

    const totalPages = Math.ceil(totalCount / take);

    return {
      designs: designs.map(design => this.formatDesignResponse(design)),
      pagination: {
        currentPage: currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: take
      },
      stats: {
        total: totalCount,
        published: 0,
        pending: totalCount,
        draft: 0,
        totalEarnings: 0,
        totalViews: 0,
        totalLikes: 0,
      }
    };
  }

  /**
   * 🆕 NOUVELLE MÉTHODE: Récupère TOUS les designs pour l'admin (peu importe le statut)
   */
  async getAllDesignsForAdmin(
    adminId: number, 
    queryDto: QueryDesignsDto, 
    validationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ALL' = 'ALL'
  ): Promise<DesignListResponseDto> {
    // Vérifier que l'utilisateur est admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      throw new ForbiddenException('Seuls les administrateurs peuvent voir tous les designs');
    }

    const { page, limit, search, sortBy, sortOrder } = queryDto;
    const currentPage = page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const take = limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;
    const skip = (currentPage - 1) * take;

    // Construction des filtres selon le statut de validation
    const where: any = {};

    // Filtrage par statut de validation selon notre nouvelle logique
    if (validationStatus !== 'ALL') {
      switch (validationStatus) {
        case 'PENDING':
          where.isValidated = false;
          where.validatedAt = null;
          where.rejectionReason = null;
          break;
        case 'VALIDATED':
          where.isValidated = true;
          where.validatedAt = { not: null };
          break;
        case 'REJECTED':
          where.isValidated = false;
          where.validatedAt = { not: null };
          where.rejectionReason = { not: null };
          break;
      }
    }


    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } },
        { 
          vendor: {
            OR: [
              { firstName: { contains: search, mode: 'insensitive' } },
              { lastName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ];
    }

    // Construction du tri
    const orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy.price = sortOrder || 'desc';
        break;
      case 'views':
        orderBy.views = sortOrder || 'desc';
        break;
      case 'vendor':
        orderBy.vendor = { firstName: sortOrder || 'asc' };
        break;
      default:
        orderBy.createdAt = sortOrder || 'desc'; // Plus récents en premier par défaut
    }

    const [designs, totalCount] = await Promise.all([
      this.prisma.design.findMany({
        where: { ...where, isDelete: false },
        skip,
        take: take,
        orderBy,
        include: {
          vendor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              shop_name: true,
              phone: true,
              profile_photo_url: true,
              country: true,
              address: true,
            }
          },
          validator: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      this.prisma.design.count({ where: { ...where, isDelete: false } })
    ]);

    // Calculer les statistiques par statut
    const [pendingCount, validatedCount, rejectedCount] = await Promise.all([
      this.prisma.design.count({
        where: {
          isValidated: false,
          validatedAt: null,
          rejectionReason: null,
          isDelete: false
        }
      }),
      this.prisma.design.count({
        where: {
          isValidated: true,
          validatedAt: { not: null },
          isDelete: false
        }
      }),
      this.prisma.design.count({
        where: {
          isValidated: false,
          validatedAt: { not: null },
          rejectionReason: { not: null },
          isDelete: false
        }
      })
    ]);

    const totalPages = Math.ceil(totalCount / take);

    return {
      designs: designs.map(design => this.formatDesignResponse(design)),
      pagination: {
        currentPage: currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: take
      },
      stats: {
        total: totalCount,
        published: validatedCount, // Les designs validés sont considérés comme publiés
        pending: pendingCount,
        draft: rejectedCount, // Utiliser draft pour les designs rejetés
        totalEarnings: 0, // TODO: calculer si nécessaire
        totalViews: 0, // TODO: calculer si nécessaire
        totalLikes: 0, // TODO: calculer si nécessaire
      }
    };
  }

  /**
   * Notifie les admins qu'un nouveau design a été soumis
   */
  private async notifyAdminsNewDesignSubmission(design: any): Promise<void> {
    try {
      // Récupérer tous les admins
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPERADMIN'] },
          status: true
        }
      });

      // Envoyer un email à chaque admin
      for (const admin of admins) {
        await this.mailService.sendEmail({
          to: admin.email,
          subject: '🎨 Nouveau design à valider - Printalma',
          template: 'design-submission',
          context: {
            adminName: `${admin.firstName} ${admin.lastName}`,
            vendorName: `${design.vendor.firstName} ${design.vendor.lastName}`,
            designName: design.name,
            designCategory: design.category,
            submissionDate: design.submittedForValidationAt.toLocaleDateString('fr-FR'),
            designUrl: design.imageUrl,
            validationUrl: `${process.env.FRONTEND_URL}/admin/designs/pending`,
          }
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications aux admins:', error);
    }
  }

  /**
   * Notifie le vendeur que son design a été approuvé
   */
  private async notifyVendorDesignApproved(design: any): Promise<void> {
    try {
      await this.mailService.sendEmail({
        to: design.vendor.email,
        subject: '✅ Votre design a été approuvé - Printalma',
        template: 'design-approved',
        context: {
          vendorName: `${design.vendor.firstName} ${design.vendor.lastName}`,
          designName: design.name,
          approvalDate: design.validatedAt.toLocaleDateString('fr-FR'),
          validatorName: design.validator ? `${design.validator.firstName} ${design.validator.lastName}` : 'Administrateur',
          designUrl: design.imageUrl,
          dashboardUrl: `${process.env.FRONTEND_URL}/vendor/designs`,
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification d\'approbation:', error);
    }
  }

  /**
   * Notifie le vendeur que son design a été rejeté
   */
  private async notifyVendorDesignRejected(design: any, rejectionReason?: string): Promise<void> {
    try {
      await this.mailService.sendEmail({
        to: design.vendor.email,
        subject: '❌ Votre design nécessite des modifications - Printalma',
        template: 'design-rejected',
        context: {
          vendorName: `${design.vendor.firstName} ${design.vendor.lastName}`,
          designName: design.name,
          rejectionDate: design.validatedAt.toLocaleDateString('fr-FR'),
          rejectionReason: rejectionReason || 'Aucune raison spécifiée',
          validatorName: design.validator ? `${design.validator.firstName} ${design.validator.lastName}` : 'Administrateur',
          designUrl: design.imageUrl,
          dashboardUrl: `${process.env.FRONTEND_URL}/vendor/designs`,
        }
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de rejet:', error);
    }
  }
}