# 🚀 GUIDE FRONTEND — Migration vers **vendorProduct.id** (Architecture V2)

> Corrige les boucles « DEBUG PRODUCT IDS » et les `TypeError: Cannot convert undefined or null to object`.
>
> L’objectif est d’utiliser **exclusivement** `vendorProduct.id` (l’ID *vendeur*) dans tous les appels `/api/vendor-products/*` et `/vendor/design-transforms/*`.

---

## 1. Rappel des champs produit (endpoint `/vendor/products`)

| Champ | Type | Description |
|-------|------|-------------|
| `id` | number | **VendorProduct ID** — l’ID à utiliser pour positions & transforms ✔️ |
| `baseProductId` | number | ID du produit *admin* (catalogue) — **ne pas** utiliser dans les calls positions/transforms |
| `designId` | number | Design appliqué |
| `name` | string | Nom libre du produit vendeur |

---

## 2. Fonction helper universelle

Ajoutez dans `src/helpers/vendorProductHelpers.ts` :

```ts
/**
 * Retourne l’ID VendorProduct fiable à partir de divers inputs.
 * @param prod peut être :
 *  • le VendorProduct complet
 *  • un baseProductId (admin)
 *  • un vendorProductId déjà correct
 */
export function resolveVendorProductId(prod: unknown, vendorProducts: Array<any>): number | null {
  // Cas 1 : objet complet
  if (typeof prod === 'object' && prod !== null && 'id' in (prod as any)) {
    return (prod as any).id;
  }
  // Cas 2 : nombre — peut être baseProductId OU vendorProductId
  if (typeof prod === 'number') {
    // D’abord chercher un vendorProduct.id == prod
    const direct = vendorProducts.find(vp => vp.id === prod);
    if (direct) return direct.id;

    // Sinon chercher via baseProductId
    const mapped = vendorProducts.find(vp => vp.baseProductId === prod);
    if (mapped) return mapped.id;
  }
  return null; // introuvable
}
```

---

## 3. Patch **useDesignTransforms.ts**

```diff
-import React, { useEffect } from 'react';
-import { api } from '../services/apiClient';
+import React, { useEffect } from 'react';
+import { api } from '../services/apiClient';
+import { resolveVendorProductId } from '../helpers/vendorProductHelpers';

// …

const vendorProducts = await api.get('/vendor/products');
-const vpId = product; // ← parfois baseProductId ❌
+const vpId = resolveVendorProductId(product, vendorProducts.data.data.products);

-if (!vpId) console.warn('❌ VendorProduct introuvable', product);
+if (!vpId) {
+  console.error('[DesignTransforms] Impossible de résoudre VendorProductId', product);
+  return; // exit early pour éviter le spam
+}
```

> ⛔ **Stop au spam log** `DEBUG PRODUCT IDS` : entourez vos console.logs d’un check environnement :
>
> ```ts
> if (process.env.NODE_ENV === 'development') console.debug('DEBUG PRODUCT IDS', obj);
> ```

---

## 4. Patch **useVendorPublish.ts** (structure produit)

Erreur actuelle :
```ts
Object.keys(structure.adminImages).forEach(...)
// ↓ structure vaut undefined lorsque le mapping d’ID échoue
```

Correctif :
```diff
-const vpId = product.baseProductId; // ❌
+const vpId = product.id;            // ✅

-if (!vpId) throw new Error('Impossible de créer la structure pour le produit');
+if (!vpId) {
+  console.error('[Publish] VendorProduct.id manquant', product);
+  throw new Error(`Impossible de créer la structure pour le produit "${product.name}"`);
+}
```

---

## 5. Mise à jour des appels Position / Transforms

Toujours utiliser :
```ts
const url = `/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`;
```
• `vendorProductId` = résultat de `resolveVendorProductId(...)`  
• `designId`        = design présent dans le produit **OU** choisi dans la UI.

---

## 6. Exemple de flux complet (V2)

```ts
// 1. Charger produits & designs
const { data: vpRes } = await api.get('/vendor/products');
const vendorProducts  = vpRes.data.products;
const currentVpId     = resolveVendorProductId(selectedProduct, vendorProducts);

// 2. Charger le transform (si existe)
const { data: tRes } = await api.get(`/vendor/design-transforms/${currentVpId}`, {
  params: { designUrl },
});

// 3. Sauvegarder la position isolée
await api.put(`/api/vendor-products/${currentVpId}/designs/${designId}/position/direct`, pos);
```

---

## 7. Tests de validation rapide en console

```js
// Vérifier que chaque baseProductId mappe à un vendorProduct.id unique
const vp = (await api.get('/vendor/products')).data.data.products;
vp.forEach(p => console.log(p.baseProductId, '→', p.id));
```

---

## 8. Résultat attendu

1. Plus de logs « product?.id: undefined » 🚫
2. Fin des boucles infinies `DEBUG PRODUCT IDS` ✅
3. Plus de `TypeError: Cannot convert undefined or null to object` lors du publish ✅
4. Positions sauvegardées du premier coup (pas d’auto-fix nécessaire) 🎉

---

> **Important** : Conservez ce mapping centralisé `resolveVendorProductId` pour éviter toute régression future. 
 
 
 
 