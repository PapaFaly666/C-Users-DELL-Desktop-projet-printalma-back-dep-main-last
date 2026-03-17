# 🔧 Guide de correction Backend - Problème de parsing baseProductId

## 📋 Problème identifié

**Symptômes:**
- Le frontend envoie `baseProductId: 2` dans le JSON
- Le backend reçoit `baseProductId: undefined`
- L'erreur se produit dans `VendorWizardProductService.createWizardProduct()`

**Analyse du problème:**
Le payload JSON est bien formé côté frontend, mais le DTO `CreateWizardProductDto` ne transforme pas correctement le `baseProductId` en nombre.

## 🛠️ Solution complète

### 1. Ajouter les décorateurs de validation au DTO

**Fichier à modifier:** `src/vendor-product/dto/wizard-product.dto.ts`

```typescript
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, IsOptional, IsEnum, ValidateNested, Min, IsNotEmpty } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class WizardColorDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: 'Noir' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '#000000' })
  @IsString()
  @IsNotEmpty()
  colorCode: string;
}

export class WizardSizeDto {
  @ApiProperty({ example: 1 })
  @IsNumber()
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  sizeName: string;
}

export class WizardProductImagesDto {
  @ApiProperty({
    description: 'Image principale en base64',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
  })
  @IsString()
  @IsNotEmpty()
  baseImage: string;

  @ApiProperty({
    description: 'Images de détail en base64',
    type: [String],
    required: false
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  detailImages?: string[];
}

export class CreateWizardProductDto {
  @ApiProperty({ example: 34, description: 'ID du produit de base (mockup)' })
  @IsNumber()
  @Min(1, { message: 'baseProductId doit être un nombre positif' })
  @Type(() => Number) // 🔧 CRITIQUE: Force la conversion en nombre
  @Transform(({ value }) => {
    // 🔧 CRITIQUE: Transformation personnalisée pour gérer tous les cas
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        throw new Error(`baseProductId doit être un nombre valide, reçu: ${value}`);
      }
      return parsed;
    }
    if (typeof value === 'number') {
      return value;
    }
    throw new Error(`baseProductId doit être un nombre, reçu: ${typeof value}`);
  })
  baseProductId: number;

  @ApiProperty({ example: 'Sweat Custom Noir', description: 'Nom du produit vendeur' })
  @IsString()
  @IsNotEmpty()
  vendorName: string;

  @ApiProperty({ example: 'Sweat à capuche personnalisé de qualité', description: 'Description du produit' })
  @IsString()
  @IsNotEmpty()
  vendorDescription: string;

  @ApiProperty({ example: 10000, description: 'Prix de vente en FCFA' })
  @IsNumber()
  @Min(1, { message: 'vendorPrice doit être supérieur à 0' })
  @Type(() => Number)
  vendorPrice: number;

  @ApiProperty({ example: 10, description: 'Stock initial', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'vendorStock doit être positif ou nul' })
  @Type(() => Number)
  vendorStock?: number;

  @ApiProperty({
    description: 'Couleurs sélectionnées',
    type: [WizardColorDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WizardColorDto)
  selectedColors: WizardColorDto[];

  @ApiProperty({
    description: 'Tailles sélectionnées',
    type: [WizardSizeDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WizardSizeDto)
  selectedSizes: WizardSizeDto[];

  @ApiProperty({
    description: 'Images du produit',
    type: WizardProductImagesDto
  })
  @ValidateNested()
  @Type(() => WizardProductImagesDto)
  productImages: WizardProductImagesDto;

  @ApiProperty({
    example: 'DRAFT',
    description: 'Statut forcé du produit',
    enum: ['DRAFT', 'PUBLISHED'],
    required: false
  })
  @IsOptional()
  @IsEnum(['DRAFT', 'PUBLISHED'], { message: 'forcedStatus doit être DRAFT ou PUBLISHED' })
  forcedStatus?: string;
}

export class WizardProductResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  data: any;
}
```

### 2. Améliorer les logs de debugging dans le service

**Fichier à modifier:** `src/vendor-product/vendor-wizard-product.service.ts`

Ajouter des logs plus détaillés au début de la méthode `createWizardProduct`:

```typescript
async createWizardProduct(
  createWizardProductDto: CreateWizardProductDto,
  vendorId: number,
): Promise<WizardProductResponseDto> {
  this.logger.log(`🎨 Début création produit WIZARD pour vendeur ${vendorId}`);

  // 🔧 Logs de debugging détaillés
  this.logger.log(`📥 DTO reçu (type): ${typeof createWizardProductDto}`);
  this.logger.log(`📥 DTO stringifié: ${JSON.stringify(createWizardProductDto, null, 2)}`);

  // Vérification spécifique du baseProductId
  this.logger.log(`🔍 baseProductId raw: ${createWizardProductDto.baseProductId}`);
  this.logger.log(`🔍 baseProductId type: ${typeof createWizardProductDto.baseProductId}`);
  this.logger.log(`🔍 baseProductId isNaN: ${isNaN(createWizardProductDto.baseProductId)}`);

  const {
    baseProductId,
    vendorName,
    vendorDescription,
    vendorPrice,
    vendorStock = 10,
    selectedColors,
    selectedSizes,
    productImages,
    forcedStatus = 'DRAFT',
  } = createWizardProductDto;

  this.logger.log(`🔍 baseProductId après destructuration: ${baseProductId} (type: ${typeof baseProductId})`);

  // Validation renforcée avec messages d'erreur détaillés
  if (baseProductId === undefined || baseProductId === null) {
    throw new BadRequestException(`baseProductId est manquant. Valeur reçue: ${baseProductId}`);
  }

  if (typeof baseProductId !== 'number') {
    throw new BadRequestException(`baseProductId doit être un nombre. Type reçu: ${typeof baseProductId}, Valeur: ${baseProductId}`);
  }

  if (isNaN(baseProductId) || baseProductId <= 0) {
    throw new BadRequestException(`baseProductId doit être un nombre positif valide. Valeur reçue: ${baseProductId}`);
  }

  // ... reste du code
}
```

### 3. Ajouter un middleware de debugging pour wizard-products

**Fichier à créer:** `src/vendor-product/middleware/wizard-debug.middleware.ts`

```typescript
import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class WizardDebugMiddleware implements NestMiddleware {
  private readonly logger = new Logger(WizardDebugMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    if (req.path.includes('/wizard-products')) {
      this.logger.log(`🎯 Wizard request intercepted:`);
      this.logger.log(`📍 Path: ${req.path}`);
      this.logger.log(`🔧 Method: ${req.method}`);
      this.logger.log(`📦 Content-Type: ${req.headers['content-type']}`);

      if (req.body) {
        this.logger.log(`📥 Raw Body Type: ${typeof req.body}`);
        this.logger.log(`📥 Raw Body Keys: ${Object.keys(req.body)}`);

        if (req.body.baseProductId !== undefined) {
          this.logger.log(`🔍 baseProductId dans middleware: ${req.body.baseProductId} (type: ${typeof req.body.baseProductId})`);
        }

        // Log complet du body (tronqué pour les images)
        const bodyForLog = { ...req.body };
        if (bodyForLog.productImages) {
          bodyForLog.productImages = {
            baseImage: bodyForLog.productImages.baseImage ? '[BASE64_DATA]' : 'undefined',
            detailImages: bodyForLog.productImages.detailImages ? `[${bodyForLog.productImages.detailImages.length} images]` : 'undefined'
          };
        }
        this.logger.log(`📥 Body (images masquées): ${JSON.stringify(bodyForLog, null, 2)}`);
      }
    }
    next();
  }
}
```

### 4. Enregistrer le middleware dans le module

**Fichier à modifier:** `src/vendor-product/vendor-product.module.ts`

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
// ... autres imports
import { WizardDebugMiddleware } from './middleware/wizard-debug.middleware';

@Module({
  // ... autres configurations
})
export class VendorProductModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(WizardDebugMiddleware)
      .forRoutes('vendor/wizard-products');
  }
}
```

### 5. Configuration spécifique pour wizard-products dans main.ts

**Ajout à faire dans:** `src/main.ts`

```typescript
// Ajouter après la ligne 36 (après la config vendor/publish)

// Configuration spécifique pour les routes wizard-products
app.use('/vendor/wizard-products', bodyParser.json({
  limit: '100mb',
  verify: (req: any, res, buf) => {
    console.log(`🎨 Wizard products payload: ${(buf.length / 1024 / 1024).toFixed(2)}MB`);

    // Parsing de test pour debugging
    try {
      const parsed = JSON.parse(buf.toString());
      console.log(`🔍 Wizard parsing test - baseProductId: ${parsed.baseProductId} (type: ${typeof parsed.baseProductId})`);
    } catch (e) {
      console.error(`❌ Erreur parsing wizard payload: ${e.message}`);
    }
  }
}));
```

### 6. Test de validation dans le contrôleur

**Ajout dans:** `src/vendor-product/vendor-wizard-product.controller.ts`

```typescript
@Post('wizard-products')
@HttpCode(HttpStatus.CREATED)
// ... décorateurs existants
async createWizardProduct(
  @Body() createWizardProductDto: CreateWizardProductDto,
  @Request() req: any
): Promise<WizardProductResponseDto> {
  const vendorId = req.user.sub;

  // 🔧 Validation préliminaire dans le controller
  this.logger.log(`🎯 Controller - DTO reçu:`);
  this.logger.log(`🔍 baseProductId dans controller: ${createWizardProductDto.baseProductId} (type: ${typeof createWizardProductDto.baseProductId})`);

  // Test de conversion forcée si nécessaire
  if (typeof createWizardProductDto.baseProductId === 'string') {
    this.logger.warn(`⚠️ baseProductId reçu comme string, tentative de conversion`);
    const converted = parseInt(createWizardProductDto.baseProductId, 10);
    if (!isNaN(converted)) {
      createWizardProductDto.baseProductId = converted;
      this.logger.log(`✅ Conversion réussie: ${createWizardProductDto.baseProductId}`);
    } else {
      this.logger.error(`❌ Échec de conversion du baseProductId: ${createWizardProductDto.baseProductId}`);
    }
  }

  try {
    const result = await this.vendorWizardProductService.createWizardProduct(
      createWizardProductDto,
      vendorId
    );

    return result;

  } catch (error) {
    this.logger.error(`❌ Erreur création produit wizard: ${error.message}`);
    // ... reste de la gestion d'erreur
  }
}
```

## 🔍 Points de debugging à vérifier

1. **Logs dans l'ordre:**
   - Middleware: baseProductId type et valeur
   - Controller: baseProductId après parsing DTO
   - Service: baseProductId après destructuration

2. **Tests manuels:**
   ```bash
   # Test avec curl
   curl -X POST http://localhost:3004/vendor/wizard-products \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"baseProductId": 2, "vendorName": "test", ...}'
   ```

3. **Vérifications:**
   - ValidationPipe est bien configuré avec `transform: true`
   - class-transformer et class-validator sont installés
   - Les décorateurs @Type et @Transform sont bien importés

## 🎯 Solution définitive

Le problème vient probablement du fait que:
1. Le DTO n'a pas de décorateurs de transformation
2. Le ValidationPipe ne convertit pas automatiquement les types sans @Type()
3. Possibilité de corruption du payload lors du parsing

Les modifications ci-dessus garantissent une conversion robuste du `baseProductId` en nombre, avec des logs détaillés pour identifier exactement où le problème se produit.

## 📝 Checklist de vérification

- [ ] Ajouter les décorateurs de validation au DTO
- [ ] Installer les dépendances class-transformer et class-validator
- [ ] Ajouter le middleware de debugging
- [ ] Modifier le service avec des logs détaillés
- [ ] Tester avec différents formats de baseProductId
- [ ] Vérifier les logs à chaque étape du pipeline