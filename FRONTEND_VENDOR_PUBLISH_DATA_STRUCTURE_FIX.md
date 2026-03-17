# Fix pour la Structure des Données Vendor Publish

## Problème Identifié

Le backend reçoit des données avec une structure incorrecte pour `finalImagesBase64`. Le frontend envoie:

```javascript
finalImagesBase64: {
  '287_340': 'data:image/png;base64,...',  // ❌ Clé basée sur imageKey
  '287_341': 'data:image/png;base64,...',
  '287_342': 'data:image/png;base64,...',
  // ...
}
```

Mais le backend s'attend à:

```javascript
finalImagesBase64: {
  'Blanc': 'data:image/png;base64,...',   // ✅ Clé basée sur nom de couleur
  'Blue': 'data:image/png;base64,...',
  'Noir': 'data:image/png;base64,...',
  // ...
}
```

## Logs d'Erreur

```
❌ Erreur response: {status: 400, statusText: 'Bad Request', errorData: {errors: ['Structure colorImages invalide ou manquante']}}
```

## Solution Frontend

### 1. Corriger la fonction `convertImagesToBase64` dans `vendorPublishService.ts`

**Problème actuel :**
```typescript
// ❌ INCORRECT - crée des clés avec imageKey
const result: Record<string, string> = {};
for (const [imageKey, blobUrl] of Object.entries(images)) {
  result[imageKey] = base64; // imageKey = "287_340"
}
```

**Solution :**
```typescript
// ✅ CORRECT - crée des clés avec nom de couleur
export async function convertImagesToBase64(
  images: Record<string, string>,
  colorMappings: Record<string, string> // Nouveau paramètre: imageKey -> colorName
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  
  for (const [imageKey, blobUrl] of Object.entries(images)) {
    const colorName = colorMappings[imageKey];
    if (!colorName) {
      console.warn(`⚠️ Aucune couleur trouvée pour imageKey: ${imageKey}`);
      continue;
    }
    
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      result[colorName] = base64; // ✅ Utilise le nom de couleur comme clé
      console.log(`✅ ${colorName} converti (${(blob.size / 1024).toFixed(0)}KB)`);
    } catch (error) {
      console.error(`❌ Erreur conversion ${colorName}:`, error);
    }
  }
  
  return result;
}
```

### 2. Corriger l'appel dans `useVendorPublish.ts`

**Problème actuel :**
```typescript
// ❌ INCORRECT - pas de mapping des couleurs
const imagesBase64 = await convertImagesToBase64(capturedImages);
```

**Solution :**
```typescript
// ✅ CORRECT - créer le mapping imageKey -> colorName
const colorMappings: Record<string, string> = {};

// Construire le mapping à partir des produits sélectionnés
selectedProducts.forEach(product => {
  product.productViews.forEach(view => {
    if (view.colors) {
      view.colors.forEach(color => {
        const imageKey = `${product.id}_${color.id}`;
        colorMappings[imageKey] = color.name;
      });
    }
  });
});

console.log('🗺️ Mapping couleurs:', colorMappings);
// Exemple: { '287_340': 'Blanc', '287_341': 'Blue', '287_342': 'Noir', '287_343': 'Rouge' }

const imagesBase64 = await convertImagesToBase64(capturedImages, colorMappings);
```

### 3. Validation de la Structure Finale

Ajouter cette validation avant l'envoi:

```typescript
// ✅ Validation structure avant envoi
function validatePayloadStructure(payload: any): boolean {
  console.log('🔍 Validation structure payload...');
  
  // Vérifier finalImages.colorImages
  if (!payload.finalImages?.colorImages) {
    console.error('❌ finalImages.colorImages manquant');
    return false;
  }
  
  // Vérifier finalImagesBase64
  if (!payload.finalImagesBase64) {
    console.error('❌ finalImagesBase64 manquant');
    return false;
  }
  
  // Vérifier correspondance des clés
  const colorImageKeys = Object.keys(payload.finalImages.colorImages);
  const base64Keys = Object.keys(payload.finalImagesBase64);
  
  console.log('🔑 Clés colorImages:', colorImageKeys);
  console.log('🔑 Clés base64:', base64Keys);
  
  const missingBase64 = colorImageKeys.filter(color => !base64Keys.includes(color));
  if (missingBase64.length > 0) {
    console.error('❌ Images base64 manquantes pour:', missingBase64);
    return false;
  }
  
  console.log('✅ Structure payload valide');
  return true;
}

// Utiliser avant l'envoi
if (!validatePayloadStructure(payload)) {
  throw new Error('Structure de données invalide');
}
```

## Code Complet Corrigé

### `vendorPublishService.ts`
```typescript
export async function convertImagesToBase64(
  images: Record<string, string>,
  colorMappings: Record<string, string>
): Promise<Record<string, string>> {
  console.log('🔄 Conversion de', Object.keys(images).length, 'images vers base64...');
  console.log('🗺️ Mappings couleurs:', colorMappings);
  
  const result: Record<string, string> = {};
  
  for (const [imageKey, blobUrl] of Object.entries(images)) {
    const colorName = colorMappings[imageKey];
    if (!colorName) {
      console.warn(`⚠️ Aucune couleur trouvée pour imageKey: ${imageKey}`);
      continue;
    }
    
    console.log(`📝 Conversion ${imageKey} -> ${colorName}...`);
    
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      
      result[colorName] = base64;
      console.log(`✅ ${colorName} converti (${(blob.size / 1024).toFixed(0)}KB)`);
    } catch (error) {
      console.error(`❌ Erreur conversion ${colorName}:`, error);
    }
  }
  
  console.log('✅ Toutes les images converties en base64');
  console.log('🔑 Clés finales:', Object.keys(result));
  return result;
}
```

### `useVendorPublish.ts`
```typescript
// Dans la fonction publishProducts
export const publishProducts = async () => {
  try {
    setIsPublishing(true);
    setPublishProgress(25);

    // 1. Capture des images
    const capturedImages = await captureAllProductImages();
    console.log('📸 Images capturées:', Object.keys(capturedImages).length, 'images');
    setPublishProgress(50);

    // 2. Créer le mapping imageKey -> colorName
    const colorMappings: Record<string, string> = {};
    selectedProducts.forEach(product => {
      product.productViews.forEach(view => {
        if (view.colors) {
          view.colors.forEach(color => {
            const imageKey = `${product.id}_${color.id}`;
            colorMappings[imageKey] = color.name;
          });
        }
      });
    });
    
    console.log('🗺️ Mapping couleurs créé:', colorMappings);

    // 3. Conversion avec le mapping
    const imagesBase64 = await convertImagesToBase64(capturedImages, colorMappings);
    console.log('✅ Images converties:', Object.keys(imagesBase64).length, 'images');
    setPublishProgress(75);

    // 4. Préparation des données avec validation
    const productsData = prepareProductsData(selectedProducts, capturedImages, imagesBase64);
    
    // 5. Validation avant envoi
    for (const productData of productsData) {
      if (!validatePayloadStructure(productData)) {
        throw new Error(`Structure invalide pour le produit ${productData.baseProductId}`);
      }
    }
    
    setPublishProgress(90);

    // 6. Envoi vers le backend
    const results = await publishAllProducts(productsData);
    console.log('📊 === RÉSULTATS DE PUBLICATION ===');
    
    return results;

  } catch (error) {
    console.error('❌ Erreur publication:', error);
    throw error;
  } finally {
    setIsPublishing(false);
    setPublishProgress(100);
  }
};

function validatePayloadStructure(payload: any): boolean {
  console.log('🔍 Validation structure pour produit', payload.baseProductId);
  
  if (!payload.finalImages?.colorImages) {
    console.error('❌ finalImages.colorImages manquant');
    return false;
  }
  
  if (!payload.finalImagesBase64) {
    console.error('❌ finalImagesBase64 manquant');
    return false;
  }
  
  const colorImageKeys = Object.keys(payload.finalImages.colorImages);
  const base64Keys = Object.keys(payload.finalImagesBase64);
  
  console.log('🔑 Clés colorImages:', colorImageKeys);
  console.log('🔑 Clés base64:', base64Keys);
  
  const missingBase64 = colorImageKeys.filter(color => !base64Keys.includes(color));
  if (missingBase64.length > 0) {
    console.error('❌ Images base64 manquantes pour:', missingBase64);
    return false;
  }
  
  console.log('✅ Structure payload valide pour produit', payload.baseProductId);
  return true;
}
```

## Test Rapide

Après ces corrections, vous devriez voir dans les logs:

```
🗺️ Mapping couleurs créé: {
  '287_340': 'Blanc',
  '287_341': 'Blue', 
  '287_342': 'Noir',
  '287_343': 'Rouge'
}

🔑 Clés finales: ['Blanc', 'Blue', 'Noir', 'Rouge']

🔑 Clés colorImages: ['Blanc', 'Blue', 'Noir', 'Rouge']
🔑 Clés base64: ['Blanc', 'Blue', 'Noir', 'Rouge']
✅ Structure payload valide
```

Au lieu de l'erreur actuelle avec des clés comme `'287_340'`. 