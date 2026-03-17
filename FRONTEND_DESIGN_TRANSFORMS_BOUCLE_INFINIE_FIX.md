# 🚨 CORRECTION URGENTE - Boucle Infinie Design Transforms

## Problème identifié
```
🚀 API Request: GET /vendor/design-transforms/39 undefined
❌ API Error: 403 {message: 'Accès refusé à ce produit'}
```

**Causes principales :**
1. **Boucle infinie** : Le hook `useDesignTransforms` se relance sans cesse
2. **URL malformée** : `undefined` s'ajoute à l'URL
3. **React Strict Mode** : Double exécution des effets
4. **Dépendances instables** : Le hook se redéclenche en permanence

---

## 🔧 SOLUTION IMMÉDIATE

### 1. **Corrige le hook `useDesignTransforms.ts`**

```typescript
// hooks/useDesignTransforms.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { loadDesignTransforms, saveDesignTransforms } from '@/services/designTransforms';

export function useDesignTransforms(product: any, designUrl?: string) {
  const [transforms, setTransforms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConceptionMode, setIsConceptionMode] = useState(false);
  
  // ANTI-BOUCLE : Références stables
  const hasLoadedRef = useRef(false);
  const productIdRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Déterminer l'ID à utiliser - FONCTION STABLE
  const getVendorProductId = useCallback(() => {
    if (!product) return null;
    
    // Priorité : vendorProduct.id > vendorProductId > id (si c'est un vendor product)
    if (product.vendorProduct?.id) return product.vendorProduct.id;
    if (product.vendorProductId) return product.vendorProductId;
    if (product.id && product.status && ['DRAFT', 'PENDING', 'PUBLISHED'].includes(product.status)) {
      return product.id; // C'est déjà un vendor product
    }
    
    return null; // Admin product, pas de vendor product associé
  }, [product?.id, product?.vendorProduct?.id, product?.vendorProductId, product?.status]);

  // Charger les transformations - FONCTION STABLE
  const loadSavedTransforms = useCallback(async () => {
    const vendorProductId = getVendorProductId();
    
    // VALIDATION CRITIQUE - Éviter la boucle infinie
    if (isLoadingRef.current) {
      console.log('⚠️ Chargement déjà en cours, éviter la boucle');
      return;
    }
    
    if (hasLoadedRef.current && productIdRef.current === vendorProductId) {
      console.log('⚠️ Déjà chargé pour ce produit, éviter la boucle');
      return;
    }
    
    if (!vendorProductId) {
      console.log('🔄 Mode conception admin product - pas de vendor product');
      setIsConceptionMode(true);
      setIsLoading(false);
      hasLoadedRef.current = true;
      productIdRef.current = null;
      
      // Charger depuis localStorage
      const localKey = `design-transforms-${product?.id || 'unknown'}`;
      const savedLocal = localStorage.getItem(localKey);
      if (savedLocal) {
        try {
          setTransforms(JSON.parse(savedLocal));
          console.log('📦 Transformations chargées depuis localStorage');
        } catch (e) {
          console.error('❌ Erreur parsing localStorage:', e);
        }
      }
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);
      setError(null);
      
      console.log('🔄 Chargement pour vendor product ID:', vendorProductId);
      
      const backendData = await loadDesignTransforms(vendorProductId, designUrl);
      setTransforms(backendData.transforms || []);
      setIsConceptionMode(false);
      
      console.log('✅ Transformations chargées depuis backend');
      
    } catch (err) {
      console.error('⚠️ Échec chargement backend:', err.message);
      
      if (err.response?.status === 403) {
        console.log('🔄 Erreur 403 détectée - Mode conception admin product');
        setIsConceptionMode(true);
        setError(null); // Pas d'erreur, c'est normal
        
        // Charger depuis localStorage en fallback
        const localKey = `design-transforms-${vendorProductId}`;
        const savedLocal = localStorage.getItem(localKey);
        if (savedLocal) {
          try {
            setTransforms(JSON.parse(savedLocal));
            console.log('📦 Transformations chargées depuis localStorage (fallback 403)');
          } catch (e) {
            console.error('❌ Erreur parsing localStorage fallback:', e);
          }
        } else {
          console.log('ℹ️ Aucune transformation sauvegardée trouvée, initialisation vide (mode 403)');
        }
      } else {
        setError(err.message);
        setIsConceptionMode(false);
      }
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
      hasLoadedRef.current = true;
      productIdRef.current = vendorProductId;
    }
  }, [getVendorProductId, product?.id, designUrl]);

  // Sauvegarder les transformations
  const saveTransforms = useCallback(async (newTransforms: any[]) => {
    const vendorProductId = getVendorProductId();
    
    // Toujours sauvegarder en localStorage (offline-first)
    const localKey = `design-transforms-${vendorProductId || product?.id || 'unknown'}`;
    localStorage.setItem(localKey, JSON.stringify(newTransforms));
    setTransforms(newTransforms);
    
    console.log('💾 Transformations sauvegardées en localStorage');
    
    // Tenter la sauvegarde backend si possible
    if (vendorProductId && !isConceptionMode) {
      try {
        await saveDesignTransforms(vendorProductId, newTransforms, designUrl);
        console.log('✅ Transformations synchronisées avec backend');
      } catch (err) {
        console.error('⚠️ Échec sync backend (localStorage OK):', err.message);
        // Pas d'erreur critique, localStorage est OK
      }
    }
  }, [getVendorProductId, product?.id, designUrl, isConceptionMode]);

  // Charger au montage - UNE SEULE FOIS avec contrôle strict
  useEffect(() => {
    if (product && !hasLoadedRef.current) {
      console.log('🔄 Initialisation useDesignTransforms pour produit:', product.id);
      loadSavedTransforms();
    }
  }, [product?.id]); // SEULEMENT product.id comme dépendance

  // Reset si le produit change
  useEffect(() => {
    const newVendorProductId = getVendorProductId();
    if (productIdRef.current !== newVendorProductId) {
      console.log('🔄 Produit changé, reset du hook');
      hasLoadedRef.current = false;
      productIdRef.current = null;
      isLoadingRef.current = false;
      setIsConceptionMode(false);
      setError(null);
      setTransforms([]);
    }
  }, [getVendorProductId]);

  return {
    transforms,
    isLoading,
    error,
    isConceptionMode,
    saveTransforms,
    reloadTransforms: () => {
      hasLoadedRef.current = false;
      productIdRef.current = null;
      loadSavedTransforms();
    }
  };
}
```

### 2. **Corrige le service `designTransforms.ts`**

```typescript
// services/designTransforms.ts
import api from './api';

export async function loadDesignTransforms(vendorProductId: number, designUrl?: string) {
  // VALIDATION CRITIQUE
  if (!vendorProductId || vendorProductId === undefined || vendorProductId === null) {
    console.error('❌ loadDesignTransforms: vendorProductId invalide:', vendorProductId);
    throw new Error('ID produit vendeur requis');
  }

  // URL propre sans undefined
  const url = `/vendor/design-transforms/${vendorProductId}`;
  const params = designUrl ? { designUrl } : {};
  
  console.log('🚀 API Request:', url, Object.keys(params).length > 0 ? params : '');
  
  try {
    const response = await api.get(url, { params });
    console.log('✅ API Success:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error:', error.response?.status, error.response?.data);
    throw error;
  }
}

export async function saveDesignTransforms(vendorProductId: number, transforms: any, designUrl?: string) {
  if (!vendorProductId || vendorProductId === undefined || vendorProductId === null) {
    console.error('❌ saveDesignTransforms: vendorProductId invalide:', vendorProductId);
    throw new Error('ID produit vendeur requis');
  }

  const url = `/vendor/design-transforms/${vendorProductId}`;
  const payload = { transforms, designUrl };
  
  console.log('🚀 API Request POST:', url, payload);
  
  try {
    const response = await api.post(url, payload);
    console.log('✅ API Success POST:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ API Error POST:', error.response?.status, error.response?.data);
    throw error;
  }
}
```

### 3. **Optimise l'utilisation dans le composant**

```typescript
// Dans ton composant ProductImageWithDesign ou similaire
const ProductImageWithDesign = ({ product }) => {
  // Utilisation stable du hook
  const { transforms, isLoading, error, isConceptionMode, saveTransforms } = useDesignTransforms(product);

  // Debug les IDs - SEULEMENT en dev
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Product debug:', {
        id: product?.id,
        vendorProductId: product?.vendorProductId,
        vendorProduct: product?.vendorProduct,
        status: product?.status,
        name: product?.name
      });
    }
  }, [product?.id]); // SEULEMENT product.id

  if (isLoading) {
    return <div>Chargement des transformations...</div>;
  }

  if (error) {
    return <div>Erreur: {error}</div>;
  }

  if (isConceptionMode) {
    return (
      <div>
        <div className="bg-blue-100 p-2 mb-4 rounded">
          ℹ️ Mode conception - Modifications sauvegardées localement
        </div>
        {/* Ton éditeur de design */}
      </div>
    );
  }

  return (
    <div>
      {/* Ton éditeur de design normal */}
    </div>
  );
};
```

---

## 🚀 ACTIONS IMMÉDIATES

### 1. **Applique ces corrections**
- [ ] Remplace le hook `useDesignTransforms.ts`
- [ ] Remplace le service `designTransforms.ts`
- [ ] Ajoute les références stables dans ton composant

### 2. **Teste immédiatement**
```bash
# Ouvre la console et vérifie :
# - Plus de boucle infinie
# - Plus de "undefined" dans les URLs
# - Messages de debug clairs
# - Chargement unique par produit
```

### 3. **Vérification**
- ✅ Plus de boucle infinie
- ✅ URLs propres sans `undefined`
- ✅ Mode conception pour admin products
- ✅ Sauvegarde localStorage fonctionnelle
- ✅ Une seule tentative de chargement par produit

---

## 🔧 POINTS CLÉS DE LA CORRECTION

1. **Références stables** : `useRef` pour éviter les re-rendus
2. **Contrôle de chargement** : `hasLoadedRef` et `isLoadingRef`
3. **Dépendances minimales** : Seulement `product.id` dans les useEffect
4. **Validation stricte** : Vérification des IDs avant les appels API
5. **Mode conception** : Gestion propre des erreurs 403

Cette correction va **immédiatement stopper la boucle infinie** et corriger les URLs malformées. 