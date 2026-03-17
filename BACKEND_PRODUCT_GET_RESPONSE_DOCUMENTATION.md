# Documentation - Structure des Données GET /products

## 🎯 Vue d'ensemble

Cette documentation détaille **exactement** ce que le backend retourne quand on fait `GET /api/products`.

---

## 📊 Structure de Réponse Complète

### **Format de Base**
L'endpoint retourne un **tableau JSON** avec tous les produits et leurs relations complètes.

```json
[
  {
    "id": 1,
    "name": "T-Shirt Premium Bio",
    "price": 8500,
    "stock": 150,
    "status": "PUBLISHED",
    "description": "Un t-shirt doux et résistant en coton bio, parfait pour l'impression personnalisée",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "categories": [...],
    "sizes": [...],
    "colorVariations": [...]
  }
  // ... autres produits
]
```

---

## 📋 Détail Complet de Chaque Champ

### **🏷️ Informations Produit Principal**

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `id` | `number` | Identifiant unique du produit | `1` |
| `name` | `string` | Nom du produit | `"T-Shirt Premium Bio"` |
| `price` | `number` | Prix en FCFA (nombre décimal) | `8500` |
| `stock` | `number` | Quantité en stock (entier) | `150` |
| `status` | `string` | Statut de publication | `"PUBLISHED"` ou `"DRAFT"` |
| `description` | `string` | Description détaillée | `"Un t-shirt doux et résistant..."` |
| `createdAt` | `string` | Date de création (ISO 8601) | `"2024-01-15T10:30:00.000Z"` |
| `updatedAt` | `string` | Date de modification (ISO 8601) | `"2024-01-15T10:30:00.000Z"` |

### **📂 Categories (Array)**

```json
"categories": [
  {
    "id": 1,
    "name": "T-shirts",
    "description": "Collection de t-shirts pour tous les goûts"
  },
  {
    "id": 2,
    "name": "Coton Bio",
    "description": null
  }
]
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | ID unique de la catégorie |
| `name` | `string` | Nom de la catégorie |
| `description` | `string` \| `null` | Description optionnelle |

### **📏 Sizes (Array)**

```json
"sizes": [
  {
    "id": 1,
    "productId": 1,
    "sizeName": "S"
  },
  {
    "id": 2,
    "productId": 1,
    "sizeName": "M"
  },
  {
    "id": 3,
    "productId": 1,
    "sizeName": "L"
  }
]
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | ID unique de la taille |
| `productId` | `number` | ID du produit associé |
| `sizeName` | `string` | Nom de la taille |

### **🎨 Color Variations (Array)**

```json
"colorVariations": [
  {
    "id": 1,
    "name": "Rouge Vif",
    "colorCode": "#FF0000",
    "productId": 1,
    "images": [...]
  }
]
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | ID unique de la variation |
| `name` | `string` | Nom de la couleur |
| `colorCode` | `string` | Code hexadécimal |
| `productId` | `number` | ID du produit |
| `images` | `array` | Tableau d'images pour cette couleur |

### **🖼️ Images (dans colorVariations)**

```json
"images": [
  {
    "id": 1,
    "view": "Front",
    "url": "https://res.cloudinary.com/printalma/image/upload/v1642253400/products/red_front.jpg",
    "publicId": "products/red_front",
    "colorVariationId": 1,
    "delimitations": [...]
  },
  {
    "id": 2,
    "view": "Back",
    "url": "https://res.cloudinary.com/printalma/image/upload/v1642253401/products/red_back.jpg",
    "publicId": "products/red_back",
    "colorVariationId": 1,
    "delimitations": []
  }
]
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | ID unique de l'image |
| `view` | `string` | Vue de l'image |
| `url` | `string` | URL complète Cloudinary |
| `publicId` | `string` | ID Cloudinary pour manipulations |
| `colorVariationId` | `number` | ID de la couleur associée |
| `delimitations` | `array` | Zones d'impression définies |

**Valeurs possibles pour `view`:**
- `"Front"` - Vue de face
- `"Back"` - Vue de dos
- `"Left"` - Vue de gauche
- `"Right"` - Vue de droite
- `"Top"` - Vue du dessus
- `"Bottom"` - Vue du dessous
- `"Detail"` - Vue détaillée
- Autres valeurs personnalisées

### **📐 Delimitations (dans images)**

```json
"delimitations": [
  {
    "id": 1,
    "x": 150.5,
    "y": 100.0,
    "width": 200.0,
    "height": 250.0,
    "rotation": 0.0,
    "productImageId": 1
  }
]
```

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `number` | ID unique de la délimitation |
| `x` | `number` | Position X en pixels (décimal) |
| `y` | `number` | Position Y en pixels (décimal) |
| `width` | `number` | Largeur en pixels (décimal) |
| `height` | `number` | Hauteur en pixels (décimal) |
| `rotation` | `number` | Rotation en degrés (décimal) |
| `productImageId` | `number` | ID de l'image associée |

---

## 🔍 Exemple Complet de Réponse

```json
[
  {
    "id": 1,
    "name": "T-Shirt Premium Bio",
    "price": 8500,
    "stock": 150,
    "status": "PUBLISHED",
    "description": "Un t-shirt doux et résistant en coton bio, parfait pour l'impression personnalisée",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z",
    "categories": [
      {
        "id": 1,
        "name": "T-shirts",
        "description": "Collection de t-shirts pour tous les goûts"
      },
      {
        "id": 2,
        "name": "Coton Bio",
        "description": null
      }
    ],
    "sizes": [
      {
        "id": 1,
        "productId": 1,
        "sizeName": "S"
      },
      {
        "id": 2,
        "productId": 1,
        "sizeName": "M"
      },
      {
        "id": 3,
        "productId": 1,
        "sizeName": "L"
      }
    ],
    "colorVariations": [
      {
        "id": 1,
        "name": "Rouge Vif",
        "colorCode": "#FF0000",
        "productId": 1,
        "images": [
          {
            "id": 1,
            "view": "Front",
            "url": "https://res.cloudinary.com/printalma/image/upload/v1642253400/products/red_front.jpg",
            "publicId": "products/red_front",
            "colorVariationId": 1,
            "delimitations": [
              {
                "id": 1,
                "x": 150.5,
                "y": 100.0,
                "width": 200.0,
                "height": 250.0,
                "rotation": 0.0,
                "productImageId": 1
              }
            ]
          },
          {
            "id": 2,
            "view": "Back",
            "url": "https://res.cloudinary.com/printalma/image/upload/v1642253401/products/red_back.jpg",
            "publicId": "products/red_back",
            "colorVariationId": 1,
            "delimitations": []
          }
        ]
      },
      {
        "id": 2,
        "name": "Bleu Marine",
        "colorCode": "#000080",
        "productId": 1,
        "images": [
          {
            "id": 3,
            "view": "Front",
            "url": "https://res.cloudinary.com/printalma/image/upload/v1642253402/products/blue_front.jpg",
            "publicId": "products/blue_front",
            "colorVariationId": 2,
            "delimitations": [
              {
                "id": 2,
                "x": 150.5,
                "y": 100.0,
                "width": 200.0,
                "height": 250.0,
                "rotation": 0.0,
                "productImageId": 3
              }
            ]
          }
        ]
      }
    ]
  },
  {
    "id": 2,
    "name": "Hoodie Confort",
    "price": 12000,
    "stock": 75,
    "status": "DRAFT",
    "description": "Hoodie ultra-confortable pour tous les styles",
    "createdAt": "2024-01-16T14:20:00.000Z",
    "updatedAt": "2024-01-16T14:20:00.000Z",
    "categories": [
      {
        "id": 3,
        "name": "Hoodies",
        "description": "Collection de hoodies tendance"
      }
    ],
    "sizes": [
      {
        "id": 4,
        "productId": 2,
        "sizeName": "M"
      },
      {
        "id": 5,
        "productId": 2,
        "sizeName": "L"
      },
      {
        "id": 6,
        "productId": 2,
        "sizeName": "XL"
      }
    ],
    "colorVariations": [
      {
        "id": 3,
        "name": "Noir Mat",
        "colorCode": "#000000",
        "productId": 2,
        "images": [
          {
            "id": 4,
            "view": "Front",
            "url": "https://res.cloudinary.com/printalma/image/upload/v1642253403/products/black_hoodie_front.jpg",
            "publicId": "products/black_hoodie_front",
            "colorVariationId": 3,
            "delimitations": []
          }
        ]
      }
    ]
  }
]
```

---

## 📊 Points Techniques Importants

### **🔢 Types de Données**

- **Nombres entiers:** `id`, `stock`, `productId`, `colorVariationId`, etc.
- **Nombres décimaux:** `price`, `x`, `y`, `width`, `height`, `rotation`
- **Chaînes:** `name`, `description`, `colorCode`, `view`, `url`, etc.
- **Dates:** Format ISO 8601 avec timezone (`"2024-01-15T10:30:00.000Z"`)
- **Énumérations:** `status` (`"PUBLISHED"` | `"DRAFT"`)

### **🔗 Relations**

- Un produit peut avoir **plusieurs catégories** (many-to-many)
- Un produit peut avoir **plusieurs tailles** (one-to-many)
- Un produit peut avoir **plusieurs variations de couleur** (one-to-many)
- Une couleur peut avoir **plusieurs images** (one-to-many)
- Une image peut avoir **plusieurs délimitations** (one-to-many)

### **📦 Tableaux Vides**

- Si un produit n'a pas de tailles: `"sizes": []`
- Si une couleur n'a pas d'images: `"images": []`
- Si une image n'a pas de délimitations: `"delimitations": []`
- Si un produit n'a pas de catégories: `"categories": []`

### **🎯 Valeurs Null**

- `description` d'une catégorie peut être `null`
- Les autres champs sont toujours présents avec une valeur

---

## 🔧 Utilisation pour le Frontend

### **Accès aux Données**

```javascript
// Récupérer tous les produits
const products = await fetch('/api/products').then(r => r.json());

// Accéder aux informations d'un produit
const product = products[0];
console.log(product.name);        // "T-Shirt Premium Bio"
console.log(product.price);       // 8500
console.log(product.status);      // "PUBLISHED"

// Accéder aux catégories
product.categories.forEach(cat => {
  console.log(cat.name);          // "T-shirts", "Coton Bio"
});

// Accéder aux tailles
product.sizes.forEach(size => {
  console.log(size.sizeName);     // "S", "M", "L"
});

// Accéder aux couleurs et images
product.colorVariations.forEach(color => {
  console.log(color.name);        // "Rouge Vif"
  console.log(color.colorCode);   // "#FF0000"
  
  color.images.forEach(image => {
    console.log(image.view);      // "Front", "Back"
    console.log(image.url);       // URL Cloudinary
    
    image.delimitations.forEach(delim => {
      console.log(`Zone: ${delim.width}x${delim.height} à (${delim.x}, ${delim.y})`);
    });
  });
});
```

### **Méthodes Utilitaires**

```javascript
// Vérifier si un produit est publié
function isPublished(product) {
  return product.status === 'PUBLISHED';
}

// Obtenir l'image principale d'un produit
function getMainImage(product) {
  return product.colorVariations?.[0]?.images?.[0]?.url || null;
}

// Obtenir toutes les couleurs disponibles
function getAvailableColors(product) {
  return product.colorVariations.map(cv => ({
    name: cv.name,
    code: cv.colorCode
  }));
}

// Obtenir toutes les tailles disponibles
function getAvailableSizes(product) {
  return product.sizes.map(s => s.sizeName);
}
```

---

## ⚠️ Points d'Attention

1. **Pas de pagination** - Tous les produits sont retournés d'un coup
2. **Relations complètes** - Toutes les données liées sont incluses
3. **Ordre par défaut** - Triés par date de création décroissante
4. **Images Cloudinary** - URLs absolues prêtes à utiliser
5. **Délimitations** - Coordonnées en pixels pour définir les zones d'impression

---

Cette documentation couvre **100%** de la structure des données retournées par `GET /api/products`. Le frontend peut maintenant traiter ces données de façon optimale ! 🎯 