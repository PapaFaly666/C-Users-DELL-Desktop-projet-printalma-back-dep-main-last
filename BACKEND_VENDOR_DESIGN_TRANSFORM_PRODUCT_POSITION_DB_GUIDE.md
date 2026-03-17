# 📚 Guide Base de Données – VendorDesignTransform & ProductDesignPosition

> **Objectif** : expliquer comment les **transformations** (_VendorDesignTransform_) et les **positionnements** (_ProductDesignPosition_) sont stockés en base, quelles contraintes existent, et comment lire/écrire ces données avec **Prisma** ou SQL brut.

---

## 1. Modèles Prisma

### 1.1 `VendorDesignTransform`
```prisma
model VendorDesignTransform {
  id              Int      @id @default(autoincrement())
  vendorId        Int
  vendorProductId Int
  designUrl       String   @db.VarChar(500)
  transforms      Json      // { 0: {x,y,scale}, positioning: {x,y,scale,rotation,…}, … }
  lastModified    DateTime @default(now()) @updatedAt
  createdAt       DateTime @default(now())

  vendor          User          @relation(fields: [vendorId], references: [id], onDelete: Cascade)
  vendorProduct   VendorProduct @relation(fields: [vendorProductId], references: [id], onDelete: Cascade)

  @@index([vendorId, vendorProductId])
  @@index([designUrl])
  @@unique([vendorId, vendorProductId, designUrl])
}
```

### 1.2 `ProductDesignPosition`
```prisma
model ProductDesignPosition {
  vendorProductId Int  @map("vendor_product_id")
  designId        Int  @map("design_id")
  position        Json // { x, y, scale, rotation, constraints? }
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  vendorProduct   VendorProduct @relation("VendorProductToDesignPosition", fields: [vendorProductId], references: [id], onDelete: Cascade)
  design          Design        @relation("DesignToDesignPosition", fields: [designId], references: [id], onDelete: Cascade)

  @@id([vendorProductId, designId])
  @@index([vendorProductId])
  @@index([designId])
}
```

---

## 2. Relations clés

| Table | FK → | Cardinalité | Commentaire |
|-------|------|-------------|-------------|
| VendorDesignTransform | `vendorProductId` → VendorProduct(id) | N:1 | Un transform par designUrl *et* produit |
| ProductDesignPosition | `(vendorProductId, designId)` | 1:1 (PK composée) | Position unique pour un couple **VendorProduct / Design** |

---

## 3. Contraintes & Index

1. **Unicité** : `(vendorId, vendorProductId, designUrl)` assure qu’un même design ne stocke qu’un enregistrement par produit.
2. **Clé composite** : `ProductDesignPosition` empêche les positions dupliquées.
3. **Indices** : conçus pour :
   * récupérer rapidement toutes les positions d’un produit (`vendorProductId`)
   * trouver les transforms par `designUrl` (auto-complétion depuis le frontend)

---

## 4. Exemples Prisma

### 4.1 Sauvegarder / mettre à jour une transformation
```ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

await prisma.vendorDesignTransform.upsert({
  where: {
    vendorId_vendorProductId_designUrl: {
      vendorId: 2,
      vendorProductId: 70,
      designUrl: 'https://…/design.png'
    }
  },
  create: {
    vendorId: 2,
    vendorProductId: 70,
    designUrl: 'https://…/design.png',
    transforms: {
      0: { x: 25, y: 30, scale: 0.8 },
      positioning: { x: 25, y: 30, scale: 0.8, rotation: 0 }
    }
  },
  update: {
    transforms: {
      0: { x: 25, y: 30, scale: 0.8 },
      positioning: { x: 30, y: 35, scale: 0.9, rotation: 5 }
    },
    lastModified: new Date()
  }
});
```

### 4.2 Sauvegarder / mettre à jour une position
```ts
await prisma.productDesignPosition.upsert({
  where: {
    vendorProductId_designId: {
      vendorProductId: 70,
      designId: 9
    }
  },
  create: {
    vendorProductId: 70,
    designId: 9,
    position: { x: -86, y: -122, scale: 0.375, rotation: 0 }
  },
  update: {
    position: { x: -50, y: -100, scale: 0.4, rotation: 2 }
  }
});
```

### 4.3 Lecture optimisée
```ts
const transform = await prisma.vendorDesignTransform.findFirst({
  where: {
    vendorProductId: 70,
    designUrl: { contains: 'design.png' }
  },
  orderBy: { lastModified: 'desc' }
});

const position = await prisma.productDesignPosition.findUnique({
  where: {
    vendorProductId_designId: {
      vendorProductId: 70,
      designId: 9
    }
  }
});
```

---

## 5. Exemples SQL brut

### 5.1 Insérer une transformation
```sql
INSERT INTO vendor_design_transform (vendor_id, vendor_product_id, design_url, transforms, last_modified)
VALUES (2, 70, 'https://…/design.png', '{"0":{"x":25,"y":30,"scale":0.8}}', NOW())
ON CONFLICT (vendor_id, vendor_product_id, design_url)
DO UPDATE SET transforms = EXCLUDED.transforms, last_modified = NOW();
```

### 5.2 Insérer une position
```sql
INSERT INTO product_design_position (vendor_product_id, design_id, position)
VALUES (70, 9, '{"x":-86,"y":-122,"scale":0.375,"rotation":0}')
ON CONFLICT (vendor_product_id, design_id)
DO UPDATE SET position = EXCLUDED.position, updated_at = NOW();
```

---

## 6. Flux de synchronisation recommandé

1. **Frontend** enregistre en localStorage (`design_position_{vendorId}_{baseProductId}_{designId}`).
2. Au **drag-stop** (ou throttlé 500 ms) :
   * `PUT /api/vendor-products/:vpId/designs/:designId/position/direct`
   * met à jour `ProductDesignPosition` + la clé `positioning` du `VendorDesignTransform` correspondant (_si présent_).
3. Lors du **clic « Enregistrer »** dans l’éditeur :
   * `POST /vendor/design-transforms` avec le JSON complet `transforms` et `lastModified`.
4. **Backend** :
   * upsert dans `VendorDesignTransform`.
   * appelle `savePositionFromTransform()` → upsert dans `ProductDesignPosition` pour garder les deux sources synchronisées.

---

## 7. Bonnes pratiques

- **Toujours** utiliser `upsert()` pour éviter les duplicats.
- Conserver `designUrl` complet (HTTPS) pour compatibilité mais utiliser aussi `cloudinaryPublicId` côté backend pour une résolution rapide.
- Garder `positioning` dans `transforms` comme source unique **côté éditeur** ; la table `ProductDesignPosition` sert de cache optimisé pour d’autres endpoints.
- Mettre à jour `lastModified` **en millisecondes** côté frontend afin de détecter les conflits éventuels.
- Limiter la taille du champ `transforms` (< 10 KB) pour éviter les problèmes de performance.

---

## 8. Sécurité & Permissions

- Vérification systématique que `vendorProduct.vendorId === req.user.id` avant tout write.
- Vérifier également `design.vendorId === req.user.id` pour `ProductDesignPosition`.
- Utiliser des **transactions Prisma** lors de mises à jour multiples (transform + position) afin de garantir l’intégrité.

---

## 9. Debug & Diagnostics

- Endpoint `GET /api/vendor-products/:vpId/designs/:dId/position/debug` renvoie :
  * permissions produit / design
  * suggestions de correction (ids alternatifs)
- En base :
  ```sql
  SELECT * FROM vendor_design_transform WHERE vendor_product_id = 70 ORDER BY last_modified DESC LIMIT 5;
  SELECT * FROM product_design_position WHERE vendor_product_id = 70;
  ```
- Loggers NestJS : `VendorDesignTransformService` & `DesignPositionService` (niveau `DEBUG`).

---

🎉 **Vous avez maintenant la cartographie complète entre frontend ↔️ API ↔️ Base de données pour les transformations et positions !** 