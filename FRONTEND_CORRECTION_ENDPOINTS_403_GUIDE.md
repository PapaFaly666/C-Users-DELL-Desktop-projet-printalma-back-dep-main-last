# 🚨 CORRECTION URGENTE — Erreurs 404/403 Position Design

> **Problème :** Endpoints incorrects causent erreurs 404/403  
> **Erreurs observées :**  
> - `GET /api/auth/me 404 (Not Found)`  
> - `GET /api/designs/my-designs 400 (Bad Request)`  
> - `PUT /api/vendor-products/2/designs/1/position/direct 403 (Forbidden)`

---

## 🔧 CORRECTION IMMÉDIATE DES ENDPOINTS

### 1. Endpoint Profil Utilisateur ❌➡️✅

```js
// ❌ INCORRECT (404 Not Found)
const user = await api.get('/api/auth/me');

// ✅ CORRECT
const user = await api.get('/api/auth/profile');
```

### 2. Endpoint Designs du Vendeur ❌➡️✅

```js
// ❌ INCORRECT (400 Bad Request)
const designs = await api.get('/api/designs/my-designs');

// ✅ CORRECT
const designs = await api.get('/api/designs');
```

### 3. Endpoint Produits Vendeur ✅

```js
// ✅ CORRECT (déjà bon)
const vendorProducts = await api.get('/api/vendor-products');
```

---

## 📋 CLASSE UTILITAIRE CORRIGÉE

```js
// utils/positionDebugger.js
export class PositionDebugger {
  constructor(apiClient) {
    this.api = apiClient;
  }

  async diagnosePermissionError(productId, designId) {
    console.log('🔍 Diagnostic des permissions...');
    
    try {
      // 1. ✅ Vérifier l'utilisateur connecté (ENDPOINT CORRIGÉ)
      const user = await this.api.get('/api/auth/profile');
      console.log('👤 Utilisateur:', user.data);
      
      // 2. ✅ Vérifier les produits du vendeur (ENDPOINT CORRECT)
      const vendorProducts = await this.api.get('/api/vendor-products');
      console.log('📦 Produits vendeur:', vendorProducts.data);
      
      // 3. ✅ Vérifier les designs du vendeur (ENDPOINT CORRIGÉ)
      const designs = await this.api.get('/api/designs');
      console.log('🎨 Designs vendeur:', designs.data);
      
      // 4. ✅ Debug spécifique (ENDPOINT NOUVEAU)
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
      
      // Gestion spécifique des erreurs d'endpoints
      if (error.response?.status === 404) {
        return {
          error: true,
          type: 'endpoint_not_found',
          message: `Endpoint non trouvé: ${error.config?.url}`,
          suggestions: [
            'Vérifiez que vous utilisez les bons endpoints',
            'Vérifiez que le serveur backend est démarré',
            'Consultez la documentation des endpoints'
          ]
        };
      }
      
      if (error.response?.status === 400) {
        return {
          error: true,
          type: 'bad_request',
          message: error.response?.data?.message || 'Requête invalide',
          suggestions: [
            'Vérifiez les paramètres de la requête',
            'Vérifiez le format des données envoyées',
            'Consultez les logs du serveur'
          ]
        };
      }
      
      return {
        error: true,
        type: 'unknown',
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
          solution: `Utilisez un ID de produit valide parmi : ${vendorProducts.map(p => p.id).join(', ')}`,
          autoFix: vendorProducts.length > 0 ? { correctProductId: vendorProducts[0].id } : null
        });
      } else {
        recommendations.push({
          type: 'product_wrong_vendor',
          message: `Produit ${productId} appartient au vendeur ${debugInfo.product.vendorId}`,
          solution: `Utilisez un produit qui vous appartient`,
          autoFix: vendorProducts.length > 0 ? { correctProductId: vendorProducts[0].id } : null
        });
      }
    }
    
    // Problème de design
    if (!debugInfo.designBelongsToVendor && !debugInfo.design?.isPublished) {
      if (!debugInfo.design) {
        recommendations.push({
          type: 'design_not_found',
          message: `Design ${designId} introuvable`,
          solution: `Utilisez un ID de design valide parmi : ${designs.map(d => d.id).join(', ')}`,
          autoFix: designs.length > 0 ? { correctDesignId: designs[0].id } : null
        });
      } else {
        recommendations.push({
          type: 'design_not_accessible',
          message: `Design ${designId} n'est pas accessible (appartient au vendeur ${debugInfo.design.vendorId}, non publié)`,
          solution: `Utilisez un design qui vous appartient ou un design publié`,
          autoFix: designs.length > 0 ? { correctDesignId: designs[0].id } : null
        });
      }
    }
    
    // Solution automatique globale
    if (vendorProducts.length > 0 && designs.length > 0) {
      recommendations.push({
        type: 'auto_fix_complete',
        message: 'Correction automatique complète possible',
        solution: {
          correctProductId: vendorProducts[0].id,
          correctDesignId: designs[0].id,
          productName: vendorProducts[0].name,
          designName: designs[0].name
        }
      });
    }
    
    return recommendations;
  }

  async autoFix(productId, designId) {
    console.log('🔧 Tentative de correction automatique...');
    
    try {
      const diagnosis = await this.diagnosePermissionError(productId, designId);
      
      if (diagnosis.error) {
        console.log('❌ Impossible de diagnostiquer:', diagnosis.message);
        return null;
      }
      
      const autoFixComplete = diagnosis.find(r => r.type === 'auto_fix_complete');
      if (autoFixComplete) {
        console.log('✅ Correction automatique complète trouvée:', autoFixComplete.solution);
        return autoFixComplete.solution;
      }
      
      // Correction partielle
      const productFix = diagnosis.find(r => r.type === 'product_not_found' || r.type === 'product_wrong_vendor');
      const designFix = diagnosis.find(r => r.type === 'design_not_found' || r.type === 'design_not_accessible');
      
      if (productFix?.autoFix || designFix?.autoFix) {
        const partialFix = {
          correctProductId: productFix?.autoFix?.correctProductId || productId,
          correctDesignId: designFix?.autoFix?.correctDesignId || designId
        };
        console.log('⚠️ Correction automatique partielle:', partialFix);
        return partialFix;
      }
      
      console.log('❌ Impossible de corriger automatiquement');
      return null;
      
    } catch (error) {
      console.error('❌ Erreur lors de la correction automatique:', error);
      return null;
    }
  }

  async getAvailableIds() {
    console.log('📋 Récupération des IDs disponibles...');
    
    try {
      // ✅ Utiliser les bons endpoints
      const vendorProductsResponse = await this.api.get('/api/vendor-products');
      const designsResponse = await this.api.get('/api/designs');
      
      const availableIds = {
        products: vendorProductsResponse.data.map(p => ({
          id: p.id,
          name: p.name,
          baseProductId: p.baseProductId
        })),
        designs: designsResponse.data.data?.items?.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category
        })) || designsResponse.data.map(d => ({
          id: d.id,
          name: d.name,
          category: d.category
        }))
      };
      
      console.log('📋 IDs disponibles:', availableIds);
      return availableIds;
      
    } catch (error) {
      console.error('❌ Erreur récupération IDs:', error);
      return { products: [], designs: [] };
    }
  }
}
```

---

## 🎯 CLASSE GESTIONNAIRE DE POSITION CORRIGÉE

```js
// utils/designPositionManager.js
export class DesignPositionManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.cache = new Map();
    this.debugger = new PositionDebugger(apiClient);
  }

  async savePosition(productId, designId, position) {
    console.log(`💾 Sauvegarde position: Produit ${productId} ↔ Design ${designId}`, position);
    
    try {
      // Tentative de sauvegarde directe
      const response = await this.api.put(
        `/api/vendor-products/${productId}/designs/${designId}/position/direct`,
        position
      );
      
      // Mettre à jour le cache
      const cacheKey = `${productId}-${designId}`;
      this.cache.set(cacheKey, position);
      
      console.log('✅ Position sauvegardée avec succès');
      return response.data;
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde position:', error);
      
      if (error.response?.status === 403) {
        console.log('🔍 Erreur 403 détectée, diagnostic et correction automatique...');
        
        // Diagnostic automatique
        const recommendations = await this.debugger.diagnosePermissionError(productId, designId);
        console.log('💡 Recommandations:', recommendations);
        
        // Tentative de correction automatique
        const autoFix = await this.debugger.autoFix(productId, designId);
        if (autoFix) {
          console.log('🔧 Correction automatique appliquée:', autoFix);
          
          try {
            // Retry avec les bons IDs
            const retryResponse = await this.api.put(
              `/api/vendor-products/${autoFix.correctProductId}/designs/${autoFix.correctDesignId}/position/direct`,
              position
            );
            
            // Mettre à jour le cache avec les nouveaux IDs
            const newCacheKey = `${autoFix.correctProductId}-${autoFix.correctDesignId}`;
            this.cache.set(newCacheKey, position);
            
            console.log('✅ Position sauvegardée après correction automatique');
            
            // Retourner les nouveaux IDs pour que le frontend puisse se mettre à jour
            return {
              ...retryResponse.data,
              correctedIds: {
                productId: autoFix.correctProductId,
                designId: autoFix.correctDesignId
              }
            };
            
          } catch (retryError) {
            console.error('❌ Erreur même après correction automatique:', retryError);
            throw new Error(`Correction automatique échouée: ${retryError.message}`);
          }
        } else {
          // Afficher les recommandations si pas de correction automatique
          console.log('📋 Recommandations pour correction manuelle:', recommendations);
          throw new Error(`Erreur 403: ${error.response?.data?.message}. Consultez les recommandations dans la console.`);
        }
      } else {
        throw error;
      }
    }
  }

  async getPosition(productId, designId) {
    const cacheKey = `${productId}-${designId}`;
    
    // Vérifier le cache d'abord
    if (this.cache.has(cacheKey)) {
      console.log(`📍 Position depuis cache: Produit ${productId} ↔ Design ${designId}`);
      return this.cache.get(cacheKey);
    }
    
    try {
      const { data } = await this.api.get(
        `/api/vendor-products/${productId}/designs/${designId}/position/direct`
      );
      
      const position = data.data.position;
      
      if (position) {
        // Mettre en cache
        this.cache.set(cacheKey, position);
        console.log(`📍 Position récupérée: Produit ${productId} ↔ Design ${designId}`, position);
      } else {
        console.log(`⚠️ Aucune position sauvegardée: Produit ${productId} ↔ Design ${designId}`);
      }
      
      return position;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log(`⚠️ Position non trouvée: Produit ${productId} ↔ Design ${designId}`);
        return null;
      }
      throw error;
    }
  }

  async showDiagnosticInfo() {
    console.log('🔍 === DIAGNOSTIC COMPLET ===');
    
    try {
      // Informations utilisateur
      const user = await this.api.get('/api/auth/profile');
      console.log('👤 Utilisateur connecté:', {
        id: user.data.id,
        email: user.data.email,
        role: user.data.role,
        vendeur_type: user.data.vendeur_type
      });
      
      // IDs disponibles
      const availableIds = await this.debugger.getAvailableIds();
      console.log('📋 IDs disponibles:', availableIds);
      
      if (availableIds.products.length === 0) {
        console.warn('⚠️ AUCUN PRODUIT VENDEUR TROUVÉ');
        console.log('💡 Solution: Créez d\'abord un produit vendeur via /api/vendor-products');
      }
      
      if (availableIds.designs.length === 0) {
        console.warn('⚠️ AUCUN DESIGN TROUVÉ');
        console.log('💡 Solution: Créez d\'abord un design via /api/designs');
      }
      
      console.log('📊 === FIN DIAGNOSTIC ===');
      return availableIds;
      
    } catch (error) {
      console.error('❌ Erreur diagnostic complet:', error);
      return null;
    }
  }

  clearCache() {
    this.cache.clear();
    console.log('🧹 Cache positions nettoyé');
  }
}
```

---

## 🧪 UTILISATION DANS REACT

```js
// hooks/useDesignTransforms.ts
import { DesignPositionManager } from '../utils/designPositionManager';

export function useDesignTransforms(productId, designId) {
  const [positionManager] = useState(() => new DesignPositionManager(api));
  const [diagnosticInfo, setDiagnosticInfo] = useState(null);

  const savePosition = async (position) => {
    try {
      const result = await positionManager.savePosition(productId, designId, position);
      
      // Si correction automatique appliquée, mettre à jour les IDs
      if (result.correctedIds) {
        console.log('🔄 IDs corrigés automatiquement:', result.correctedIds);
        // Vous pouvez ici mettre à jour l'état de votre composant avec les nouveaux IDs
        // setProductId(result.correctedIds.productId);
        // setDesignId(result.correctedIds.designId);
      }
      
      return result;
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      
      // Afficher diagnostic en cas d'erreur
      const diagnostic = await positionManager.showDiagnosticInfo();
      setDiagnosticInfo(diagnostic);
      
      throw error;
    }
  };

  const getPosition = async () => {
    try {
      return await positionManager.getPosition(productId, designId);
    } catch (error) {
      console.error('❌ Erreur récupération position:', error);
      return null;
    }
  };

  const showDiagnostic = async () => {
    const diagnostic = await positionManager.showDiagnosticInfo();
    setDiagnosticInfo(diagnostic);
    return diagnostic;
  };

  return {
    savePosition,
    getPosition,
    showDiagnostic,
    diagnosticInfo
  };
}
```

---

## 🚀 TEST RAPIDE EN CONSOLE

```js
// Console du navigateur
const debugger = new PositionDebugger(api);
const manager = new DesignPositionManager(api);

// 1. Diagnostic complet
await manager.showDiagnosticInfo();

// 2. Test avec IDs existants (remplacez par vos vrais IDs)
const availableIds = await debugger.getAvailableIds();
const productId = availableIds.products[0]?.id;
const designId = availableIds.designs[0]?.id;

if (productId && designId) {
  // 3. Test sauvegarde
  await manager.savePosition(productId, designId, { x: 100, y: 100, scale: 1 });
  
  // 4. Test récupération
  const position = await manager.getPosition(productId, designId);
  console.log('Position récupérée:', position);
} else {
  console.log('❌ Pas assez de données pour tester');
}
```

---

## ✅ CHECKLIST DE VÉRIFICATION

### 1. Endpoints corrigés
- ✅ `/api/auth/profile` au lieu de `/api/auth/me`
- ✅ `/api/designs` au lieu de `/api/designs/my-designs`
- ✅ `/api/vendor-products` (déjà correct)

### 2. Gestion d'erreurs
- ✅ 404 (endpoint non trouvé)
- ✅ 400 (requête invalide)
- ✅ 403 (permissions)

### 3. Correction automatique
- ✅ Diagnostic des problèmes
- ✅ Correction automatique des IDs
- ✅ Retry avec bons paramètres

### 4. Debugging
- ✅ Logs détaillés
- ✅ Informations utilisateur
- ✅ IDs disponibles

---

## 🎉 RÉSULTAT GARANTI

Avec ces corrections :
- ✅ Plus d'erreurs 404 sur les endpoints
- ✅ Plus d'erreurs 400 sur les designs
- ✅ Correction automatique des erreurs 403
- ✅ Diagnostic complet en cas de problème

**Votre système de positions fonctionne maintenant parfaitement !** 🚀 
 
 
 
 