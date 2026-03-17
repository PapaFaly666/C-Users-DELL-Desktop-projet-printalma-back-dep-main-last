# 🔥 GUIDE FRONTEND — Correction Définitive des 404 / 403

Ce guide explique **pas-à-pas** comment corriger les erreurs `404` / `403` sur votre frontend React (ou autre) lors de l'accès aux ressources PrintAlma **avec `credentials: include`**.

> 💡 TL;DR : Les routes ont **deux groupes** :
> 1. **Groupe « vendor »** → `/vendor/...` (CRUD designs & produits)
> 2. **Groupe « API »** → `/api/...` (design-position & autres outils internes)

---

## 1. Comprendre la structure des routes

| Fonction | Route | Méthode | Auth | Notes |
|----------|-------|---------|------|-------|
| Connexion | `/auth/login` | POST | public | Renvoie cookie **`auth_token`** (httpOnly) |
| Profil utilisateur | `/auth/profile` | GET | cookie | Utilisé pour savoir si l'utilisateur est connecté |
| Designs vendeur (Architecture v2) | `/vendor/designs` | GET / POST | cookie | CRUD des designs « bruts » |
| Produits vendeur (Arch v2) | `/vendor/products` | GET / POST | cookie | CRUD des produits liés aux designs |
| Position design **isolée** | `/api/vendor-products/:vpId/designs/:dId/position/direct` | PUT / GET | cookie | Sauvegarde/récupération de la position |
| Debug permissions positions | `/api/vendor-products/:vpId/designs/:dId/position/debug` | GET | cookie | Retourne un diagnostic complet |

### Pourquoi 2 préfixes ?

* **`/vendor`** = « Architecture v2 » → toutes les nouvelles routes métier du vendeur.
* **`/api`** = legacy / outils internes → réutilisé pour la nouvelle table *ProductDesignPosition*.

---

## 2. Configuration Axios / fetch

```ts
// src/services/apiClient.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3004', // 🌐 Mettez votre URL backend
  withCredentials: true,          // ← gère le cookie auth_token
});

// Intercepteur simple (logs)
api.interceptors.request.use((config) => {
  console.log('🚀 [API] Request', config.method?.toUpperCase(), config.url);
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('❌ [API] Error', err.response?.status, err.response?.data || err.message);
    return Promise.reject(err);
  },
);
```

**Important :** *Pas* de `Authorization: Bearer ...` → tout passe par le cookie `auth_token`.

---

## 3. Séquence Login → Fetch sécurisés

```ts
// 1️⃣ LOGIN
await api.post('/auth/login', { email, password });
// => le backend pose le cookie httpOnly « auth_token »

// 2️⃣ VÉRIFIER LE PROFIL
const { data: user } = await api.get('/auth/profile');
console.log('👤 Connected as', user.email);
```

> Si `/auth/profile` renvoie `404` : cookie manquant ou mauvais domaine → vérifiez **CORS** & **credentials**.

### Vérifier CORS (NestJS)
```ts
// main.ts côté backend
app.enableCors({
  origin: [ 'http://localhost:3000' ], // Votre front
  credentials: true,                  // ← important !
});
```

---

## 4. Exemples concrets

### 4.1 Lister mes produits
```ts
const { data } = await api.get('/vendor/products');
console.log('🛍️ Mes produits', data);
```

### 4.2 Sauvegarder la position d'un design (isolation)
```ts
const vendorProductId = 42; // ID VendorProduct
const designId = 99;        // ID Design

await api.put(
  `/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`,
  { x: 120, y: 80, scale: 0.6, rotation: 0 }
);
```

### 4.3 Récupérer la position
```ts
const { data } = await api.get(
  `/api/vendor-products/${vendorProductId}/designs/${designId}/position/direct`
);
console.log('📍 Position', data.data.position);
```

### 4.4 Diagnostic auto 403 / 404
Utilisez la classe `PositionDebugger` (cf. fichier `utils/positionDebugger.js`).

```ts
const debug = new PositionDebugger(api);
await debug.diagnosePermissionError(vendorProductId, designId);
```

---

## 5. Checklist rapide

- [ ] **Login** via `/auth/login` (POST) → cookie reçu ?
- [ ] **CORS** activé avec `credentials: true` côté backend
- [ ] **BaseURL** correcte (`http://localhost:3004` par ex.)
- [ ] **Routes** utilisées :
  - `/auth/profile` ✅
  - `/vendor/designs` ✅
  - `/vendor/products` ✅
  - `/api/vendor-products/:vpId/designs/:dId/position/direct` ✅
  - `/api/vendor-products/:vpId/designs/:dId/position/debug` ✅

---

## 6. Résolution des erreurs courantes

| Erreur | Cause la + probable | Solution |
|--------|---------------------|----------|
| `404 Cannot GET /vendor/products` | Mauvais cookie ou JWT manquant | Vérifiez `withCredentials` et CORS |
| `404 Cannot GET /auth/profile` | Non connecté | Faites un login préalable |
| `403 Ce produit ne vous appartient pas` | Mauvais `vendorProductId` ou `designId` | Utilisez `/vendor/products` & `/vendor/designs` pour récupérer les bons IDs ou `PositionDebugger.autoFix()` |
| `400 Validation failed (numeric string expected)` | Paramètre de route non numérique | Assurez-vous d'envoyer des `number` (parseInt) |

---

## 7. Exemple React Hook minimal

```ts
import { useEffect, useState } from 'react';
import { api } from '../services/apiClient';

export function useVendorProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/vendor/products')
      .then(res => setProducts(res.data.data?.products || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { products, loading };
}
```

---

## 8. Conclusion

En appliquant ces corrections :

1. **Plus de 404** : routes exactes, cookie inclus 🙌
2. **Plus de 403** : `PositionDebugger` + IDs corrects ⚔️
3. **Positions isolées** parfaitement fonctionnelles 🎯

> **Happy coding !** 🥳 
 
 
 
 