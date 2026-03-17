# Implémentation Hiérarchie des Catégories

## 📋 Résumé des changements

L'enregistrement des catégories a été adapté selon la logique frontend décrite dans `ha.md`. Le système supporte maintenant une hiérarchie à 3 niveaux :

- **Level 0** : Catégorie parent (ex: "Téléphone")
- **Level 1** : Sous-catégorie (ex: "Coque")
- **Level 2** : Variation (ex: "iPhone 13", "iPhone 14")

---

## 🗄️ Modifications du schéma Prisma

### Modèle `Category` (prisma/schema.prisma:115-132)

```prisma
model Category {
  id          Int        @id @default(autoincrement())
  name        String
  description String?
  parentId    Int?       @map("parent_id")
  level       Int        @default(0)
  order       Int        @default(0)
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  parent      Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]  @relation("CategoryToProduct")

  @@unique([name, parentId], name: "unique_category_per_parent")
  @@index([parentId])
  @@index([level])
  @@map("categories")
}
```

**Nouveaux champs :**
- `parentId` : ID de la catégorie parent (null pour les catégories racines)
- `level` : Niveau hiérarchique (0, 1 ou 2)
- `order` : Ordre d'affichage
- `createdAt`, `updatedAt` : Timestamps
- Relations `parent` et `children` pour la hiérarchie

**Contraintes :**
- `@@unique([name, parentId])` : Empêche les doublons dans le même parent
- `onDelete: Cascade` : Supprime automatiquement les enfants

---

## 🎯 Nouvelles fonctionnalités

### 1. Création avec vérification des doublons

**Endpoint :** `POST /categories`

**Requête :**
```json
{
  "name": "iPhone 14",
  "description": "Variation de Coque",
  "parentId": 2,
  "level": 2
}
```

**Réponse succès :**
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 4,
    "name": "iPhone 14",
    "description": "Variation de Coque",
    "parentId": 2,
    "level": 2,
    "order": 0,
    "createdAt": "2025-09-30T10:00:00.000Z",
    "updatedAt": "2025-09-30T10:00:00.000Z"
  }
}
```

**Réponse erreur (doublon) :**
```json
{
  "statusCode": 409,
  "message": {
    "success": false,
    "error": "DUPLICATE_CATEGORY",
    "message": "La catégorie \"iPhone 14\" existe déjà dans cette catégorie parent",
    "existingCategory": { ... }
  }
}
```

---

### 2. Création de structure complète

**Endpoint :** `POST /categories/structure`

Crée automatiquement la hiérarchie complète (parent > sous-catégorie > variations) en réutilisant les catégories existantes.

**Requête :**
```json
{
  "parentName": "Téléphone",
  "parentDescription": "Accessoires téléphone",
  "childName": "Coque",
  "variations": ["iPhone 13", "iPhone 14", "iPhone 15"]
}
```

**Réponse :**
```json
{
  "success": true,
  "createdCount": 5,
  "skippedVariations": [],
  "message": "Structure créée avec succès ! 5 nouveau(x) élément(s) ajouté(s).",
  "data": {
    "parent": { ... },
    "child": { ... },
    "totalVariations": 3,
    "createdVariations": 3
  }
}
```

**Logique :**
1. Vérifie si le parent existe, sinon le crée
2. Vérifie si l'enfant existe, sinon le crée
3. Pour chaque variation, vérifie si elle existe, sinon la crée
4. Retourne le nombre d'éléments créés et saute les doublons

---

### 3. Récupération hiérarchique

**Endpoint :** `GET /categories/hierarchy`

Retourne les catégories organisées en arbre avec leurs enfants et petits-enfants.

**Réponse :**
```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "level": 0,
    "productCount": 5,
    "subcategories": [
      {
        "id": 2,
        "name": "Coque",
        "level": 1,
        "productCount": 3,
        "subcategories": [
          {
            "id": 3,
            "name": "iPhone 13",
            "level": 2,
            "productCount": 1,
            "subcategories": []
          }
        ]
      }
    ]
  }
]
```

---

### 4. Vérification des doublons

**Endpoint :** `GET /categories/check-duplicate?name=iPhone 14&parentId=2`

**Réponse :**
```json
{
  "exists": true,
  "category": {
    "id": 4,
    "name": "iPhone 14",
    "parentId": 2,
    "level": 2
  }
}
```

---

### 5. Suppression en cascade

**Endpoint :** `DELETE /categories/:id`

Supprime la catégorie et **tous ses enfants** automatiquement.

**Réponse :**
```json
{
  "success": true,
  "message": "Catégorie supprimée avec succès",
  "deletedCount": 5
}
```

**Erreur si produits liés :**
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer la catégorie car elle (ou ses sous-catégories) est liée à 10 produit(s). Veuillez d'abord supprimer ou déplacer ces produits vers une autre catégorie."
}
```

---

## 📝 Nouveaux fichiers

### DTOs

1. **`src/category/dto/create-category.dto.ts`** (mis à jour)
   - Ajout de `parentId`, `level`, `order`

2. **`src/category/dto/create-category-structure.dto.ts`** (nouveau)
   - DTO pour créer une structure complète

### Service

**`src/category/category.service.ts`** - Nouvelles méthodes :

- `create()` : Création avec vérification des doublons et calcul automatique du level
- `findAllHierarchy()` : Récupération en arbre hiérarchique
- `createCategoryStructure()` : Création de structure complète
- `checkDuplicateCategory()` : Vérification des doublons
- `getAllChildrenIds()` : Récupération récursive des enfants
- `remove()` : Suppression en cascade

### Controller

**`src/category/category.controller.ts`** - Nouveaux endpoints :

- `POST /categories/structure` : Créer une structure complète
- `GET /categories/hierarchy` : Récupérer l'arbre hiérarchique
- `GET /categories/check-duplicate` : Vérifier les doublons

---

## 🔄 Calcul automatique du level

Le `level` est calculé automatiquement en fonction du `parentId` :

```typescript
if (parentId) {
  const parent = await this.prisma.category.findUnique({
    where: { id: parentId },
    select: { level: true }
  });
  calculatedLevel = parent.level + 1;
}
```

- Si `parentId = null` → `level = 0` (parent)
- Si parent a `level = 0` → enfant aura `level = 1` (sous-catégorie)
- Si parent a `level = 1` → enfant aura `level = 2` (variation)

---

## 🧪 Tests recommandés

### Test 1 : Créer une structure complète

```bash
curl -X POST http://localhost:3000/categories/structure \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "Vêtements",
    "parentDescription": "Vêtements personnalisables",
    "childName": "T-Shirt",
    "variations": ["Homme", "Femme", "Enfant"]
  }'
```

### Test 2 : Vérifier les doublons

```bash
curl -X GET "http://localhost:3000/categories/check-duplicate?name=T-Shirt&parentId=1"
```

### Test 3 : Récupérer l'arbre hiérarchique

```bash
curl -X GET http://localhost:3000/categories/hierarchy
```

### Test 4 : Créer une variation

```bash
curl -X POST http://localhost:3000/categories \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Unisexe",
    "description": "T-Shirt unisexe",
    "parentId": 2
  }'
```

### Test 5 : Supprimer avec cascade

```bash
curl -X DELETE http://localhost:3000/categories/1
```

---

## 📊 Intégration avec le frontend

Le frontend peut maintenant :

1. **Créer des catégories** avec le même workflow que décrit dans `ha.md`
2. **Éviter les doublons** en vérifiant avant la création
3. **Afficher la hiérarchie** avec `GET /categories/hierarchy`
4. **Créer en masse** avec `POST /categories/structure`

### Exemple d'utilisation frontend

```typescript
// 1. Vérifier si la catégorie existe
const check = await fetch(`/api/categories/check-duplicate?name=iPhone 15&parentId=2`);
const { exists } = await check.json();

if (!exists) {
  // 2. Créer la catégorie
  const response = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'iPhone 15',
      parentId: 2
    })
  });
}

// 3. Récupérer l'arbre hiérarchique pour affichage
const tree = await fetch('/api/categories/hierarchy').then(r => r.json());
```

---

## ✅ Points clés

1. ✅ **Hiérarchie à 3 niveaux** : parent → sous-catégorie → variation
2. ✅ **Vérification des doublons** : contrainte unique `(name, parentId)`
3. ✅ **Suppression en cascade** : `onDelete: Cascade`
4. ✅ **Calcul automatique du level** : basé sur le parent
5. ✅ **Création de structure complète** : endpoint dédié
6. ✅ **Récupération hiérarchique** : arbre complet
7. ✅ **Gestion des erreurs** : messages explicites

---

## 🚀 Prochaines étapes (optionnel)

1. Ajouter des tests unitaires pour les méthodes du service
2. Ajouter des tests e2e pour les endpoints
3. Implémenter la réorganisation des catégories (drag & drop)
4. Ajouter la gestion de l'ordre d'affichage
5. Implémenter la recherche par niveau
6. Ajouter un système de cache pour les catégories
