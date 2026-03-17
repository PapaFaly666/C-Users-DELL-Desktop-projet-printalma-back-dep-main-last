import { Controller, Post, Get, Param, ParseIntPipe, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../core/guards/admin.guard';
import { DesignAutoValidationService } from './design-auto-validation.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiTags('admin-auto-validation')
export class DesignAutoValidationController {
  
  constructor(
    private readonly autoValidationService: DesignAutoValidationService
  ) {}

  /**
   * 🎯 PRIORITÉ 1: Auto-validation spécifique par design
   * POST /admin/designs/{designId}/auto-validate-products
   */
  @Post('designs/:designId/auto-validate-products')
  @ApiOperation({ 
    summary: 'Auto-valider tous les VendorProducts utilisant un design spécifique',
    description: 'Met automatiquement isValidated = true pour tous les VendorProducts utilisant le design spécifié qui vient d\'être validé'
  })
  @ApiParam({
    name: 'designId',
    description: 'ID du design qui vient d\'être validé',
    type: Number,
    example: 42
  })
  @ApiResponse({
    status: 200,
    description: 'Produits auto-validés avec succès',
    schema: {
      example: {
        success: true,
        message: "Produits auto-validés avec succès",
        data: {
          updatedProducts: [
            {
              id: 123,
              name: "T-shirt Logo Rouge",
              isValidated: true,
              vendorId: 45
            },
            {
              id: 124,
              name: "Mug Personnalisé",
              isValidated: true,
              vendorId: 45
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Design non trouvé',
    schema: {
      example: {
        success: false,
        message: "Design non trouvé",
        error: "DESIGN_NOT_FOUND"
      }
    }
  })
  @ApiResponse({
    status: 403,
    description: 'Accès non autorisé',
    schema: {
      example: {
        success: false,
        message: "Accès non autorisé",
        error: "ACCESS_DENIED"
      }
    }
  })
  async autoValidateProductsForDesign(
    @Param('designId', ParseIntPipe) designId: number,
    @Request() req: any
  ) {
    return await this.autoValidationService.autoValidateProductsForDesign(designId);
  }

  /**
   * 🎯 PRIORITÉ 2: Auto-validation globale
   * POST /admin/vendor-products/auto-validate
   */
  @Post('vendor-products/auto-validate')
  @ApiOperation({ 
    summary: 'Auto-valider tous les VendorProducts éligibles',
    description: 'Auto-valide tous les VendorProducts où tous les designs associés sont validés'
  })
  @ApiResponse({
    status: 200,
    description: 'Auto-validation globale terminée',
    schema: {
      example: {
        success: true,
        message: "Auto-validation globale terminée",
        data: {
          updated: [
            {
              id: 123,
              name: "T-shirt Logo Rouge",
              vendorId: 45,
              isValidated: true,
              validatedAt: "2025-01-15T10:30:00Z",
              validatedBy: -1
            }
          ]
        }
      }
    }
  })
  async autoValidateAllProducts(@Request() req: any) {
    return await this.autoValidationService.autoValidateAllEligibleProducts();
  }

  /**
   * 🎯 BONUS: Statistiques d'auto-validation
   * GET /admin/stats/auto-validation
   */
  @Get('stats/auto-validation')
  @ApiOperation({ 
    summary: 'Statistiques de l\'auto-validation',
    description: 'Retourne les statistiques des produits auto-validés vs validés manuellement'
  })
  @ApiResponse({
    status: 200,
    description: 'Statistiques récupérées avec succès',
    schema: {
      example: {
        success: true,
        data: {
          autoValidated: 45,
          manualValidated: 23,
          pending: 12,
          totalValidated: 68
        }
      }
    }
  })
  async getAutoValidationStats(@Request() req: any) {
    return await this.autoValidationService.getAutoValidationStats();
  }
}