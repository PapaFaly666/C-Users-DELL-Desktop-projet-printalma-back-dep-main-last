# 🛠️ Guide Backend : Gestion des Informations Vendeurs

## 🎯 Vue d'ensemble

Ce guide complet aide l'équipe backend à gérer efficacement toutes les informations des vendeurs, incluant les dates de connexion, statuts, et données personnelles. Il couvre l'architecture actuelle, les bonnes pratiques, et les patterns recommandés.

## 🏗️ Architecture Actuelle

### 📁 Structure des Modules Vendeurs

```
src/
├── auth/                           # Authentification et profils
│   ├── auth.controller.ts         # Login, register, profil
│   ├── auth.service.ts           # Logic d'auth
│   └── dto/
│       ├── register-vendor.dto.ts
│       └── create-client.dto.ts
├── vendor-product/                # Produits vendeurs
│   ├── vendor-publish.service.ts  # Service principal
│   ├── vendor-publish.controller.ts
│   ├── vendor-product-validation.service.ts
│   └── public-products.controller.ts
├── vendor-orders/                 # Commandes vendeurs
├── vendor-funds/                  # Gestion des fonds
└── commission/                    # Système de commissions
```

### 🗃️ Modèle de Données Vendeur (Prisma)

```prisma
model User {
  id                   Int          @id @default(autoincrement())

  // 👤 Informations de base
  firstName            String
  lastName             String
  email                String       @unique
  password             String
  role                 Role         @default(VENDEUR)

  // ⚡ Statut et sécurité
  status               Boolean      @default(true)           // Compte actif/désactivé
  login_attempts       Int          @default(0)              // Tentatives de connexion
  locked_until         DateTime?                             // Verrouillage temporaire
  must_change_password Boolean      @default(false)

  // 📅 Dates importantes
  created_at           DateTime     @default(now())          // Date d'inscription
  updated_at           DateTime     @updatedAt               // Dernière modification
  last_login_at        DateTime?                             // Dernière connexion

  // 🏪 Profil vendeur étendu
  phone                String?                               // Téléphone
  country              String?                               // Pays
  address              String?                               // Adresse
  shop_name            String?      @unique                  // Nom boutique
  profile_photo_url    String?                               // Photo Cloudinary
  vendeur_type         VendeurType?                          // INDIVIDUEL/ENTREPRISE

  // 🔐 Activation par email
  activation_code         String?                           // Code à 6 chiffres
  activation_code_expires DateTime?                         // Expiration code

  // 🔗 Relations
  vendorProducts       VendorProduct[]
  designs              Design[]
  orders               Order[]
  vendorCommission     VendorCommission?
  vendorFundsRequests  VendorFundsRequest[]
  vendorEarnings       VendorEarnings?

  @@index([country])
  @@index([shop_name])
}

enum VendeurType {
  INDIVIDUEL
  ENTREPRISE
}

enum Role {
  VENDEUR
  ADMIN
  SUPERADMIN
}
```

## 🔧 Services Principaux

### 1. 🔐 **AuthService** - Gestion de l'authentification

```typescript
// src/auth/auth.service.ts
@Injectable()
export class AuthService {

  /**
   * 🔑 Connexion vendeur avec mise à jour last_login_at
   */
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (user) {
      // ✅ IMPORTANT: Mettre à jour last_login_at à chaque connexion
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          last_login_at: new Date(),
          login_attempts: 0  // Reset tentatives
        }
      });

      return this.generateTokens(user);
    }

    // ❌ Gérer les tentatives échouées
    await this.handleFailedLogin(loginDto.email);
    throw new UnauthorizedException('Identifiants incorrects');
  }

  /**
   * 🔒 Gestion des tentatives de connexion échouées
   */
  private async handleFailedLogin(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const attempts = user.login_attempts + 1;
    const updateData: any = { login_attempts: attempts };

    // Verrouillage après 5 tentatives
    if (attempts >= 5) {
      updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000); // 15 min
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: updateData
    });
  }

  /**
   * 📝 Inscription vendeur avec données complètes
   */
  async registerVendor(registerDto: RegisterVendorDto) {
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const vendor = await this.prisma.user.create({
      data: {
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        email: registerDto.email,
        password: hashedPassword,
        role: 'VENDEUR',
        phone: registerDto.phone,
        country: registerDto.country,
        address: registerDto.address,
        shop_name: registerDto.shop_name,
        vendeur_type: registerDto.vendeur_type || 'INDIVIDUEL',

        // 📅 Dates automatiques
        created_at: new Date(),
        status: true  // Actif par défaut
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        shop_name: true,
        created_at: true,
        status: true
      }
    });

    return vendor;
  }

  /**
   * 👤 Mise à jour profil vendeur
   */
  async updateVendorProfile(userId: number, updateDto: UpdateVendorProfileDto) {
    return await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateDto,
        updated_at: new Date()  // ✅ Toujours mettre à jour
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        address: true,
        shop_name: true,
        profile_photo_url: true,
        vendeur_type: true,
        created_at: true,
        updated_at: true,
        last_login_at: true,
        status: true
      }
    });
  }
}
```

### 2. 🛍️ **VendorPublishService** - Gestion des produits

```typescript
// src/vendor-product/vendor-publish.service.ts
@Injectable()
export class VendorPublishService {

  /**
   * 📊 Récupération enrichie des informations vendeur
   */
  private getVendorSelectFields() {
    return {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      shop_name: true,
      profile_photo_url: true,
      phone: true,
      country: true,
      address: true,
      vendeur_type: true,

      // 📅 DATES IMPORTANTES
      created_at: true,
      last_login_at: true,
      updated_at: true,

      // ⚡ STATUT ET SÉCURITÉ
      status: true,
      login_attempts: true,
      locked_until: true
    };
  }

  /**
   * 🌐 Produits publics avec informations vendeur complètes
   */
  async getPublicVendorProducts(options: GetPublicVendorProductsOptions = {}) {
    const whereClause: any = {
      isDelete: false
      // ✅ Modification récente: Plus de filtre sur vendor.status
      // Permet d'afficher les produits même si vendeur désactivé
    };

    // Filtres
    if (options.vendorId) whereClause.vendorId = options.vendorId;
    if (options.status) whereClause.status = options.status;
    if (options.isBestSeller === true) whereClause.isBestSeller = true;

    const products = await this.prisma.vendorProduct.findMany({
      where: whereClause,
      include: {
        vendor: {
          select: this.getVendorSelectFields()  // ✅ Champs enrichis
        },
        baseProduct: {
          include: {
            colorVariations: {
              include: { images: true }
            }
          }
        },
        designPositions: {
          include: { design: true }
        }
      },
      orderBy: [
        { isBestSeller: 'desc' },
        { createdAt: 'desc' }
      ],
      take: options.limit || 20,
      skip: options.offset || 0
    });

    return {
      products: products.map(product => this.formatVendorProductResponse(product)),
      pagination: {
        total: await this.prisma.vendorProduct.count({ where: whereClause }),
        limit: options.limit || 20,
        offset: options.offset || 0,
        hasMore: products.length === (options.limit || 20)
      }
    };
  }

  /**
   * 🎨 Formatage de la réponse avec informations vendeur enrichies
   */
  private formatVendorProductResponse(product: any) {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      status: product.status,
      createdAt: product.createdAt,

      // 👤 INFORMATIONS VENDEUR ENRICHIES
      vendor: {
        id: product.vendor.id,
        firstName: product.vendor.firstName,
        lastName: product.vendor.lastName,
        shop_name: product.vendor.shop_name,
        profile_photo_url: product.vendor.profile_photo_url,
        email: product.vendor.email,
        phone: product.vendor.phone,
        country: product.vendor.country,
        vendeur_type: product.vendor.vendeur_type,

        // 📅 DATES FORMATÉES
        created_at: product.vendor.created_at?.toISOString(),
        last_login_at: product.vendor.last_login_at?.toISOString(),
        updated_at: product.vendor.updated_at?.toISOString(),

        // ⚡ STATUT
        status: product.vendor.status,
        isLocked: product.vendor.locked_until && new Date(product.vendor.locked_until) > new Date(),

        // 📊 STATISTIQUES CALCULÉES
        memberSinceDays: product.vendor.created_at ?
          Math.floor((Date.now() - product.vendor.created_at.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        lastSeenDays: product.vendor.last_login_at ?
          Math.floor((Date.now() - product.vendor.last_login_at.getTime()) / (1000 * 60 * 60 * 24)) : null
      },

      // 🎨 Autres données produit...
      baseProduct: product.baseProduct,
      designPositions: product.designPositions
    };
  }

  /**
   * 🔄 Activation/Désactivation compte vendeur
   */
  async updateVendorAccountStatus(vendorId: number, status: boolean, reason?: string) {
    this.logger.log(`🔄 Mise à jour statut compte vendeur ${vendorId}: ${status ? 'ACTIF' : 'DÉSACTIVÉ'}`);

    try {
      // Vérifier que le vendeur existe
      const vendor = await this.prisma.user.findUnique({
        where: { id: vendorId },
        select: this.getVendorSelectFields()
      });

      if (!vendor) {
        throw new BadRequestException('Vendeur non trouvé');
      }

      // Mettre à jour le statut
      const updatedVendor = await this.prisma.user.update({
        where: { id: vendorId },
        data: {
          status,
          updated_at: new Date()
        },
        select: this.getVendorSelectFields()
      });

      // 📧 Notification par email (optionnelle)
      if (!status && reason) {
        await this.sendAccountDeactivationEmail(vendor.email, reason);
      }

      const action = status ? 'réactivé' : 'désactivé';
      this.logger.log(`✅ Compte vendeur ${vendorId} ${action}`);

      return {
        success: true,
        message: `Compte ${action} avec succès`,
        data: {
          ...updatedVendor,
          statusChangedAt: updatedVendor.updated_at.toISOString(),
          reason: reason || null
        }
      };
    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour statut vendeur ${vendorId}:`, error);
      throw error;
    }
  }

  /**
   * 📧 Notification email de désactivation
   */
  private async sendAccountDeactivationEmail(email: string, reason: string) {
    try {
      // Implementation avec votre service de mail
      await this.mailService.sendAccountDeactivationNotification(email, reason);
    } catch (error) {
      this.logger.error('Erreur envoi email désactivation:', error);
      // Ne pas faire échouer la désactivation pour un problème d'email
    }
  }

  /**
   * 📊 Statistiques avancées vendeur
   */
  async getVendorDetailedStats(vendorId: number) {
    const [
      totalProducts,
      publishedProducts,
      draftProducts,
      pendingProducts,
      totalDesigns,
      totalEarnings,
      ordersLastMonth,
      vendor
    ] = await Promise.all([
      this.prisma.vendorProduct.count({
        where: { vendorId, isDelete: false }
      }),
      this.prisma.vendorProduct.count({
        where: { vendorId, status: 'PUBLISHED', isDelete: false }
      }),
      this.prisma.vendorProduct.count({
        where: { vendorId, status: 'DRAFT', isDelete: false }
      }),
      this.prisma.vendorProduct.count({
        where: { vendorId, status: 'PENDING', isDelete: false }
      }),
      this.prisma.design.count({
        where: { vendorId, isDelete: false }
      }),
      this.prisma.vendorEarnings.findUnique({
        where: { vendorId },
        select: { totalEarnings: true, availableBalance: true }
      }),
      this.prisma.order.count({
        where: {
          orderItems: {
            some: {
              vendorProduct: { vendorId }
            }
          },
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      }),
      this.prisma.user.findUnique({
        where: { id: vendorId },
        select: this.getVendorSelectFields()
      })
    ]);

    return {
      vendor,
      statistics: {
        products: {
          total: totalProducts,
          published: publishedProducts,
          draft: draftProducts,
          pending: pendingProducts
        },
        designs: {
          total: totalDesigns
        },
        earnings: {
          total: totalEarnings?.totalEarnings || 0,
          available: totalEarnings?.availableBalance || 0
        },
        activity: {
          ordersLastMonth,
          memberSinceDays: vendor?.created_at ?
            Math.floor((Date.now() - vendor.created_at.getTime()) / (1000 * 60 * 60 * 24)) : 0,
          lastSeenDays: vendor?.last_login_at ?
            Math.floor((Date.now() - vendor.last_login_at.getTime()) / (1000 * 60 * 60 * 24)) : null
        }
      }
    };
  }
}
```

### 3. 📊 **VendorProductValidationService** - Validation admin

```typescript
// src/vendor-product/vendor-product-validation.service.ts
@Injectable()
export class VendorProductValidationService {

  /**
   * 👥 Liste complète des vendeurs avec statistiques
   */
  async getAllVendorsWithStats(filters: VendorFilters = {}) {
    const where: any = { role: 'VENDEUR' };

    // Filtres
    if (filters.status === 'active') where.status = true;
    if (filters.status === 'inactive') where.status = false;
    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { shop_name: { contains: filters.search, mode: 'insensitive' } }
      ];
    }

    const vendors = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        country: true,
        shop_name: true,
        profile_photo_url: true,
        vendeur_type: true,

        // 📅 DATES
        created_at: true,
        last_login_at: true,
        updated_at: true,

        // ⚡ STATUT
        status: true,
        login_attempts: true,
        locked_until: true,

        // 📊 COMPTEURS AUTOMATIQUES
        _count: {
          select: {
            vendorProducts: { where: { isDelete: false } },
            designs: { where: { isDelete: false } },
            orders: true
          }
        }
      },
      orderBy: [
        { status: 'desc' },  // Actifs en premier
        { created_at: 'desc' }
      ],
      take: filters.limit || 50,
      skip: filters.offset || 0
    });

    // Enrichir avec statistiques détaillées
    const enrichedVendors = await Promise.all(
      vendors.map(async (vendor) => {
        const [publishedProducts, earnings] = await Promise.all([
          this.prisma.vendorProduct.count({
            where: { vendorId: vendor.id, status: 'PUBLISHED', isDelete: false }
          }),
          this.prisma.vendorEarnings.findUnique({
            where: { vendorId: vendor.id },
            select: { totalEarnings: true, availableBalance: true }
          })
        ]);

        return {
          ...vendor,
          statistics: {
            totalProducts: vendor._count.vendorProducts,
            publishedProducts,
            totalDesigns: vendor._count.designs,
            totalOrders: vendor._count.orders,
            totalEarnings: earnings?.totalEarnings || 0,
            availableBalance: earnings?.availableBalance || 0,

            // 📅 CALCULS TEMPORELS
            memberSinceDays: Math.floor(
              (Date.now() - vendor.created_at.getTime()) / (1000 * 60 * 60 * 24)
            ),
            lastSeenDays: vendor.last_login_at ?
              Math.floor((Date.now() - vendor.last_login_at.getTime()) / (1000 * 60 * 60 * 24)) : null,

            // ⚡ STATUT ENRICHI
            isLocked: vendor.locked_until && new Date(vendor.locked_until) > new Date(),
            needsAttention: vendor.login_attempts >= 3 ||
                           (vendor.last_login_at &&
                            (Date.now() - vendor.last_login_at.getTime()) > 30 * 24 * 60 * 60 * 1000)
          }
        };
      })
    );

    // Calculer les statistiques globales
    const stats = {
      total: enrichedVendors.length,
      active: enrichedVendors.filter(v => v.status).length,
      inactive: enrichedVendors.filter(v => !v.status).length,
      locked: enrichedVendors.filter(v => v.statistics.isLocked).length,
      needsAttention: enrichedVendors.filter(v => v.statistics.needsAttention).length,
      withProducts: enrichedVendors.filter(v => v.statistics.totalProducts > 0).length,
      withoutProducts: enrichedVendors.filter(v => v.statistics.totalProducts === 0).length,
    };

    return {
      vendors: enrichedVendors,
      stats,
      pagination: {
        total: await this.prisma.user.count({ where }),
        limit: filters.limit || 50,
        offset: filters.offset || 0
      }
    };
  }

  /**
   * 🔄 Déverrouillage manuel d'un compte vendeur
   */
  async unlockVendorAccount(vendorId: number, adminId: number) {
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: { id: true, email: true, firstName: true, lastName: true }
    });

    if (!vendor) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    await this.prisma.user.update({
      where: { id: vendorId },
      data: {
        login_attempts: 0,
        locked_until: null,
        updated_at: new Date()
      }
    });

    // Log de l'action admin
    this.logger.log(`🔓 Compte vendeur ${vendorId} déverrouillé par admin ${adminId}`);

    return {
      success: true,
      message: `Compte de ${vendor.firstName} ${vendor.lastName} déverrouillé`
    };
  }
}
```

## 📝 DTOs et Validation

### 🔍 **DTOs pour les Informations Vendeur**

```typescript
// src/auth/dto/vendor-profile.dto.ts
import { IsOptional, IsString, IsEnum, IsPhoneNumber, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VendeurType } from '@prisma/client';

export class UpdateVendorProfileDto {
  @ApiProperty({ description: 'Prénom du vendeur' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ description: 'Nom de famille du vendeur' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ description: 'Numéro de téléphone' })
  @IsOptional()
  @IsPhoneNumber('FR')
  phone?: string;

  @ApiProperty({ description: 'Pays de résidence' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Adresse complète' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: 'Nom de la boutique' })
  @IsOptional()
  @IsString()
  shop_name?: string;

  @ApiProperty({ description: 'URL de la photo de profil Cloudinary' })
  @IsOptional()
  @IsUrl()
  profile_photo_url?: string;

  @ApiProperty({ enum: VendeurType, description: 'Type de vendeur' })
  @IsOptional()
  @IsEnum(VendeurType)
  vendeur_type?: VendeurType;
}

export class VendorProfileResponseDto {
  @ApiProperty()
  id: number;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  country?: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  shop_name?: string;

  @ApiProperty({ required: false })
  profile_photo_url?: string;

  @ApiProperty({ enum: VendeurType, required: false })
  vendeur_type?: VendeurType;

  @ApiProperty({ description: 'Date d\'inscription ISO' })
  created_at: string;

  @ApiProperty({ description: 'Dernière connexion ISO', required: false })
  last_login_at?: string;

  @ApiProperty({ description: 'Dernière modification ISO' })
  updated_at: string;

  @ApiProperty({ description: 'Statut du compte (actif/désactivé)' })
  status: boolean;

  @ApiProperty({ description: 'Nombre de tentatives de connexion échouées' })
  login_attempts: number;

  @ApiProperty({ description: 'Date de fin de verrouillage', required: false })
  locked_until?: string;

  @ApiProperty({ description: 'Statistiques calculées' })
  statistics: {
    memberSinceDays: number;
    lastSeenDays: number | null;
    totalProducts: number;
    publishedProducts: number;
    totalDesigns: number;
    totalEarnings: number;
    isLocked: boolean;
  };
}
```

### 🎯 **DTOs pour Filtres et Recherche**

```typescript
// src/vendor-product/dto/vendor-filters.dto.ts
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export enum VendorStatus {
  ALL = 'all',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  LOCKED = 'locked'
}

export class VendorFiltersDto {
  @ApiProperty({ description: 'Recherche textuelle (nom, email, boutique)', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: VendorStatus, description: 'Filtrer par statut', required: false })
  @IsOptional()
  @IsEnum(VendorStatus)
  status?: VendorStatus;

  @ApiProperty({ description: 'Pays à filtrer', required: false })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({ description: 'Type de vendeur', required: false })
  @IsOptional()
  @IsEnum(['INDIVIDUEL', 'ENTREPRISE'])
  vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';

  @ApiProperty({ description: 'Nombre d\'éléments par page', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({ description: 'Décalage pour pagination', required: false, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiProperty({ description: 'Trier par (created_at, last_login_at, etc.)', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string = 'created_at';

  @ApiProperty({ description: 'Ordre de tri (asc, desc)', required: false })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
```

## 🚦 Contrôleurs et Endpoints

### 🔐 **AuthController** - Endpoints d'authentification

```typescript
// src/auth/auth.controller.ts (Extensions)
@Controller('auth')
@ApiTags('Authentication')
export class AuthController {

  /**
   * 👤 Récupération du profil vendeur complet
   */
  @Get('vendor/profile')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({ summary: 'Récupérer le profil vendeur complet' })
  @ApiResponse({ type: VendorProfileResponseDto })
  async getVendorProfile(@Req() req: RequestWithUser) {
    const vendorProfile = await this.authService.getVendorCompleteProfile(req.user.id);
    return {
      success: true,
      data: vendorProfile
    };
  }

  /**
   * ✏️ Mise à jour du profil vendeur
   */
  @Put('vendor/profile')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({ summary: 'Mettre à jour le profil vendeur' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('profile_photo', profilePhotoConfig))
  async updateVendorProfile(
    @Req() req: RequestWithUser,
    @Body() updateDto: UpdateVendorProfileDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    // Upload photo si fournie
    if (file) {
      const uploadResult = await this.cloudinaryService.uploadProfilePhoto(file);
      updateDto.profile_photo_url = uploadResult.secure_url;
    }

    const updatedProfile = await this.authService.updateVendorProfile(req.user.id, updateDto);

    return {
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedProfile
    };
  }

  /**
   * 📊 Statistiques du vendeur connecté
   */
  @Get('vendor/stats')
  @UseGuards(JwtAuthGuard, VendorGuard)
  @ApiOperation({ summary: 'Statistiques détaillées du vendeur' })
  async getVendorStats(@Req() req: RequestWithUser) {
    const stats = await this.vendorPublishService.getVendorDetailedStats(req.user.id);

    return {
      success: true,
      data: stats
    };
  }
}
```

### 👥 **VendorManagementController** - Gestion admin des vendeurs

```typescript
// src/vendor-product/vendor-management.controller.ts (Nouveau)
@Controller('admin/vendors')
@ApiTags('Admin - Vendor Management')
@UseGuards(JwtAuthGuard, AdminGuard)
export class VendorManagementController {
  constructor(
    private readonly vendorValidationService: VendorProductValidationService,
    private readonly vendorPublishService: VendorPublishService
  ) {}

  /**
   * 👥 Liste complète des vendeurs avec filtres
   */
  @Get()
  @ApiOperation({ summary: 'Récupérer tous les vendeurs avec statistiques' })
  @ApiResponse({ type: 'object' })
  async getAllVendors(@Query() filters: VendorFiltersDto) {
    const result = await this.vendorValidationService.getAllVendorsWithStats(filters);

    return {
      success: true,
      message: 'Vendeurs récupérés avec succès',
      data: result
    };
  }

  /**
   * 👤 Détails complets d'un vendeur
   */
  @Get(':vendorId')
  @ApiOperation({ summary: 'Détails complets d\'un vendeur' })
  @ApiParam({ name: 'vendorId', type: 'number' })
  async getVendorDetails(@Param('vendorId', ParseIntPipe) vendorId: number) {
    const vendorDetails = await this.vendorPublishService.getVendorDetailedStats(vendorId);

    if (!vendorDetails.vendor) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    return {
      success: true,
      data: vendorDetails
    };
  }

  /**
   * 🔄 Activation/Désactivation compte vendeur
   */
  @Put(':vendorId/status')
  @ApiOperation({ summary: 'Activer/Désactiver un compte vendeur' })
  @ApiParam({ name: 'vendorId', type: 'number' })
  async updateVendorStatus(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Body() updateDto: { status: boolean; reason?: string }
  ) {
    const result = await this.vendorPublishService.updateVendorAccountStatus(
      vendorId,
      updateDto.status,
      updateDto.reason
    );

    return result;
  }

  /**
   * 🔓 Déverrouillage manuel d'un compte
   */
  @Post(':vendorId/unlock')
  @ApiOperation({ summary: 'Déverrouiller un compte vendeur verrouillé' })
  @ApiParam({ name: 'vendorId', type: 'number' })
  async unlockVendorAccount(
    @Param('vendorId', ParseIntPipe) vendorId: number,
    @Req() req: RequestWithUser
  ) {
    const result = await this.vendorValidationService.unlockVendorAccount(
      vendorId,
      req.user.id
    );

    return result;
  }

  /**
   * 📊 Export des données vendeurs
   */
  @Get('export/csv')
  @ApiOperation({ summary: 'Exporter les données vendeurs en CSV' })
  async exportVendorsData(@Query() filters: VendorFiltersDto, @Res() res: Response) {
    const allVendors = await this.vendorValidationService.getAllVendorsWithStats({
      ...filters,
      limit: 10000  // Récupérer tous pour export
    });

    const csv = this.generateVendorsCsv(allVendors.vendors);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=vendors-export.csv');
    res.send(csv);
  }

  /**
   * 📧 Notification en masse aux vendeurs
   */
  @Post('notify')
  @ApiOperation({ summary: 'Envoyer une notification à plusieurs vendeurs' })
  async notifyVendors(@Body() notifyDto: {
    vendorIds: number[];
    subject: string;
    message: string;
    type: 'email' | 'in-app' | 'both';
  }) {
    // Implementation de notification en masse
    const results = await Promise.allSettled(
      notifyDto.vendorIds.map(vendorId =>
        this.sendNotificationToVendor(vendorId, notifyDto)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return {
      success: true,
      message: `Notifications envoyées: ${successful} réussies, ${failed} échecs`,
      data: { successful, failed, total: notifyDto.vendorIds.length }
    };
  }

  private generateVendorsCsv(vendors: any[]): string {
    const headers = [
      'ID', 'Prénom', 'Nom', 'Email', 'Téléphone', 'Pays',
      'Boutique', 'Type', 'Statut', 'Date Inscription', 'Dernière Connexion',
      'Produits Total', 'Produits Publiés', 'Designs', 'Gains'
    ];

    const rows = vendors.map(vendor => [
      vendor.id,
      vendor.firstName,
      vendor.lastName,
      vendor.email,
      vendor.phone || '',
      vendor.country || '',
      vendor.shop_name || '',
      vendor.vendeur_type || '',
      vendor.status ? 'Actif' : 'Inactif',
      new Date(vendor.created_at).toLocaleDateString('fr-FR'),
      vendor.last_login_at ? new Date(vendor.last_login_at).toLocaleDateString('fr-FR') : 'Jamais',
      vendor.statistics.totalProducts,
      vendor.statistics.publishedProducts,
      vendor.statistics.totalDesigns,
      vendor.statistics.totalEarnings
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }
}
```

## 🔒 Guards et Middleware

### 🛡️ **VendorGuard** - Protection des routes vendeur

```typescript
// src/core/guards/vendor.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class VendorGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Vérifier le rôle vendeur
    if (user.role !== 'VENDEUR') {
      throw new ForbiddenException('Accès réservé aux vendeurs');
    }

    // ✅ VÉRIFICATIONS SUPPLÉMENTAIRES
    const vendorData = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        status: true,
        locked_until: true,
        login_attempts: true
      }
    });

    if (!vendorData) {
      throw new ForbiddenException('Compte vendeur introuvable');
    }

    // Vérifier si le compte est verrouillé
    if (vendorData.locked_until && new Date(vendorData.locked_until) > new Date()) {
      throw new ForbiddenException('Compte temporairement verrouillé');
    }

    // ⚠️ AVERTISSEMENT si compte désactivé mais autoriser quand même
    // (permet au vendeur de voir ses infos mais pas de créer/modifier)
    if (!vendorData.status) {
      request.vendorWarning = 'Compte désactivé - Accès limité';
    }

    return true;
  }
}
```

### 🕐 **LastLoginMiddleware** - Mise à jour automatique

```typescript
// src/core/middleware/last-login.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class LastLoginMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Mettre à jour last_login_at pour les requêtes authentifiées
    if (req.user && req.user.id) {
      try {
        // ✅ Mise à jour asynchrone sans bloquer la requête
        this.updateLastLogin(req.user.id).catch(error => {
          console.error('Erreur mise à jour last_login_at:', error);
        });
      } catch (error) {
        // Ne pas faire échouer la requête pour une erreur de mise à jour
        console.error('Erreur middleware last_login:', error);
      }
    }

    next();
  }

  private async updateLastLogin(userId: number) {
    // Mettre à jour seulement si la dernière mise à jour date de plus de 5 minutes
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { last_login_at: true }
    });

    const shouldUpdate = !user.last_login_at ||
      (Date.now() - user.last_login_at.getTime()) > 5 * 60 * 1000; // 5 minutes

    if (shouldUpdate) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { last_login_at: new Date() }
      });
    }
  }
}
```

## 📊 Bonnes Pratiques Backend

### 1. 🔄 **Gestion des Dates**

```typescript
// ✅ Toujours utiliser new Date() pour les timestamps
const updateData = {
  updated_at: new Date(),  // Plutôt que Date.now()
  last_login_at: new Date()
};

// ✅ Convertir en ISO pour les réponses JSON
const response = {
  created_at: user.created_at.toISOString(),
  last_login_at: user.last_login_at?.toISOString()
};

// ✅ Calculer les durées en jours
const daysSince = Math.floor(
  (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
);
```

### 2. 🎯 **Select Fields Optimisés**

```typescript
// ✅ Créer des fonctions réutilisables pour les sélections
private getVendorSelectFields() {
  return {
    id: true,
    firstName: true,
    lastName: true,
    // ... autres champs nécessaires
  };
}

// ✅ Éviter select: { password: false } qui expose tout
// ❌ Mauvais
select: { password: false }

// ✅ Bon
select: this.getVendorSelectFields()
```

### 3. 🔍 **Requêtes Optimisées**

```typescript
// ✅ Utiliser Promise.all pour les requêtes parallèles
const [totalProducts, totalDesigns, earnings] = await Promise.all([
  this.prisma.vendorProduct.count({ where: { vendorId } }),
  this.prisma.design.count({ where: { vendorId } }),
  this.prisma.vendorEarnings.findUnique({ where: { vendorId } })
]);

// ✅ Utiliser _count dans les relations pour éviter N+1
const vendors = await this.prisma.user.findMany({
  include: {
    _count: {
      select: {
        vendorProducts: { where: { isDelete: false } },
        designs: { where: { isDelete: false } }
      }
    }
  }
});
```

### 4. 🚨 **Gestion d'Erreurs**

```typescript
// ✅ Gestion d'erreurs spécifiques
try {
  const result = await this.updateVendorStatus(vendorId, status);
  return result;
} catch (error) {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new NotFoundException('Vendeur non trouvé');
    }
  }

  this.logger.error(`Erreur mise à jour vendeur ${vendorId}:`, error);
  throw new InternalServerErrorException('Erreur interne du serveur');
}
```

### 5. 📧 **Notifications et Logs**

```typescript
// ✅ Logger les actions importantes
this.logger.log(`🔄 Vendeur ${vendorId} - Statut changé: ${status}`);

// ✅ Notifications asynchrones
private async notifyStatusChange(vendorId: number, status: boolean) {
  try {
    // Ne pas bloquer la requête principale
    setImmediate(async () => {
      await this.sendStatusChangeEmail(vendorId, status);
    });
  } catch (error) {
    this.logger.error('Erreur notification:', error);
  }
}
```

## 🚀 Améliorations Futures

### 1. 📈 **Analytics Temps Réel**

```typescript
// Service d'analytics pour tracking des connexions
@Injectable()
export class VendorAnalyticsService {
  async trackVendorActivity(vendorId: number, action: string, metadata?: any) {
    // Enregistrer les actions pour analytics
  }

  async getVendorActivityReport(vendorId: number, period: 'day' | 'week' | 'month') {
    // Générer rapports d'activité
  }
}
```

### 2. 🔄 **Cache pour Performances**

```typescript
// Cache Redis pour les données fréquemment consultées
@Injectable()
export class VendorCacheService {
  @Cache(300) // 5 minutes
  async getCachedVendorStats(vendorId: number) {
    return this.calculateVendorStats(vendorId);
  }
}
```

### 3. 📊 **Système de Rapports**

```typescript
// Génération automatique de rapports
@Injectable()
export class VendorReportingService {
  async generateMonthlyVendorReport() {
    // Rapport automatique mensuel
  }

  async generateVendorPerformanceReport(vendorId: number) {
    // Rapport de performance individuel
  }
}
```

---

## ✅ Checklist de Mise en Œuvre

- [ ] **Mettre à jour les services existants** avec les nouveaux champs
- [ ] **Implémenter les DTOs** de validation
- [ ] **Créer les nouveaux contrôleurs** pour la gestion admin
- [ ] **Ajouter les guards** de sécurité
- [ ] **Configurer les middlewares** de mise à jour automatique
- [ ] **Tester les endpoints** avec différents scénarios
- [ ] **Documenter les APIs** avec Swagger
- [ ] **Optimiser les requêtes** pour les performances
- [ ] **Implémenter les logs** et monitoring
- [ ] **Configurer les notifications** email

Ce guide fournit une base solide pour gérer efficacement toutes les informations des vendeurs côté backend ! 🎯