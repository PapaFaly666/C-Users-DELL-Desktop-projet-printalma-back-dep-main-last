# 🚑 Frontend – Correctif Express « 403 Accès refusé » sur les Design Transforms

> Dernière mise à jour : 2025-07-02
>
> Ce mini-guide recense **les 3 points cruciaux** à vérifier pour éliminer l’erreur 
> `403 Forbidden – Accès refusé à ce produit` rencontrée sur les appels :
> * `GET  /vendor/design-transforms/:productId`  
> * `POST /vendor/design-transforms`

---

## 1. Utiliser le **bon** identifiant produit

| Champ | Description | À envoyer |
|-------|-------------|-----------|
| `productId` (param URL + body) | Identifiant du **VendorProduct** (le produit Vendeur) | `product.id` |
| `baseProductId` | Identifiant du produit catalogue (admin) | **NE PAS envoyer ici** |

**➡️ Si le produit n’est pas encore publié** : créez-le d’abord avec `POST /vendor/products`, récupérez l’ID retourné puis utilisez-le pour les transforms.

```ts
// Mauvais – provoque 403
await loadDesignTransforms(baseProduct.id, designUrl);

// Bon – pas de 403
await loadDesignTransforms(vendorProduct.id, designUrl);
```

---

## 2. Toujours envoyer les cookies d’authentification

Le backend sur le port **3004** utilise l’auth par cookie (`auth_token`). Avec **Axios** :

```ts
axios.post('/vendor/design-transforms', payload, { withCredentials: true });
axios.get(`/vendor/design-transforms/${productId}`, {
  params: { designUrl },
  withCredentials: true,
});
```

Sans `withCredentials: true` le serveur répondra **401** puis **403**.

---

## 3. Exemple de service minimal fonctionnel

```ts
// src/services/designTransforms.ts
import axios from 'axios';

export interface Transform { x: number; y: number; scale: number; }

export async function saveDesignTransforms(
  productId: number,
  designUrl: string,
  transforms: Record<string, Transform>,
) {
  await axios.post(
    '/vendor/design-transforms',
    {
      productId,
      designUrl,
      transforms,
      lastModified: Date.now(),
    },
    { withCredentials: true },
  );
}

export async function loadDesignTransforms(productId: number, designUrl: string) {
  const { data } = await axios.get(`/vendor/design-transforms/${productId}` , {
    params: { designUrl },
    withCredentials: true,
  });
  return data?.data ?? null;
}
```

---

### ✅ Check-list finale

- [ ] `product.id` (et non `baseProductId`) est utilisé partout pour `POST` / `GET`.
- [ ] Les requêtes Axios contiennent `withCredentials: true`.
- [ ] Les tests manuels `POST` puis `GET` renvoient **200 OK**.

Une fois ces points validés, l’erreur 403 disparaît et les transformations se sauvegardent/récupèrent correctement. 🎉 