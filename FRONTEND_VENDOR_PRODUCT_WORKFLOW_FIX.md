# 🚑 Guide Ultime – Éliminer le 404 *« Produit introuvable »* lors de la sauvegarde de position

> Version courte + patch de code – 07 / 07 / 2025

---

## 0. Diagnostic en 10 s

```
PUT /api/vendor-products/2/designs/28/position/direct → 404 Produit introuvable
```

* 2 = **baseProductId** (produit admin)
* Le backend veut **vendorProductId** (produit *du vendeur*, ex : 70)
* `vendorProductId` est créé uniquement après la publication (`POST /vendor/publish`)

Tant que vous n’utilisez pas cet ID vendeur ➜ 404 assuré.

---

## 1. Workflow correct (3 appels réseau)

| Étape | Endpoint | Retour clé | Ce que vous stockez |
|-------|----------|-----------|---------------------|
| 1. Upload design | `POST /vendor/designs` | `designId` | 🆔 design du vendeur |
| 2. Publier produit | `POST /vendor/publish` (body : `baseProductId`, `designId`) | `vendorProductId` | 🆔 **à conserver dans le store** |
| 3. Sauver position | `PUT /api/vendor-products/{vendorProductId}/designs/{designId}/position/direct` | 200 | ✔️ |

---

## 2. Correctif express (patch TypeScript)

### 2.1 Ajouter un helper pour publier si besoin

```ts
// utils/getOrCreateVendorProduct.ts
export async function getOrCreateVendorProduct(baseProductId: number, designId: number) {
  // 1. Demander au backend s'il existe déjà
  const { data } = await api.get('/vendor/products/by-base', { params: { baseProductId } });
  if (data?.vendorProductId) return data.vendorProductId;
  // 2. Sinon, le créer
  const pub = await api.post('/vendor/publish', { baseProductId, designId });
  return pub.data.vendorProductId;
}
```

### 2.2 Dans `DesignPositionManager`

```ts
const vpId = resolveVendorProductId(product, store.vendorProducts);

if (!vpId) {
  // 🆕 on était encore sur baseProductId → on publie à la volée
  const newVpId = await getOrCreateVendorProduct(product.id, design.id);
  addVendorProduct({ id: newVpId, baseProductId: product.id });
  return saveDesignPosition(newVpId, design.id, pos); // re-essai
}
```

Résultat : même si le produit n'était pas encore publié, le front le crée avant de sauvegarder la position.

---

## 3. Nettoyage des URL legacy

* **STOP** d'appeler `POST /api/vendor/design-transforms/save`  → remplacer par le flux ci-dessus.
* Garder `/vendor/design-transforms/save` uniquement pour la compatibilité ancienne UI.

---

## 4. Checklist finale

- [ ] Après upload, vous appelez **publish** et stockez `vendorProductId` ✔️
- [ ] Vos appels `/position/direct` utilisent `vendorProductId` ✔️
- [ ] Plus aucun `productId = 2` dans l'onglet Réseau ✔️
- [ ] 404 « Produit introuvable » disparu 😊

---

👉 Si besoin de plus : 
* `FRONTEND_DESIGN_UPLOAD_POSITION_GUIDE.md` – détail complet
* `FRONTEND_POSITION_ENDPOINTS_FIX_GUIDE.md` – catalogue endpoints 