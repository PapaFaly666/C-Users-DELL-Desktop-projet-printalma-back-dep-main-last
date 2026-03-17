import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class DesignProductLinkService {
  private readonly logger = new Logger(DesignProductLinkService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 🔗 Créer une liaison entre un design et un produit vendeur
   */
  async createLink(designId: number, vendorProductId: number): Promise<void> {
    try {
      await this.prisma.designProductLink.create({
        data: {
          designId,
          vendorProductId
        }
      });

      this.logger.log(`🔗 Lien créé: Design ${designId} ↔ Produit ${vendorProductId}`);
    } catch (error) {
      // Ignorer l'erreur si le lien existe déjà (contrainte unique)
      if (error.code === 'P2002') {
        this.logger.log(`🔗 Lien déjà existant: Design ${designId} ↔ Produit ${vendorProductId}`);
      } else {
        this.logger.error('❌ Erreur création lien:', error);
        throw error;
      }
    }
  }

  /**
   * 🔗 Créer une liaison en utilisant l'URL du design
   */
  async createLinkByUrl(designUrl: string, vendorId: number, vendorProductId: number): Promise<boolean> {
    try {
      // Trouver le design par URL
      const design = await this.prisma.design.findFirst({
        where: {
          imageUrl: designUrl,
          vendorId: vendorId
        }
      });

      if (!design) {
        this.logger.log(`⚠️ Design non trouvé pour URL: ${designUrl}`);
        return false;
      }

      // Créer le lien
      await this.createLink(design.id, vendorProductId);

      // Mettre à jour le designId dans VendorProduct
      await this.prisma.vendorProduct.update({
        where: { id: vendorProductId },
        data: { designId: design.id }
      });

      this.logger.log(`✅ Lien créé avec succès: Design ${design.id} ↔ Produit ${vendorProductId}`);
      return true;

    } catch (error) {
      this.logger.error('❌ Erreur création lien par URL:', error);
      return false;
    }
  }

  /**
   * 📋 Récupérer tous les produits liés à un design
   */
  async getProductsByDesign(designId: number): Promise<any[]> {
    try {
      const links = await this.prisma.designProductLink.findMany({
        where: { designId },
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

      return links.map(link => link.vendorProduct);
    } catch (error) {
      this.logger.error('❌ Erreur récupération produits par design:', error);
      throw error;
    }
  }

  /**
   * 📋 Récupérer le design lié à un produit
   */
  async getDesignByProduct(vendorProductId: number): Promise<any | null> {
    try {
      const link = await this.prisma.designProductLink.findFirst({
        where: { vendorProductId },
        include: {
          design: {
            include: {
              vendor: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true
                }
              }
            }
          }
        }
      });

      return link?.design || null;
    } catch (error) {
      this.logger.error('❌ Erreur récupération design par produit:', error);
      throw error;
    }
  }

  /**
   * 🔄 Migrer les liens existants basés sur designCloudinaryUrl
   */
  async migrateExistingLinks(): Promise<{ created: number; errors: number }> {
    try {
      this.logger.log('🔄 Début migration des liens existants...');

      // Récupérer tous les produits avec designCloudinaryUrl
      const productsWithDesignUrl = await this.prisma.vendorProduct.findMany({
        where: {
          designCloudinaryUrl: { not: null },
          designId: null // Seulement ceux qui n'ont pas encore de designId
        },
        select: {
          id: true,
          vendorId: true,
          designCloudinaryUrl: true,
          name: true
        }
      });

      this.logger.log(`📋 Produits à migrer: ${productsWithDesignUrl.length}`);

      let created = 0;
      let errors = 0;

      for (const product of productsWithDesignUrl) {
        try {
          const success = await this.createLinkByUrl(
            product.designCloudinaryUrl,
            product.vendorId,
            product.id
          );

          if (success) {
            created++;
            this.logger.log(`✅ Migré: Produit ${product.id} (${product.name})`);
          } else {
            errors++;
            this.logger.log(`⚠️ Échec migration: Produit ${product.id} (${product.name})`);
          }
        } catch (error) {
          errors++;
          this.logger.error(`❌ Erreur migration produit ${product.id}:`, error);
        }
      }

      this.logger.log(`🎉 Migration terminée: ${created} créés, ${errors} erreurs`);
      return { created, errors };

    } catch (error) {
      this.logger.error('❌ Erreur migration globale:', error);
      throw error;
    }
  }

  /**
   * 🧹 Nettoyer les liens orphelins
   */
  async cleanupOrphanedLinks(): Promise<{ deleted: number }> {
    try {
      this.logger.log('🧹 Nettoyage des liens orphelins...');

      // Supprimer les liens vers des designs supprimés
      const deletedDesignLinks = await this.prisma.designProductLink.deleteMany({
        where: {
          design: null
        }
      });

      // Supprimer les liens vers des produits supprimés
      const deletedProductLinks = await this.prisma.designProductLink.deleteMany({
        where: {
          vendorProduct: null
        }
      });

      const totalDeleted = deletedDesignLinks.count + deletedProductLinks.count;
      this.logger.log(`🧹 Liens orphelins supprimés: ${totalDeleted}`);

      return { deleted: totalDeleted };

    } catch (error) {
      this.logger.error('❌ Erreur nettoyage liens orphelins:', error);
      throw error;
    }
  }

  /**
   * 📊 Statistiques des liens
   */
  async getLinkStats(): Promise<{
    totalLinks: number;
    uniqueDesigns: number;
    uniqueProducts: number;
    productsWithDesignId: number;
    productsWithUrlOnly: number;
  }> {
    try {
      const [
        totalLinks,
        uniqueDesigns,
        uniqueProducts,
        productsWithDesignId,
        productsWithUrlOnly
      ] = await Promise.all([
        this.prisma.designProductLink.count(),
        this.prisma.designProductLink.groupBy({
          by: ['designId'],
          _count: true
        }).then(result => result.length),
        this.prisma.designProductLink.groupBy({
          by: ['vendorProductId'],
          _count: true
        }).then(result => result.length),
        this.prisma.vendorProduct.count({
          where: { designId: { not: null } }
        }),
        this.prisma.vendorProduct.count({
          where: {
            designCloudinaryUrl: { not: null },
            designId: null
          }
        })
      ]);

      return {
        totalLinks,
        uniqueDesigns,
        uniqueProducts,
        productsWithDesignId,
        productsWithUrlOnly
      };

    } catch (error) {
      this.logger.error('❌ Erreur statistiques liens:', error);
      throw error;
    }
  }

  /**
   * 🔄 Vérifier et réparer les liens manquants
   */
  async verifyAndRepairLinks(): Promise<{ repaired: number; errors: number }> {
    try {
      this.logger.log('🔄 Vérification et réparation des liens...');

      // Trouver les produits avec designId mais sans lien
      const productsWithDesignIdButNoLink = await this.prisma.vendorProduct.findMany({
        where: {
          designId: { not: null },
          designProductLinks: { none: {} }
        },
        select: {
          id: true,
          designId: true,
          name: true
        }
      });

      this.logger.log(`🔧 Produits à réparer: ${productsWithDesignIdButNoLink.length}`);

      let repaired = 0;
      let errors = 0;

      for (const product of productsWithDesignIdButNoLink) {
        try {
          await this.createLink(product.designId, product.id);
          repaired++;
          this.logger.log(`🔧 Réparé: Produit ${product.id} (${product.name})`);
        } catch (error) {
          errors++;
          this.logger.error(`❌ Erreur réparation produit ${product.id}:`, error);
        }
      }

      this.logger.log(`🎉 Réparation terminée: ${repaired} réparés, ${errors} erreurs`);
      return { repaired, errors };

    } catch (error) {
      this.logger.error('❌ Erreur vérification/réparation:', error);
      throw error;
    }
  }
} 