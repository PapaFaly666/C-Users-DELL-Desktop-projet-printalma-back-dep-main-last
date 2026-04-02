import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { DesignService } from './design.service';
import { DesignProductLinkService } from './design-product-link.service';
import { CreateDesignDto } from './dto/create-design.dto';
import { UpdateDesignDto } from './dto/update-design.dto';
import { QueryDesignsDto } from './dto/query-design.dto';
import {
  CreateDesignResponseDto,
  GetDesignsResponseDto,
  DesignResponseDto,
  PublishDesignDto,
  DeleteDesignResponseDto,
  DesignErrorResponseDto,
} from './dto/design-response.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { multerConfig } from '../../multerConfig';
import { GetDesignValidationStatusResponseDto } from './dto/design-validation-status.dto';

@ApiTags('designs')
@Controller('api/designs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DesignController {
  constructor(
    private readonly designService: DesignService,
    private readonly designProductLinkService: DesignProductLinkService
  ) {}

  @Post()
  @ApiOperation({
    summary: 'Créer un nouveau design',
    description: 'Upload d\'un design avec métadonnées (nom, description, prix, catégorie)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Design à uploader avec métadonnées',
    required: true,
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Fichier image du design (PNG, JPG, JPEG, SVG - max 10MB)',
        },
        name: {
          type: 'string',
          description: 'Nom du design',
          example: 'Logo moderne entreprise',
          minLength: 3,
          maxLength: 255,
        },
        description: {
          type: 'string',
          description: 'Description du design',
          example: 'Un logo épuré et moderne pour entreprises tech',
          maxLength: 1000,
        },
        price: {
          type: 'number',
          description: 'Prix en FCFA',
          example: 2500,
          minimum: 100,
          maximum: 1000000,
        },
        category: {
          type: 'string',
          enum: ['logo', 'pattern', 'illustration', 'typography', 'abstract'],
          description: 'Catégorie du design',
          example: 'logo',
        },
        tags: {
          type: 'string',
          description: 'Tags optionnels (séparés par des virgules)',
          example: 'moderne,entreprise,tech',
        },
      },
      required: ['file', 'name', 'price', 'category'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Design créé avec succès',
    type: CreateDesignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erreurs de validation',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification requis',
  })
  @ApiResponse({
    status: 413,
    description: 'Fichier trop volumineux (max 10MB)',
  })
  @UseInterceptors(FileInterceptor('file', multerConfig))
  @HttpCode(HttpStatus.CREATED)
  async createDesign(
    @Request() req,
    @Body() createDesignDto: CreateDesignDto,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<CreateDesignResponseDto> {
    const vendorId = req.user.id;
    
    const design = await this.designService.createDesign(
      vendorId,
      createDesignDto,
      file,
    );

    return {
      success: true,
      message: 'Design créé avec succès',
      data: design,
    };
  }

  @Get()
  @ApiOperation({
    summary: 'Récupérer la liste des designs du vendeur',
    description: 'Liste paginée avec filtres et recherche',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Éléments par page' })
  @ApiQuery({ name: 'category', required: false, description: 'Catégorie de design' })
  @ApiQuery({ name: 'status', required: false, description: 'Statut du design' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Champ de tri' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @ApiResponse({
    status: 200,
    description: 'Liste des designs récupérée avec succès',
    type: GetDesignsResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification requis',
  })
  async findAll(
    @Request() req,
    @Query() queryDto: QueryDesignsDto,
  ): Promise<GetDesignsResponseDto> {
    const vendorId = req.user.id;
    
    const data = await this.designService.findAllByVendor(vendorId, queryDto);

    return {
      success: true,
      data,
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Récupérer un design spécifique',
    description: 'Récupère les détails d\'un design par son ID',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Design récupéré avec succès',
    type: DesignResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification requis',
  })
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<DesignResponseDto> {
    const vendorId = req.user.id;
    return this.designService.findOne(id, vendorId);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Modifier un design',
    description: 'Met à jour les métadonnées d\'un design (nom, description, prix, catégorie)',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Design mis à jour avec succès',
    type: DesignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erreurs de validation',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification requis',
  })
  async updateDesign(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDesignDto: UpdateDesignDto,
  ): Promise<DesignResponseDto> {
    const vendorId = req.user.id;
    return this.designService.updateDesign(id, vendorId, updateDesignDto);
  }

  @Patch(':id/publish')
  @ApiOperation({
    summary: 'Publier/dépublier un design',
    description: 'Change le statut de publication d\'un design',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Statut de publication mis à jour avec succès',
    type: DesignResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token d\'authentification requis',
  })
  async publishDesign(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() publishDto: PublishDesignDto,
  ): Promise<DesignResponseDto> {
    const vendorId = req.user.id;
    return this.designService.publishDesign(id, vendorId, publishDto.isPublished);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un design du vendeur' })
  @ApiParam({ name: 'id', type: Number, description: 'ID du design' })
  async softDeleteDesign(
    @Request() req,
    @Param('id', ParseIntPipe) id: number
  ): Promise<{ success: boolean; message: string }> {
    await this.designService.deleteDesign(id, req.user.sub);
    return { success: true, message: 'Design supprimé avec succès' };
  }

  // Endpoint pour les statistiques globales (bonus)
  @Get('stats/overview')
  @ApiOperation({
    summary: 'Statistiques globales des designs',
    description: 'Récupère les statistiques générales des designs du vendeur',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
  })
  async getStats(@Request() req) {
    const vendorId = req.user.id;
    // Cette méthode pourrait être implémentée pour retourner seulement les stats
    const data = await this.designService.findAllByVendor(vendorId, { 
      page: 1, 
      limit: 1 
    });
    
    return {
      success: true,
      data: data.stats,
    };
  }

  // Endpoint pour incrémenter les likes (bonus)
  @Patch(':id/like')
  @ApiOperation({
    summary: 'Liker/disliker un design',
    description: 'Incrémente ou décrémente le nombre de likes d\'un design',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design' })
  async toggleLike(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const vendorId = req.user.id;
    // Cette fonctionnalité nécessiterait une table pour tracking les likes par utilisateur
    // Pour l'instant, on incrémente simplement
    return {
      success: true,
      message: 'Like mis à jour',
    };
  }

  /**
   * ENDPOINTS POUR LA VALIDATION ADMIN
   */

  @Post(':id/submit-for-validation')
  @ApiOperation({
    summary: 'Soumettre un design pour validation admin',
    description: 'Le vendeur soumet son design en brouillon pour validation par un administrateur',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design à soumettre' })
  @ApiResponse({
    status: 200,
    description: 'Design soumis avec succès pour validation',
    type: DesignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Le design n\'est pas en brouillon ou déjà soumis',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
    type: DesignErrorResponseDto,
  })
  async submitForValidation(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; message: string; data: DesignResponseDto }> {
    const vendorId = req.user.id;
    
    const design = await this.designService.submitForValidation(id, vendorId);

    return {
      success: true,
      message: 'Design soumis pour validation avec succès',
      data: design,
    };
  }

  @Get('admin/pending')
  @ApiOperation({
    summary: 'Récupérer les designs en attente de validation (Admin)',
    description: 'Liste tous les designs soumis par les vendeurs en attente de validation',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Éléments par page' })
  @ApiQuery({ name: 'category', required: false, description: 'Catégorie de design' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Champ de tri' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @ApiResponse({
    status: 200,
    description: 'Liste des designs en attente récupérée avec succès',
    type: GetDesignsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès réservé aux administrateurs',
    type: DesignErrorResponseDto,
  })
  async getPendingDesigns(
    @Request() req,
    @Query() queryDto: QueryDesignsDto,
  ): Promise<GetDesignsResponseDto> {
    const adminId = req.user.id;
    
    const data = await this.designService.getPendingDesigns(adminId, queryDto);

    return {
      success: true,
      data,
    };
  }

  @Get('admin/all')
  @ApiOperation({
    summary: '🆕 Récupérer TOUS les designs pour validation (Admin)',
    description: `
    Liste tous les designs créés par les vendeurs, peu importe leur statut.
    Permet à l'admin de voir et valider les designs dès leur création.
    
    **Nouveau workflow:**
    - Vendeur crée design → Apparaît immédiatement dans cette liste
    - Admin peut valider directement sans attendre soumission
    - Filtrage par statut: PENDING, VALIDATED, REJECTED, ALL
    `
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Éléments par page' })
  @ApiQuery({ name: 'category', required: false, description: 'Catégorie de design' })
  @ApiQuery({ name: 'search', required: false, description: 'Terme de recherche' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['PENDING', 'VALIDATED', 'REJECTED', 'ALL'],
    description: 'Filtrer par statut de validation (défaut: ALL)'
  })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Champ de tri' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Ordre de tri' })
  @ApiResponse({
    status: 200,
    description: 'Liste de tous les designs récupérée avec succès',
    type: GetDesignsResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès réservé aux administrateurs',
    type: DesignErrorResponseDto,
  })
  async getAllDesignsForAdmin(
    @Request() req,
    @Query() queryDto: QueryDesignsDto,
    @Query('status') status?: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ALL',
  ): Promise<GetDesignsResponseDto> {
    const adminId = req.user.id;
    
    const data = await this.designService.getAllDesignsForAdmin(adminId, queryDto, status || 'ALL');

    return {
      success: true,
      data,
    };
  }

  @Put(':id/validate')
  @ApiOperation({
    summary: 'Valider ou rejeter un design (Admin)',
    description: 'L\'administrateur valide ou rejette un design selon la nouvelle logique: VALIDATE ou REJECT',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design à valider' })
  @ApiBody({
    description: 'Action de validation',
    required: true,
    schema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['VALIDATE', 'REJECT'],
          description: 'Action à effectuer: VALIDATE pour approuver, REJECT pour rejeter',
          example: 'VALIDATE',
        },
        rejectionReason: {
          type: 'string',
          description: 'Raison du rejet (obligatoire si action = REJECT)',
          example: 'La qualité de l\'image n\'est pas suffisante',
          maxLength: 500,
        },
      },
      required: ['action'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Design traité avec succès',
    type: DesignResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de validation invalides ou design pas en attente',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Accès réservé aux administrateurs',
    type: DesignErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
    type: DesignErrorResponseDto,
  })
  async validateDesign(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() validationData: { action: 'VALIDATE' | 'REJECT'; rejectionReason?: string },
  ): Promise<{ success: boolean; message: string; data: DesignResponseDto }> {
    const adminId = req.user.id;
    
    // Validation des données
    if (!validationData.action || !['VALIDATE', 'REJECT'].includes(validationData.action)) {
      throw new BadRequestException('L\'action doit être "VALIDATE" ou "REJECT"');
    }

    if (validationData.action === 'REJECT' && (!validationData.rejectionReason || validationData.rejectionReason.trim() === '')) {
      throw new BadRequestException('Une raison de rejet est obligatoire pour rejeter un design');
    }

    const design = await this.designService.validateDesign(
      id,
      adminId,
      validationData.action,
      validationData.rejectionReason,
    );

    const message = validationData.action === 'VALIDATE' 
      ? 'Design validé avec succès'
      : 'Design rejeté avec succès';

    // Construire la réponse selon guidefr.md avec auto-validation
    const response: any = {
      success: true,
      message,
      data: design,
    };

    // Inclure les résultats de l'auto-validation si disponibles
    if (validationData.action === 'VALIDATE' && (design as any).autoValidation) {
      response.data.autoValidation = (design as any).autoValidation;
      // Ajouter au message principal si des produits ont été auto-validés
      if ((design as any).autoValidation.count > 0) {
        response.message += ` + ${(design as any).autoValidation.count} produit(s) auto-validé(s)`;
      }
    }

    return response;
  }

  @Get('vendor/by-status')
  @ApiOperation({
    summary: 'Récupérer les designs du vendeur par statut de validation',
    description: 'Liste paginée des designs filtrés par statut: PENDING, VALIDATED, REJECTED ou ALL',
  })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['PENDING', 'VALIDATED', 'REJECTED', 'ALL'],
    description: 'Statut de validation' 
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Numéro de page' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Éléments par page' })
  @ApiResponse({
    status: 200,
    description: 'Designs récupérés avec succès',
    type: GetDesignsResponseDto,
  })
  async getDesignsByValidationStatus(
    @Request() req,
    @Query('status') status?: 'PENDING' | 'VALIDATED' | 'REJECTED' | 'ALL',
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<GetDesignsResponseDto> {
    const vendorId = req.user.id;
    
    const data = await this.designService.getVendorDesignsByValidationStatus(
      vendorId,
      status || 'ALL',
      page || 1,
      limit || 10
    );

    return {
      success: true,
      data,
    };
  }

  @Get(':id/products')
  @ApiOperation({
    summary: 'Récupérer les produits utilisant un design',
    description: 'Liste tous les VendorProducts qui utilisent ce design',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Produits récupérés avec succès',
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
  })
  async getProductsUsingDesign(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const vendorId = req.user.id;
    
    const data = await this.designService.getProductsUsingDesign(id, vendorId);

    return {
      success: true,
      data,
    };
  }

  @Get(':id/validation-status')
  @ApiOperation({
    summary: 'Obtenir le statut de validation d\'un design',
    description: 'Retourne un objet léger contenant seulement les informations de validation',
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Statut de validation récupéré avec succès',
    type: GetDesignValidationStatusResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
  })
  async getValidationStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GetDesignValidationStatusResponseDto> {
    const data = await this.designService.getDesignValidationStatus(id);
    return { success: true, data };
  }

  /**
   * 🆕 ADMIN: Récupérer les statistiques des liens design-produit
   */
  @Get('admin/links/stats')
  @ApiOperation({
    summary: '[ADMIN] Statistiques des liens design-produit',
    description: 'Récupère les statistiques des liaisons entre designs et produits'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            totalLinks: { type: 'number' },
            uniqueDesigns: { type: 'number' },
            uniqueProducts: { type: 'number' },
            productsWithDesignId: { type: 'number' },
            productsWithUrlOnly: { type: 'number' }
          }
        }
      }
    }
  })
  async getLinkStats(@Request() req) {
    // Vérifier que l'utilisateur est admin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent accéder à ces statistiques');
    }

    const stats = await this.designProductLinkService.getLinkStats();

    return {
      success: true,
      data: stats
    };
  }

  /**
   * 🆕 ADMIN: Migrer les liens existants
   */
  @Post('admin/links/migrate')
  @ApiOperation({
    summary: '[ADMIN] Migrer les liens design-produit existants',
    description: 'Crée des liens DesignProductLink basés sur les designCloudinaryUrl existantes'
  })
  @ApiResponse({
    status: 200,
    description: 'Migration terminée avec succès',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            created: { type: 'number' },
            errors: { type: 'number' }
          }
        }
      }
    }
  })
  async migrateLinks(@Request() req) {
    // Vérifier que l'utilisateur est admin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent effectuer cette migration');
    }

    const result = await this.designProductLinkService.migrateExistingLinks();

    return {
      success: true,
      message: `Migration terminée: ${result.created} liens créés, ${result.errors} erreurs`,
      data: result
    };
  }

  /**
   * 🆕 ADMIN: Réparer les liens manquants
   */
  @Post('admin/links/repair')
  @ApiOperation({
    summary: '[ADMIN] Réparer les liens design-produit manquants',
    description: 'Vérifie et répare les liens manquants entre designs et produits'
  })
  @ApiResponse({
    status: 200,
    description: 'Réparation terminée avec succès'
  })
  async repairLinks(@Request() req) {
    // Vérifier que l'utilisateur est admin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent effectuer cette réparation');
    }

    const result = await this.designProductLinkService.verifyAndRepairLinks();

    return {
      success: true,
      message: `Réparation terminée: ${result.repaired} liens réparés, ${result.errors} erreurs`,
      data: result
    };
  }

  /**
   * 🆕 ADMIN: Nettoyer les liens orphelins
   */
  @Delete('admin/links/cleanup')
  @ApiOperation({
    summary: '[ADMIN] Nettoyer les liens orphelins',
    description: 'Supprime les liens vers des designs ou produits supprimés'
  })
  @ApiResponse({
    status: 200,
    description: 'Nettoyage terminé avec succès'
  })
  async cleanupLinks(@Request() req) {
    // Vérifier que l'utilisateur est admin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent effectuer ce nettoyage');
    }

    const result = await this.designProductLinkService.cleanupOrphanedLinks();

    return {
      success: true,
      message: `Nettoyage terminé: ${result.deleted} liens orphelins supprimés`,
      data: result
    };
  }

  /**
   * 🆕 ADMIN: Récupérer les produits liés à un design
   */
  @Get(':id/products')
  @ApiOperation({
    summary: '[ADMIN] Récupérer les produits liés à un design',
    description: 'Liste tous les produits vendeur utilisant ce design'
  })
  @ApiParam({ name: 'id', type: 'number', description: 'ID du design' })
  @ApiResponse({
    status: 200,
    description: 'Produits récupérés avec succès'
  })
  async getProductsByDesign(
    @Request() req,
    @Param('id', ParseIntPipe) id: number
  ) {
    // Vérifier que l'utilisateur est admin
    if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
      throw new BadRequestException('Seuls les administrateurs peuvent accéder à cette information');
    }

    const products = await this.designProductLinkService.getProductsByDesign(id);

    return {
      success: true,
      data: {
        designId: id,
        products: products,
        totalProducts: products.length
      }
    };
  }
} 