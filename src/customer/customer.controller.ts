import { Controller, Post, Get, Body, Query, BadRequestException } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

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
}
