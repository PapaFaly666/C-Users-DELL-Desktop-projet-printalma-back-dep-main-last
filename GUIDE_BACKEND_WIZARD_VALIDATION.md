# 🎯 Guide Backend - Endpoints Validation Produits WIZARD

## ✅ Implémentation Terminée

### 🚀 **Nouveaux Endpoints Disponibles**

#### 1. **GET /admin/pending-products** ⭐ PRIORITÉ HAUTE
```bash
GET http://localhost:3004/admin/pending-products
GET http://localhost:3004/admin/pending-products?productType=WIZARD
GET http://localhost:3004/admin/pending-products?productType=TRADITIONAL
GET http://localhost:3004/admin/pending-products?vendor=john&page=1&limit=10
```

#### 2. **PATCH /admin/validate-product/:id** ⭐ PRIORITÉ HAUTE
```bash
PATCH http://localhost:3004/admin/validate-product/138
Body: { "approved": true }

PATCH http://localhost:3004/admin/validate-product/139
Body: { "approved": false, "rejectionReason": "Images de mauvaise qualité" }
```

#### 3. **PATCH /admin/validate-products-batch** 🔹 PRIORITÉ NORMALE
```bash
PATCH http://localhost:3004/admin/validate-products-batch
Body: {
  "productIds": [138, 139, 140],
  "approved": true
}
```

## 🔧 **Logique d'Implémentation**

### **Détection WIZARD Automatique**
```typescript
// Logique principale selon ha.md
const isWizardProduct = !product.designId || product.designId === null || product.designId === 0;

// Enrichissement des données
const enrichedProduct = {
  ...product,
  isWizardProduct: isWizardProduct,
  productType: isWizardProduct ? 'WIZARD' : 'TRADITIONAL',
  hasDesign: !isWizardProduct,
  adminProductName: product.baseProduct?.name || 'Produit de base'
};
```

### **Controller Principal**
- **Fichier**: `src/vendor-product/admin-wizard-validation.controller.ts`
- **Route base**: `/admin`
- **Sécurité**: Admin/SuperAdmin uniquement
- **Service**: Utilise `VendorProductValidationService` existant

## 📊 **Réponses API Détaillées**

### **GET /admin/pending-products**

#### **Paramètres de Query**
| Paramètre | Type | Optionnel | Description |
|-----------|------|-----------|-------------|
| `page` | number | ✅ | Page (défaut: 1) |
| `limit` | number | ✅ | Limite (défaut: 20) |
| `productType` | enum | ✅ | `WIZARD` \| `TRADITIONAL` \| `ALL` |
| `vendor` | string | ✅ | Filtre par nom vendeur |
| `status` | string | ✅ | Filtre par statut |

#### **Réponse Succès (200)**
```json
{
  "success": true,
  "message": "Produits en attente récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 138,
        "vendorName": "Mon T-shirt Personnalisé",
        "vendorDescription": "T-shirt avec mes propres images",
        "vendorPrice": 12000,
        "status": "PENDING",
        "isValidated": false,
        "designCloudinaryUrl": null,

        // ✅ Nouvelles propriétés WIZARD
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "T-shirt Blanc Classique",

        "baseProduct": {
          "id": 34,
          "name": "T-shirt Blanc Classique"
        },
        "vendor": {
          "id": 7,
          "firstName": "John",
          "lastName": "Vendor",
          "email": "john@vendor.com",
          "shop_name": "Ma Boutique"
        },
        "createdAt": "2024-09-15T10:30:00.000Z",
        "updatedAt": "2024-09-15T10:30:00.000Z"
      },
      {
        "id": 139,
        "vendorName": "Polo Design Africain",
        "vendorDescription": "Polo avec design traditionnel",
        "vendorPrice": 15000,
        "status": "PENDING",
        "isValidated": false,
        "designCloudinaryUrl": "https://res.cloudinary.com/.../design.png",

        // ✅ Produit traditionnel
        "isWizardProduct": false,
        "productType": "TRADITIONAL",
        "hasDesign": true,
        "adminProductName": "Polo",

        "baseProduct": {
          "id": 12,
          "name": "Polo"
        },
        "vendor": {
          "id": 8,
          "firstName": "Jane",
          "lastName": "Designer",
          "email": "jane@designer.com"
        },
        "createdAt": "2024-09-15T11:45:00.000Z",
        "updatedAt": "2024-09-15T11:45:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNext": true,
      "hasPrevious": false
    },
    "stats": {
      "pending": 25,
      "validated": 150,
      "rejected": 8,
      "total": 183,
      // ✅ Nouvelles statistiques
      "wizardProducts": 12,
      "traditionalProducts": 13
    }
  }
}
```

### **PATCH /admin/validate-product/:id**

#### **Paramètres de Route**
| Paramètre | Type | Description |
|-----------|------|-------------|
| `id` | number | ID du produit à valider |

#### **Body de Requête**
```typescript
{
  "approved": boolean,              // Obligatoire
  "rejectionReason"?: string        // Obligatoire si approved = false
}
```

#### **Exemples de Body**
```json
// Approuver
{
  "approved": true
}

// Rejeter
{
  "approved": false,
  "rejectionReason": "Images de mauvaise qualité"
}
```

#### **Réponse Succès (200)**
```json
{
  "success": true,
  "message": "Produit WIZARD validé avec succès",
  "data": {
    "id": 138,
    "vendorName": "Mon T-shirt Personnalisé",
    "vendorPrice": 12000,
    "status": "PUBLISHED",
    "isValidated": true,
    "validatedAt": "2024-09-15T14:30:00.000Z",
    "validatedBy": 1,
    "rejectionReason": null,

    // ✅ Enrichissement type
    "isWizardProduct": true,
    "productType": "WIZARD",
    "hasDesign": false,

    "vendor": {
      "id": 7,
      "firstName": "John",
      "lastName": "Vendor",
      "email": "john@vendor.com"
    }
  }
}
```

### **PATCH /admin/validate-products-batch**

#### **Body de Requête**
```typescript
{
  "productIds": number[],           // Obligatoire, tableau non vide
  "approved": boolean,              // Obligatoire
  "rejectionReason"?: string        // Obligatoire si approved = false
}
```

#### **Exemple de Body**
```json
{
  "productIds": [138, 139, 140],
  "approved": true
}
```

#### **Réponse Succès (200)**
```json
{
  "success": true,
  "message": "3 produits validés avec succès",
  "data": {
    "totalRequested": 3,
    "successCount": 3,
    "errorCount": 0,

    // ✅ Statistiques par type
    "wizardProcessed": 2,
    "traditionalProcessed": 1,

    "errors": [],
    "processedProducts": [138, 139, 140]
  }
}
```

#### **Réponse avec Erreurs Partielles (200)**
```json
{
  "success": true,
  "message": "2 produits validés, 1 erreurs",
  "data": {
    "totalRequested": 3,
    "successCount": 2,
    "errorCount": 1,
    "wizardProcessed": 1,
    "traditionalProcessed": 1,
    "errors": [
      {
        "productId": 140,
        "error": "Produit déjà validé"
      }
    ],
    "processedProducts": [138, 139]
  }
}
```

## 🔒 **Sécurité et Autorisation**

### **Guards Appliqués**
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
```

### **Headers Requis**
```bash
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### **Codes d'Erreur**
| Code | Description | Solutions |
|------|-------------|-----------|
| 401 | Non authentifié | Vérifier le token JWT |
| 403 | Non autorisé | Vérifier le rôle Admin |
| 400 | Données invalides | Vérifier le format du body |
| 404 | Produit non trouvé | Vérifier l'ID du produit |

## 🧪 **Tests avec cURL**

### **1. Récupérer les produits en attente**
```bash
# Tous les produits
curl -X GET "http://localhost:3004/admin/pending-products" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Seulement les produits WIZARD
curl -X GET "http://localhost:3004/admin/pending-products?productType=WIZARD" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Avec pagination et filtre vendeur
curl -X GET "http://localhost:3004/admin/pending-products?vendor=john&page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### **2. Valider un produit individuel**
```bash
# Approuver
curl -X PATCH "http://localhost:3004/admin/validate-product/138" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": true}'

# Rejeter
curl -X PATCH "http://localhost:3004/admin/validate-product/139" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"approved": false, "rejectionReason": "Images de mauvaise qualité"}'
```

### **3. Validation en lot**
```bash
# Approuver plusieurs produits
curl -X PATCH "http://localhost:3004/admin/validate-products-batch" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [138, 139, 140],
    "approved": true
  }'

# Rejeter plusieurs produits
curl -X PATCH "http://localhost:3004/admin/validate-products-batch" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productIds": [141, 142],
    "approved": false,
    "rejectionReason": "Non-conformité aux standards qualité"
  }'
```

## 📝 **Logs de Débogage**

### **Logs Générés**
```bash
# Récupération des produits
🎯 Admin 1 récupère les produits en attente - Type: WIZARD
✅ Produits récupérés: 5 (3 WIZARD, 2 TRADITIONAL)

# Validation individuelle
🎯 Admin 1 valide le produit 138 - Approuvé: true
✅ Produit WIZARD 138 validé
✅ Produit 138 traité avec succès

# Validation en lot
🎯 Admin 1 traite 3 produits en lot - Approuvé: true
✅ Produit 138 traité avec succès
✅ Produit 139 traité avec succès
❌ Erreur produit 140: Produit déjà validé
📊 Résumé lot: 2 succès, 1 erreurs (1 WIZARD, 1 TRADITIONAL)
```

## 🔄 **Intégration avec Frontend**

### **Détection Automatique des Endpoints**
Le frontend détecte automatiquement si ces endpoints sont disponibles :

```typescript
// Détection automatique
const checkEndpointAvailability = async () => {
  try {
    const response = await fetch('/admin/pending-products?limit=1');
    return response.status !== 404;
  } catch {
    return false;
  }
};

// Si disponible → vraies données
// Si non disponible → données mockées
```

### **Bannière de Statut**
```tsx
// Le frontend affiche automatiquement
<div className={endpointsAvailable ? "bg-green-100" : "bg-blue-100"}>
  {endpointsAvailable
    ? "🟢 Connecté aux vrais endpoints backend"
    : "🔵 Mode données mockées - En attente du backend"
  }
</div>
```

## 🎯 **Points de Test**

### **Tests Fonctionnels**
1. **Récupération avec filtres** : `/admin/pending-products?productType=WIZARD`
2. **Validation WIZARD** : Approuver un produit sans design
3. **Validation traditionnel** : Approuver un produit avec design
4. **Validation en lot** : Traiter plusieurs produits simultanément
5. **Gestion d'erreurs** : Produit déjà validé, données invalides

### **Tests de Sécurité**
1. **Sans token** : Retourne 401
2. **Token vendeur** : Retourne 403
3. **Token admin** : Retourne 200
4. **Token expiré** : Retourne 401

### **Tests de Performance**
1. **Pagination** : Grandes listes de produits
2. **Filtres multiples** : Type + vendeur + statut
3. **Lot important** : 50+ produits en une fois

## 🚀 **Points Clés d'Implémentation**

### **✅ Avantages**
- **Distinction automatique** WIZARD vs Traditionnel
- **Réutilisation** des services existants
- **Enrichissement intelligent** des données
- **Gestion robuste** des erreurs
- **Logging détaillé** pour le débogage
- **Compatibilité frontend** immédiate

### **🔧 Architecture**
- **Controller dédié** pour la logique admin WIZARD
- **Service existant** réutilisé pour la validation
- **Enrichissement** au niveau controller
- **Sécurité** par guards et décorateurs
- **Documentation** Swagger automatique

L'interface frontend existante fonctionnera **immédiatement** avec ces endpoints sans aucune modification requise ! 🎉