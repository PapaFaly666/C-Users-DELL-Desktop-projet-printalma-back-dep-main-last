import { Controller, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BestSellersService, BestSellerProduct } from './best-sellers.service';

@ApiTags('Public - Best Sellers')
@Controller('public/best-sellers-v2')
export class PublicBestSellersController {
  constructor(private readonly bestSellersService: BestSellersService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Récupérer les meilleurs vendeurs (endpoint public)',
    description: 'Retourne la liste des produits best-sellers avec toutes les informations nécessaires pour l\'affichage (design, délimitations, couleurs, vendeur, etc.)'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de produits à retourner (défaut: 20)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset pour pagination (défaut: 0)' })
  @ApiQuery({ name: 'category', required: false, type: String, description: 'Filtrer par catégorie' })
  @ApiQuery({ name: 'vendorId', required: false, type: Number, description: 'Filtrer par vendeur spécifique' })
  @ApiQuery({ name: 'minSales', required: false, type: Number, description: 'Minimum de ventes requises (défaut: 1)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des best-sellers récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'number', example: 1 },
              name: { type: 'string', example: 'T-shirt Premium avec Design Personnalisé' },
              description: { type: 'string', example: 'Un magnifique t-shirt avec design unique' },
              price: { type: 'number', example: 2500 },
              salesCount: { type: 'number', example: 45 },
              totalRevenue: { type: 'number', example: 112500 },
              bestSellerRank: { type: 'number', example: 1 },
              averageRating: { type: 'number', example: 4.8 },
              viewsCount: { type: 'number', example: 1250 },
              designCloudinaryUrl: { type: 'string', example: 'https://res.cloudinary.com/example/design.png' },
              designWidth: { type: 'number', example: 800 },
              designHeight: { type: 'number', example: 600 },
              designFormat: { type: 'string', example: 'PNG' },
              designScale: { type: 'number', example: 0.6 },
              designPositioning: { type: 'string', example: 'CENTER' },
              baseProduct: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 10 },
                  name: { type: 'string', example: 'T-shirt Premium' },
                  genre: { type: 'string', example: 'HOMME' },
                  categories: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1 },
                        name: { type: 'string', example: 'T-shirts' }
                      }
                    }
                  },
                  colorVariations: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'number', example: 1 },
                        name: { type: 'string', example: 'Noir' },
                        colorCode: { type: 'string', example: '#000000' },
                        images: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              id: { type: 'number', example: 1 },
                              url: { type: 'string', example: 'https://res.cloudinary.com/example/tshirt.jpg' },
                              view: { type: 'string', example: 'Front' },
                              naturalWidth: { type: 'number', example: 1000 },
                              naturalHeight: { type: 'number', example: 1200 },
                              delimitations: {
                                type: 'array',
                                items: {
                                  type: 'object',
                                  properties: {
                                    id: { type: 'number', example: 1 },
                                    name: { type: 'string', example: 'Zone Poitrine' },
                                    x: { type: 'number', example: 30 },
                                    y: { type: 'number', example: 40 },
                                    width: { type: 'number', example: 40 },
                                    height: { type: 'number', example: 20 }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              },
              vendor: {
                type: 'object',
                properties: {
                  id: { type: 'number', example: 5 },
                  firstName: { type: 'string', example: 'Jean' },
                  lastName: { type: 'string', example: 'Dupont' },
                  email: { type: 'string', example: 'jean.dupont@example.com' },
                  profilePhotoUrl: { type: 'string', example: 'https://example.com/photo.jpg' },
                  businessName: { type: 'string', example: 'Designs by Jean' }
                }
              },
              createdAt: { type: 'string', example: '2024-01-15T10:30:00Z' },
              lastSaleDate: { type: 'string', example: '2024-01-20T14:22:00Z' }
            }
          }
        },
        pagination: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 150 },
            limit: { type: 'number', example: 20 },
            offset: { type: 'number', example: 0 },
            hasMore: { type: 'boolean', example: true }
          }
        },
        stats: {
          type: 'object',
          properties: {
            totalBestSellers: { type: 'number', example: 150 },
            categoriesCount: { type: 'number', example: 8 },
            vendorsCount: { type: 'number', example: 45 }
          }
        }
      }
    }
  })
  async getBestSellers(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('category') category?: string,
    @Query('vendorId') vendorId?: number,
    @Query('minSales') minSales?: number,
  ) {
    console.log('🏆 [PUBLIC-API] Récupération des best-sellers:', {
      limit,
      offset,
      category,
      vendorId,
      minSales
    });

    // Incrémenter les vues si on regarde un vendeur spécifique
    if (vendorId) {
      // On pourrait incrémenter les vues du vendeur ici si nécessaire
    }

    const result = await this.bestSellersService.getPublicBestSellers({
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
      category,
      vendorId: vendorId ? parseInt(vendorId.toString()) : undefined,
      minSales: minSales ? parseInt(minSales.toString()) : undefined,
    });

    // Incrémenter les vues pour chaque produit affiché
    result.data.forEach(product => {
      // Incrémenter de façon asynchrone sans attendre
      this.bestSellersService.incrementViews(product.id).catch(err => {
        console.error(`Erreur lors de l'incrémentation des vues pour le produit ${product.id}:`, err);
      });
    });

    return result;
  }

  @Get('stats')
  @ApiOperation({ 
    summary: 'Récupérer les statistiques des best-sellers',
    description: 'Retourne les statistiques générales des best-sellers'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        stats: {
          type: 'object',
          properties: {
            totalBestSellers: { type: 'number', example: 150 },
            categoriesCount: { type: 'number', example: 8 },
            vendorsCount: { type: 'number', example: 45 }
          }
        }
      }
    }
  })
  async getBestSellersStats() {
    console.log('📊 [PUBLIC-API] Récupération des statistiques best-sellers');
    
    const stats = await this.bestSellersService.getBestSellersStats();
    
    return {
      success: true,
      stats
    };
  }

  @Get('vendor/:vendorId')
  @ApiOperation({ 
    summary: 'Récupérer les best-sellers d\'un vendeur spécifique',
    description: 'Retourne tous les best-sellers d\'un vendeur donné'
  })
  @ApiResponse({ status: 200, description: 'Best-sellers du vendeur récupérés avec succès' })
  async getVendorBestSellers(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    console.log(`🏪 [PUBLIC-API] Récupération des best-sellers du vendeur ${vendorId}`);

    return this.bestSellersService.getPublicBestSellers({
      vendorId,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }

  @Get('category/:category')
  @ApiOperation({ 
    summary: 'Récupérer les best-sellers d\'une catégorie spécifique',
    description: 'Retourne tous les best-sellers d\'une catégorie donnée'
  })
  @ApiResponse({ status: 200, description: 'Best-sellers de la catégorie récupérés avec succès' })
  async getCategoryBestSellers(
    @Param('category') category: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    console.log(`🏷️ [PUBLIC-API] Récupération des best-sellers de la catégorie ${category}`);

    return this.bestSellersService.getPublicBestSellers({
      category,
      limit: limit ? parseInt(limit.toString()) : undefined,
      offset: offset ? parseInt(offset.toString()) : undefined,
    });
  }

  @Get('product/:productId/view')
  @ApiOperation({ 
    summary: 'Incrémenter les vues d\'un produit best-seller',
    description: 'Incrémente le compteur de vues d\'un produit (à appeler quand un utilisateur consulte un produit)'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Vues incrémentées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Vues incrémentées avec succès' }
      }
    }
  })
  async incrementProductViews(@Param('productId', ParseIntPipe) productId: number) {
    console.log(`👁️ [PUBLIC-API] Incrémentation des vues pour le produit ${productId}`);

    await this.bestSellersService.incrementViews(productId);

    return {
      success: true,
      message: 'Vues incrémentées avec succès'
    };
  }
} 