# BACKEND - Implémentation des dimensions de design (design_width, design_height)

## 🎯 RÉSUMÉ DES MODIFICATIONS

Les champs `design_width` et `design_height` ont été ajoutés au système de positions de design pour permettre au frontend de sauvegarder les dimensions finales des designs affichés (style Photoshop).

## 📋 FICHIERS MODIFIÉS

### 1. Schéma de base de données
- **`prisma/schema.prisma`** : Ajout des colonnes `design_width` et `design_height` au modèle `ProductDesignPosition`

### 2. DTOs (Data Transfer Objects)
- **`src/vendor-product/dto/save-design-position.dto.ts`** : Ajout des champs avec validation
- **`src/vendor-product/dto/update-design-position.dto.ts`** : Ajout des champs avec validation

### 3. Services
- **`src/vendor-product/services/design-position.service.ts`** : Mise à jour pour gérer les nouveaux champs
- **`src/vendor-product/services/vendor-design-position.service.ts`** : Mise à jour pour gérer les nouveaux champs
- **`src/vendor-product/vendor-publish.service.ts`** : Mise à jour de la méthode `saveDesignPosition`

### 4. Scripts de migration et test
- **`add-design-dimensions.sql`** : Script SQL pour ajouter les colonnes
- **`test-design-dimensions.js`** : Script de test pour vérifier les fonctionnalités

## 🔧 STRUCTURE DES DONNÉES

### Modèle Prisma mis à jour
```prisma
model ProductDesignPosition {
  vendorProductId Int  @map("vendor_product_id")
  designId        Int  @map("design_id")
  
  position        Json  @default("{}")
  
  // 🆕 Nouveaux champs
  design_width    Float? @map("design_width")
  design_height   Float? @map("design_height")
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations...
}
```

### Format des requêtes
```json
{
  "vendorProductId": 2,
  "designId": 42,
  "position": {
    "x": 50.5,
    "y": 30.2,
    "scale": 1.0,
    "rotation": 0
  },
  "design_width": 200.0,
  "design_height": 150.0
}
```

### Format des réponses
```json
{
  "success": true,
  "data": {
    "x": 50.5,
    "y": 30.2,
    "scale": 1.0,
    "rotation": 0,
    "design_width": 200.0,
    "design_height": 150.0
  }
}
```

## 🔍 VALIDATION

### Contraintes appliquées
- `design_width` et `design_height` sont optionnels (nullable)
- Valeurs minimales : 10 pixels
- Valeurs maximales : 2000 pixels
- Type : `Float` (nombres décimaux autorisés)

### Messages d'erreur
- `"La largeur doit être au moins 10 pixels"`
- `"La largeur ne peut pas dépasser 2000 pixels"`
- `"La hauteur doit être au moins 10 pixels"`
- `"La hauteur ne peut pas dépasser 2000 pixels"`

## 🔄 RÉTROCOMPATIBILITÉ

### Données existantes
- Les positions existantes auront `design_width` et `design_height` = `null`
- Le frontend doit gérer ces valeurs `null` avec des dimensions par défaut
- Aucune migration de données nécessaire

### Logique de fallback
```typescript
// Dans les services
return {
  ...positionRecord.position,
  design_width: positionRecord.design_width, // Peut être null
  design_height: positionRecord.design_height, // Peut être null
};
```

## 📊 ENDPOINTS AFFECTÉS

### 1. Sauvegarde de position
- **POST** `/api/vendor/design-position`
- Accepte maintenant `design_width` et `design_height`

### 2. Récupération de position
- **GET** `/api/vendor-products/{id}/designs/{id}/position/direct`
- Retourne maintenant `design_width` et `design_height`

### 3. Mise à jour de position
- **PUT** `/api/vendor-products/{id}/designs/{id}/position/direct`
- Accepte maintenant `design_width` et `design_height`

## 🧪 TESTS

### Script de test
```bash
node test-design-dimensions.js
```

### Tests couverts
1. **Sauvegarde** : Position avec dimensions
2. **Récupération** : Position avec dimensions
3. **Mise à jour** : Nouvelles dimensions
4. **Validation** : Dimensions invalides

## 🔧 MIGRATION DE BASE DE DONNÉES

### Script SQL
```sql
-- Ajouter les colonnes
ALTER TABLE "ProductDesignPosition" 
ADD COLUMN design_width DOUBLE PRECISION,
ADD COLUMN design_height DOUBLE PRECISION;

-- Contraintes de validation
ALTER TABLE "ProductDesignPosition" 
ADD CONSTRAINT design_width_positive CHECK (design_width IS NULL OR design_width > 0);

ALTER TABLE "ProductDesignPosition" 
ADD CONSTRAINT design_height_positive CHECK (design_height IS NULL OR design_height > 0);

ALTER TABLE "ProductDesignPosition" 
ADD CONSTRAINT design_width_max CHECK (design_width IS NULL OR design_width <= 2000);

ALTER TABLE "ProductDesignPosition" 
ADD CONSTRAINT design_height_max CHECK (design_height IS NULL OR design_height <= 2000);
```

### Commande Prisma
```bash
npx prisma generate
```

## 🎨 UTILISATION CÔTÉ FRONTEND

### Cas d'usage
1. **Redimensionnement fluide** : Les poignées de redimensionnement modifient ces valeurs
2. **Cohérence visuelle** : Les dimensions affichées correspondent aux valeurs sauvegardées
3. **Contrôles numériques** : Les champs largeur/hauteur modifient ces valeurs en temps réel

### Exemple d'utilisation
```javascript
// Sauvegarde avec dimensions
const positionData = {
  vendorProductId: 2,
  designId: 42,
  position: { x: 50, y: 30, scale: 1, rotation: 0 },
  design_width: 200.0,
  design_height: 150.0
};

await saveDesignPosition(positionData);
```

## 🚨 POINTS IMPORTANTS

1. **Dimensions finales** : `design_width` et `design_height` sont les dimensions réelles affichées
2. **Scale = 1** : Avec ce système, `scale` sera généralement 1.0 car les dimensions sont déjà finales
3. **Nullable** : Les colonnes sont nullable pour la rétrocompatibilité
4. **Float** : Type `Float` pour permettre les valeurs décimales

## 📋 CHECKLIST IMPLÉMENTATION

- [x] Ajouter les colonnes `design_width` et `design_height` au schéma Prisma
- [x] Mettre à jour les DTOs avec validation
- [x] Modifier les services pour gérer les nouveaux champs
- [x] Mettre à jour les endpoints pour accepter/retourner les nouvelles données
- [x] Créer un script de test
- [x] Créer un script de migration SQL
- [x] Générer le client Prisma
- [x] Documenter les modifications
- [ ] Exécuter les tests en production
- [ ] Appliquer la migration en base de données

## 🔗 INTÉGRATION AVEC L'EXISTANT

Les modifications sont entièrement rétrocompatibles :
- Les anciennes positions continuent de fonctionner
- Les nouveaux champs sont optionnels
- Le frontend peut progressivement adopter les nouvelles dimensions
- Aucune rupture de service prévue

Cette implémentation permet un système de dimensionnement fluide et cohérent entre le frontend et le backend ! 🎨 
 
 
 
 
 
 