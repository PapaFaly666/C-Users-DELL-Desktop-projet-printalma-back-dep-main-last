# 🔧 Endpoint Admin - Produits Vendeur Complets

## Vue d'ensemble

Cette endpoint permet aux administrateurs d'afficher **TOUS** les produits des vendeurs avec **TOUTES** les informations détaillées, incluant :
- ✅ Informations complètes du vendeur
- ✅ Détails du produit de base avec catégories, tailles, couleurs
- ✅ Images avec délimitations
- ✅ Designs associés et leurs positions
- ✅ Transformations appliquées
- ✅ Statistiques globales
- ✅ Filtrage et recherche avancés

## Endpoint

```
GET /vendor-product-validation/all-products
```

**Authentification requise** : Admin ou SuperAdmin

## Paramètres de requête

### Pagination
- `page` (optionnel) : Numéro de page (défaut: 1)
- `limit` (optionnel) : Nombre d'éléments par page (défaut: 20)

### Filtres
- `vendorId` (optionnel) : Filtrer par ID du vendeur
- `status` (optionnel) : Filtrer par statut
  - `PENDING` : En attente de validation
  - `PUBLISHED` : Publié
  - `DRAFT` : Brouillon (validé mais non publié)
  - `REJECTED` : Rejeté
- `search` (optionnel) : Recherche dans le nom du produit, description, ou nom du vendeur

### Options d'inclusion
- `includeDesigns` (optionnel) : Inclure les designs (défaut: true)
- `includeImages` (optionnel) : Inclure les images (défaut: true)
- `includePositions` (optionnel) : Inclure les positions (défaut: true)
- `includeTransforms` (optionnel) : Inclure les transformations (défaut: true)

## Exemples d'utilisation

### 1. Récupérer tous les produits (pagination basique)
```bash
GET /vendor-product-validation/all-products?page=1&limit=20
```

### 2. Filtrer par vendeur spécifique
```bash
GET /vendor-product-validation/all-products?vendorId=123
```

### 3. Filtrer par statut
```bash
GET /vendor-product-validation/all-products?status=PENDING
```

### 4. Recherche par nom
```bash
GET /vendor-product-validation/all-products?search=t-shirt
```

### 5. Optimiser les performances (sans designs)
```bash
GET /vendor-product-validation/all-products?includeDesigns=false&includeTransforms=false
```

### 6. Combinaison de filtres
```bash
GET /vendor-product-validation/all-products?vendorId=123&status=PUBLISHED&search=hoodie&page=1&limit=10
```

## Structure de la réponse

```json
{
  "products": [
    {
      "id": 1,
      "name": "T-shirt personnalisé",
      "description": "Description du produit",
      "price": 2500,
      "stock": 100,
      "status": "PUBLISHED",
      "postValidationAction": "AUTO_PUBLISH",
      
      // 🆕 DESIGN APPLICATION (STRUCTURE CRITIQUE POUR UI)
      "designApplication": {
        "hasDesign": true,
        "designUrl": "https://res.cloudinary.com/printalma/image/upload/v1701234567/designs/logo_entreprise_456.png",
        "designCloudinaryPublicId": "designs/logo_entreprise_456",
        "positioning": "CENTER",
        "scale": 0.75,
        "mode": "PRESERVED"
      },
      
      // 🆕 COULEURS SÉLECTIONNÉES (CRITICAL POUR UI)
      "selectedColors": [
        {
          "id": 1,
          "name": "Noir",
          "colorCode": "#000000"
        },
        {
          "id": 2,
          "name": "Blanc",
          "colorCode": "#FFFFFF"
        },
        {
          "id": 3,
          "name": "Rouge",
          "colorCode": "#FF0000"
        }
      ],
      
      // 🆕 POSITIONS ENRICHIES DES DESIGNS
      "designPositions": [
        {
          "vendorProductId": 1,
          "designId": 456,
          "position": {
            "x": 0.48,
            "y": 0.28,
            "scale": 0.75,
            "rotation": 0
          },
          "createdAt": "2023-12-01T10:00:00Z",
          "design": {
            "id": 456,
            "name": "Logo Entreprise XYZ",
            "imageUrl": "https://res.cloudinary.com/printalma/image/upload/v1701234567/designs/logo_entreprise_456.png",
            "cloudinaryPublicId": "designs/logo_entreprise_456",
            "category": "LOGO"
          }
        }
      ],
      
      // 🆕 PRODUIT ADMIN AVEC VARIATIONS COMPLÈTES
      "adminProduct": {
        "id": 10,
        "name": "T-shirt Premium",
        "description": "T-shirt en coton bio premium",
        "price": 2000,
        "stock": 1000,
        "status": "PUBLISHED",
        "categories": [
          {
            "id": 1,
            "name": "Vêtements",
            "description": "Catégorie vêtements"
          }
        ],
        "sizes": [
          {
            "id": 1,
            "sizeName": "S"
          },
          {
            "id": 2,
            "sizeName": "M"
          },
          {
            "id": 3,
            "sizeName": "L"
          }
        ],
        "colorVariations": [
          {
            "id": 1,
            "name": "Noir",
            "colorCode": "#000000",
            "images": [
              {
                "id": 101,
                "view": "Front",
                "url": "https://res.cloudinary.com/printalma/image/upload/v1701234567/products/tshirt_noir_front.jpg",
                "publicId": "products/tshirt_noir_front",
                "naturalWidth": 1200,
                "naturalHeight": 1600,
                "viewType": "Front",
                "delimitations": [
                  {
                    "id": 1,
                    "x": 25.0,
                    "y": 28.0,
                    "width": 50.0,
                    "height": 40.0,
                    "rotation": 0,
                    "name": "Zone poitrine",
                    "coordinateType": "PERCENTAGE"
                  }
                ]
              }
            ]
          },
          {
            "id": 2,
            "name": "Blanc",
            "colorCode": "#FFFFFF",
            "images": [
              {
                "id": 102,
                "view": "Front",
                "url": "https://res.cloudinary.com/printalma/image/upload/v1701234567/products/tshirt_blanc_front.jpg",
                "publicId": "products/tshirt_blanc_front",
                "naturalWidth": 1200,
                "naturalHeight": 1600,
                "viewType": "Front",
                "delimitations": [
                  {
                    "id": 2,
                    "x": 25.0,
                    "y": 28.0,
                    "width": 50.0,
                    "height": 40.0,
                    "rotation": 0,
                    "name": "Zone poitrine",
                    "coordinateType": "PERCENTAGE"
                  }
                ]
              }
            ]
          }
        ],
        "validator": {
          "id": 789,
          "firstName": "Admin",
          "lastName": "Smith",
          "email": "admin@example.com"
        }
      },
      
      // Informations admin originales (LEGACY - gardé pour compatibilité)
      "adminProductName": "T-shirt de base",
      "adminProductDescription": "Description admin",
      "adminProductPrice": 2000,
      
      // Design principal (LEGACY - gardé pour compatibilité)
      "designCloudinaryUrl": "https://res.cloudinary.com/...",
      "designCloudinaryPublicId": "design_123",
      "designPositioning": "CENTER",
      "designScale": 0.6,
      "designApplicationMode": "PRESERVED",
      "designId": 456,
      
      // Sélections vendeur (LEGACY)
      "sizes": ["S", "M", "L", "XL"],
      "colors": ["Rouge", "Bleu", "Vert"],
      
      // Validation
      "isValidated": true,
      "validatedAt": "2023-12-07T10:30:00Z",
      "validatedBy": 789,
      "rejectionReason": null,
      
      // Timestamps
      "createdAt": "2023-12-01T10:00:00Z",
      "updatedAt": "2023-12-07T10:30:00Z",
      
      // Relations enrichies (LEGACY - gardé pour compatibilité)
      "vendor": {
        "id": 123,
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "shop_name": "Boutique John",
        "phone": "+33123456789",
        "country": "France",
        "address": "123 Rue de la Paix",
        "profile_photo_url": "https://res.cloudinary.com/...",
        "vendeur_type": "PROFESSIONNEL",
        "status": true,
        "created_at": "2023-01-01T00:00:00Z",
        "last_login_at": "2023-12-07T09:00:00Z"
      },
      
      "baseProduct": {
        // Structure legacy gardée pour compatibilité
        "id": 10,
        "name": "T-shirt de base",
        "description": "T-shirt en coton bio",
        // ... structure basique
      },
      
      "validator": {
        "id": 789,
        "firstName": "Admin",
        "lastName": "Smith",
        "email": "admin@example.com",
        "role": "ADMIN"
      },
      
      "design": {
        "id": 456,
        "name": "Logo personnalisé",
        "imageUrl": "https://res.cloudinary.com/...",
        "cloudinaryPublicId": "design_456",
        "category": "LOGO",
        "format": "PNG",
        "isValidated": true,
        "validatedAt": "2023-12-05T14:00:00Z"
      },
      
      "images": [
        {
          "id": 1,
          "colorName": "Rouge",
          "colorCode": "#FF0000",
          "imageType": "color",
          "cloudinaryUrl": "https://res.cloudinary.com/...",
          "cloudinaryPublicId": "vendor_image_123",
          "width": 1200,
          "height": 1600,
          "fileSize": 245760,
          "format": "jpg"
        }
      ],
      
      "designTransforms": [
        {
          "id": 1,
          "designUrl": "https://res.cloudinary.com/...",
          "transforms": {
            "scale": 0.8,
            "rotation": 0,
            "position": { "x": 50, "y": 40 }
          },
          "lastModified": "2023-12-01T10:00:00Z",
          "vendor": {
            "id": 123,
            "firstName": "John",
            "lastName": "Doe"
          }
        }
      ],
      
      "designProductLinks": [
        {
          "id": 1,
          "designId": 456,
          "vendorProductId": 1,
          "design": {
            "id": 456,
            "name": "Logo personnalisé",
            "imageUrl": "https://res.cloudinary.com/...",
            "cloudinaryPublicId": "design_456",
            "category": "LOGO",
            "format": "PNG",
            "isValidated": true,
            "validatedAt": "2023-12-05T14:00:00Z"
          }
        }
      ],
      
      // Métadonnées calculées
      "hasDesign": true,
      "hasImages": true,
      "hasPositions": true,
      "hasTransforms": true,
      "totalDesignLinks": 1,
      
      // Statut enrichi
      "statusDisplay": "Publié et validé",
      "canBePublished": false,
      "needsValidation": false
    }
  ],
  
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 95,
    "itemsPerPage": 20
  },
  
  "stats": {
    "totalProducts": 95,
    "pendingProducts": 12,
    "publishedProducts": 68,
    "draftProducts": 10,
    "rejectedProducts": 5,
    "validatedProducts": 78,
    "totalVendors": 25,
    "totalDesigns": 156,
    "totalImages": 340,
    "validationRate": "82.1"
  }
}
```

## 🎯 **Nouvelles Structures - Logique d'Affichage**

### **1. `designApplication` (PRIORITAIRE)**
Cette structure centralise toutes les informations nécessaires pour afficher le design :
- **`designUrl`** : URL directe du design à superposer sur le mockup
- **`hasDesign`** : Indicateur booléen simple pour l'UI
- **`scale`** : Facteur d'échelle (0.1 à 2.0)
- **`positioning`** : Position générale (CENTER, TOP_LEFT, etc.)

**Ordre de priorité pour `designUrl` :**
1. `designApplication.designUrl` (PRIORITAIRE)
2. `design.imageUrl` (FALLBACK)
3. `designPositions[0].design.imageUrl` (FALLBACK)

### **2. `selectedColors` (CRITIQUE pour UI)**
Tableau d'objets avec les couleurs sélectionnées par le vendeur :
```javascript
// Frontend peut directement utiliser cette structure
selectedColors.forEach(color => {
  // color.id, color.name, color.colorCode disponibles
});
```

**Logique de fallback :**
- Si `selectedColors` est vide → utiliser `adminProduct.colorVariations`
- Permet d'afficher toutes les couleurs disponibles même si le vendeur n'a pas fait de sélection

### **3. `designPositions` (POSITIONS PRÉCISES)**
Positions exactes du design avec coordonnées relatives (0-1) :
```javascript
const position = designPositions[0]?.position || { x: 0.5, y: 0.3, scale: 0.8, rotation: 0 };
```

### **4. `adminProduct` (VARIATIONS COMPLÈTES)**
Structure enrichie du produit de base avec :
- **`colorVariations`** : Toutes les couleurs avec images et délimitations
- **`delimitations`** : Zones de placement précises (pourcentages)
- **`viewType`** : Type de vue (Front, Back, etc.)

## 🎨 **Exemples d'Utilisation Frontend**

### **Affichage du Design sur le Mockup**
```javascript
// 1. Récupérer l'URL du design (ordre de priorité)
const designUrl = product.designApplication?.designUrl || 
                  product.design?.imageUrl || 
                  product.designPositions?.[0]?.design?.imageUrl;

// 2. Récupérer la position
const position = product.designPositions?.[0]?.position || {
  x: 0.5, y: 0.3, scale: 0.8, rotation: 0
};

// 3. Appliquer sur le mockup
overlayDesign(designUrl, position, product.designApplication.scale);
```

### **Slider de Couleurs**
```javascript
// Utiliser selectedColors directement
product.selectedColors.forEach(color => {
  createColorButton(color.name, color.colorCode, color.id);
});

// Changer le mockup selon la couleur
const colorImages = product.adminProduct.colorVariations
  .find(cv => cv.id === selectedColorId)?.images;
```

### **Délimitations de Placement**
```javascript
// Afficher les zones de placement
const delimitations = product.adminProduct.colorVariations[0]?.images[0]?.delimitations;
delimitations?.forEach(delim => {
  drawPlacementZone(delim.x, delim.y, delim.width, delim.height);
});
```

## Cas d'usage principaux

### 1. Dashboard administrateur
```javascript
// Récupérer les statistiques globales
const response = await fetch('/vendor-product-validation/all-products?limit=1');
const { stats } = await response.json();
console.log(`Taux de validation : ${stats.validationRate}%`);
```

### 2. Modération des produits
```javascript
// Produits en attente de validation
const pendingProducts = await fetch('/vendor-product-validation/all-products?status=PENDING');
```

### 3. Recherche avancée
```javascript
// Rechercher tous les produits d'un vendeur avec designs
const vendorProducts = await fetch('/vendor-product-validation/all-products?vendorId=123&includeDesigns=true');
```

### 4. Analyse des performances
```javascript
// Produits les plus populaires
const popularProducts = await fetch('/vendor-product-validation/all-products?status=PUBLISHED&limit=100');
```

## Optimisation des performances

### Réduire la charge
```bash
# Pour les listes simples (sans détails)
GET /vendor-product-validation/all-products?includeDesigns=false&includeImages=false&includePositions=false&includeTransforms=false

# Pour les statistiques uniquement
GET /vendor-product-validation/all-products?limit=0
```

### Pagination efficace
```bash
# Petites pages pour une navigation fluide
GET /vendor-product-validation/all-products?page=1&limit=10

# Grandes pages pour l'export
GET /vendor-product-validation/all-products?page=1&limit=100
```

## Codes d'erreur

- `403 Forbidden` : Seuls les administrateurs peuvent accéder
- `400 Bad Request` : Paramètres invalides
- `500 Internal Server Error` : Erreur serveur

## Notes importantes

1. **Permissions** : Cette endpoint est réservée aux administrateurs (ADMIN/SUPERADMIN)
2. **Performance** : Les données complètes peuvent être volumineuses, utilisez les filtres
3. **Pagination** : Recommandé pour les gros volumes de données
4. **Filtrage** : Combinable pour des recherches précises
5. **Optimisation** : Désactivez les inclusions non nécessaires pour améliorer les performances

Cette endpoint est particulièrement utile pour :
- 📊 Tableaux de bord administrateur
- 🔍 Recherche et filtrage avancés
- 📈 Analyses et statistiques
- 🛠️ Modération et validation
- 📋 Export de données
- 🔧 Debugging et support technique