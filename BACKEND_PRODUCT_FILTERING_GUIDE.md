# 🎯 Guide Backend - Filtrage Produits Mockup

## 📋 **Contexte et Problème Résolu**

### **Problème Initial**
Dans `/sell-design`, quand un vendeur uploade un design, nous devions afficher uniquement :
- Produits avec `isReadyProduct: false` (mockups)
- ET qui ont des délimitations

### **Solution Implémentée**
✅ **Endpoint de filtrage avancé** : `GET /api/products` avec paramètres de requête

## 🔧 **Structure de la Base de Données**

### **Table `products`**
```sql
CREATE TABLE products (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  price DECIMAL(10,2),
  isReadyProduct BOOLEAN DEFAULT false,  -- ✅ Existe déjà
  status VARCHAR(50),
  isDelete BOOLEAN DEFAULT false,
  -- autres champs...
);
```

### **Table `delimitations`**
```sql
CREATE TABLE delimitations (
  id INT PRIMARY KEY,
  x FLOAT,           -- Position X (0-100%)
  y FLOAT,           -- Position Y (0-100%)
  width FLOAT,       -- Largeur (0-100%)
  height FLOAT,      -- Hauteur (0-100%)
  productImageId INT, -- Référence vers ProductImage
  -- autres champs...
);
```

### **Relations**
- `Product` → `ColorVariation` → `ProductImage` → `Delimitation`
- Un produit peut avoir plusieurs couleurs
- Chaque couleur peut avoir plusieurs images
- Chaque image peut avoir plusieurs délimitations

## 🚀 **API Endpoint Principal**

### **URL**
```
GET /api/products
```

### **Paramètres de Requête**

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `forVendorDesign` | boolean | **PRINCIPAL** - Mockups avec délimitations | `true` |
| `isReadyProduct` | boolean | Produits prêts (true) ou mockups (false) | `false` |
| `hasDelimitations` | boolean | Produits avec délimitations | `true` |
| `status` | string | Statut du produit | `PUBLISHED`, `DRAFT` |
| `category` | string | Catégorie du produit | `tshirt`, `mug` |
| `search` | string | Recherche par nom | `manga`, `anime` |
| `limit` | number | Nombre de produits | `10`, `20` |
| `offset` | number | Offset pour pagination | `0`, `20` |

## 🎯 **Cas d'Usage Principaux**

### **1. Pour `/sell-design` (Frontend)**
```javascript
// Endpoint principal pour le frontend
GET /api/products?forVendorDesign=true

// Équivalent à :
GET /api/products?isReadyProduct=false&hasDelimitations=true
```

### **2. Produits Prêts (Admin)**
```javascript
GET /api/products?isReadyProduct=true
```

### **3. Mockups avec Délimitations**
```javascript
GET /api/products?isReadyProduct=false&hasDelimitations=true
```

### **4. Mockups sans Délimitations**
```javascript
GET /api/products?isReadyProduct=false&hasDelimitations=false
```

## 📊 **Structure de Réponse**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt Manga Collection",
      "price": 25.99,
      "status": "PUBLISHED",
      "isReadyProduct": false,
      "hasDelimitations": true,
      "hasCustomDesigns": false,
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "categories": [
        { "id": 1, "name": "tshirt" }
      ],
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "images": [
            {
              "id": 1,
              "url": "https://res.cloudinary.com/...",
              "view": "Front",
              "delimitations": [
                {
                  "id": 1,
                  "x": 10.5,
                  "y": 20.3,
                  "width": 80.0,
                  "height": 60.0
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "applied": {
      "forVendorDesign": true,
      "limit": 10
    },
    "resultsCount": 10
  }
}
```

## 🔍 **Logique de Filtrage Backend**

### **1. Filtre `forVendorDesign=true`**
```javascript
// Logique équivalente à :
where.isReadyProduct = false;
where.colorVariations = {
  some: {
    images: {
      some: {
        delimitations: {
          some: {} // Au moins une délimitation
        }
      }
    }
  }
};
```

### **2. Filtre `isReadyProduct`**
```javascript
if (filters.isReadyProduct !== undefined) {
  where.isReadyProduct = filters.isReadyProduct;
}
```

### **3. Filtre `hasDelimitations`**
```javascript
if (filters.hasDelimitations === true) {
  where.colorVariations = {
    some: {
      images: {
        some: {
          delimitations: {
            some: {} // Avec délimitations
          }
        }
      }
    }
  };
} else if (filters.hasDelimitations === false) {
  where.colorVariations = {
    some: {
      images: {
        some: {
          delimitations: {
            none: {} // Sans délimitations
          }
        }
      }
    }
  };
}
```

## 🧪 **Tests et Validation**

### **Script de Test**
```bash
node test-product-filtering.js
```

### **Tests Inclus**
1. ✅ Produits mockup avec délimitations
2. ✅ Produits prêts
3. ✅ Produits avec/sans délimitations
4. ✅ Recherche par nom
5. ✅ Filtre par catégorie
6. ✅ Filtre par statut
7. ✅ Combinaison de filtres
8. ✅ Validation des paramètres
9. ✅ Test de performance

## 🔧 **Implémentation Technique**

### **1. Contrôleur (`product.controller.ts`)**
```typescript
@Get()
@ApiOperation({ summary: 'List all products' })
@ApiQuery({ name: 'forVendorDesign', required: false, type: Boolean })
@ApiQuery({ name: 'isReadyProduct', required: false, type: Boolean })
@ApiQuery({ name: 'hasDelimitations', required: false, type: Boolean })
async findAll(
  @Query('forVendorDesign') forVendorDesign?: boolean,
  @Query('isReadyProduct') isReadyProduct?: boolean,
  @Query('hasDelimitations') hasDelimitations?: boolean,
  // ... autres paramètres
) {
  const filters = {
    forVendorDesign,
    isReadyProduct,
    hasDelimitations,
    // ... autres filtres
  };
  
  return this.productService.findAllWithFilters(filters);
}
```

### **2. Service (`product.service.ts`)**
```typescript
async findAllWithFilters(filters: {
  forVendorDesign?: boolean;
  isReadyProduct?: boolean;
  hasDelimitations?: boolean;
  // ... autres filtres
}) {
  const where: any = { isDelete: false };
  
  // Logique de filtrage...
  
  const products = await this.prisma.product.findMany({
    where,
    include: {
      categories: true,
      sizes: true,
      colorVariations: {
        include: {
          images: {
            include: {
              delimitations: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: filters.limit,
    skip: filters.offset,
  });
  
  // Enrichissement des données...
  
  return {
    success: true,
    data: enrichedProducts,
    pagination: { /* ... */ },
    filters: { /* ... */ }
  };
}
```

## 📈 **Performance et Optimisation**

### **Index Recommandés**
```sql
-- Index pour isReadyProduct
CREATE INDEX idx_products_is_ready_product ON products(isReadyProduct);

-- Index pour isDelete
CREATE INDEX idx_products_is_delete ON products(isDelete);

-- Index pour status
CREATE INDEX idx_products_status ON products(status);

-- Index pour les délimitations
CREATE INDEX idx_delimitations_product_image_id ON delimitations(productImageId);
```

### **Optimisations Appliquées**
1. ✅ **Filtrage au niveau base de données** (pas de filtrage côté application)
2. ✅ **Pagination** pour éviter de charger tous les produits
3. ✅ **Index** sur les champs de filtrage
4. ✅ **Logs de debug** pour diagnostiquer les problèmes
5. ✅ **Validation des paramètres** côté serveur

## 🐛 **Debug et Monitoring**

### **Logs de Debug**
```javascript
console.log('🔍 Filtrage backend - Filtres reçus:', filters);
console.log('🔍 Filtrage backend - isReadyProduct:', filters.isReadyProduct);
console.log('🔍 Filtrage backend - Produits trouvés:', products.length);
console.log('🔍 Filtrage backend - Total:', total);
```

### **Diagnostic des Problèmes**
1. **Produits non trouvés** → Vérifier les délimitations en base
2. **Performance lente** → Vérifier les index
3. **Filtres non appliqués** → Vérifier les logs backend
4. **Erreurs 500** → Vérifier la structure de la base

## 🎯 **Utilisation Frontend**

### **Exemple React**
```javascript
const fetchMockupProducts = async () => {
  try {
    const response = await axios.get('/api/products', {
      params: {
        forVendorDesign: true,
        limit: 12,
        status: 'PUBLISHED'
      }
    });
    
    if (response.data.success) {
      setProducts(response.data.data);
      setPagination(response.data.pagination);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### **Exemple Vue.js**
```javascript
const fetchMockupProducts = async () => {
  try {
    const response = await axios.get('/api/products', {
      params: {
        forVendorDesign: true,
        limit: 12
      }
    });
    
    if (response.data.success) {
      products.value = response.data.data;
      pagination.value = response.data.pagination;
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

## ✅ **Validation et Tests**

### **Test Manuel**
```bash
# Test des mockups avec délimitations
curl "http://localhost:5174/api/products?forVendorDesign=true&limit=5"

# Test des produits prêts
curl "http://localhost:5174/api/products?isReadyProduct=true&limit=5"

# Test avec recherche
curl "http://localhost:5174/api/products?forVendorDesign=true&search=tshirt&limit=5"
```

### **Test Automatisé**
```bash
node test-product-filtering.js
```

## 🎉 **Résultat Final**

✅ **Endpoint fonctionnel** : `GET /api/products?forVendorDesign=true`

✅ **Filtrage précis** : Seuls les mockups avec délimitations

✅ **Performance optimisée** : Filtrage au niveau base de données

✅ **Documentation complète** : Guide d'utilisation et tests

✅ **Debug facilité** : Logs détaillés et diagnostics

Le backend est maintenant prêt pour le filtrage des produits mockup avec délimitations ! 🚀 