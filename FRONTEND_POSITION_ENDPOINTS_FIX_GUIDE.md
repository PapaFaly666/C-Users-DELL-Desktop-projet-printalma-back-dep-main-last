# 🛠️ Guide Frontend – Correction Définitive des Endpoints *Design Position*

> Dernière mise à jour : 2025-07-07 — compatible React / Vite

---

## 0. TL;DR

1. **Toujours résoudre les IDs** avant d'appeler le backend :
   ```ts
   const vpId  = resolveVendorProductId(product, vendorProducts); // vendorProductId réel (≥ 60)
   const desId = resolveVendorDesignId (design , vendorDesigns);  // designId réel (≥ 20)
   ```
2. **Utiliser les nouveaux endpoints** :
   ```http
   GET /api/vendor-products/{vpId}/designs/{desId}/position/direct
   PUT /api/vendor-products/{vpId}/designs/{desId}/position/direct
   ```
3. **Ne préfixez pas** les routes legacy `/vendor/design-transforms` par `/api`.
4. Vérifiez dans *Network* que `vpId` ≠ `baseProductId` et que le statut HTTP = 200.

---

## 1. Problèmes observés

| Symptôme | Cause racine |
|----------|--------------|
| 404 « Produit introuvable » sur `/api/vendor-products/2/designs/28/position/direct` | `2` est un `baseProductId` admin, pas un `vendorProductId`. |
| 404 « Cannot POST /api/vendor/design-transforms/save » | Le contrôleur legacy est monté **sans** préfixe `/api`. Le bon chemin est `/vendor/design-transforms/save`. |
| 500 sur `/position/direct` (NPE vendorId) | Le produit envoyé ne correspond à aucun `vendorProduct` du vendeur. |

---

## 2. Résoudre les vrais IDs

Fichier : `frontend/src/helpers/vendorIdResolvers.ts`

```ts
const vpId  = resolveVendorProductId(product, vendorProducts);
const desId = resolveVendorDesignId (design , vendorDesigns);

if (!vpId || !desId) {
  console.warn('IDs non résolus', { product, design });
  return; // skip api call ➜ UI centrée par défaut
}
```

> Sans cette étape, vous enverrez `product.id === 2` ➜ 404 assuré.

---

## 3. Endpoints à utiliser

### 3.1 – Nouveaux endpoints (recommandé)

| Action | Méthode + Path | Corps | Réponse 200 |
|--------|----------------|-------|-------------|
| Lire la position | `GET /api/vendor-products/{vpId}/designs/{desId}/position/direct` | – | `{ success:true, data:{ x,y,scale,rotation,… } \| null }` |
| Sauvegarder / upserter | `PUT /api/vendor-products/{vpId}/designs/{desId}/position/direct` | `{ x,y,scale?,rotation?,constraints? }` | `{ success:true, message:'Position sauvegardée' }` |

*Avantages* : IDs numériques → plus robustes, pas de problème d'encodage d'URL.

### 3.2 – Endpoints legacy (compatibilité)

| Action | Bon chemin | Mauvais chemin (à éviter) |
|--------|-----------|--------------------------|
| Save | `POST /vendor/design-transforms/save` | `/api/vendor/design-transforms/save` |
| Load | `GET  /vendor/design-transforms/{vpId}?designUrl={url}` | idem avec `/api` |

> Gardez-les **uniquement** si vous dépendez encore du stockage `transforms`. Sinon, migrez vers `/position/direct`.

---

## 4. Intégration recommandée (*hook prêt à l'emploi*)

Fichier : `frontend/src/hooks/useDesignPosition.ts`

```ts
const { position, setPosition } = useDesignPosition({
  product,
  design,
  vendorProducts,
  vendorDesigns,
});

// ➜ position est chargée auto. Pour sauvegarder :
setPosition({ x, y, scale, rotation, constraints:{ adaptive:true } });
```

Ce hook :
1. Résout `vpId` & `desId`.
2. Appelle les routes `/position/direct` avec `withCredentials:true`.
3. Gère l'état `loading` + fallback `null`.

---

## 5. Migration pas-à-pas

1. **Supprimer** tout appel direct à `/api/vendor/design-transforms/save` dans le code.
2. **Installer / importer** `designPositionApi.ts` et/ou `useDesignPosition.ts`.
3. **Assainir** les composants : ne plus construire d'URL à la main, mais passer par le hook ou le service.
4. **Tester** :
   - Dans Sell-Design, déplacez le design → devtools doit montrer un `PUT /api/vendor-products/70/designs/28/position/direct` 200.
   - Rafraîchissez → `GET …/position/direct` 200 + position appliquée (plus de design centré).
5. **Nettoyer** : supprimer le fallback legacy une fois validé.

---

## 6. Débogage rapide

```bash
# Vérifier qu'un vendorProduct existe bien (ex : baseProductId=2)
SELECT id, base_product_id, vendor_id
FROM vendor_products
WHERE base_product_id = 2 AND vendor_id = <votreId>;

# Vérifier la position enregistrée
SELECT *
FROM product_design_positions
WHERE vendor_product_id = 70 AND design_id = 28;
```

---

## 7. FAQ

**Q : Je reçois encore 404 sur `/position/direct`.**  
A : regardez l'ID dans l'URL ; si c'est `2`, vous utilisez le mauvais helper. `vpId` doit être ≥ 60.

**Q : Pourquoi `/vendor/design-transforms/save` répond 404 ?**  
A : Vous avez ajouté `/api` devant. Supprimez-le.

**Q : Peut-on supprimer totalement les routes legacy ?**  
A : Oui, quand les applis mobiles et anciennes pages auront migré vers `/position/direct`.

---

👩‍💻 **Référent back-end** : @backend-dev  
🧑‍🎨 **Référent front-end** : @frontend-dev 