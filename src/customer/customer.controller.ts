import { Controller, Post, Get, Patch, Delete, Body, Query, Param, BadRequestException, UseGuards, Request } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Public Customer')
@Controller('public/customer')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post('register')
  @ApiOperation({ summary: 'Inscription client' })
  async register(
    @Body() body: { firstName: string; lastName: string; email: string; password: string },
  ) {
    if (!body.firstName || !body.lastName || !body.email || !body.password) {
      throw new BadRequestException('Tous les champs sont requis');
    }
    return this.customerService.register(body);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Vérification email client' })
  async verifyEmail(@Query('token') token: string) {
    if (!token) throw new BadRequestException('Token manquant');
    return this.customerService.verifyEmail(token);
  }

  @Post('login')
  @ApiOperation({ summary: 'Connexion client' })
  async login(@Body() body: { email: string; password: string }) {
    if (!body.email || !body.password) {
      throw new BadRequestException('Email et mot de passe requis');
    }
    return this.customerService.login(body.email, body.password);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer le profil client' })
  async getProfile(@Request() req: any) {
    const data = await this.customerService.getProfile(req.user.id);
    return { success: true, data };
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Mettre à jour le profil client' })
  async updateProfile(@Request() req: any, @Body() body: { firstName?: string; lastName?: string; phone?: string; address?: string; country?: string }) {
    const data = await this.customerService.updateProfile(req.user.id, body);
    return { success: true, data };
  }

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Changer le mot de passe client' })
  async changePassword(@Request() req: any, @Body() body: { currentPassword: string; newPassword: string }) {
    if (!body.currentPassword || !body.newPassword) {
      throw new BadRequestException('Mot de passe actuel et nouveau mot de passe requis');
    }
    return this.customerService.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }

  @Get('favorites')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer les favoris du client' })
  async getFavorites(@Request() req: any) {
    const data = await this.customerService.getFavorites(req.user.id);
    return { success: true, data };
  }

  @Post('favorites/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter un produit aux favoris' })
  async addFavorite(@Request() req: any, @Param('productId') productId: string) {
    const data = await this.customerService.addFavorite(req.user.id, parseInt(productId));
    return { success: true, data };
  }

  @Delete('favorites/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Supprimer un produit des favoris' })
  async removeFavorite(@Request() req: any, @Param('productId') productId: string) {
    const data = await this.customerService.removeFavorite(req.user.id, parseInt(productId));
    return { success: true, data };
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Récupérer l\'historique de navigation' })
  async getHistory(@Request() req: any) {
    const data = await this.customerService.getHistory(req.user.id);
    return { success: true, data };
  }

  @Post('history')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Ajouter un produit à l\'historique' })
  async addToHistory(@Request() req: any, @Body() body: { productId: number; name: string; imageUrl?: string; price?: number }) {
    if (!body.productId || !body.name) {
      throw new BadRequestException('productId et name requis');
    }
    const data = await this.customerService.addToHistory(req.user.id, { ...body, viewedAt: new Date().toISOString() });
    return { success: true, data };
  }
}
