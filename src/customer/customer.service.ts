import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma.service';
import { MailService } from '../core/mail/mail.service';

@Injectable()
export class CustomerService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(data: { firstName: string; lastName: string; email: string; password: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('Un compte avec cet email existe déjà');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await this.prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: hashedPassword,
        role: null,
        email_verified: false,
        activation_code: verificationToken,
        activation_code_expires: tokenExpires,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
    const verifyUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    try {
      await this.mailService.sendNotificationEmail(
        data.email,
        'Confirmez votre adresse email - PrintAlma',
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #14689a;">Bienvenue sur PrintAlma !</h2>
            <p>Bonjour ${data.firstName},</p>
            <p>Merci de vous être inscrit. Cliquez sur le bouton ci-dessous pour confirmer votre adresse email :</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #14689a; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 16px 0;">
              Confirmer mon email
            </a>
            <p style="color: #888; font-size: 12px;">Ce lien expire dans 24 heures.</p>
          </div>
        `,
      );
    } catch (e) {
      console.warn('Email de vérification non envoyé:', e.message);
    }

    return { message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        activation_code: token,
        role: null,
      },
    });

    if (!user) throw new BadRequestException('Lien invalide ou déjà utilisé');

    if (user.activation_code_expires && user.activation_code_expires < new Date()) {
      throw new BadRequestException('Lien expiré. Veuillez vous réinscrire.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        email_verified: true,
        activation_code: null,
        activation_code_expires: null,
      },
    });

    return { message: 'Email vérifié avec succès. Vous pouvez vous connecter.' };
  }

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== null) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.email_verified) {
      throw new UnauthorizedException('Veuillez vérifier votre email avant de vous connecter');
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Email ou mot de passe incorrect');

    const payload = { sub: user.id, email: user.email, role: 'CUSTOMER' };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };
  }
}
