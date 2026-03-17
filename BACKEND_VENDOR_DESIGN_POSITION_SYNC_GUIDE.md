# 🛠️ BACKEND – Vendor Design Position Sync

Ce guide explique comment ➜
1. créer la table `vendor_design_positions` (Prisma + migration SQL),
2. implémenter les endpoints **GET / PUT /position/direct**,
3. gérer le fallback `baseProductId → vendorProductId`,
4. migrer les anciennes données de `vendor_design_transforms`.

---

## 1. Modèle Prisma

```prisma
model VendorDesignPosition {
  id               Int      @id @default(autoincrement())
  vendorProductId  Int
  designId         Int
  x                Decimal  @default(0)
  y                Decimal  @default(0)
  scale            Decimal  @default(1)
  rotation         Decimal  @default(0)
  constraints      Json?
  updatedAt        DateTime @updatedAt

  vendorProduct    VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)
  design           Design        @relation(fields: [designId],         references: [id], onDelete: Cascade)

  @@unique([vendorProductId, designId])
  @@map("vendor_design_positions")
}
```

> `npx prisma migrate dev -n vendor_design_positions`

---

## 2. DTO

```ts
export class PositionDto {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  constraints?: Record<string, any>;
}
```

---

## 3. Service

```ts
@Injectable()
export class VendorDesignPositionService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lecture */
  async getPosition(vendorId: number, vpId: number, designId: number) {
    // mapping produit
    const product = await this.resolveProduct(vendorId, vpId);
    if (!product) return null;

    const rec = await this.prisma.vendorDesignPosition.findUnique({
      where: {
        vendorProductId_designId: { vendorProductId: product.id, designId }
      }
    });
    return rec ? rec : null;
  }

  /** Sauvegarde */
  async savePosition(vendorId: number, vpId: number, designId: number, dto: PositionDto) {
    const product = await this.resolveProduct(vendorId, vpId);
    if (!product) throw new ForbiddenException('Produit introuvable');

    await this.prisma.vendorDesignPosition.upsert({
      where: {
        vendorProductId_designId: { vendorProductId: product.id, designId }
      },
      create: {
        vendorProductId: product.id,
        designId,
        x: dto.x,
        y: dto.y,
        scale: dto.scale,
        rotation: dto.rotation,
        constraints: dto.constraints ?? {},
      },
      update: {
        x: dto.x,
        y: dto.y,
        scale: dto.scale,
        rotation: dto.rotation,
        constraints: dto.constraints ?? {},
      }
    });
  }

  /** mapping baseProductId → vendorProductId */
  private async resolveProduct(vendorId: number, vpId: number) {
    // direct id
    let p = await this.prisma.vendorProduct.findFirst({ where: { id: vpId, vendorId } });
    if (p) return p;
    // fallback baseProductId
    p = await this.prisma.vendorProduct.findFirst({ where: { baseProductId: vpId, vendorId } });
    return p;
  }
}
```

---

## 4. Contrôleur

```ts
@Controller('api/vendor-products/:vpId/designs/:designId/position')
@UseGuards(JwtAuthGuard)
export class VendorDesignPositionController {
  constructor(private readonly service: VendorDesignPositionService) {}

  @Get('direct')
  async getDirect(@Req() req, @Param() params) {
    const vendorId = req.user.id;
    const pos = await this.service.getPosition(vendorId, +params.vpId, +params.designId);
    return { success: true, data: pos };
  }

  @Put('direct')
  async putDirect(@Req() req, @Param() params, @Body() dto: PositionDto) {
    const vendorId = req.user.id;
    await this.service.savePosition(vendorId, +params.vpId, +params.designId, dto);
    return { success: true, message: 'OK' };
  }
}
```

Ajoutez le contrôleur dans le module `VendorProductModule`.

---

## 5. Migration Legacy (script SQL)

```sql
INSERT INTO vendor_design_positions (vendor_product_id, design_id, x, y, scale, rotation, constraints)
SELECT vp.id, 1, (t.transforms->0->>'x')::numeric,
                 (t.transforms->0->>'y')::numeric,
                 (t.transforms->0->>'scale')::numeric,
                 (t.transforms->0->>'rotation')::numeric,
                 jsonb_build_object('migrated',true)
FROM vendor_design_transforms t
JOIN vendor_products vp ON vp.base_product_id = t.base_product_id AND vp.vendor_id = t.vendor_id
WHERE (t.transforms->0) IS NOT NULL
ON CONFLICT (vendor_product_id, design_id) DO NOTHING;
```

---

## 6. Tests manuels

```bash
# Créer une position
curl -b cookie.txt -X PUT \
  -d '{"x":-20,"y":-60,"scale":0.35,"rotation":0,"constraints":{}}' \
  http://localhost:3004/api/vendor-products/63/designs/21/position/direct

# Lire la position
curl -b cookie.txt http://localhost:3004/api/vendor-products/63/designs/21/position/direct
```

> La seconde requête doit renvoyer la même position.

---

## 7. Checklist

- [ ] Migration Prisma appliquée ✅
- [ ] Service + contrôleur enregistrés dans le module ✅
- [ ] Fallback baseProductId fonctionnel ✅
- [ ] Legacy transform migré (optionnel) ✅
- [ ] Frontend reçoit `data` ≠ null et affiche la bonne position ✅

Une fois tout coché → problème résolu. 🎉 
 
 
 
 