# Guide de Gestion des Catégories - Documentation Frontend

## 📋 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture Hiérarchique](#architecture-hiérarchique)
3. [Endpoints API](#endpoints-api)
4. [DTOs et Validation](#dtos-et-validation)
5. [Exemples d'Utilisation](#exemples-dutilisation)
6. [Gestion des Erreurs](#gestion-des-erreurs)
7. [Règles Métier](#règles-métier)
8. [Best Practices](#best-practices)

---

## Vue d'ensemble

Le système de gestion des catégories utilise une **hiérarchie à 3 niveaux**:

```
Category (Niveau 0)
  ├── SubCategory (Niveau 1)
  │   └── Variation (Niveau 2)
  └── Products (peuvent être attachés à n'importe quel niveau)
```

### Caractéristiques Principales

- **Hiérarchie stricte**: Variation → SubCategory → Category
- **Suppression protégée**: Impossible de supprimer si des produits sont attachés
- **Slugs automatiques**: Générés automatiquement à partir du nom
- **Réordonnancement**: Chaque niveau a un `displayOrder`
- **Soft delete**: Les variations sont désactivées (pas supprimées)
- **Recherche avancée**: Filtrage, pagination, recherche globale

---

## Architecture Hiérarchique

### Modèle de Données

#### Category (Catégorie Principale)
```typescript
interface Category {
  id: number;
  name: string;              // Unique globalement
  slug: string;              // Généré automatiquement
  description?: string;
  displayOrder: number;      // Pour le tri
  coverImageUrl?: string;
  coverImagePublicId?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  subCategories: SubCategory[];
  directProducts: Product[];
}
```

#### SubCategory (Sous-catégorie)
```typescript
interface SubCategory {
  id: number;
  name: string;              // Unique par catégorie
  slug: string;
  description?: string;
  categoryId: number;        // Référence à la catégorie parente
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  category: Category;
  variations: Variation[];
  products: Product[];
}
```

#### Variation
```typescript
interface Variation {
  id: number;
  name: string;              // Unique par sous-catégorie
  slug: string;
  description?: string;
  subCategoryId: number;     // Référence à la sous-catégorie parente
  displayOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  subCategory: SubCategory;
  products: Product[];
}
```

### Contraintes d'Unicité

| Niveau | Contrainte | Exemple |
|--------|-----------|---------|
| **Category** | `name` unique global | "Vêtements" existe une seule fois |
| **SubCategory** | `name` + `categoryId` unique | "T-Shirts" peut exister dans plusieurs catégories |
| **Variation** | `name` + `subCategoryId` unique | "Col V" peut exister dans plusieurs sous-catégories |

---

## Endpoints API

### 📁 Categories

#### 1. Créer une catégorie
```http
POST /categories
Content-Type: application/json

{
  "name": "Vêtements",
  "description": "Tous les vêtements personnalisables",
  "displayOrder": 0,
  "coverImageUrl": "https://...",
  "coverImagePublicId": "categories/vetements_abc"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 1,
    "name": "Vêtements",
    "slug": "vetements",
    "description": "Tous les vêtements personnalisables",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2025-01-15T10:00:00Z",
    "updatedAt": "2025-01-15T10:00:00Z"
  }
}
```

#### 2. Lister toutes les catégories (avec recherche et pagination)
```http
GET /categories?search=vêt&isActive=true&includeSubCategories=true&limit=10&offset=0
```

**Paramètres de requête:**
- `search` (optionnel): Recherche partielle dans nom/slug/description
- `isActive` (optionnel): Filtrer par statut (true/false)
- `includeSubCategories` (optionnel): Inclure les sous-catégories
- `includeVariations` (optionnel): Inclure les variations
- `limit` (optionnel, défaut: 50): Nombre d'éléments par page
- `offset` (optionnel, défaut: 0): Décalage pour la pagination

**Réponse:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Vêtements",
        "slug": "vetements",
        "description": "...",
        "displayOrder": 0,
        "isActive": true,
        "_count": {
          "subCategories": 3,
          "directProducts": 5
        },
        "subCategories": [...]
      }
    ],
    "pagination": {
      "total": 15,
      "limit": 10,
      "offset": 0,
      "hasMore": true,
      "totalPages": 2,
      "currentPage": 1
    }
  }
}
```

#### 3. Récupérer la hiérarchie complète
```http
GET /categories/hierarchy
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Vêtements",
      "slug": "vetements",
      "subCategories": [
        {
          "id": 1,
          "name": "T-Shirts",
          "slug": "t-shirts",
          "variations": [
            {
              "id": 1,
              "name": "Col V",
              "slug": "col-v"
            }
          ]
        }
      ]
    }
  ]
}
```

#### 4. Récupérer une catégorie par ID
```http
GET /categories/:id
```

#### 5. Mettre à jour une catégorie
```http
PATCH /categories/:id
Content-Type: application/json

{
  "name": "Vêtements Premium",
  "description": "Vêtements de qualité supérieure",
  "displayOrder": 0,
  "coverImageUrl": "https://..."
}
```

> ⚠️ **Important**: La mise à jour d'une catégorie déclenche la régénération des mockups associés.

#### 6. Supprimer une catégorie
```http
DELETE /categories/:id
```

> ⚠️ **Protection**: La suppression est bloquée si des produits ou sous-catégories sont attachés.

#### 7. Vérifier la possibilité de suppression
```http
GET /categories/:id/can-delete
```

**Réponse:**
```json
{
  "canDelete": false,
  "message": "Impossible de supprimer cette catégorie car elle est liée à 5 produit(s) et 3 sous-catégorie(s)",
  "productCount": 5,
  "subCategoryCount": 3,
  "blockers": {
    "products": ["T-Shirt Premium", "Hoodie Classique", "..."],
    "subCategories": ["T-Shirts", "Sweats", "Pantalons"]
  }
}
```

#### 8. Réordonner plusieurs catégories
```http
POST /categories/bulk/reorder
Content-Type: application/json

{
  "items": [
    { "id": 1, "displayOrder": 0 },
    { "id": 2, "displayOrder": 1 },
    { "id": 3, "displayOrder": 2 }
  ]
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "3 catégorie(s) réordonnée(s) avec succès",
  "data": {
    "updatedCount": 3
  }
}
```

#### 9. Activer/Désactiver plusieurs catégories
```http
POST /categories/bulk/toggle-status
Content-Type: application/json

{
  "categoryIds": [1, 2, 3],
  "isActive": false
}
```

#### 10. Recherche globale
```http
GET /categories/search/global?q=t-shirt&limit=20
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "categories": [
      { "id": 1, "name": "T-Shirts", "type": "category", "level": 0 }
    ],
    "subCategories": [
      { "id": 5, "name": "T-Shirts Premium", "type": "subCategory", "level": 1, "category": {...} }
    ],
    "variations": [
      { "id": 10, "name": "T-Shirt Col V", "type": "variation", "level": 2, "subCategory": {...} }
    ],
    "totalResults": 3
  }
}
```

---

### 📁 SubCategories

#### 1. Créer une sous-catégorie
```http
POST /sub-categories
Content-Type: application/json

{
  "name": "T-Shirts",
  "description": "T-shirts pour homme et femme",
  "categoryId": 1,
  "displayOrder": 0
}
```

#### 2. Lister les sous-catégories (avec filtres)
```http
GET /sub-categories?categoryId=1&search=t-shirt&isActive=true&includeVariations=true&limit=10&offset=0
```

#### 3. Récupérer une sous-catégorie par ID
```http
GET /sub-categories/:id
```

#### 4. Mettre à jour une sous-catégorie
```http
PATCH /sub-categories/:id
Content-Type: application/json

{
  "name": "T-Shirts Premium",
  "description": "T-shirts de qualité supérieure",
  "displayOrder": 0,
  "isActive": true
}
```

#### 5. Supprimer une sous-catégorie
```http
DELETE /sub-categories/:id
```

#### 6. Vérifier la possibilité de suppression
```http
GET /sub-categories/:id/can-delete
```

**Réponse:**
```json
{
  "canDelete": false,
  "message": "Impossible de supprimer cette sous-catégorie car elle est liée à 8 produit(s) et 5 variation(s)",
  "productCount": 8,
  "variationCount": 5,
  "blockers": {
    "products": ["T-Shirt Col V", "T-Shirt Col Rond", "..."],
    "variations": ["Col V", "Col Rond", "Manches Longues", "..."]
  }
}
```

#### 7. Réordonner plusieurs sous-catégories
```http
POST /sub-categories/bulk/reorder
Content-Type: application/json

{
  "items": [
    { "id": 5, "displayOrder": 0 },
    { "id": 6, "displayOrder": 1 }
  ]
}
```

> ⚠️ **Contrainte**: Toutes les sous-catégories doivent appartenir à la même catégorie parente.

---

### 📁 Variations

#### 1. Créer une variation
```http
POST /variations
Content-Type: application/json

{
  "name": "Col V",
  "description": "T-shirt avec col en V",
  "subCategoryId": 5,
  "displayOrder": 0
}
```

#### 2. Créer plusieurs variations en lot
```http
POST /categories/variations/batch
Content-Type: application/json

{
  "variations": [
    {
      "name": "Col V",
      "description": "T-shirt avec col en V",
      "parentId": 5
    },
    {
      "name": "Col Rond",
      "description": "T-shirt avec col rond",
      "parentId": 5
    },
    {
      "name": "Manches Longues",
      "parentId": 5
    }
  ]
}
```

#### 3. Lister les variations (avec filtres)
```http
GET /variations?subCategoryId=5&search=col&isActive=true&limit=10&offset=0
```

#### 4. Récupérer une variation par ID
```http
GET /variations/:id
```

#### 5. Mettre à jour une variation
```http
PATCH /variations/:id
Content-Type: application/json

{
  "name": "Col V Premium",
  "description": "Col en V en coton premium",
  "displayOrder": 0,
  "isActive": true
}
```

#### 6. Supprimer/Désactiver une variation
```http
DELETE /variations/:id
```

> 🔄 **Soft Delete**: Les variations ne sont pas supprimées mais désactivées (`isActive = false`).

#### 7. Vérifier la possibilité de suppression
```http
GET /variations/:id/can-delete
```

**Réponse:**
```json
{
  "canDelete": false,
  "message": "Impossible de supprimer cette variation car 12 produit(s) l'utilise(nt)",
  "productCount": 12,
  "blockers": {
    "products": ["T-Shirt Col V Noir", "T-Shirt Col V Blanc", "..."]
  }
}
```

#### 8. Réordonner plusieurs variations
```http
POST /variations/bulk/reorder
Content-Type: application/json

{
  "items": [
    { "id": 10, "displayOrder": 0 },
    { "id": 11, "displayOrder": 1 },
    { "id": 12, "displayOrder": 2 }
  ]
}
```

> ⚠️ **Contrainte**: Toutes les variations doivent appartenir à la même sous-catégorie parente.

---

## DTOs et Validation

### CreateCategoryDto
```typescript
interface CreateCategoryDto {
  name: string;                 // Requis, 2-100 caractères
  description?: string;         // Optionnel, max 500 caractères
  displayOrder?: number;        // Optionnel, >= 0
  coverImageUrl?: string;       // Optionnel, URL valide
  coverImagePublicId?: string;  // Optionnel
}
```

### UpdateCategoryDto
```typescript
interface UpdateCategoryDto {
  name?: string;                // Optionnel, 2-100 caractères
  description?: string;         // Optionnel, max 500 caractères
  displayOrder?: number;        // Optionnel, >= 0
  coverImageUrl?: string;       // Optionnel, URL valide
  coverImagePublicId?: string;  // Optionnel
}
```

### CreateSubCategoryDto
```typescript
interface CreateSubCategoryDto {
  name: string;                 // Requis
  description?: string;         // Optionnel
  categoryId: number;           // Requis, doit exister
  displayOrder?: number;        // Optionnel, >= 0
}
```

### UpdateSubCategoryDto
```typescript
interface UpdateSubCategoryDto {
  name?: string;                // Optionnel, 2-100 caractères
  description?: string;         // Optionnel, max 500 caractères
  displayOrder?: number;        // Optionnel, >= 0
  isActive?: boolean;           // Optionnel
}
```

### CreateVariationDto
```typescript
interface CreateVariationDto {
  name: string;                 // Requis
  description?: string;         // Optionnel
  subCategoryId: number;        // Requis, doit exister
  displayOrder?: number;        // Optionnel, >= 0
}
```

### UpdateVariationDto
```typescript
interface UpdateVariationDto {
  name?: string;                // Optionnel, 2-100 caractères
  description?: string;         // Optionnel, max 500 caractères
  displayOrder?: number;        // Optionnel, >= 0
  isActive?: boolean;           // Optionnel
}
```

### BulkReorderDto
```typescript
interface BulkReorderDto {
  items: Array<{
    id: number;                 // ID de l'élément
    displayOrder: number;       // Nouvel ordre (>= 0)
  }>;
}
```

### QueryCategoryDto
```typescript
interface QueryCategoryDto {
  search?: string;                    // Recherche partielle
  isActive?: boolean;                 // Filtrer par statut
  includeSubCategories?: boolean;     // Inclure les sous-catégories
  includeVariations?: boolean;        // Inclure les variations
  limit?: number;                     // Limite par page (défaut: 50)
  offset?: number;                    // Décalage (défaut: 0)
}
```

---

## Exemples d'Utilisation

### Exemple 1: Créer une hiérarchie complète

```typescript
// 1. Créer une catégorie
const categoryResponse = await fetch('/categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Vêtements',
    description: 'Tous les vêtements personnalisables',
    displayOrder: 0
  })
});
const category = await categoryResponse.json();
// category.data.id = 1

// 2. Créer une sous-catégorie
const subCategoryResponse = await fetch('/sub-categories', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'T-Shirts',
    description: 'T-shirts pour homme et femme',
    categoryId: category.data.id,
    displayOrder: 0
  })
});
const subCategory = await subCategoryResponse.json();
// subCategory.data.id = 5

// 3. Créer plusieurs variations en lot
const variationsResponse = await fetch('/categories/variations/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    variations: [
      { name: 'Col V', parentId: subCategory.data.id },
      { name: 'Col Rond', parentId: subCategory.data.id },
      { name: 'Manches Longues', parentId: subCategory.data.id }
    ]
  })
});
```

### Exemple 2: Vérifier avant de supprimer

```typescript
// Vérifier si une catégorie peut être supprimée
const checkResponse = await fetch('/categories/1/can-delete');
const checkResult = await checkResponse.json();

if (checkResult.canDelete) {
  // Supprimer en toute sécurité
  await fetch('/categories/1', { method: 'DELETE' });
  console.log('Catégorie supprimée avec succès');
} else {
  // Afficher les bloqueurs à l'utilisateur
  console.error(checkResult.message);
  console.log('Produits bloquants:', checkResult.blockers.products);
  console.log('Sous-catégories bloquantes:', checkResult.blockers.subCategories);
}
```

### Exemple 3: Recherche avec pagination

```typescript
const page = 1;
const pageSize = 10;
const searchTerm = 't-shirt';

const response = await fetch(
  `/categories?search=${searchTerm}&includeSubCategories=true&limit=${pageSize}&offset=${(page - 1) * pageSize}`
);
const result = await response.json();

console.log('Résultats:', result.data.items);
console.log('Total:', result.data.pagination.total);
console.log('Page:', result.data.pagination.currentPage);
console.log('Total de pages:', result.data.pagination.totalPages);
console.log('Encore des résultats?', result.data.pagination.hasMore);
```

### Exemple 4: Réordonner avec drag & drop

```typescript
// Après un drag & drop, réordonner les catégories
const newOrder = [
  { id: 3, displayOrder: 0 },
  { id: 1, displayOrder: 1 },
  { id: 2, displayOrder: 2 }
];

const response = await fetch('/categories/bulk/reorder', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ items: newOrder })
});

if (response.ok) {
  console.log('Ordre mis à jour avec succès');
}
```

### Exemple 5: Recherche globale

```typescript
// Rechercher "col v" dans toute la hiérarchie
const response = await fetch('/categories/search/global?q=col%20v&limit=20');
const result = await response.json();

// Afficher les résultats groupés par type
console.log('Catégories trouvées:', result.data.categories);
console.log('Sous-catégories trouvées:', result.data.subCategories);
console.log('Variations trouvées:', result.data.variations);
console.log('Total:', result.data.totalResults);
```

---

## Gestion des Erreurs

### Codes d'Erreur Courants

| Code HTTP | Erreur | Description |
|-----------|--------|-------------|
| **400** | `BAD_REQUEST` | Données invalides |
| **404** | `NOT_FOUND` | Ressource non trouvée |
| **409** | `CONFLICT` | Conflit (nom déjà existant) |
| **422** | `UNPROCESSABLE_ENTITY` | Validation échouée |
| **500** | `INTERNAL_SERVER_ERROR` | Erreur serveur |

### Erreurs Spécifiques

#### 1. Nom déjà existant
```json
{
  "statusCode": 409,
  "message": "Une catégorie avec ce nom existe déjà",
  "error": "Conflict"
}
```

#### 2. Catégorie parente non trouvée
```json
{
  "statusCode": 404,
  "message": "La catégorie avec l'ID 999 n'existe pas",
  "error": "Not Found"
}
```

#### 3. Suppression bloquée
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer cette catégorie car 5 produits l'utilisent",
  "error": "Bad Request"
}
```

#### 4. Validation échouée
```json
{
  "statusCode": 400,
  "message": [
    "Le nom doit contenir au moins 2 caractères",
    "La description ne peut pas dépasser 500 caractères"
  ],
  "error": "Bad Request"
}
```

#### 5. Hiérarchie incohérente
```json
{
  "statusCode": 400,
  "message": "La sous-catégorie 5 n'appartient pas à la catégorie 1",
  "error": "Bad Request"
}
```

### Gestion des Erreurs en Frontend

```typescript
async function createCategory(data: CreateCategoryDto) {
  try {
    const response = await fetch('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();

      // Gérer les erreurs spécifiques
      if (response.status === 409) {
        throw new Error('Ce nom est déjà utilisé. Veuillez en choisir un autre.');
      } else if (response.status === 400) {
        throw new Error(error.message);
      } else {
        throw new Error('Une erreur est survenue. Veuillez réessayer.');
      }
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Erreur lors de la création:', error);
    throw error;
  }
}
```

---

## Règles Métier

### 1. Hiérarchie

- ✅ **AUTORISÉ**: Un produit peut être attaché à n'importe quel niveau (Category, SubCategory, ou Variation)
- ✅ **AUTORISÉ**: Une SubCategory peut exister dans plusieurs Categories (mais avec un nom unique par Category)
- ✅ **AUTORISÉ**: Une Variation peut exister dans plusieurs SubCategories (mais avec un nom unique par SubCategory)
- ❌ **INTERDIT**: Une Variation sans SubCategory parente
- ❌ **INTERDIT**: Une SubCategory sans Category parente

### 2. Suppression

- ✅ **AUTORISÉ**: Supprimer une Category/SubCategory/Variation si aucun produit n'est attaché
- ❌ **INTERDIT**: Supprimer une Category si des SubCategories existent
- ❌ **INTERDIT**: Supprimer une SubCategory si des Variations existent
- ❌ **INTERDIT**: Supprimer une Category/SubCategory/Variation si des produits sont attachés
- ℹ️ **SOFT DELETE**: Les Variations sont désactivées au lieu d'être supprimées

### 3. Nommage et Slugs

- **Slugs automatiques**: Générés à partir du nom (accentuation normalisée, minuscules, caractères spéciaux supprimés)
- **Unicité des slugs**: Si un slug existe déjà, un suffixe numérique est ajouté (ex: `vetements-1`, `vetements-2`)
- **Noms uniques**:
  - Category: unique globalement
  - SubCategory: unique par Category
  - Variation: unique par SubCategory

### 4. Ordre d'Affichage

- **displayOrder** est utilisé pour trier les éléments
- Si non spécifié lors de la création, il est calculé automatiquement (max + 1)
- Le tri final est: `displayOrder ASC, name ASC`

### 5. Régénération des Mockups

Lorsqu'une Category/SubCategory/Variation est mise à jour:
- Les mockups associés sont automatiquement marqués pour régénération
- La régénération se fait de manière asynchrone
- Les produits liés à tous les niveaux enfants sont également affectés

---

## Best Practices

### 1. Vérifier avant de supprimer

Toujours vérifier avec `/can-delete` avant d'afficher un bouton de suppression:

```typescript
async function canDelete(type: 'category' | 'subCategory' | 'variation', id: number): Promise<boolean> {
  const endpoints = {
    category: `/categories/${id}/can-delete`,
    subCategory: `/sub-categories/${id}/can-delete`,
    variation: `/variations/${id}/can-delete`
  };

  const response = await fetch(endpoints[type]);
  const result = await response.json();

  return result.canDelete;
}

// Usage dans un composant
const showDeleteButton = await canDelete('category', categoryId);
```

### 2. Utiliser la recherche globale pour l'autocomplete

```typescript
// Composant de recherche avec autocomplete
async function searchAll(query: string) {
  if (query.length < 2) return [];

  const response = await fetch(`/categories/search/global?q=${encodeURIComponent(query)}&limit=10`);
  const result = await response.json();

  // Combiner tous les résultats avec des labels
  return [
    ...result.data.categories.map(c => ({ ...c, label: `📁 ${c.name}` })),
    ...result.data.subCategories.map(sc => ({ ...sc, label: `📂 ${sc.name} (${sc.category.name})` })),
    ...result.data.variations.map(v => ({ ...v, label: `🏷️ ${v.name} (${v.subCategory.name})` }))
  ];
}
```

### 3. Utiliser la pagination pour les grandes listes

```typescript
// Composant de liste paginée
function usePaginatedCategories(pageSize: number = 10) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function fetchData() {
      const offset = (page - 1) * pageSize;
      const response = await fetch(`/categories?limit=${pageSize}&offset=${offset}`);
      const result = await response.json();
      setData(result.data);
    }
    fetchData();
  }, [page, pageSize]);

  return {
    items: data?.items || [],
    pagination: data?.pagination,
    goToPage: setPage
  };
}
```

### 4. Optimiser les requêtes avec les includes

```typescript
// Éviter les requêtes multiples en incluant les relations nécessaires
async function getCategoryWithDetails(id: number) {
  // ❌ MAUVAIS: 3 requêtes
  const category = await fetch(`/categories/${id}`);
  const subCategories = await fetch(`/sub-categories?categoryId=${id}`);
  const products = await fetch(`/products?categoryId=${id}`);

  // ✅ BON: 1 seule requête
  const category = await fetch(`/categories/${id}?includeSubCategories=true&includeVariations=true`);
}
```

### 5. Gérer les opérations en lot pour de meilleures performances

```typescript
// ❌ MAUVAIS: Mettre à jour une par une
for (const item of reorderedItems) {
  await fetch(`/categories/${item.id}`, {
    method: 'PATCH',
    body: JSON.stringify({ displayOrder: item.displayOrder })
  });
}

// ✅ BON: Utiliser l'endpoint bulk
await fetch('/categories/bulk/reorder', {
  method: 'POST',
  body: JSON.stringify({ items: reorderedItems })
});
```

### 6. Implémenter un cache côté client

```typescript
// Utiliser un cache pour éviter les requêtes répétées
const categoryCache = new Map<number, Category>();

async function getCategoryById(id: number): Promise<Category> {
  if (categoryCache.has(id)) {
    return categoryCache.get(id);
  }

  const response = await fetch(`/categories/${id}`);
  const result = await response.json();
  const category = result.data;

  categoryCache.set(id, category);
  return category;
}

// Invalider le cache lors des mises à jour
async function updateCategory(id: number, data: UpdateCategoryDto) {
  await fetch(`/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data)
  });

  categoryCache.delete(id); // Invalider l'entrée du cache
}
```

### 7. Afficher les breadcrumbs de la hiérarchie

```typescript
// Afficher le chemin complet: Vêtements > T-Shirts > Col V
async function getHierarchyPath(type: string, id: number): Promise<string[]> {
  let path: string[] = [];

  if (type === 'variation') {
    const variation = await fetch(`/variations/${id}`).then(r => r.json());
    path.unshift(variation.data.name);

    const subCategory = await fetch(`/sub-categories/${variation.data.subCategoryId}`).then(r => r.json());
    path.unshift(subCategory.data.name);

    const category = await fetch(`/categories/${subCategory.data.categoryId}`).then(r => r.json());
    path.unshift(category.data.name);
  }
  // ... gérer les autres types

  return path;
}

// Usage
const path = await getHierarchyPath('variation', 10);
console.log(path.join(' > ')); // "Vêtements > T-Shirts > Col V"
```

### 8. Valider côté client avant d'envoyer

```typescript
function validateCategoryData(data: CreateCategoryDto): string[] {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }

  if (data.name && data.name.length > 100) {
    errors.push('Le nom ne peut pas dépasser 100 caractères');
  }

  if (data.description && data.description.length > 500) {
    errors.push('La description ne peut pas dépasser 500 caractères');
  }

  if (data.displayOrder !== undefined && data.displayOrder < 0) {
    errors.push('L\'ordre d\'affichage doit être supérieur ou égal à 0');
  }

  return errors;
}
```

---

## Support et Questions

Pour toute question ou problème, veuillez consulter:
- Le code source dans `/src/category`, `/src/sub-category`, `/src/variation`
- Les tests unitaires (si disponibles)
- L'équipe backend

---

**Dernière mise à jour**: 2025-01-22
**Version de l'API**: 1.0.0
