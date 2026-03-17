# 🚀 FRONTEND — GUIDE DE CORRECTION DESIGN TRANSFORMS

> **Objectif :** Éliminer les erreurs 403 et l'infinite loop en utilisant les **bons IDs vendorProduct** et en fiabilisant le chargement/sauvegarde des transformations de design.

---

## 1. Contexte du bug 🪲

1. Le frontend envoie encore les **anciens IDs** `39 / 43 / 47` (Admin Products).
2. Le backend s'attend aux **IDs vendorProduct** `425 – 430` (ou 422-427 selon votre base).
3. Résultat : 403 "Accès refusé" + appels réseau infinis.

---

## 2. Plan de correction 🛠️

| Étape | Fichier | Action |
|-------|---------|--------|
| 1 | `src/utils/vendorProductHelpers.ts` | Créer un helper pour calculer le bon ID |
| 2 | `src/services/designTransforms.ts`  | Réécrire le service de fetch/save |
| 3 | `src/hooks/useDesignTransforms.ts`  | Mettre à jour le hook pour éviter la boucle infinie |
| 4 | Composants | Utiliser le helper et le hook corrigé |
| 5 | QA | Vérifier dans les DevTools qu'aucun appel n'utilise 39/43/47 |

---

## 3. Implémentation détaillée 📄

### 3.1 Helper : `vendorProductHelpers.ts`
```ts
// src/utils/vendorProductHelpers.ts
export function getVendorProductId(product: any): number | undefined {
  if (!product) return undefined;

  // 1. Architecture V2 : objet imbriqué
  if (product.vendorProduct?.id) return product.vendorProduct.id;

  // 2. Champ à plat
  if (product.vendorProductId) return product.vendorProductId;

  // 3. Produit déjà vendor
  if (product.id && ['DRAFT', 'PENDING', 'PUBLISHED'].includes(product.status)) {
    return product.id;
  }

  // Mode conception admin → pas d'ID vendor
  return undefined;
}

export function debugProductIds(p: any) {
  if (process.env.NODE_ENV !== 'development') return;
  console.log('🔍 Product ID Debug', {
    productId: p?.id,
    vendorProductId: p?.vendorProductId,
    vendorProduct: p?.vendorProduct,
    status: p?.status,
    name: p?.name,
    calculatedVendorId: getVendorProductId(p)
  });
}
```

### 3.2 Service : `designTransforms.ts`
```ts
// src/services/designTransforms.ts
import api from './api';
import { getVendorProductId } from '@/utils/vendorProductHelpers';

export async function loadDesignTransforms(product: any, designUrl?: string) {
  const vendorProductId = getVendorProductId(product);

  // Fallback localStorage pour le mode conception
  if (!vendorProductId) {
    const key = `design-transforms-${product?.id || 'unknown'}`;
    const saved = localStorage.getItem(key);
    return { transforms: saved ? JSON.parse(saved) : [], conception: true };
  }

  const params = designUrl && designUrl !== 'undefined' ? { designUrl } : {};
  const { data } = await api.get(`/vendor/design-transforms/${vendorProductId}`, { params });
  return data;
}

export async function saveDesignTransforms(product: any, transforms: any, designUrl?: string) {
  const vendorProductId = getVendorProductId(product);

  // Toujours sauvegarder en localStorage
  const key = `design-transforms-${vendorProductId || product?.id || 'unknown'}`;
  localStorage.setItem(key, JSON.stringify(transforms));

  // Si pas d'ID vendor → seulement local
  if (!vendorProductId) return { success: true, localStorage: true };

  const payload = {
    productId: vendorProductId,
    transforms,
    designUrl: designUrl && designUrl !== 'undefined' ? designUrl : undefined,
    lastModified: Date.now(),
  };
  return (await api.post('/vendor/design-transforms', payload)).data;
}
```

### 3.3 Hook : `useDesignTransforms.ts`
```ts
// src/hooks/useDesignTransforms.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { loadDesignTransforms, saveDesignTransforms } from '@/services/designTransforms';
import { getVendorProductId, debugProductIds } from '@/utils/vendorProductHelpers';

export function useDesignTransforms(product: any, designUrl?: string) {
  const [transforms, setTransforms] = useState<any[]>([]);
  const [loading, setLoading]   = useState(false);
  const [error,   setError]     = useState<string | null>(null);
  const [conception, setConception] = useState(false);

  const loadedRef    = useRef(false);
  const productIdRef = useRef<number | null>(null);

  const reload = useCallback(async () => {
    const vpId = getVendorProductId(product);
    debugProductIds(product);

    if (loadedRef.current && productIdRef.current === vpId) return;
    setLoading(true);

    try {
      const res = await loadDesignTransforms(product, designUrl);
      if (res.conception) setConception(true);
      setTransforms(res.transforms || res.data?.transforms || []);
      setError(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      loadedRef.current = true;
      productIdRef.current = vpId || null;
    }
  }, [product?.id, product?.vendorProductId, product?.vendorProduct?.id, designUrl]);

  // Chargement initial
  useEffect(() => { reload(); }, [reload]);

  // Sauvegarde
  const save = useCallback(async (t: any[]) => {
    setTransforms(t);
    await saveDesignTransforms(product, t, designUrl);
  }, [product, designUrl]);

  return { transforms, loading, error, conception, save, reload };
}
```

### 3.4 Exemple d'intégration dans un composant
```tsx
// ProductViewer.tsx
import { useDesignTransforms } from '@/hooks/useDesignTransforms';
import { getVendorProductId } from '@/utils/vendorProductHelpers';

export const ProductViewer = ({ product, designUrl }: any) => {
  const { transforms, loading, error, conception, save } = useDesignTransforms(product, designUrl);

  useEffect(() => {
    const id = getVendorProductId(product);
    console.log('✅ VendorProductId utilisé', id);
  }, [product?.id]);

  if (loading) return null;
  if (error)   return <div>Erreur : {error}</div>;

  return (
    <div>
      {conception && (
        <div className="bg-blue-100 p-2 mb-4 rounded">
          ℹ️ Mode conception – sauvegarde locale uniquement
        </div>
      )}
      {/* Render editor with `transforms` & handle `save` */}
    </div>
  );
};
```

---

## 4. Checklist QA ✅

- [ ] Aucune requête réseau ne doit cibler /vendor/design-transforms/39 / 43 / 47.
- [ ] Les premières requêtes sont bien : `/vendor/design-transforms/425-430` (ou 422-427).
- [ ] Déplacement d'un design → **1 seul POST**, pas de boucle infinie.
- [ ] Actualisation de la page → les positions sont restaurées.
- [ ] Mode conception (admin product) : pas d'erreur 403, données stockées dans localStorage.

---

## 5. Debug & tips 🔎

1. **DevTools → Network** : Filtrer « design-transforms » pour vérifier les IDs.
2. **LocalStorage** : Clé `design-transforms-<id>`.
3. **Console** : Chercher `🔍 Product ID Debug` pour confirmer le mapping.
4. **Clean cache** si jamais un ancien JS bundle traîne.

---

## 6. Récapitulatif mapping IDs 🔄

| Admin Product | VendorProduct (DRAFT) | VendorProduct (PENDING) |
|---------------|-----------------------|-------------------------|
| 14 (Tshirt)           | 424 | 427 |
| 15 (Tshirt luxe)      | 423 | 426 |
| 16 (Mugs)             | 422 | 425 |

> **Important :** Utilisez toujours `getVendorProductId()` pour obtenir l'ID correct, ne mappez plus manuellement !

---

**Une fois ces étapes appliquées, le frontend n'aura plus de 403 ni de boucle infinie.** 🎉 