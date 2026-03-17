# 🚑 Guide de Dépannage – Erreur 403 (Design Transforms)

> Ce document liste les **vérifications** et **commandes** pour éliminer les 403 lorsqu’on appelle
> `POST/GET /vendor/design-transforms`.

---

## 1. Checklist rapide

| ⚠️ Problème | Vérification | Action corrective |
|-------------|-------------|-------------------|
| ID invalide | L’ID envoyé est un `adminProductId` qui n’a pas encore de `VendorProduct` | Publier le produit vendeur ou utiliser l’ID vendeur existant |
| Cookie manquant | L’onglet *Network* ne montre pas `Cookie: auth_token=…` | Ajouter `withCredentials: true` dans Axios, ou se reconnecter |
| Produit d’un autre compte | L’ID appartient à un autre vendeur | Changer de compte ou d’ID |

---

## 2. Étapes de diagnostic

### 2.1 Récupérer les produits vendeurs

```bash
curl -b "auth_token=<JWT>" http://localhost:3004/vendor/products | jq '.data[] | {id, baseProductId, name}'
```

Résultat type :
```
{
  "id": 42,
  "baseProductId": 13,
  "name": "T-shirt Dragon Rouge"
}
```

* `id` → **vendorProductId** (à utiliser dans Design Transforms)
* `baseProductId` → ID catalogue admin (optionnel)

### 2.2 Tester le GET

```bash
curl -b "auth_token=<JWT>" \
  "http://localhost:3004/vendor/design-transforms/42?designUrl=https://res.cloudinary.com/app/design.png" -v
```
• 200 + données ⇒ OK  
• 200 + `data: null` ⇒ Pas encore sauvegardé (c’est normal)  
• 403 ⇒ l’ID n’appartient toujours pas au vendeur → revenir à l’étape 2.1

### 2.3 Publier le produit si nécessaire

Si aucun `vendorProduct` n’existe pour `baseProductId=13` :

```bash
curl -X POST http://localhost:3004/vendor/products \
  -b "auth_token=<JWT>" -H "Content-Type: application/json" \
  -d '{
    "baseProductId": 13,
    "productStructure": { /* données admin + design */ },
    "vendorName": "T-shirt Dragon Edition",
    "finalImagesBase64": {"design": "data:image/png;base64,…"}
  }'
```

Notez l’`id` renvoyé 👆 (ex. `42`). Répétez alors le test GET/POST.

---

## 3. Exemple complet côté frontend

```ts
// services/designTransforms.ts
export async function save(vendorProductId: number, designUrl: string, transforms: Record<string, any>) {
  await axios.post('/vendor/design-transforms', {
    productId: vendorProductId,
    designUrl,
    transforms,
    lastModified: Date.now(),
  }, { withCredentials: true });
}

export async function load(vendorProductId: number, designUrl: string) {
  const { data } = await axios.get(`/vendor/design-transforms/${vendorProductId}`, {
    params: { designUrl },
    withCredentials: true,
  });
  return data?.data;
}
```

---

## 4. Cas d’erreur résolus

| Cas | Ancien résultat | Correction |
|-----|-----------------|------------|
| Envoi de `adminProductId` sans produit publié | 403 | Publier le `vendorProduct` ou utiliser son `id` directement |
| Cookie expiré | 403 | Rafraîchir le login, vérifier `withCredentials` |
| Mauvais ID (copié d’un autre vendeur) | 403 | Utiliser l’id retourné par `/vendor/products` |

---

## 5. Résumé

• Toujours utiliser **`vendorProduct.id`** quand c’est possible.  
• S’assurer que le cookie JWT est envoyé (`withCredentials: true`).  
• Publier un produit vendeur si seul l’ID admin existe.  

Ces trois points éliminent 99 % des 403 sur les endpoints Design Transforms. Bonne intégration ! 🚀 