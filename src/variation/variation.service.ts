import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVariationDto } from './dto/create-variation.dto';
import { MockupService } from '../product/services/mockup.service';

@Injectable()
export class VariationService {
  private readonly logger = new Logger(VariationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mockupService: MockupService
  ) {}

  async create(dto: CreateVariationDto) {
    // Vérifier que la sous-catégorie parente existe
    const subCategory = await this.prisma.subCategory.findUnique({
      where: { id: dto.subCategoryId }
    });

    if (!subCategory) {
      throw new NotFoundException(`Sous-catégorie avec ID ${dto.subCategoryId} non trouvée`);
    }

    // Vérifier que la variation n'existe pas déjà
    const existing = await this.prisma.variation.findFirst({
      where: {
        name: dto.name.trim(),
        subCategoryId: dto.subCategoryId
      }
    });

    if (existing) {
      throw new ConflictException(
        `La variation "${dto.name}" existe déjà dans cette sous-catégorie`
      );
    }

    // Générer le slug
    const slug = dto.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Créer la variation
    const variation = await this.prisma.variation.create({
      data: {
        name: dto.name.trim(),
        slug,
        description: dto.description?.trim() || '',
        subCategoryId: dto.subCategoryId,
        displayOrder: dto.displayOrder || 0
      },
      include: {
        subCategory: {
          include: {
            category: true
          }
        }
      }
    });

    return {
      success: true,
      message: 'Variation créée avec succès',
      data: variation
    };
  }

  async findAll(subCategoryId?: number) {
    const where = subCategoryId ? { subCategoryId, isActive: true } : { isActive: true };

    const variations = await this.prisma.variation.findMany({
      where,
      include: {
        subCategory: {
          include: {
            category: true
          }
        },
        _count: {
          select: {
            products: { where: { isDelete: false } }
          }
        }
      },
      orderBy: [
        { displayOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    return variations;
  }

  async findOne(id: number) {
    const variation = await this.prisma.variation.findUnique({
      where: { id },
      include: {
        subCategory: {
          include: {
            category: true
          }
        }
      }
    });

    if (!variation) {
      throw new NotFoundException(`Variation avec ID ${id} non trouvée`);
    }

    return variation;
  }

  async update(id: number, dto: Partial<CreateVariationDto>) {
    // Vérifier que la variation existe
    const variation = await this.findOne(id);

    // Si le nom est modifié, vérifier qu'il n'existe pas déjà
    if (dto.name && dto.name.trim() !== variation.name) {
      const existing = await this.prisma.variation.findFirst({
        where: {
          name: dto.name.trim(),
          subCategoryId: dto.subCategoryId || variation.subCategoryId,
          id: { not: id }
        }
      });

      if (existing) {
        throw new ConflictException(
          `La variation "${dto.name}" existe déjà dans cette sous-catégorie`
        );
      }
    }

    // Préparer les données de mise à jour
    const dataToUpdate: any = {};

    if (dto.name) {
      dataToUpdate.name = dto.name.trim();
      // Régénérer le slug si le nom change
      dataToUpdate.slug = dto.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description?.trim() || '';
    }

    if (dto.subCategoryId !== undefined) {
      // Vérifier que la nouvelle sous-catégorie existe
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: dto.subCategoryId }
      });

      if (!subCategory) {
        throw new NotFoundException(`Sous-catégorie avec ID ${dto.subCategoryId} non trouvée`);
      }

      dataToUpdate.subCategoryId = dto.subCategoryId;
    }

    if (dto.displayOrder !== undefined) {
      dataToUpdate.displayOrder = dto.displayOrder;
    }

    // Mettre à jour la variation
    const updated = await this.prisma.variation.update({
      where: { id },
      data: dataToUpdate,
      include: {
        subCategory: {
          include: {
            category: true
          }
        }
      }
    });

    // Régénérer les mockups pour cette variation
    this.logger.log(`🔄 Déclenchement de la régénération des mockups pour la variation ${id}`);
    try {
      await this.mockupService.regenerateMockupsForVariation(id);
    } catch (error) {
      this.logger.warn(`⚠️ Erreur lors de la régénération des mockups: ${error.message}`);
      // On continue même si la régénération échoue
    }

    return {
      success: true,
      message: 'Variation mise à jour avec succès',
      data: updated
    };
  }

  /**
   * Supprimer une variation si elle n'est pas utilisée par des produits
   */
  async remove(id: number) {
    // Vérifier que la variation existe
    const variation = await this.findOne(id);

    // Vérifier UNIQUEMENT si des produits sont liés directement à cette variation
    const productsCount = await this.prisma.product.count({
      where: {
        variationId: id,
        isDelete: false
      }
    });

    if (productsCount > 0) {
      throw new ConflictException({
        success: false,
        error: 'VARIATION_IN_USE',
        message: `La variation est utilisée par ${productsCount} produit(s). Elle ne peut pas être supprimée.`,
        details: {
          variationId: id,
          subCategoryId: variation.subCategoryId,
          productsCount,
          message: `${productsCount} produit(s) utilisent directement cette variation`
        }
      });
    }

    // Marquer la variation comme inactive au lieu de la supprimer
    // pour éviter les problèmes de suppression en cascade
    await this.prisma.variation.update({
      where: { id },
      data: {
        isActive: false,
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      message: 'Variation désactivée avec succès'
    };
  }
}
