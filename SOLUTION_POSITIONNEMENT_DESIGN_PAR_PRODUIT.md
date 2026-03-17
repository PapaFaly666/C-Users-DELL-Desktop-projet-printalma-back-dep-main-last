# Solution - Positionnement de design adaptatif par type de produit

## 🎯 Problème identifié

Actuellement, quand un vendeur crée plusieurs produits avec le même design, le positionnement (délimitations) reste identique pour tous les produits. Cela pose problème car :
- Un logo sur un t-shirt doit être positionné différemment que sur un mug
- Les dimensions et proportions varient selon le type de produit
- L'expérience utilisateur est dégradée

## 🔧 Solution proposée

### 1. Architecture de données

#### A. Nouveau modèle `ProductDesignTemplate`
```prisma
model ProductDesignTemplate {
  id                Int      @id @default(autoincrement())
  baseProductId     Int      @map("base_product_id")
  productCategory   String   // "tshirt", "mug", "hoodie", etc.
  
  // Positionnement par défaut pour ce type de produit
  defaultPositioning Json    // { x: 50, y: 40, width: 30, height: 20, rotation: 0 }
  defaultScale       Float   @default(0.6)
  
  // Métadonnées
  name              String   // "T-shirt - Position poitrine"
  description       String?  // "Position optimale pour logo sur t-shirt"
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  baseProduct       Product  @relation(fields: [baseProductId], references: [id])
  
  @@unique([baseProductId, productCategory])
  @@index([baseProductId])
  @@index([productCategory])
}
```

#### B. Mise à jour du modèle `VendorDesignTransform`
```prisma
model VendorDesignTransform {
  id              Int      @id @default(autoincrement())
  vendorId        Int
  vendorProductId Int
  designUrl       String   @db.VarChar(500)
  
  // 🆕 Positionnement spécifique à ce produit
  positioning     Json     // { x, y, width, height, rotation }
  scale           Float    @default(0.6)
  
  // Référence au template utilisé (optionnel)
  templateId      Int?     @map("template_id")
  
  transforms      Json     // Autres transformations
  lastModified    DateTime @default(now()) @updatedAt
  createdAt       DateTime @default(now())

  vendor          User          @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  vendorProduct   VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)
  template        ProductDesignTemplate? @relation(fields: [templateId], references: [id])

  @@index([vendorId, vendorProductId], name: "idx_vendor_product")
  @@index([designUrl], name: "idx_design_url")
  @@unique([vendorId, vendorProductId, designUrl], name: "unique_vendor_product_design")
}
```

### 2. Logique métier

#### A. Détection automatique du type de produit
```typescript
interface ProductTypeDetector {
  detectProductType(baseProduct: Product): string;
  getDefaultPositioning(productType: string): DesignPositioning;
}

class ProductTypeDetectorService {
  detectProductType(baseProduct: Product): string {
    const name = baseProduct.name.toLowerCase();
    
    if (name.includes('t-shirt') || name.includes('tshirt')) return 'tshirt';
    if (name.includes('hoodie') || name.includes('sweat')) return 'hoodie';
    if (name.includes('mug') || name.includes('tasse')) return 'mug';
    if (name.includes('casquette') || name.includes('cap')) return 'cap';
    if (name.includes('sac') || name.includes('bag')) return 'bag';
    
    return 'default';
  }
  
  getDefaultPositioning(productType: string): DesignPositioning {
    const templates = {
      tshirt: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
      hoodie: { x: 50, y: 40, width: 20, height: 25, rotation: 0 },
      mug: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
      cap: { x: 50, y: 30, width: 30, height: 20, rotation: 0 },
      bag: { x: 50, y: 45, width: 35, height: 35, rotation: 0 },
      default: { x: 50, y: 50, width: 30, height: 30, rotation: 0 }
    };
    
    return templates[productType] || templates.default;
  }
}
```

#### B. Service de positionnement adaptatif
```typescript
@Injectable()
export class AdaptiveDesignPositioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productTypeDetector: ProductTypeDetectorService
  ) {}

  async getOptimalPositioning(
    vendorId: number,
    baseProductId: number,
    designUrl: string
  ): Promise<DesignPositioning> {
    
    // 1. Vérifier s'il existe déjà un positionnement personnalisé
    const existingTransform = await this.prisma.vendorDesignTransform.findFirst({
      where: {
        vendorId,
        vendorProduct: { baseProductId },
        designUrl
      }
    });

    if (existingTransform?.positioning) {
      return existingTransform.positioning;
    }

    // 2. Obtenir le produit de base
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: baseProductId }
    });

    if (!baseProduct) {
      throw new NotFoundException('Produit de base non trouvé');
    }

    // 3. Détecter le type de produit
    const productType = this.productTypeDetector.detectProductType(baseProduct);

    // 4. Chercher un template existant
    const template = await this.prisma.productDesignTemplate.findFirst({
      where: {
        baseProductId,
        productCategory: productType
      }
    });

    if (template) {
      return template.defaultPositioning;
    }

    // 5. Utiliser le positionnement par défaut du type
    return this.productTypeDetector.getDefaultPositioning(productType);
  }

  async saveCustomPositioning(
    vendorId: number,
    vendorProductId: number,
    designUrl: string,
    positioning: DesignPositioning
  ): Promise<void> {
    
    await this.prisma.vendorDesignTransform.upsert({
      where: {
        vendorId_vendorProductId_designUrl: {
          vendorId,
          vendorProductId,
          designUrl
        }
      },
      create: {
        vendorId,
        vendorProductId,
        designUrl,
        positioning,
        transforms: {},
        lastModified: new Date()
      },
      update: {
        positioning,
        lastModified: new Date()
      }
    });
  }
}
```

### 3. Endpoints API

#### A. Obtenir le positionnement optimal
```typescript
@Get('products/:productId/design-positioning')
async getOptimalPositioning(
  @Param('productId') productId: number,
  @Query('designUrl') designUrl: string,
  @Req() req: AuthRequest
) {
  const positioning = await this.adaptivePositioningService.getOptimalPositioning(
    req.user.id,
    productId,
    designUrl
  );
  
  return {
    success: true,
    data: {
      positioning,
      productType: this.productTypeDetector.detectProductType(await this.getProduct(productId))
    }
  };
}
```

#### B. Sauvegarder un positionnement personnalisé
```typescript
@Post('products/:productId/design-positioning')
async saveCustomPositioning(
  @Param('productId') productId: number,
  @Body() dto: SavePositioningDto,
  @Req() req: AuthRequest
) {
  await this.adaptivePositioningService.saveCustomPositioning(
    req.user.id,
    productId,
    dto.designUrl,
    dto.positioning
  );
  
  return {
    success: true,
    message: 'Positionnement sauvegardé avec succès'
  };
}
```

### 4. Intégration frontend

#### A. Hook React pour positionnement adaptatif
```typescript
const useAdaptiveDesignPositioning = (productId: number, designUrl: string) => {
  const [positioning, setPositioning] = useState(null);
  const [productType, setProductType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptimalPositioning = async () => {
      try {
        const response = await axios.get(
          `/vendor-products/${productId}/design-positioning`,
          { params: { designUrl } }
        );
        
        setPositioning(response.data.data.positioning);
        setProductType(response.data.data.productType);
      } catch (error) {
        console.error('Erreur chargement positionnement:', error);
        // Fallback vers positionnement par défaut
        setPositioning({ x: 50, y: 50, width: 30, height: 30, rotation: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (productId && designUrl) {
      loadOptimalPositioning();
    }
  }, [productId, designUrl]);

  const saveCustomPositioning = async (newPositioning: DesignPositioning) => {
    try {
      await axios.post(`/vendor-products/${productId}/design-positioning`, {
        designUrl,
        positioning: newPositioning
      });
      
      setPositioning(newPositioning);
    } catch (error) {
      console.error('Erreur sauvegarde positionnement:', error);
    }
  };

  return {
    positioning,
    productType,
    loading,
    saveCustomPositioning
  };
};
```

#### B. Composant de positionnement adaptatif
```tsx
const AdaptiveDesignPositioner = ({ productId, designUrl, onPositionChange }) => {
  const { positioning, productType, loading, saveCustomPositioning } = 
    useAdaptiveDesignPositioning(productId, designUrl);

  const handlePositionChange = (newPosition) => {
    onPositionChange(newPosition);
    saveCustomPositioning(newPosition);
  };

  if (loading) return <div>Chargement du positionnement optimal...</div>;

  return (
    <div className="adaptive-design-positioner">
      <div className="product-type-indicator">
        <span className="badge badge-info">
          Type: {productType} | Position optimisée
        </span>
      </div>
      
      <DesignPositioner
        initialPosition={positioning}
        onPositionChange={handlePositionChange}
        productType={productType}
      />
      
      <div className="positioning-presets">
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'center'))}>
          Centre
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'top'))}>
          Haut
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'bottom'))}>
          Bas
        </button>
      </div>
    </div>
  );
};
```

### 5. Migration et déploiement

#### A. Script de migration
```typescript
// migrate-design-positioning.ts
async function migrateExistingPositioning() {
  const existingTransforms = await prisma.vendorDesignTransform.findMany({
    include: {
      vendorProduct: {
        include: {
          baseProduct: true
        }
      }
    }
  });

  for (const transform of existingTransforms) {
    const productType = productTypeDetector.detectProductType(
      transform.vendorProduct.baseProduct
    );
    
    const optimalPositioning = productTypeDetector.getDefaultPositioning(productType);
    
    await prisma.vendorDesignTransform.update({
      where: { id: transform.id },
      data: {
        positioning: optimalPositioning,
        scale: 0.6
      }
    });
  }
}
```

#### B. Seeding des templates par défaut
```typescript
// seed-design-templates.ts
const defaultTemplates = [
  {
    baseProductId: 1, // T-shirt
    productCategory: 'tshirt',
    defaultPositioning: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
    name: 'T-shirt - Position poitrine',
    description: 'Position optimale pour logo sur t-shirt'
  },
  {
    baseProductId: 2, // Mug
    productCategory: 'mug',
    defaultPositioning: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
    name: 'Mug - Position centrale',
    description: 'Position optimale pour design sur mug'
  }
  // ... autres templates
];

async function seedDesignTemplates() {
  for (const template of defaultTemplates) {
    await prisma.productDesignTemplate.upsert({
      where: {
        baseProductId_productCategory: {
          baseProductId: template.baseProductId,
          productCategory: template.productCategory
        }
      },
      create: template,
      update: template
    });
  }
}
```

### 6. Avantages de cette solution

1. **Positionnement intelligent** : Chaque type de produit a son positionnement optimal
2. **Personnalisation** : Le vendeur peut ajuster et sauvegarder ses préférences
3. **Évolutif** : Facile d'ajouter de nouveaux types de produits
4. **Rétrocompatible** : Migration transparente des données existantes
5. **UX améliorée** : Moins de manipulation manuelle pour le vendeur

### 7. Implémentation progressive

**Phase 1** : Détection automatique des types de produits
**Phase 2** : Positionnement par défaut selon le type
**Phase 3** : Sauvegarde des positionnements personnalisés
**Phase 4** : Templates avancés avec zones multiples

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 

## 🎯 Problème identifié

Actuellement, quand un vendeur crée plusieurs produits avec le même design, le positionnement (délimitations) reste identique pour tous les produits. Cela pose problème car :
- Un logo sur un t-shirt doit être positionné différemment que sur un mug
- Les dimensions et proportions varient selon le type de produit
- L'expérience utilisateur est dégradée

## 🔧 Solution proposée

### 1. Architecture de données

#### A. Nouveau modèle `ProductDesignTemplate`
```prisma
model ProductDesignTemplate {
  id                Int      @id @default(autoincrement())
  baseProductId     Int      @map("base_product_id")
  productCategory   String   // "tshirt", "mug", "hoodie", etc.
  
  // Positionnement par défaut pour ce type de produit
  defaultPositioning Json    // { x: 50, y: 40, width: 30, height: 20, rotation: 0 }
  defaultScale       Float   @default(0.6)
  
  // Métadonnées
  name              String   // "T-shirt - Position poitrine"
  description       String?  // "Position optimale pour logo sur t-shirt"
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  baseProduct       Product  @relation(fields: [baseProductId], references: [id])
  
  @@unique([baseProductId, productCategory])
  @@index([baseProductId])
  @@index([productCategory])
}
```

#### B. Mise à jour du modèle `VendorDesignTransform`
```prisma
model VendorDesignTransform {
  id              Int      @id @default(autoincrement())
  vendorId        Int
  vendorProductId Int
  designUrl       String   @db.VarChar(500)
  
  // 🆕 Positionnement spécifique à ce produit
  positioning     Json     // { x, y, width, height, rotation }
  scale           Float    @default(0.6)
  
  // Référence au template utilisé (optionnel)
  templateId      Int?     @map("template_id")
  
  transforms      Json     // Autres transformations
  lastModified    DateTime @default(now()) @updatedAt
  createdAt       DateTime @default(now())

  vendor          User          @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  vendorProduct   VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)
  template        ProductDesignTemplate? @relation(fields: [templateId], references: [id])

  @@index([vendorId, vendorProductId], name: "idx_vendor_product")
  @@index([designUrl], name: "idx_design_url")
  @@unique([vendorId, vendorProductId, designUrl], name: "unique_vendor_product_design")
}
```

### 2. Logique métier

#### A. Détection automatique du type de produit
```typescript
interface ProductTypeDetector {
  detectProductType(baseProduct: Product): string;
  getDefaultPositioning(productType: string): DesignPositioning;
}

class ProductTypeDetectorService {
  detectProductType(baseProduct: Product): string {
    const name = baseProduct.name.toLowerCase();
    
    if (name.includes('t-shirt') || name.includes('tshirt')) return 'tshirt';
    if (name.includes('hoodie') || name.includes('sweat')) return 'hoodie';
    if (name.includes('mug') || name.includes('tasse')) return 'mug';
    if (name.includes('casquette') || name.includes('cap')) return 'cap';
    if (name.includes('sac') || name.includes('bag')) return 'bag';
    
    return 'default';
  }
  
  getDefaultPositioning(productType: string): DesignPositioning {
    const templates = {
      tshirt: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
      hoodie: { x: 50, y: 40, width: 20, height: 25, rotation: 0 },
      mug: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
      cap: { x: 50, y: 30, width: 30, height: 20, rotation: 0 },
      bag: { x: 50, y: 45, width: 35, height: 35, rotation: 0 },
      default: { x: 50, y: 50, width: 30, height: 30, rotation: 0 }
    };
    
    return templates[productType] || templates.default;
  }
}
```

#### B. Service de positionnement adaptatif
```typescript
@Injectable()
export class AdaptiveDesignPositioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productTypeDetector: ProductTypeDetectorService
  ) {}

  async getOptimalPositioning(
    vendorId: number,
    baseProductId: number,
    designUrl: string
  ): Promise<DesignPositioning> {
    
    // 1. Vérifier s'il existe déjà un positionnement personnalisé
    const existingTransform = await this.prisma.vendorDesignTransform.findFirst({
      where: {
        vendorId,
        vendorProduct: { baseProductId },
        designUrl
      }
    });

    if (existingTransform?.positioning) {
      return existingTransform.positioning;
    }

    // 2. Obtenir le produit de base
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: baseProductId }
    });

    if (!baseProduct) {
      throw new NotFoundException('Produit de base non trouvé');
    }

    // 3. Détecter le type de produit
    const productType = this.productTypeDetector.detectProductType(baseProduct);

    // 4. Chercher un template existant
    const template = await this.prisma.productDesignTemplate.findFirst({
      where: {
        baseProductId,
        productCategory: productType
      }
    });

    if (template) {
      return template.defaultPositioning;
    }

    // 5. Utiliser le positionnement par défaut du type
    return this.productTypeDetector.getDefaultPositioning(productType);
  }

  async saveCustomPositioning(
    vendorId: number,
    vendorProductId: number,
    designUrl: string,
    positioning: DesignPositioning
  ): Promise<void> {
    
    await this.prisma.vendorDesignTransform.upsert({
      where: {
        vendorId_vendorProductId_designUrl: {
          vendorId,
          vendorProductId,
          designUrl
        }
      },
      create: {
        vendorId,
        vendorProductId,
        designUrl,
        positioning,
        transforms: {},
        lastModified: new Date()
      },
      update: {
        positioning,
        lastModified: new Date()
      }
    });
  }
}
```

### 3. Endpoints API

#### A. Obtenir le positionnement optimal
```typescript
@Get('products/:productId/design-positioning')
async getOptimalPositioning(
  @Param('productId') productId: number,
  @Query('designUrl') designUrl: string,
  @Req() req: AuthRequest
) {
  const positioning = await this.adaptivePositioningService.getOptimalPositioning(
    req.user.id,
    productId,
    designUrl
  );
  
  return {
    success: true,
    data: {
      positioning,
      productType: this.productTypeDetector.detectProductType(await this.getProduct(productId))
    }
  };
}
```

#### B. Sauvegarder un positionnement personnalisé
```typescript
@Post('products/:productId/design-positioning')
async saveCustomPositioning(
  @Param('productId') productId: number,
  @Body() dto: SavePositioningDto,
  @Req() req: AuthRequest
) {
  await this.adaptivePositioningService.saveCustomPositioning(
    req.user.id,
    productId,
    dto.designUrl,
    dto.positioning
  );
  
  return {
    success: true,
    message: 'Positionnement sauvegardé avec succès'
  };
}
```

### 4. Intégration frontend

#### A. Hook React pour positionnement adaptatif
```typescript
const useAdaptiveDesignPositioning = (productId: number, designUrl: string) => {
  const [positioning, setPositioning] = useState(null);
  const [productType, setProductType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptimalPositioning = async () => {
      try {
        const response = await axios.get(
          `/vendor-products/${productId}/design-positioning`,
          { params: { designUrl } }
        );
        
        setPositioning(response.data.data.positioning);
        setProductType(response.data.data.productType);
      } catch (error) {
        console.error('Erreur chargement positionnement:', error);
        // Fallback vers positionnement par défaut
        setPositioning({ x: 50, y: 50, width: 30, height: 30, rotation: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (productId && designUrl) {
      loadOptimalPositioning();
    }
  }, [productId, designUrl]);

  const saveCustomPositioning = async (newPositioning: DesignPositioning) => {
    try {
      await axios.post(`/vendor-products/${productId}/design-positioning`, {
        designUrl,
        positioning: newPositioning
      });
      
      setPositioning(newPositioning);
    } catch (error) {
      console.error('Erreur sauvegarde positionnement:', error);
    }
  };

  return {
    positioning,
    productType,
    loading,
    saveCustomPositioning
  };
};
```

#### B. Composant de positionnement adaptatif
```tsx
const AdaptiveDesignPositioner = ({ productId, designUrl, onPositionChange }) => {
  const { positioning, productType, loading, saveCustomPositioning } = 
    useAdaptiveDesignPositioning(productId, designUrl);

  const handlePositionChange = (newPosition) => {
    onPositionChange(newPosition);
    saveCustomPositioning(newPosition);
  };

  if (loading) return <div>Chargement du positionnement optimal...</div>;

  return (
    <div className="adaptive-design-positioner">
      <div className="product-type-indicator">
        <span className="badge badge-info">
          Type: {productType} | Position optimisée
        </span>
      </div>
      
      <DesignPositioner
        initialPosition={positioning}
        onPositionChange={handlePositionChange}
        productType={productType}
      />
      
      <div className="positioning-presets">
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'center'))}>
          Centre
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'top'))}>
          Haut
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'bottom'))}>
          Bas
        </button>
      </div>
    </div>
  );
};
```

### 5. Migration et déploiement

#### A. Script de migration
```typescript
// migrate-design-positioning.ts
async function migrateExistingPositioning() {
  const existingTransforms = await prisma.vendorDesignTransform.findMany({
    include: {
      vendorProduct: {
        include: {
          baseProduct: true
        }
      }
    }
  });

  for (const transform of existingTransforms) {
    const productType = productTypeDetector.detectProductType(
      transform.vendorProduct.baseProduct
    );
    
    const optimalPositioning = productTypeDetector.getDefaultPositioning(productType);
    
    await prisma.vendorDesignTransform.update({
      where: { id: transform.id },
      data: {
        positioning: optimalPositioning,
        scale: 0.6
      }
    });
  }
}
```

#### B. Seeding des templates par défaut
```typescript
// seed-design-templates.ts
const defaultTemplates = [
  {
    baseProductId: 1, // T-shirt
    productCategory: 'tshirt',
    defaultPositioning: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
    name: 'T-shirt - Position poitrine',
    description: 'Position optimale pour logo sur t-shirt'
  },
  {
    baseProductId: 2, // Mug
    productCategory: 'mug',
    defaultPositioning: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
    name: 'Mug - Position centrale',
    description: 'Position optimale pour design sur mug'
  }
  // ... autres templates
];

async function seedDesignTemplates() {
  for (const template of defaultTemplates) {
    await prisma.productDesignTemplate.upsert({
      where: {
        baseProductId_productCategory: {
          baseProductId: template.baseProductId,
          productCategory: template.productCategory
        }
      },
      create: template,
      update: template
    });
  }
}
```

### 6. Avantages de cette solution

1. **Positionnement intelligent** : Chaque type de produit a son positionnement optimal
2. **Personnalisation** : Le vendeur peut ajuster et sauvegarder ses préférences
3. **Évolutif** : Facile d'ajouter de nouveaux types de produits
4. **Rétrocompatible** : Migration transparente des données existantes
5. **UX améliorée** : Moins de manipulation manuelle pour le vendeur

### 7. Implémentation progressive

**Phase 1** : Détection automatique des types de produits
**Phase 2** : Positionnement par défaut selon le type
**Phase 3** : Sauvegarde des positionnements personnalisés
**Phase 4** : Templates avancés avec zones multiples

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 

## 🎯 Problème identifié

Actuellement, quand un vendeur crée plusieurs produits avec le même design, le positionnement (délimitations) reste identique pour tous les produits. Cela pose problème car :
- Un logo sur un t-shirt doit être positionné différemment que sur un mug
- Les dimensions et proportions varient selon le type de produit
- L'expérience utilisateur est dégradée

## 🔧 Solution proposée

### 1. Architecture de données

#### A. Nouveau modèle `ProductDesignTemplate`
```prisma
model ProductDesignTemplate {
  id                Int      @id @default(autoincrement())
  baseProductId     Int      @map("base_product_id")
  productCategory   String   // "tshirt", "mug", "hoodie", etc.
  
  // Positionnement par défaut pour ce type de produit
  defaultPositioning Json    // { x: 50, y: 40, width: 30, height: 20, rotation: 0 }
  defaultScale       Float   @default(0.6)
  
  // Métadonnées
  name              String   // "T-shirt - Position poitrine"
  description       String?  // "Position optimale pour logo sur t-shirt"
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  baseProduct       Product  @relation(fields: [baseProductId], references: [id])
  
  @@unique([baseProductId, productCategory])
  @@index([baseProductId])
  @@index([productCategory])
}
```

#### B. Mise à jour du modèle `VendorDesignTransform`
```prisma
model VendorDesignTransform {
  id              Int      @id @default(autoincrement())
  vendorId        Int
  vendorProductId Int
  designUrl       String   @db.VarChar(500)
  
  // 🆕 Positionnement spécifique à ce produit
  positioning     Json     // { x, y, width, height, rotation }
  scale           Float    @default(0.6)
  
  // Référence au template utilisé (optionnel)
  templateId      Int?     @map("template_id")
  
  transforms      Json     // Autres transformations
  lastModified    DateTime @default(now()) @updatedAt
  createdAt       DateTime @default(now())

  vendor          User          @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  vendorProduct   VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)
  template        ProductDesignTemplate? @relation(fields: [templateId], references: [id])

  @@index([vendorId, vendorProductId], name: "idx_vendor_product")
  @@index([designUrl], name: "idx_design_url")
  @@unique([vendorId, vendorProductId, designUrl], name: "unique_vendor_product_design")
}
```

### 2. Logique métier

#### A. Détection automatique du type de produit
```typescript
interface ProductTypeDetector {
  detectProductType(baseProduct: Product): string;
  getDefaultPositioning(productType: string): DesignPositioning;
}

class ProductTypeDetectorService {
  detectProductType(baseProduct: Product): string {
    const name = baseProduct.name.toLowerCase();
    
    if (name.includes('t-shirt') || name.includes('tshirt')) return 'tshirt';
    if (name.includes('hoodie') || name.includes('sweat')) return 'hoodie';
    if (name.includes('mug') || name.includes('tasse')) return 'mug';
    if (name.includes('casquette') || name.includes('cap')) return 'cap';
    if (name.includes('sac') || name.includes('bag')) return 'bag';
    
    return 'default';
  }
  
  getDefaultPositioning(productType: string): DesignPositioning {
    const templates = {
      tshirt: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
      hoodie: { x: 50, y: 40, width: 20, height: 25, rotation: 0 },
      mug: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
      cap: { x: 50, y: 30, width: 30, height: 20, rotation: 0 },
      bag: { x: 50, y: 45, width: 35, height: 35, rotation: 0 },
      default: { x: 50, y: 50, width: 30, height: 30, rotation: 0 }
    };
    
    return templates[productType] || templates.default;
  }
}
```

#### B. Service de positionnement adaptatif
```typescript
@Injectable()
export class AdaptiveDesignPositioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productTypeDetector: ProductTypeDetectorService
  ) {}

  async getOptimalPositioning(
    vendorId: number,
    baseProductId: number,
    designUrl: string
  ): Promise<DesignPositioning> {
    
    // 1. Vérifier s'il existe déjà un positionnement personnalisé
    const existingTransform = await this.prisma.vendorDesignTransform.findFirst({
      where: {
        vendorId,
        vendorProduct: { baseProductId },
        designUrl
      }
    });

    if (existingTransform?.positioning) {
      return existingTransform.positioning;
    }

    // 2. Obtenir le produit de base
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: baseProductId }
    });

    if (!baseProduct) {
      throw new NotFoundException('Produit de base non trouvé');
    }

    // 3. Détecter le type de produit
    const productType = this.productTypeDetector.detectProductType(baseProduct);

    // 4. Chercher un template existant
    const template = await this.prisma.productDesignTemplate.findFirst({
      where: {
        baseProductId,
        productCategory: productType
      }
    });

    if (template) {
      return template.defaultPositioning;
    }

    // 5. Utiliser le positionnement par défaut du type
    return this.productTypeDetector.getDefaultPositioning(productType);
  }

  async saveCustomPositioning(
    vendorId: number,
    vendorProductId: number,
    designUrl: string,
    positioning: DesignPositioning
  ): Promise<void> {
    
    await this.prisma.vendorDesignTransform.upsert({
      where: {
        vendorId_vendorProductId_designUrl: {
          vendorId,
          vendorProductId,
          designUrl
        }
      },
      create: {
        vendorId,
        vendorProductId,
        designUrl,
        positioning,
        transforms: {},
        lastModified: new Date()
      },
      update: {
        positioning,
        lastModified: new Date()
      }
    });
  }
}
```

### 3. Endpoints API

#### A. Obtenir le positionnement optimal
```typescript
@Get('products/:productId/design-positioning')
async getOptimalPositioning(
  @Param('productId') productId: number,
  @Query('designUrl') designUrl: string,
  @Req() req: AuthRequest
) {
  const positioning = await this.adaptivePositioningService.getOptimalPositioning(
    req.user.id,
    productId,
    designUrl
  );
  
  return {
    success: true,
    data: {
      positioning,
      productType: this.productTypeDetector.detectProductType(await this.getProduct(productId))
    }
  };
}
```

#### B. Sauvegarder un positionnement personnalisé
```typescript
@Post('products/:productId/design-positioning')
async saveCustomPositioning(
  @Param('productId') productId: number,
  @Body() dto: SavePositioningDto,
  @Req() req: AuthRequest
) {
  await this.adaptivePositioningService.saveCustomPositioning(
    req.user.id,
    productId,
    dto.designUrl,
    dto.positioning
  );
  
  return {
    success: true,
    message: 'Positionnement sauvegardé avec succès'
  };
}
```

### 4. Intégration frontend

#### A. Hook React pour positionnement adaptatif
```typescript
const useAdaptiveDesignPositioning = (productId: number, designUrl: string) => {
  const [positioning, setPositioning] = useState(null);
  const [productType, setProductType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptimalPositioning = async () => {
      try {
        const response = await axios.get(
          `/vendor-products/${productId}/design-positioning`,
          { params: { designUrl } }
        );
        
        setPositioning(response.data.data.positioning);
        setProductType(response.data.data.productType);
      } catch (error) {
        console.error('Erreur chargement positionnement:', error);
        // Fallback vers positionnement par défaut
        setPositioning({ x: 50, y: 50, width: 30, height: 30, rotation: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (productId && designUrl) {
      loadOptimalPositioning();
    }
  }, [productId, designUrl]);

  const saveCustomPositioning = async (newPositioning: DesignPositioning) => {
    try {
      await axios.post(`/vendor-products/${productId}/design-positioning`, {
        designUrl,
        positioning: newPositioning
      });
      
      setPositioning(newPositioning);
    } catch (error) {
      console.error('Erreur sauvegarde positionnement:', error);
    }
  };

  return {
    positioning,
    productType,
    loading,
    saveCustomPositioning
  };
};
```

#### B. Composant de positionnement adaptatif
```tsx
const AdaptiveDesignPositioner = ({ productId, designUrl, onPositionChange }) => {
  const { positioning, productType, loading, saveCustomPositioning } = 
    useAdaptiveDesignPositioning(productId, designUrl);

  const handlePositionChange = (newPosition) => {
    onPositionChange(newPosition);
    saveCustomPositioning(newPosition);
  };

  if (loading) return <div>Chargement du positionnement optimal...</div>;

  return (
    <div className="adaptive-design-positioner">
      <div className="product-type-indicator">
        <span className="badge badge-info">
          Type: {productType} | Position optimisée
        </span>
      </div>
      
      <DesignPositioner
        initialPosition={positioning}
        onPositionChange={handlePositionChange}
        productType={productType}
      />
      
      <div className="positioning-presets">
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'center'))}>
          Centre
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'top'))}>
          Haut
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'bottom'))}>
          Bas
        </button>
      </div>
    </div>
  );
};
```

### 5. Migration et déploiement

#### A. Script de migration
```typescript
// migrate-design-positioning.ts
async function migrateExistingPositioning() {
  const existingTransforms = await prisma.vendorDesignTransform.findMany({
    include: {
      vendorProduct: {
        include: {
          baseProduct: true
        }
      }
    }
  });

  for (const transform of existingTransforms) {
    const productType = productTypeDetector.detectProductType(
      transform.vendorProduct.baseProduct
    );
    
    const optimalPositioning = productTypeDetector.getDefaultPositioning(productType);
    
    await prisma.vendorDesignTransform.update({
      where: { id: transform.id },
      data: {
        positioning: optimalPositioning,
        scale: 0.6
      }
    });
  }
}
```

#### B. Seeding des templates par défaut
```typescript
// seed-design-templates.ts
const defaultTemplates = [
  {
    baseProductId: 1, // T-shirt
    productCategory: 'tshirt',
    defaultPositioning: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
    name: 'T-shirt - Position poitrine',
    description: 'Position optimale pour logo sur t-shirt'
  },
  {
    baseProductId: 2, // Mug
    productCategory: 'mug',
    defaultPositioning: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
    name: 'Mug - Position centrale',
    description: 'Position optimale pour design sur mug'
  }
  // ... autres templates
];

async function seedDesignTemplates() {
  for (const template of defaultTemplates) {
    await prisma.productDesignTemplate.upsert({
      where: {
        baseProductId_productCategory: {
          baseProductId: template.baseProductId,
          productCategory: template.productCategory
        }
      },
      create: template,
      update: template
    });
  }
}
```

### 6. Avantages de cette solution

1. **Positionnement intelligent** : Chaque type de produit a son positionnement optimal
2. **Personnalisation** : Le vendeur peut ajuster et sauvegarder ses préférences
3. **Évolutif** : Facile d'ajouter de nouveaux types de produits
4. **Rétrocompatible** : Migration transparente des données existantes
5. **UX améliorée** : Moins de manipulation manuelle pour le vendeur

### 7. Implémentation progressive

**Phase 1** : Détection automatique des types de produits
**Phase 2** : Positionnement par défaut selon le type
**Phase 3** : Sauvegarde des positionnements personnalisés
**Phase 4** : Templates avancés avec zones multiples

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 

## 🎯 Problème identifié

Actuellement, quand un vendeur crée plusieurs produits avec le même design, le positionnement (délimitations) reste identique pour tous les produits. Cela pose problème car :
- Un logo sur un t-shirt doit être positionné différemment que sur un mug
- Les dimensions et proportions varient selon le type de produit
- L'expérience utilisateur est dégradée

## 🔧 Solution proposée

### 1. Architecture de données

#### A. Nouveau modèle `ProductDesignTemplate`
```prisma
model ProductDesignTemplate {
  id                Int      @id @default(autoincrement())
  baseProductId     Int      @map("base_product_id")
  productCategory   String   // "tshirt", "mug", "hoodie", etc.
  
  // Positionnement par défaut pour ce type de produit
  defaultPositioning Json    // { x: 50, y: 40, width: 30, height: 20, rotation: 0 }
  defaultScale       Float   @default(0.6)
  
  // Métadonnées
  name              String   // "T-shirt - Position poitrine"
  description       String?  // "Position optimale pour logo sur t-shirt"
  
  // Timestamps
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  baseProduct       Product  @relation(fields: [baseProductId], references: [id])
  
  @@unique([baseProductId, productCategory])
  @@index([baseProductId])
  @@index([productCategory])
}
```

#### B. Mise à jour du modèle `VendorDesignTransform`
```prisma
model VendorDesignTransform {
  id              Int      @id @default(autoincrement())
  vendorId        Int
  vendorProductId Int
  designUrl       String   @db.VarChar(500)
  
  // 🆕 Positionnement spécifique à ce produit
  positioning     Json     // { x, y, width, height, rotation }
  scale           Float    @default(0.6)
  
  // Référence au template utilisé (optionnel)
  templateId      Int?     @map("template_id")
  
  transforms      Json     // Autres transformations
  lastModified    DateTime @default(now()) @updatedAt
  createdAt       DateTime @default(now())

  vendor          User          @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  vendorProduct   VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)
  template        ProductDesignTemplate? @relation(fields: [templateId], references: [id])

  @@index([vendorId, vendorProductId], name: "idx_vendor_product")
  @@index([designUrl], name: "idx_design_url")
  @@unique([vendorId, vendorProductId, designUrl], name: "unique_vendor_product_design")
}
```

### 2. Logique métier

#### A. Détection automatique du type de produit
```typescript
interface ProductTypeDetector {
  detectProductType(baseProduct: Product): string;
  getDefaultPositioning(productType: string): DesignPositioning;
}

class ProductTypeDetectorService {
  detectProductType(baseProduct: Product): string {
    const name = baseProduct.name.toLowerCase();
    
    if (name.includes('t-shirt') || name.includes('tshirt')) return 'tshirt';
    if (name.includes('hoodie') || name.includes('sweat')) return 'hoodie';
    if (name.includes('mug') || name.includes('tasse')) return 'mug';
    if (name.includes('casquette') || name.includes('cap')) return 'cap';
    if (name.includes('sac') || name.includes('bag')) return 'bag';
    
    return 'default';
  }
  
  getDefaultPositioning(productType: string): DesignPositioning {
    const templates = {
      tshirt: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
      hoodie: { x: 50, y: 40, width: 20, height: 25, rotation: 0 },
      mug: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
      cap: { x: 50, y: 30, width: 30, height: 20, rotation: 0 },
      bag: { x: 50, y: 45, width: 35, height: 35, rotation: 0 },
      default: { x: 50, y: 50, width: 30, height: 30, rotation: 0 }
    };
    
    return templates[productType] || templates.default;
  }
}
```

#### B. Service de positionnement adaptatif
```typescript
@Injectable()
export class AdaptiveDesignPositioningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly productTypeDetector: ProductTypeDetectorService
  ) {}

  async getOptimalPositioning(
    vendorId: number,
    baseProductId: number,
    designUrl: string
  ): Promise<DesignPositioning> {
    
    // 1. Vérifier s'il existe déjà un positionnement personnalisé
    const existingTransform = await this.prisma.vendorDesignTransform.findFirst({
      where: {
        vendorId,
        vendorProduct: { baseProductId },
        designUrl
      }
    });

    if (existingTransform?.positioning) {
      return existingTransform.positioning;
    }

    // 2. Obtenir le produit de base
    const baseProduct = await this.prisma.product.findUnique({
      where: { id: baseProductId }
    });

    if (!baseProduct) {
      throw new NotFoundException('Produit de base non trouvé');
    }

    // 3. Détecter le type de produit
    const productType = this.productTypeDetector.detectProductType(baseProduct);

    // 4. Chercher un template existant
    const template = await this.prisma.productDesignTemplate.findFirst({
      where: {
        baseProductId,
        productCategory: productType
      }
    });

    if (template) {
      return template.defaultPositioning;
    }

    // 5. Utiliser le positionnement par défaut du type
    return this.productTypeDetector.getDefaultPositioning(productType);
  }

  async saveCustomPositioning(
    vendorId: number,
    vendorProductId: number,
    designUrl: string,
    positioning: DesignPositioning
  ): Promise<void> {
    
    await this.prisma.vendorDesignTransform.upsert({
      where: {
        vendorId_vendorProductId_designUrl: {
          vendorId,
          vendorProductId,
          designUrl
        }
      },
      create: {
        vendorId,
        vendorProductId,
        designUrl,
        positioning,
        transforms: {},
        lastModified: new Date()
      },
      update: {
        positioning,
        lastModified: new Date()
      }
    });
  }
}
```

### 3. Endpoints API

#### A. Obtenir le positionnement optimal
```typescript
@Get('products/:productId/design-positioning')
async getOptimalPositioning(
  @Param('productId') productId: number,
  @Query('designUrl') designUrl: string,
  @Req() req: AuthRequest
) {
  const positioning = await this.adaptivePositioningService.getOptimalPositioning(
    req.user.id,
    productId,
    designUrl
  );
  
  return {
    success: true,
    data: {
      positioning,
      productType: this.productTypeDetector.detectProductType(await this.getProduct(productId))
    }
  };
}
```

#### B. Sauvegarder un positionnement personnalisé
```typescript
@Post('products/:productId/design-positioning')
async saveCustomPositioning(
  @Param('productId') productId: number,
  @Body() dto: SavePositioningDto,
  @Req() req: AuthRequest
) {
  await this.adaptivePositioningService.saveCustomPositioning(
    req.user.id,
    productId,
    dto.designUrl,
    dto.positioning
  );
  
  return {
    success: true,
    message: 'Positionnement sauvegardé avec succès'
  };
}
```

### 4. Intégration frontend

#### A. Hook React pour positionnement adaptatif
```typescript
const useAdaptiveDesignPositioning = (productId: number, designUrl: string) => {
  const [positioning, setPositioning] = useState(null);
  const [productType, setProductType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOptimalPositioning = async () => {
      try {
        const response = await axios.get(
          `/vendor-products/${productId}/design-positioning`,
          { params: { designUrl } }
        );
        
        setPositioning(response.data.data.positioning);
        setProductType(response.data.data.productType);
      } catch (error) {
        console.error('Erreur chargement positionnement:', error);
        // Fallback vers positionnement par défaut
        setPositioning({ x: 50, y: 50, width: 30, height: 30, rotation: 0 });
      } finally {
        setLoading(false);
      }
    };

    if (productId && designUrl) {
      loadOptimalPositioning();
    }
  }, [productId, designUrl]);

  const saveCustomPositioning = async (newPositioning: DesignPositioning) => {
    try {
      await axios.post(`/vendor-products/${productId}/design-positioning`, {
        designUrl,
        positioning: newPositioning
      });
      
      setPositioning(newPositioning);
    } catch (error) {
      console.error('Erreur sauvegarde positionnement:', error);
    }
  };

  return {
    positioning,
    productType,
    loading,
    saveCustomPositioning
  };
};
```

#### B. Composant de positionnement adaptatif
```tsx
const AdaptiveDesignPositioner = ({ productId, designUrl, onPositionChange }) => {
  const { positioning, productType, loading, saveCustomPositioning } = 
    useAdaptiveDesignPositioning(productId, designUrl);

  const handlePositionChange = (newPosition) => {
    onPositionChange(newPosition);
    saveCustomPositioning(newPosition);
  };

  if (loading) return <div>Chargement du positionnement optimal...</div>;

  return (
    <div className="adaptive-design-positioner">
      <div className="product-type-indicator">
        <span className="badge badge-info">
          Type: {productType} | Position optimisée
        </span>
      </div>
      
      <DesignPositioner
        initialPosition={positioning}
        onPositionChange={handlePositionChange}
        productType={productType}
      />
      
      <div className="positioning-presets">
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'center'))}>
          Centre
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'top'))}>
          Haut
        </button>
        <button onClick={() => handlePositionChange(getPresetPosition(productType, 'bottom'))}>
          Bas
        </button>
      </div>
    </div>
  );
};
```

### 5. Migration et déploiement

#### A. Script de migration
```typescript
// migrate-design-positioning.ts
async function migrateExistingPositioning() {
  const existingTransforms = await prisma.vendorDesignTransform.findMany({
    include: {
      vendorProduct: {
        include: {
          baseProduct: true
        }
      }
    }
  });

  for (const transform of existingTransforms) {
    const productType = productTypeDetector.detectProductType(
      transform.vendorProduct.baseProduct
    );
    
    const optimalPositioning = productTypeDetector.getDefaultPositioning(productType);
    
    await prisma.vendorDesignTransform.update({
      where: { id: transform.id },
      data: {
        positioning: optimalPositioning,
        scale: 0.6
      }
    });
  }
}
```

#### B. Seeding des templates par défaut
```typescript
// seed-design-templates.ts
const defaultTemplates = [
  {
    baseProductId: 1, // T-shirt
    productCategory: 'tshirt',
    defaultPositioning: { x: 50, y: 35, width: 25, height: 30, rotation: 0 },
    name: 'T-shirt - Position poitrine',
    description: 'Position optimale pour logo sur t-shirt'
  },
  {
    baseProductId: 2, // Mug
    productCategory: 'mug',
    defaultPositioning: { x: 50, y: 50, width: 40, height: 40, rotation: 0 },
    name: 'Mug - Position centrale',
    description: 'Position optimale pour design sur mug'
  }
  // ... autres templates
];

async function seedDesignTemplates() {
  for (const template of defaultTemplates) {
    await prisma.productDesignTemplate.upsert({
      where: {
        baseProductId_productCategory: {
          baseProductId: template.baseProductId,
          productCategory: template.productCategory
        }
      },
      create: template,
      update: template
    });
  }
}
```

### 6. Avantages de cette solution

1. **Positionnement intelligent** : Chaque type de produit a son positionnement optimal
2. **Personnalisation** : Le vendeur peut ajuster et sauvegarder ses préférences
3. **Évolutif** : Facile d'ajouter de nouveaux types de produits
4. **Rétrocompatible** : Migration transparente des données existantes
5. **UX améliorée** : Moins de manipulation manuelle pour le vendeur

### 7. Implémentation progressive

**Phase 1** : Détection automatique des types de produits
**Phase 2** : Positionnement par défaut selon le type
**Phase 3** : Sauvegarde des positionnements personnalisés
**Phase 4** : Templates avancés avec zones multiples

---

**Dernière mise à jour : 2025-01-05** 
 
 
 
 
 