# 🛠️ GUIDE FRONTEND — Correction définitive « Ce produit ne vous appartient pas » (403) + Boucle infinie positions

> TL;DR : envoyez **toujours `vendorProduct.id`**, jamais `baseProductId`.
>
> 1. Utilisez `resolveVendorProductId()`.
> 2. Corrigez l'URL des endpoints positions.
> 3. Stabilisez votre hook de chargement.

---

## 1. Symptômes

• Requêtes qui partent en boucle :
```
PUT /api/vendor-products/2/designs/1/position/direct 403
GET /api/vendor-products/2/designs/1/position/debug 200 { product:null, … }
… autoFix() …
PUT /api/vendor-products/47/designs/22/position/direct 200 ✅
```

• Message : `Ce produit ne vous appartient pas` (403).
• `productId` vaut **2** (baseProduct) alors que vos vrais `vendorProduct.id` sont **37 – 47**.

---

## 2. Pourquoi ça arrive

| Champ                       | Valeur | Signification                           |
|-----------------------------|--------|-----------------------------------------|
| `baseProductId` (2)         | 2      | ID *admin* du produit catalogue.        |
| `vendorProduct.id` (47)     | 47     | ID du **produit vendeur** (Architecture V2). |

Le backend vérifie `vendorProduct.vendorId === user.id`. L'ID **2** n'appartient à personne ⇒ 403.

---

## 3. Correctif pas-à-pas

### 3.1. Importez le helper centralisé

```ts
import { resolveVendorProductId } from '@/helpers/vendorProductHelpers';
```

### 3.2. Sauvegarde de la position (DesignPositionManager / service équivalent)

```diff
-export async function saveIsolatedPosition(product: any, design: any, pos: Position) {
-  const url = `/api/vendor-products/${product.id}/designs/${design.id}/position/direct`;
+export async function saveIsolatedPosition(product: any, design: any, pos: Position, vendorProducts: any[]) {
+  const vpId = resolveVendorProductId(product, vendorProducts);
+  if (!vpId) {
+    console.error('[DesignSave] VendorProductId introuvable', product);
+    return;
+  }
+
+  const url = `/api/vendor-products/${vpId}/designs/${design.id}/position/direct`;
   await api.put(url, pos, { withCredentials: true });
 }
```

### 3.3. Chargement de la position (hook `useDesignTransforms`)

```diff
-const vpId = product.id;              // parfois baseProductId ❌
+const vpId = resolveVendorProductId(product, vendorProducts); // ✅

-useEffect(() => {
-  loadPosition();              // se relance indéfiniment
-}, [product, designUrl]);
+useEffect(() => {
+  if (!vpId || !design?.id) return;
+  loadPosition(vpId, design.id); // 1 appel stable
+}, [vpId, design?.id]);
```

### 3.4. Supprimer le fallback `autoFix()` (facultatif)

Une fois les IDs corrects, la correction automatique ne devrait plus jamais se déclencher. Gardez-la en dev seulement :

```ts
if (process.env.NODE_ENV === 'development') {
  PositionDebugger.autoFix();
}
```

---

## 4. Test express

1. Ouvrez votre appli, déplacez le design, cliquez « Save ».  
2. Dans l'onglet Réseau :
   * Vous devez voir **une seule** requête 
     `PUT /api/vendor-products/47/designs/22/position/direct` → 200.  
   * Plus aucun appel `…/position/debug` ni 403.
3. Rechargez la page ► la position s'affiche ; aucun GET en boucle.

---

## 5. Checklist avant merge

- [ ] Tous les appels positions utilisent `vendorProduct.id`.
- [ ] Aucune valeur codée en dur (`productId: 1`, `designId: 1`).
- [ ] Hook `useDesignTransforms` a des dépendances stables.
- [ ] Plus de 403 dans la console.
- [ ] Tests Cypress / Playwright passent.

---

## 6. Aller plus loin

• Ajoutez un `eslint rule` ou un test unit pour empêcher l'usage direct de
`product.baseProductId` dans les URLs.  
• Centralisez toutes les requêtes positions dans `designPositionService.ts` pour
éviter les oublis.

---

_💡 Une fois ce guide appliqué, vous n'aurez plus besoin de
`PositionDebugger.autoFix()` en production._ 
 
 
 
 