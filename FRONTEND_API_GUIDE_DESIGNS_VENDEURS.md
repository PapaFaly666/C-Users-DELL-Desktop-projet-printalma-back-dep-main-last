# Guide API Frontend: Gestion des Designs et Produits Vendeurs

Ce guide détaille tous les endpoints disponibles pour la gestion des designs et produits vendeurs avec leurs réponses exactes.

## 🎨 Gestion des Designs

### 1. Créer un Design

**Endpoint:** `POST /api/designs`  
**Authentification:** Requise (Bearer Token)  
**Content-Type:** `multipart/form-data`

**Payload:**
```javascript
const formData = new FormData();
formData.append('file', designFile); // Fichier image (PNG, JPG, JPEG, SVG - max 10MB)
formData.append('name', 'Mon Super Design');
formData.append('description', 'Description optionnelle');
formData.append('price', '25000'); // Prix en FCFA
formData.append('category', 'logo'); // logo|pattern|illustration|typography|abstract
formData.append('tags', 'moderne,entreprise,tech'); // Optionnel, séparés par virgules
```

**Réponse 201 (Succès):**
```json
{
  "success": true,
  "message": "Design créé avec succès",
  "data": {
    "id": 123,
    "vendorId": 45,
    "name": "Mon Super Design",
    "description": "Description optionnelle",
    "price": 25000,
    "category": "logo",
    "imageUrl": "https://res.cloudinary.com/printalma/image/upload/v1234567890/designs/45/design_123.jpg",
    "thumbnailUrl": "https://res.cloudinary.com/printalma/image/upload/v1234567890/designs/45/thumbnails/design_123.jpg",
    "fileSize": 2048576,
    "dimensions": {
      "width": 1920,
      "height": 1080
    },
    "isPublished": false,
    "isPending": false,
    "isDraft": true,
    "isValidated": false,
    "validationStatus": "PENDING",
    "validatedAt": null,
    "validatorName": null,
    "rejectionReason": null,
    "submittedForValidationAt": null,
    "tags": ["moderne", "entreprise", "tech"],
    "usageCount": 0,
    "earnings": 0,
    "views": 0,
    "likes": 0,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "publishedAt": null
  }
}
```

**Erreurs possibles:**
```json
// 400 - Fichier invalide
{
  "statusCode": 400,
  "message": "Format de fichier non supporté. Formats acceptés: JPG, PNG, SVG"
}

// 403 - Pas un vendeur approuvé
{
  "statusCode": 403,
  "message": "User is not an approved vendor."
}
```

### 2. Récupérer Designs par Statut de Validation

**Endpoint:** `GET /api/designs/vendor/by-status`  
**Authentification:** Requise

**Paramètres:**
- `status` (optionnel): `PENDING|VALIDATED|REJECTED|ALL` (défaut: ALL)
- `page` (optionnel): Numéro de page (défaut: 1)
- `limit` (optionnel): Éléments par page (défaut: 10, max: 50)

**Exemples d'appels:**
```javascript
// Tous les designs
GET /api/designs/vendor/by-status?status=ALL&page=1&limit=10

// Designs validés seulement
GET /api/designs/vendor/by-status?status=VALIDATED&page=1&limit=20

// Designs en attente
GET /api/designs/vendor/by-status?status=PENDING
```

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 123,
        "name": "Design Logo 1",
        "imageUrl": "https://res.cloudinary.com/.../design_123.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/.../thumb_123.jpg",
        "validationStatus": "VALIDATED",
        "isValidated": true,
        "validatedAt": "2024-01-16T08:00:00Z",
        "validatorName": "Admin User",
        "rejectionReason": null,
        "price": 25000,
        "usageCount": 3,
        "earnings": 75000,
        "views": 45,
        "likes": 12,
        "createdAt": "2024-01-15T10:30:00Z",
        "updatedAt": "2024-01-16T08:00:00Z"
      },
      {
        "id": 124,
        "name": "Design Logo 2",
        "imageUrl": "https://res.cloudinary.com/.../design_124.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/.../thumb_124.jpg",
        "validationStatus": "REJECTED",
        "isValidated": false,
        "validatedAt": "2024-01-16T09:00:00Z",
        "validatorName": "Admin User",
        "rejectionReason": "Qualité insuffisante pour impression",
        "price": 15000,
        "usageCount": 0,
        "earnings": 0,
        "views": 12,
        "likes": 2,
        "createdAt": "2024-01-15T11:00:00Z",
        "updatedAt": "2024-01-16T09:00:00Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "itemsPerPage": 10
    },
    "stats": {
      "total": 25,
      "published": 15,
      "pending": 5,
      "draft": 0,
      "validated": 15,
      "rejected": 5,
      "totalEarnings": 375000,
      "totalViews": 1250,
      "totalLikes": 89,
      "totalUsage": 45
    }
  }
}
```

### 3. Voir les Produits utilisant un Design

**Endpoint:** `GET /api/designs/:id/products`  
**Authentification:** Requise

**Exemple:**
```javascript
GET /api/designs/123/products
```

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "design": {
      "id": 123,
      "name": "Mon Design Logo",
      "validationStatus": "VALIDATED",
      "usageCount": 3,
      "earnings": 75000
    },
    "vendorProducts": [
      {
        "id": 456,
        "baseProduct": {
          "id": 10,
          "name": "T-shirt Basic",
          "description": "T-shirt en coton"
        },
        "vendor": {
          "id": 45,
          "firstName": "Jean",
          "lastName": "Dupont"
        },
        "price": 25000,
        "status": "PUBLISHED",
        "isValidated": true,
        "createdAt": "2024-01-16T10:00:00Z",
        "designUrl": "https://res.cloudinary.com/.../design_applied.jpg",
        "mockupUrl": "https://res.cloudinary.com/.../mockup.jpg"
      }
    ]
  }
}
```

### 4. Soumettre un Design pour Validation

**Endpoint:** `POST /api/designs/:id/submit-for-validation`  
**Authentification:** Requise

**Exemple:**
```javascript
POST /api/designs/123/submit-for-validation
```

**Réponse 200:**
```json
{
  "success": true,
  "message": "Design soumis pour validation avec succès",
  "data": {
    "id": 123,
    "name": "Mon Design",
    "validationStatus": "PENDING",
    "isPending": true,
    "isDraft": false,
    "submittedForValidationAt": "2024-01-16T15:30:00Z",
    // ... autres propriétés du design
  }
}
```

### 5. Valider/Rejeter un Design (Admin)

**Endpoint:** `PUT /api/designs/:id/validate`  
**Authentification:** Requise (Admin seulement)

**Payload pour validation:**
```json
{
  "action": "VALIDATE"
}
```

**Payload pour rejet:**
```json
{
  "action": "REJECT",
  "rejectionReason": "La résolution est insuffisante pour l'impression"
}
```

**Réponse 200 (Validation):**
```json
{
  "success": true,
  "message": "Design validé avec succès",
  "data": {
    "id": 123,
    "name": "Mon Design",
    "validationStatus": "VALIDATED",
    "isValidated": true,
    "validatedAt": "2024-01-16T16:00:00Z",
    "validatorName": "Admin User",
    "rejectionReason": null,
    "isPublished": true,
    "publishedAt": "2024-01-16T16:00:00Z",
    // ... autres propriétés
  }
}
```

**Réponse 200 (Rejet):**
```json
{
  "success": true,
  "message": "Design rejeté avec succès",
  "data": {
    "id": 123,
    "name": "Mon Design",
    "validationStatus": "REJECTED",
    "isValidated": false,
    "validatedAt": "2024-01-16T16:00:00Z",
    "validatorName": "Admin User",
    "rejectionReason": "La résolution est insuffisante pour l'impression",
    "isPublished": false,
    "publishedAt": null,
    // ... autres propriétés
  }
}
```

**Erreurs:**
```json
// 400 - Action invalide
{
  "statusCode": 400,
  "message": "L'action doit être \"VALIDATE\" ou \"REJECT\""
}

// 400 - Raison de rejet manquante
{
  "statusCode": 400,
  "message": "Une raison de rejet est obligatoire pour rejeter un design"
}

// 400 - Design déjà traité
{
  "statusCode": 400,
  "message": "Ce design a déjà été traité (validé ou rejeté)"
}
```

### 6. Designs en Attente (Admin)

**Endpoint:** `GET /api/designs/admin/pending`  
**Authentification:** Requise (Admin seulement)

**Paramètres:**
- `page`, `limit`, `category`, `search`, `sortBy`, `sortOrder`

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 125,
        "name": "Nouveau Design",
        "vendorId": 45,
        "vendor": {
          "firstName": "Jean",
          "lastName": "Dupont",
          "email": "jean@example.com"
        },
        "validationStatus": "PENDING",
        "submittedForValidationAt": "2024-01-16T14:00:00Z",
        "imageUrl": "https://res.cloudinary.com/.../design_125.jpg",
        "thumbnailUrl": "https://res.cloudinary.com/.../thumb_125.jpg",
        "price": 20000,
        "category": "logo",
        // ... autres propriétés
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 8,
      "itemsPerPage": 20
    },
    "stats": {
      "total": 8,
      "published": 0,
      "pending": 8,
      "draft": 0,
      "totalEarnings": 0,
      "totalViews": 0,
      "totalLikes": 0
    }
  }
}
```

## 🛍️ Gestion des Produits Vendeurs

### 7. Vérifier Validation d'un Design avant Utilisation

**Endpoint:** `GET /api/vendor-publish/check-design/:designId`  
**Authentification:** Requise

**Exemple:**
```javascript
GET /api/vendor-publish/check-design/123
```

**Réponse 200 (Design validé):**
```json
{
  "canUse": true,
  "validationStatus": "VALIDATED",
  "message": "Le design \"Mon Design\" est validé et peut être utilisé pour créer des produits.",
  "rejectionReason": null
}
```

**Réponse 200 (Design rejeté):**
```json
{
  "canUse": false,
  "validationStatus": "REJECTED",
  "message": "Le design \"Mon Design\" a été rejeté et ne peut pas être utilisé.",
  "rejectionReason": "Qualité insuffisante pour impression"
}
```

**Réponse 200 (Design en attente):**
```json
{
  "canUse": false,
  "validationStatus": "PENDING",
  "message": "Le design \"Mon Design\" est en attente de validation admin et ne peut pas encore être utilisé.",
  "rejectionReason": null
}
```

### 8. Créer un Produit Vendeur avec Design

**Endpoint:** `POST /api/vendor-publish`  
**Authentification:** Requise  
**Content-Type:** `application/json`

**Payload (avec design existant validé):**
```json
{
  "baseProductId": 10,
  "designId": 123,
  "vendorPrice": 45000,
  "basePriceAdmin": 25000,
  "vendorName": "T-shirt Custom Logo",
  "vendorDescription": "T-shirt personnalisé avec mon design logo",
  "vendorStock": 100,
  "selectedSizes": [
    { "id": 1, "sizeName": "M" },
    { "id": 2, "sizeName": "L" },
    { "id": 3, "sizeName": "XL" }
  ],
  "selectedColors": [
    { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
    { "id": 2, "name": "Noir", "colorCode": "#000000" }
  ],
  "finalImages": {
    "statistics": {
      "totalImagesGenerated": 2
    },
    "colorImages": {
      "Blanc": {
        "imageKey": "white_123",
        "imageUrl": "blob:...",
        "colorInfo": {
          "id": 1,
          "name": "Blanc",
          "colorCode": "#FFFFFF"
        }
      },
      "Noir": {
        "imageKey": "black_123",
        "imageUrl": "blob:...",
        "colorInfo": {
          "id": 2,
          "name": "Noir",
          "colorCode": "#000000"
        }
      }
    }
  },
  "finalImagesBase64": {
    "design": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "Blanc": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
    "Noir": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

**Réponse 200 (Design validé - Publication automatique):**
```json
{
  "success": true,
  "productId": 789,
  "message": "Produit publié avec succès. Design \"Mon Design\" validé. Produit publié automatiquement.",
  "status": "PUBLISHED",
  "needsValidation": false,
  "imagesProcessed": 2,
  "imageDetails": {
    "totalImages": 2,
    "colorImages": 2,
    "defaultImage": 0,
    "uploadedToCloudinary": 2
  }
}
```

**Réponse 200 (Design en attente - Produit en attente):**
```json
{
  "success": true,
  "productId": 790,
  "message": "Produit créé avec succès. Le design \"Mon Design\" est en attente de validation. Votre produit sera aussi en attente.",
  "status": "PENDING",
  "needsValidation": true,
  "imagesProcessed": 2,
  "imageDetails": {
    "totalImages": 2,
    "colorImages": 2,
    "defaultImage": 0,
    "uploadedToCloudinary": 2
  }
}
```

**Erreur 400 (Design rejeté):**
```json
{
  "error": "Design rejeté",
  "message": "Le design \"Mon Design\" a été rejeté et ne peut pas être utilisé.",
  "rejectionReason": "Qualité insuffisante pour impression",
  "designValidationStatus": "REJECTED"
}
```

**Erreur 403 (Design pas au vendeur):**
```json
{
  "statusCode": 403,
  "message": "Vous n'êtes pas autorisé à utiliser ce design"
}
```

### 9. Récupérer Produits du Vendeur

**Endpoint:** `GET /api/vendor-publish/products`  
**Authentification:** Requise

**Paramètres:**
- `limit` (optionnel): Nombre d'éléments (défaut: 20)
- `offset` (optionnel): Décalage (défaut: 0)
- `status` (optionnel): `PUBLISHED|PENDING|DRAFT|all` (défaut: all)
- `search` (optionnel): Terme de recherche

**Exemple:**
```javascript
GET /api/vendor-publish/products?limit=10&offset=0&status=PUBLISHED&search=logo
```

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 789,
        "vendorId": 45,
        "baseProductId": 10,
        "price": 45000,
        "status": "PUBLISHED",
        "vendorName": "T-shirt Custom Logo",
        "vendorDescription": "T-shirt personnalisé avec mon design logo",
        "vendorStock": 100,
        "basePriceAdmin": 25000,
        "designUrl": "https://res.cloudinary.com/.../design_original.jpg",
        "mockupUrl": "https://res.cloudinary.com/.../mockup.jpg",
        "originalDesignUrl": "https://res.cloudinary.com/.../design_hq.jpg",
        "createdAt": "2024-01-16T10:00:00Z",
        "updatedAt": "2024-01-16T10:00:00Z",
        "baseProduct": {
          "id": 10,
          "name": "T-shirt Basic",
          "price": 25000,
          "status": "PUBLISHED",
          "description": "T-shirt en coton de qualité",
          "categories": [
            { "id": 1, "name": "Vêtements" }
          ]
        },
        "vendor": {
          "id": 45,
          "firstName": "Jean",
          "lastName": "Dupont",
          "email": "jean@example.com",
          "vendeurType": "DESIGNER",
          "fullName": "Jean Dupont"
        },
        "selectedSizes": [
          { "id": 1, "sizeName": "M" },
          { "id": 2, "sizeName": "L" },
          { "id": 3, "sizeName": "XL" }
        ],
        "selectedColors": [
          { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
          { "id": 2, "name": "Noir", "colorCode": "#000000" }
        ],
        "images": {
          "total": 2,
          "colorImages": [
            {
              "id": 101,
              "colorId": 1,
              "colorName": "Blanc",
              "colorCode": "#FFFFFF",
              "cloudinaryUrl": "https://res.cloudinary.com/.../white.jpg",
              "fileSize": 1024576,
              "format": "jpg"
            },
            {
              "id": 102,
              "colorId": 2,
              "colorName": "Noir",
              "colorCode": "#000000",
              "cloudinaryUrl": "https://res.cloudinary.com/.../black.jpg",
              "fileSize": 1156789,
              "format": "jpg"
            }
          ],
          "defaultImages": [],
          "primaryImageUrl": "https://res.cloudinary.com/.../white.jpg",
          "imageUrls": [
            "https://res.cloudinary.com/.../white.jpg",
            "https://res.cloudinary.com/.../black.jpg"
          ]
        }
      }
    ],
    "pagination": {
      "total": 5,
      "limit": 10,
      "offset": 0,
      "page": 1,
      "totalPages": 1,
      "hasNext": false,
      "hasPrev": false
    }
  }
}
```

### 10. Détails d'un Produit Vendeur

**Endpoint:** `GET /api/vendor-publish/products/:id`  
**Authentification:** Requise

**Exemple:**
```javascript
GET /api/vendor-publish/products/789
```

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "id": 789,
    "vendorId": 45,
    "baseProductId": 10,
    "price": 45000,
    "status": "PUBLISHED",
    "vendorName": "T-shirt Custom Logo",
    "vendorDescription": "T-shirt personnalisé avec mon design logo",
    "vendorStock": 100,
    "basePriceAdmin": 25000,
    "designUrl": "https://res.cloudinary.com/.../design_original.jpg",
    "mockupUrl": "https://res.cloudinary.com/.../mockup.jpg",
    "originalDesignUrl": "https://res.cloudinary.com/.../design_hq.jpg",
    "createdAt": "2024-01-16T10:00:00Z",
    "updatedAt": "2024-01-16T10:00:00Z",
    
    "baseProduct": {
      "id": 10,
      "name": "T-shirt Basic",
      "price": 25000,
      "status": "PUBLISHED",
      "description": "T-shirt en coton de qualité",
      "categories": [
        { "id": 1, "name": "Vêtements" }
      ]
    },
    
    "vendor": {
      "id": 45,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "vendeurType": "DESIGNER",
      "fullName": "Jean Dupont",
      "status": true,
      "createdAt": "2023-12-01T10:00:00Z"
    },

    "selectedSizes": [
      { "id": 1, "sizeName": "M" },
      { "id": 2, "sizeName": "L" },
      { "id": 3, "sizeName": "XL" }
    ],

    "selectedColors": [
      { "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" },
      { "id": 2, "name": "Noir", "colorCode": "#000000" }
    ],

    "images": {
      "total": 2,
      "colorImages": [
        {
          "id": 101,
          "vendorProductId": 789,
          "colorId": 1,
          "colorName": "Blanc",
          "colorCode": "#FFFFFF",
          "imageType": "color",
          "cloudinaryUrl": "https://res.cloudinary.com/.../white.jpg",
          "cloudinaryPublicId": "vendor-products/white_789",
          "originalImageKey": "white_123",
          "width": 1920,
          "height": 1080,
          "fileSize": 1024576,
          "format": "jpg",
          "uploadedAt": "2024-01-16T10:05:00Z",
          "createdAt": "2024-01-16T10:05:00Z"
        }
      ],
      "defaultImages": [],
      "primaryImageUrl": "https://res.cloudinary.com/.../white.jpg",
      "imageUrls": [
        "https://res.cloudinary.com/.../white.jpg",
        "https://res.cloudinary.com/.../black.jpg"
      ]
    },

    "metadata": {
      "profitMargin": 20000,
      "profitPercentage": 80.00,
      "totalValue": 4500000,
      "averageImageSize": 1090682,
      "designQuality": "HIGH",
      "lastModified": "2024-01-16T10:00:00Z"
    }
  },
  "retrievedAt": "2024-01-16T17:30:00Z"
}
```

### 11. Statistiques Vendeur

**Endpoint:** `GET /api/vendor-publish/stats`  
**Authentification:** Requise

**Réponse 200:**
```json
{
  "success": true,
  "stats": {
    "totalProducts": 15,
    "publishedProducts": 12,
    "draftProducts": 3,
    "totalImages": 0,
    "totalRevenue": 675000,
    "averagePrice": 45000,
    "totalStock": 0
  },
  "calculatedAt": "2024-01-16T17:30:00Z"
}
```

## 🔧 Codes d'Erreur Fréquents

### Erreurs Design

**400 - Validation échouée:**
```json
{
  "statusCode": 400,
  "message": "Format de fichier non supporté. Formats acceptés: JPG, PNG, SVG"
}
```

**403 - Permissions insuffisantes:**
```json
{
  "statusCode": 403,
  "message": "User is not an approved vendor."
}
```

**404 - Design non trouvé:**
```json
{
  "statusCode": 404,
  "message": "Design non trouvé"
}
```

### Erreurs Produits Vendeur

**400 - Design rejeté:**
```json
{
  "error": "Design rejeté",
  "message": "Le design \"Mon Design\" a été rejeté et ne peut pas être utilisé.",
  "rejectionReason": "Qualité insuffisante pour impression",
  "designValidationStatus": "REJECTED"
}
```

**400 - Données invalides:**
```json
{
  "message": "Données invalides",
  "errors": [
    "Au moins une couleur doit être sélectionnée",
    "Prix vendeur (20000) inférieur au prix minimum (25000)"
  ]
}
```

## 💡 Bonnes Pratiques Frontend

### 1. Gestion des États de Design

```javascript
// Utiliser validationStatus pour l'affichage
const getDesignStatusColor = (status) => {
  switch(status) {
    case 'VALIDATED': return 'green';
    case 'REJECTED': return 'red';
    case 'PENDING': return 'orange';
    default: return 'gray';
  }
};

const getDesignStatusText = (status) => {
  switch(status) {
    case 'VALIDATED': return 'Validé ✅';
    case 'REJECTED': return 'Rejeté ❌';
    case 'PENDING': return 'En attente ⏳';
    default: return 'Inconnu';
  }
};
```

### 2. Vérification avant Création de Produit

```javascript
// Toujours vérifier le design avant de créer un produit
const checkDesignBeforeProductCreation = async (designId) => {
  try {
    const response = await fetch(`/api/vendor-publish/check-design/${designId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const result = await response.json();
    
    if (!result.canUse) {
      alert(`Impossible d'utiliser ce design: ${result.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur vérification design:', error);
    return false;
  }
};
```

### 3. Gestion des Réponses de Création Produit

```javascript
const createVendorProduct = async (productData) => {
  try {
    const response = await fetch('/api/vendor-publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (result.needsValidation) {
        showNotification('info', `Produit créé mais en attente de validation: ${result.message}`);
      } else {
        showNotification('success', `Produit publié avec succès: ${result.message}`);
      }
      
      return result;
    }
  } catch (error) {
    if (error.designValidationStatus === 'REJECTED') {
      showNotification('error', `Design rejeté: ${error.rejectionReason}`);
    } else {
      showNotification('error', 'Erreur lors de la création du produit');
    }
    throw error;
  }
};
```

### 4. Pagination et Filtres

```javascript
// Exemple de composant pour la liste des designs
const DesignsList = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: 'ALL',
    page: 1,
    limit: 10
  });

  const fetchDesigns = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(filters);
      const response = await fetch(`/api/designs/vendor/by-status?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setDesigns(result.data.designs);
        setPagination(result.data.pagination);
      }
    } catch (error) {
      console.error('Erreur récupération designs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, [filters]);

  return (
    <div>
      {/* Interface utilisateur */}
    </div>
  );
};
```

## 🔧 Maintenance et Administration

### 12. Corriger les designId manquants (Admin)

**Endpoint:** `GET /api/vendor-publish/admin/fix-missing-design-ids`  
**Authentification:** Requise (Admin seulement)

**Description:** Crée automatiquement des designs pour tous les produits vendeurs qui n'ont pas de `designId`, permettant ainsi le lien automatique lors de la validation des designs.

**Exemple:**
```javascript
GET /api/vendor-publish/admin/fix-missing-design-ids
```

**Réponse 200:**
```json
{
  "success": true,
  "message": "Correction des designId manquants effectuée avec succès",
  "timestamp": "2024-01-16T18:00:00Z"
}
```

**Erreur 403:**
```json
{
  "statusCode": 403,
  "message": "Accès réservé aux administrateurs"
}
```

### 13. Vérifier un Design (Admin)

**Endpoint:** `GET /api/vendor-publish/admin/check-design/:designId`  
**Authentification:** Requise (Admin seulement)

**Exemple:**
```javascript
GET /api/vendor-publish/admin/check-design/123
```

**Réponse 200:**
```json
{
  "success": true,
  "data": {
    "canUse": true,
    "validationStatus": "VALIDATED",
    "message": "Le design \"Mon Design\" est validé et peut être utilisé pour créer des produits.",
    "rejectionReason": null
  },
  "timestamp": "2024-01-16T18:00:00Z"
}
```

## 🔗 Logique de Liaison Design-Produit

### Fonctionnement Automatique

Désormais, la liaison entre designs et produits vendeurs fonctionne automatiquement :

1. **Création avec designId existant :**
   ```json
   {
     "designId": 123,
     "baseProductId": 10,
     // ... autres données
   }
   ```
   → Le produit sera lié au design 123

2. **Création sans designId :**
   - Un design est créé automatiquement
   - Le produit est lié à ce nouveau design
   - Le design hérite du statut de validation du produit

3. **Validation en cascade :**
   - Quand un design est **VALIDÉ** → tous ses produits vendeurs passent en `PUBLISHED`
   - Quand un design est **REJETÉ** → tous ses produits vendeurs passent en `DRAFT`

### Correction des Données Existantes

Pour corriger les produits existants sans `designId` :

**Option 1 - Via API (Admin) :**
```javascript
GET /api/vendor-publish/admin/fix-missing-design-ids
```

**Option 2 - Via script :**
```bash
node fix-missing-design-ids.js
```

## 🎯 Scénarios d'Usage Complets

### Scénario 1: Nouveau Design → Produit

```javascript
// 1. Créer un design
const designResponse = await fetch('/api/designs', {
  method: 'POST',
  body: formData // avec file, name, price, etc.
});
const design = await designResponse.json();

// 2. Vérifier que le design peut être utilisé
const checkResponse = await fetch(`/api/vendor-publish/check-design/${design.data.id}`);
const checkResult = await checkResponse.json();

if (checkResult.canUse) {
  // 3. Créer le produit avec le design
  const productResponse = await fetch('/api/vendor-publish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      designId: design.data.id,
      baseProductId: 10,
      // ... autres données
    })
  });
}
```

### Scénario 2: Upload Direct → Produit

```javascript
// 1. Créer directement le produit avec images
const productResponse = await fetch('/api/vendor-publish', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    // Pas de designId → design créé automatiquement
    baseProductId: 10,
    finalImagesBase64: {
      design: "data:image/png;base64,iVBORw0KGgo...",
      blanc: "data:image/png;base64,iVBORw0KGgo...",
      noir: "data:image/png;base64,iVBORw0KGgo..."
    },
    // ... autres données
  })
});

const result = await productResponse.json();
// result.needsValidation sera true
// Un design aura été créé automatiquement
```

### Scénario 3: Validation Admin

```javascript
// Admin valide un design
const validationResponse = await fetch(`/api/designs/123/validate`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'VALIDATE'
  })
});

// Automatiquement :
// - Le design 123 passe en VALIDATED
// - Tous les VendorProducts avec designId: 123 passent en PUBLISHED
// - Les vendeurs reçoivent une notification
```

## 🧪 Test et Vérification

### Tester la Liaison Design-Produit

```javascript
// 1. Créer un produit et noter son ID
const product = await createVendorProduct(productData);

// 2. Récupérer les détails du produit
const productDetails = await fetch(`/api/vendor-publish/products/${product.productId}`);
const details = await productDetails.json();

// 3. Vérifier que designId n'est pas null
console.log('DesignId:', details.data.designId); // Ne doit pas être null

// 4. Si designId existe, récupérer le design
if (details.data.designId) {
  const designResponse = await fetch(`/api/designs/vendor/by-status?status=ALL`);
  const designs = await designResponse.json();
  
  const linkedDesign = designs.data.designs.find(d => d.id === details.data.designId);
  console.log('Design lié:', linkedDesign);
}
```

### Vérifier la Validation en Cascade

```javascript
// 1. Trouver un design en PENDING avec des produits liés
const pendingDesigns = await fetch('/api/designs/admin/pending');
const designs = await pendingDesigns.json();

const designToValidate = designs.data.designs[0];

// 2. Vérifier les produits liés avant validation
const productsResponse = await fetch(`/api/designs/${designToValidate.id}/products`);
const productsBefore = await productsResponse.json();

console.log('Produits avant validation:', productsBefore.data.vendorProducts.map(p => ({
  id: p.id,
  status: p.status
})));

// 3. Valider le design
await fetch(`/api/designs/${designToValidate.id}/validate`, {
  method: 'PUT',
  body: JSON.stringify({ action: 'VALIDATE' })
});

// 4. Vérifier les produits après validation
const productsAfter = await fetch(`/api/designs/${designToValidate.id}/products`);
const productsAfterData = await productsAfter.json();

console.log('Produits après validation:', productsAfterData.data.vendorProducts.map(p => ({
  id: p.id,
  status: p.status // Doit être PUBLISHED maintenant
})));
```

Ce guide couvre tous les endpoints et réponses pour la gestion des designs et produits vendeurs selon la nouvelle logique de validation implémentée.

## 🆕 Règles anti-doublon : choisir VS uploader un design

> IMPORTANT : depuis la mise à jour backend de juin 2024, **le serveur créera automatiquement un design** si vous n'envoyez pas `designId` ET que vous fournissez une image base64 dans `finalImagesBase64["design"]`.  
> Pour éviter les doublons, suivez scrupuleusement les deux scénarios ci-dessous.

### 1. Le vendeur sélectionne **un design existant**

1. Récupérez la liste de ses designs (`GET /api/designs/vendor/by-status?...`).
2. L'utilisateur clique sur « Utiliser ce design » ➜ vous stockez son `id` (ex. `42`).
3. Dans l'appel `POST /api/vendor-publish` :
   • Ajoutez le champ `designId: 42`.  
   • **Ne mettez PAS** la clé `"design"` dans `finalImagesBase64`.  
   • Conservez uniquement les mockups couleur (Blanc, Noir, etc.).

```jsonc
{
  "baseProductId": 123,
  "designId": 42,                // 🚩 design existant
  "vendorPrice": 25000,
  "vendorName": "T-shirt Logo",
  "vendorDescription": "…",
  "vendorStock": 30,
  "basePriceAdmin": 20000,
  "selectedSizes": [{ "id": 1, "sizeName": "M" }],
  "selectedColors": [{ "id": 1, "name": "Blanc", "colorCode": "#FFFFFF" }],
  "finalImages": { /* mockups */ },
  "finalImagesBase64": {
    "Blanc": "data:image/png;base64,...",   // mockup couleur
    "Noir":  "data:image/png;base64,..."
  }
}
```

✅ Résultat : le backend réutilise le design 42. **Aucun design `auto_design_….jpg` n'est créé.**

---

### 2. Le vendeur **uploade un nouveau design** pendant la création du produit

1. Ne mettez pas `designId` – laissez ce champ absent ou `null`.
2. Ajoutez la clé `"design"` dans `finalImagesBase64` avec l'image base64 originale.  
3. Le backend créera **un seul** design automatique et l'attachera au produit.

```jsonc
{
  "baseProductId": 123,
  // pas de designId
  "vendorPrice": 25000,
  "vendorName": "T-shirt Dragon",
  "vendorDescription": "…",
  "vendorStock": 30,
  "basePriceAdmin": 20000,
  "selectedSizes": [{ "id": 1, "sizeName": "M" }],
  "selectedColors": [{ "id": 2, "name": "Noir", "colorCode": "#000000" }],
  "finalImages": { /* mockups */ },
  "finalImagesBase64": {
    "design": "data:image/png;base64,...",  // image originale
    "Noir":   "data:image/png;base64,..."   // mockup couleur
  }
}
```

✅ Résultat : un design auto-généré est créé **une seule fois** et réutilisé si le même fichier est ré-uploadé.

---

### Récapitulatif rapide

| Action utilisateur | designId | finalImagesBase64["design"] | Comportement backend |
| ------------------ | -------- | ----------------------------- | -------------------- |
| Choisir design existant | OBLIGATOIRE | 🚫 ABSENT | Réutilise le design – aucun doublon |
| Uploader nouvelle image | non envoyé | ✅ PRÉSENT | Crée UN design auto-généré |

En suivant ces règles, vous ne verrez plus de doublons avec `originalFileName: auto_design_…`. Si vous avez plusieurs images base64 dans `finalImagesBase64`, assurez-vous qu'une seule clé s'appelle `"design"` – les autres clés doivent correspondre aux couleurs de mockups. 