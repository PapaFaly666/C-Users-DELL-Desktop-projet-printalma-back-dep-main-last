# 🔍 GUIDE DEBUG — Erreur 403 Position Design

> **Erreur :** `PUT /api/vendor-products/2/designs/1/position/direct 403 (Forbidden)`  
> **Message :** "Ce produit ne vous appartient pas"  
> **Cause :** Problème de permissions entre vendeur, produit et design

---

## 🚨 DIAGNOSTIC IMMÉDIAT

### 1. Endpoint de debug
Appelez cet endpoint pour diagnostiquer le problème :

```js
// Remplacez par vos vrais IDs
const productId = 2;
const designId = 1;

const debugResponse = await api.get(
  `/api/vendor-products/${productId}/designs/${designId}/position/debug`
);

console.log('🔍 DEBUG INFO:', debugResponse.data.debug);
```

### 2. Vérifications essentielles

#### A. Vérifier l'ID du produit
```js
// Est-ce que c'est le bon ID de VendorProduct ?
const vendorProducts = await api.get('/api/vendor-products');
console.log('📦 Mes produits:', vendorProducts.data);

// Chercher le produit avec l'ID utilisé
const targetProduct = vendorProducts.data.find(p => p.id === productId);
console.log('🎯 Produit ciblé:', targetProduct);
```

#### B. Vérifier l'ID du design
```js
// Est-ce que c'est le bon ID de Design ?
const designs = await api.get('/api/designs/my-designs');
console.log('🎨 Mes designs:', designs.data);

// Chercher le design avec l'ID utilisé
const targetDesign = designs.data.find(d => d.id === designId);
console.log('🎯 Design ciblé:', targetDesign);
```

---

## 🔧 SOLUTIONS COMMUNES

### Solution 1 : Mauvais ID de produit

**Problème :** Vous utilisez l'ID du produit admin au lieu de l'ID du VendorProduct

```js
// ❌ INCORRECT - ID du produit admin
const adminProductId = 2;
await api.put(`/api/vendor-products/${adminProductId}/designs/${designId}/position/direct`, position);

// ✅ CORRECT - ID du VendorProduct
const vendorProducts = await api.get('/api/vendor-products');
const myProduct = vendorProducts.data.find(p => p.baseProductId === adminProductId);
const vendorProductId = myProduct.id;

await api.put(`/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`, position);
```

### Solution 2 : Design non accessible

**Problème :** Le design n'appartient pas au vendeur et n'est pas public

```js
// Vérifier l'accès au design
const debugInfo = await api.get(`/api/vendor-products/${productId}/designs/${designId}/position/debug`);

if (!debugInfo.data.debug.designBelongsToVendor) {
  console.log('⚠️ Design non accessible');
  
  // Option A: Utiliser un design du vendeur
  const myDesigns = debugInfo.data.debug.allDesigns;
  const alternativeDesign = myDesigns[0];
  
  // Option B: Créer/uploader le design d'abord
  const newDesign = await api.post('/api/designs', {
    name: 'Mon Design',
    imageUrl: 'https://res.cloudinary.com/...',
    category: 'LOGO'
  });
}
```

### Solution 3 : Problème de contexte utilisateur

**Problème :** Token JWT invalide ou utilisateur non connecté

```js
// Vérifier le token
const userInfo = await api.get('/api/auth/me');
console.log('👤 Utilisateur connecté:', userInfo.data);

// Vérifier le rôle
if (userInfo.data.role !== 'VENDOR') {
  console.error('❌ Utilisateur non vendeur');
  // Rediriger vers la page de connexion vendeur
}
```

---

## 🛠️ UTILITAIRE DE DIAGNOSTIC

```js
// utils/positionDebugger.js
export class PositionDebugger {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async diagnosePermissionError(productId, designId) {
    console.log('🔍 Diagnostic des permissions...');
    
    try {
      // 1. Vérifier l'utilisateur connecté
      const user = await this.api.get('/api/auth/me');
      console.log('👤 Utilisateur:', user.data);
      
      // 2. Vérifier les produits du vendeur
      const vendorProducts = await this.api.get('/api/vendor-products');
      console.log('📦 Produits vendeur:', vendorProducts.data);
      
      // 3. Vérifier les designs du vendeur
      const designs = await this.api.get('/api/designs/my-designs');
      console.log('🎨 Designs vendeur:', designs.data);
      
      // 4. Debug spécifique
      const debugInfo = await this.api.get(
        `/api/vendor-products/${productId}/designs/${designId}/position/debug`
      );
      console.log('🔍 Debug spécifique:', debugInfo.data.debug);
      
      // 5. Générer des recommandations
      const recommendations = this.generateRecommendations(
        productId, 
        designId, 
        debugInfo.data.debug,
        vendorProducts.data,
        designs.data
      );
      
      console.log('💡 Recommandations:', recommendations);
      return recommendations;
      
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      return {
        error: true,
        message: error.response?.data?.message || error.message,
        suggestions: [
          'Vérifiez votre connexion',
          'Vérifiez que vous êtes connecté en tant que vendeur',
          'Vérifiez que le serveur backend est démarré'
        ]
      };
    }
  }

  generateRecommendations(productId, designId, debugInfo, vendorProducts, designs) {
    const recommendations = [];
    
    // Problème de produit
    if (!debugInfo.productBelongsToVendor) {
      if (!debugInfo.product) {
        recommendations.push({
          type: 'product_not_found',
          message: `Produit ${productId} introuvable`,
          solution: `Utilisez un ID de produit valide parmi : ${vendorProducts.map(p => p.id).join(', ')}`
        });
      } else {
        recommendations.push({
          type: 'product_wrong_vendor',
          message: `Produit ${productId} appartient au vendeur ${debugInfo.product.vendorId}`,
          solution: `Utilisez un produit qui vous appartient`
        });
      }
    }
    
    // Problème de design
    if (!debugInfo.designBelongsToVendor) {
      if (!debugInfo.design) {
        recommendations.push({
          type: 'design_not_found',
          message: `Design ${designId} introuvable`,
          solution: `Utilisez un ID de design valide parmi : ${designs.map(d => d.id).join(', ')}`
        });
      } else {
        recommendations.push({
          type: 'design_wrong_vendor',
          message: `Design ${designId} appartient au vendeur ${debugInfo.design.vendorId}`,
          solution: `Utilisez un design qui vous appartient ou créez-en un nouveau`
        });
      }
    }
    
    // Solutions automatiques
    if (vendorProducts.length > 0 && designs.length > 0) {
      recommendations.push({
        type: 'auto_fix',
        message: 'Correction automatique possible',
        solution: {
          correctProductId: vendorProducts[0].id,
          correctDesignId: designs[0].id
        }
      });
    }
    
    return recommendations;
  }

  async autoFix(productId, designId) {
    console.log('🔧 Tentative de correction automatique...');
    
    try {
      const diagnosis = await this.diagnosePermissionError(productId, designId);
      const autoFix = diagnosis.find(r => r.type === 'auto_fix');
      
      if (autoFix) {
        console.log('✅ Correction automatique trouvée:', autoFix.solution);
        return autoFix.solution;
      } else {
        console.log('❌ Impossible de corriger automatiquement');
        return null;
      }
    } catch (error) {
      console.error('❌ Erreur lors de la correction automatique:', error);
      return null;
    }
  }
}
```

---

## 🎯 UTILISATION PRATIQUE

### Dans votre composant React

```js
// components/DesignConfigurator.jsx
import { PositionDebugger } from '../utils/positionDebugger';

function DesignConfigurator({ productId, designId }) {
  const [debugger] = useState(new PositionDebugger(api));
  
  const handleSavePosition = async (position) => {
    try {
      await api.put(
        `/api/vendor-products/${productId}/designs/${designId}/position/direct`,
        position
      );
      console.log('✅ Position sauvegardée');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('🔍 Erreur 403 détectée, diagnostic en cours...');
        
        // Diagnostic automatique
        const recommendations = await debugger.diagnosePermissionError(productId, designId);
        console.log('💡 Recommandations:', recommendations);
        
        // Tentative de correction automatique
        const autoFix = await debugger.autoFix(productId, designId);
        if (autoFix) {
          console.log('🔧 Correction automatique appliquée');
          // Retry avec les bons IDs
          await api.put(
            `/api/vendor-products/${autoFix.correctProductId}/designs/${autoFix.correctDesignId}/position/direct`,
            position
          );
        } else {
          // Afficher les recommandations à l'utilisateur
          showErrorWithRecommendations(recommendations);
        }
      } else {
        console.error('❌ Autre erreur:', error);
      }
    }
  };
  
  return (
    <div>
      {/* Votre UI */}
      <button onClick={() => handleSavePosition({ x: 100, y: 100 })}>
        Sauvegarder Position
      </button>
    </div>
  );
}
```

### Test rapide en console

```js
// Console du navigateur
const debugger = new PositionDebugger(api);

// Diagnostiquer le problème
await debugger.diagnosePermissionError(2, 1);

// Tentative de correction automatique
const fix = await debugger.autoFix(2, 1);
console.log('Correction:', fix);
```

---

## 📞 SUPPORT RAPIDE

### Commandes de diagnostic

```bash
# 1. Vérifier les logs du serveur
# Chercher les logs avec "💾 savePositionByDesignId" et "❌"

# 2. Tester l'endpoint debug
curl -X GET "http://localhost:3004/api/vendor-products/2/designs/1/position/debug" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Lister les produits du vendeur
curl -X GET "http://localhost:3004/api/vendor-products" \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Lister les designs du vendeur
curl -X GET "http://localhost:3004/api/designs/my-designs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Résolution en 3 étapes

1. **Identifier le problème** : Utilisez l'endpoint debug
2. **Corriger les IDs** : Utilisez les bons IDs de VendorProduct et Design
3. **Tester** : Réessayez la sauvegarde de position

---

## 🎉 RÉSOLUTION GARANTIE

Avec ces outils, vous devriez pouvoir :
- ✅ Identifier la cause exacte de l'erreur 403
- ✅ Obtenir les bons IDs à utiliser
- ✅ Corriger automatiquement les problèmes courants
- ✅ Sauvegarder les positions avec succès

**Le problème sera résolu en quelques minutes !** 🚀 
 
 
 
 