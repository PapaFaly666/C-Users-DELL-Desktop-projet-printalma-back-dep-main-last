# 🚀 CONFIGURATION FRONTEND FINALE - VALIDATION WIZARD

## ✅ Backend confirmé fonctionnel !

L'endpoint `/admin/products/validation` sur le port **3004** retourne parfaitement les données.

## 🔧 Configuration requise dans le frontend

### **1. Proxy Vite.js (vite.config.js)**

```javascript
export default {
  server: {
    port: 5174,
    proxy: {
      '/admin': {
        target: 'http://localhost:3004', // ✅ PORT 3004 confirmé
        changeOrigin: true,
        secure: false
      }
    }
  }
}
```

### **2. Service API (ProductValidationService.ts)**

```typescript
class ProductValidationService {
  async getPendingProducts(params = {}) {
    // ✅ URL correcte sans /api
    const response = await fetch('/admin/products/validation?' + new URLSearchParams(params));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async validateProduct(productId, approved, rejectionReason = null) {
    const response = await fetch(`/admin/products/${productId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}` // ⚠️ Token admin requis
      },
      body: JSON.stringify({
        approved,
        rejectionReason
      })
    });

    return response.json();
  }
}
```

## 📋 Structure des données reçues

### **Produit WIZARD type :**
```json
{
  "id": 150,
  "vendorName": "C63",
  "vendorDescription": "dddddddddddd",
  "status": "PUBLISHED", // ou "PENDING"
  "isValidated": false,
  "isWizardProduct": true,        // ✅ Identifier WIZARD
  "productType": "WIZARD",        // ✅ Type explicite
  "hasDesign": false,             // ✅ Pas de design prédéfini
  "adminProductName": "Polo",     // ✅ Nom du produit de base
  "baseProduct": {
    "id": 34,
    "name": "Polo"
  },
  "vendor": {
    "id": 7,
    "firstName": "Papa ",
    "lastName": "Diagne",
    "shop_name": "C'est carré"
  },
  "vendorImages": [               // ✅ Images du vendeur pour WIZARD
    {
      "id": 416,
      "imageType": "base",        // base | detail | admin_reference
      "cloudinaryUrl": "https://...",
      "colorName": null,
      "colorCode": null
    }
  ]
}
```

## 🎨 Interface utilisateur recommandée

### **1. Badges produit**

```jsx
{product.isWizardProduct ? (
  <Badge variant="warning">
    🎨 WIZARD - {product.adminProductName}
  </Badge>
) : (
  <Badge variant="info">
    📐 TRADITIONNEL - {product.vendorName}
  </Badge>
)}
```

### **2. Affichage des images**

```jsx
// Pour produits WIZARD
{product.isWizardProduct && product.vendorImages?.map(image => (
  <img
    key={image.id}
    src={image.cloudinaryUrl}
    alt={`${image.imageType} - ${image.colorName || 'Base'}`}
    className="product-image"
  />
))}

// Pour produits traditionnels
{!product.isWizardProduct && product.designCloudinaryUrl && (
  <img
    src={product.designCloudinaryUrl}
    alt="Design traditionnel"
    className="product-design"
  />
)}
```

### **3. Statistiques dashboard**

```jsx
const stats = data.stats;

<div className="stats-grid">
  <StatCard
    title="Produits WIZARD"
    value={stats.wizardProducts}
    color="orange"
  />
  <StatCard
    title="Produits traditionnels"
    value={stats.traditionalProducts}
    color="blue"
  />
  <StatCard
    title="En attente"
    value={stats.pending}
    color="yellow"
  />
  <StatCard
    title="Validés"
    value={stats.validated}
    color="green"
  />
</div>
```

## ✅ Actions de validation

### **Valider un produit WIZARD :**

```javascript
const validateWizardProduct = async (productId, approved, reason = null) => {
  try {
    const result = await fetch(`/admin/products/${productId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        approved: approved,
        rejectionReason: approved ? null : reason
      })
    });

    const data = await result.json();

    if (data.success) {
      // Succès - recharger la liste
      await refreshProductList();
      showNotification(`Produit WIZARD ${approved ? 'validé' : 'rejeté'} avec succès`);
    }
  } catch (error) {
    showError('Erreur lors de la validation');
  }
};
```

## 🚨 Points importants

### **1. Authentification requise**
Tous les endpoints admin nécessitent un token JWT avec rôle ADMIN ou SUPERADMIN.

### **2. Gestion des erreurs**
```javascript
if (!response.ok) {
  if (response.status === 401) {
    // Token expiré - rediriger vers login
    redirectToLogin();
  } else if (response.status === 403) {
    // Pas admin
    showError('Accès refusé - Droits admin requis');
  }
}
```

### **3. Types de validation**
- **WIZARD** : Validation des images personnalisées du vendeur
- **TRADITIONNEL** : Validation du design + application sur produit

---

**🎯 Avec cette configuration, le frontend aura accès à toutes les données WIZARD parfaitement structurées !**