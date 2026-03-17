# 🔧 Solution - Erreur 500 lors de la création de produit

## ❌ Problème

Le frontend reçoit une erreur 500 lors de la création d'un produit avec des catégories.

**Erreur dans les logs:**
```
POST https://printalma-back-dep.onrender.com/products 500 (Internal Server Error)
```

**Payload envoyé par le frontend:**
```json
{
  "name": "Mugs à café",
  "categoryId": 11,
  "subcategoryId": 20,     // ❌ PROBLÈME ICI
  "variationId": 40
}
```

---

## 🔍 Cause du Problème

Le backend NestJS utilise le **camelCase** pour les noms de champs, mais le frontend envoie `subcategoryId` (tout en minuscules).

**Le backend attend:**
```typescript
{
  categoryId: number;
  subCategoryId: number;  // ✅ Avec majuscule au C
  variationId: number;
}
```

---

## ✅ Solution

### 1. Modifier le fichier `productService.ts`

**Trouver cette ligne (environ ligne 398):**
```typescript
// ❌ AVANT (INCORRECT)
const backendProductData = {
  name: productData.name,
  categoryId: parseInt(productData.categoryId),
  subcategoryId: productData.subcategoryId,  // ❌ Mauvais nom
  variationsCount: productData.variations.length
};
```

**Remplacer par:**
```typescript
// ✅ APRÈS (CORRECT)
const backendProductData = {
  name: productData.name,
  categoryId: parseInt(productData.categoryId),
  subCategoryId: productData.subcategoryId,  // ✅ Bon nom (camelCase)
  variationId: productData.variations?.[0]?.variationId, // Ajout de variationId
  variationsCount: productData.variations.length
};
```

---

### 2. Vérifier le formatage du payload final

**Trouver la section où le `backendProductData` est construit (environ ligne 405):**

```typescript
// ✅ Structure correcte attendue par le backend
const backendProductData = {
  name: productData.name,
  description: productData.description,
  price: productData.price,
  suggestedPrice: productData.suggestedPrice,
  stock: productData.stock,
  status: productData.status,
  categoryId: parseInt(productData.categoryId),        // ✅ Number
  subCategoryId: parseInt(productData.subcategoryId),  // ✅ camelCase + Number
  variationId: productData.variations?.[0]?.variationId, // ✅ Si variation existe
  variations: productData.variations.map(v => ({
    variationId: v.variationId,
    value: v.value,
    price: v.price,
    stock: v.stock,
    colorCode: v.colorCode
  })),
  genre: productData.genre,
  isReadyProduct: productData.isReadyProduct,
  sizes: productData.sizes
};
```

---

### 3. Correction complète du code

**Localisation:** `src/services/productService.ts` (ou équivalent)

**Section à corriger:**

```typescript
async createProduct(productData: any, images: File[]): Promise<any> {
  try {
    console.log('🔄 [ProductService] Création du produit...');

    // ... autres logs ...

    // ✅ CORRECTION: Utiliser subCategoryId au lieu de subcategoryId
    const backendProductData = {
      name: productData.name,
      description: productData.description,
      price: productData.price,
      suggestedPrice: productData.suggestedPrice,
      stock: productData.stock,
      status: productData.status,

      // ✅ IMPORTANT: Utiliser camelCase et convertir en number
      categoryId: productData.categoryId ? parseInt(productData.categoryId) : undefined,
      subCategoryId: productData.subcategoryId ? parseInt(productData.subcategoryId) : undefined,  // ✅ CORRIGÉ
      variationId: productData.variations?.[0]?.variationId,

      variations: productData.variations?.map((v: any) => ({
        variationId: v.variationId,
        value: v.value,
        price: v.price,
        stock: v.stock,
        colorCode: v.colorCode
      })),

      genre: productData.genre,
      isReadyProduct: productData.isReadyProduct,
      sizes: productData.sizes
    };

    // Ajouter au FormData
    const formData = new FormData();
    formData.append('productData', JSON.stringify(backendProductData));

    // Ajouter les images
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    // Envoyer la requête
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Erreur backend:', errorData);
      throw new Error(errorData.message || 'Erreur lors de la création');
    }

    return await response.json();

  } catch (error) {
    console.error('❌ [ProductService] Erreur création produit:', error);
    throw error;
  }
}
```

---

## 🧪 Test de Validation

### Payload Frontend (AVANT correction)
```json
{
  "categoryId": 11,
  "subcategoryId": 20,     // ❌ ERREUR
  "variationId": 40
}
```

### Payload Frontend (APRÈS correction)
```json
{
  "categoryId": 11,
  "subCategoryId": 20,     // ✅ CORRECT
  "variationId": 40
}
```

### Vérification dans la console

Avant l'envoi, vous devriez voir dans les logs :
```javascript
console.log('🔧 [DEBUG] backendProductData final:', backendProductData);
```

**Résultat attendu:**
```json
{
  "name": "Mugs à café",
  "categoryId": 11,
  "subCategoryId": 20,    // ✅ Avec majuscule
  "variationId": 40,
  "variations": [...],
  "genre": "UNISEXE",
  ...
}
```

---

## 🔍 Autres Vérifications

### 1. Type des IDs

Les IDs doivent être des **nombres** et non des **chaînes** :

```typescript
// ❌ INCORRECT
categoryId: "11"

// ✅ CORRECT
categoryId: 11
```

**Solution:**
```typescript
categoryId: parseInt(productData.categoryId)
subCategoryId: parseInt(productData.subcategoryId)
```

### 2. Gestion des champs optionnels

Si la catégorie/sous-catégorie/variation est optionnelle :

```typescript
const backendProductData = {
  // ... autres champs ...

  // ✅ Gestion des undefined
  categoryId: productData.categoryId ? parseInt(productData.categoryId) : undefined,
  subCategoryId: productData.subcategoryId ? parseInt(productData.subcategoryId) : undefined,
  variationId: productData.variations?.[0]?.variationId || undefined,
};

// Nettoyer les undefined avant envoi
const cleanedData = Object.fromEntries(
  Object.entries(backendProductData).filter(([_, v]) => v !== undefined)
);
```

---

## 📝 Checklist de Correction

- [ ] Remplacer `subcategoryId` par `subCategoryId` dans productService.ts
- [ ] Vérifier que les IDs sont convertis en `number` avec `parseInt()`
- [ ] Vérifier que `variationId` est bien inclus dans le payload
- [ ] Tester la création d'un produit avec catégorie
- [ ] Vérifier les logs de la console pour confirmer le bon format
- [ ] Tester la création d'un produit sans catégorie (optionnel)

---

## 🎯 Résumé

**Problème:** Mauvais nom de champ (`subcategoryId` au lieu de `subCategoryId`)

**Solution:** Utiliser le **camelCase** pour correspondre au backend NestJS

**Fichiers à modifier:**
- `src/services/productService.ts`

**Lignes à changer:**
```typescript
// AVANT
subcategoryId: productData.subcategoryId

// APRÈS
subCategoryId: parseInt(productData.subcategoryId)
```

---

## 🚀 Test Final

Après correction, créer un produit avec :
- Catégorie: ID 11
- Sous-catégorie: ID 20
- Variation: ID 40

**Résultat attendu:** HTTP 201 Created ✅

---

## 📞 Support

Si le problème persiste après cette correction :

1. Vérifier les logs backend pour voir le payload reçu
2. Vérifier que les IDs existent dans la base de données
3. Vérifier que les contraintes de clé étrangère sont respectées
4. Consulter `GUIDE_INTEGRATION_FRONTEND_PROTECTION_CATEGORIES.md` pour plus de détails
