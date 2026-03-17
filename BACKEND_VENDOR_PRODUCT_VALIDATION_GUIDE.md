# 🛡️ Backend – Validation des Produits Vendeur

Ce guide explique les nouvelles règles de validation côté backend pour éviter les produits avec des noms/descriptions auto-générés.

---

## Problème résolu

**Avant** : Les produits vendeur étaient créés avec des noms comme :
- "Produit auto-généré pour positionnage design"
- "Test"
- "Default"
- "Untitled"

**Maintenant** : Le backend rejette automatiquement ces noms génériques.

---

## Validation `vendorName` (obligatoire)

### ✅ Règles acceptées
- Minimum 3 caractères
- Nom personnalisé et descriptif
- Exemples valides :
  ```
  "T-shirt Dragon Mystique"
  "Mug Café du Matin"
  "Poster Sunset Beach"
  ```

### ❌ Patterns rejetés
Le backend rejette les noms contenant :
- `produit.*auto.*généré`
- `auto.*généré.*pour.*position`
- `produit.*pour.*position`
- `design.*position`
- `^produit$` (juste "Produit")
- `^test$` (juste "Test")
- `^default$` (juste "Default")
- `^untitled$` (juste "Untitled")

---

## Validation `vendorDescription` (optionnelle)

### ✅ Règles acceptées
- Peut être vide/null
- Si fournie, doit être personnalisée
- Exemples valides :
  ```
  "T-shirt premium en coton bio avec design exclusif"
  "Mug en céramique parfait pour vos matins"
  "" (vide - accepté)
  ```

### ❌ Patterns rejetés
Même liste que pour `vendorName` si une description est fournie.

---

## Réponse d'erreur

Si validation échoue, le backend retourne `400 Bad Request` :

```json
{
  "statusCode": 400,
  "message": "Le nom du produit \"Produit auto-généré pour positionnage design\" semble être auto-généré. Veuillez saisir un nom personnalisé pour votre produit.",
  "error": "Bad Request"
}
```

---

## Frontend – Bonnes pratiques

### 1. Validation côté client
```ts
function validateProductName(name: string): string | null {
  if (!name || name.trim().length < 3) {
    return 'Le nom doit contenir au moins 3 caractères';
  }
  
  const forbiddenPatterns = [
    /produit.*auto.*généré/i,
    /auto.*généré.*pour.*position/i,
    /produit.*pour.*position/i,
    /design.*position/i,
    /^produit$/i,
    /^test$/i,
    /^default$/i,
    /^untitled$/i
  ];
  
  for (const pattern of forbiddenPatterns) {
    if (pattern.test(name)) {
      return 'Veuillez saisir un nom personnalisé pour votre produit';
    }
  }
  
  return null; // Valide
}
```

### 2. Suggestions auto
```ts
function generateProductSuggestion(designName: string, baseProductName: string): string {
  return `${baseProductName} ${designName}`;
  // Ex: "T-shirt Dragon Mystique"
}
```

### 3. Interface utilisateur
```tsx
<input
  type="text"
  placeholder="Ex: T-shirt Dragon Mystique"
  value={vendorName}
  onChange={(e) => setVendorName(e.target.value)}
  required
  minLength={3}
/>
{validationError && (
  <p className="text-red-500 text-sm">{validationError}</p>
)}
```

---

## Impact sur l'API

| Endpoint | Changement |
|----------|------------|
| `POST /vendor/products` | ✅ Validation ajoutée |
| `PUT /vendor/products/:id` | ✅ Validation ajoutée (si implémenté) |

Cette validation s'applique uniquement lors de la **création/modification** de produits vendeur. Les produits existants ne sont pas affectés.

---

**TL;DR** : Le backend refuse maintenant les noms de produits génériques. Le frontend doit s'assurer que l'utilisateur saisit un nom personnalisé avant d'envoyer la requête. 