# 🔧 Guide de correction - Erreur Produit Wizard Frontend

## 📋 Problème identifié

Le frontend envoie des données mal formatées lors de la création d'un produit wizard. L'erreur se produit dans `useWizardProductUpload.ts` lors de l'appel à `/vendor/wizard-products`.

### Erreurs principales:

1. **`baseProductId` est undefined**
   - Le backend attend un nombre mais reçoit `undefined`
   - Message d'erreur: `"baseProductId invalide: undefined. Doit être un nombre."`

2. **Fallback vers `/vendor/products` avec structure incorrecte**
   - Le fallback essaie d'utiliser l'ancien endpoint avec un format incompatible
   - Message d'erreur: `"productStructure.adminProduct.images must be an object", "productStructure.adminProduct.sizes must be an array"`

## ✅ Solution complète

### 1. Corriger le mapping du `baseProductId`

Dans le fichier `useWizardProductUpload.ts`, le payload envoie plusieurs variations du même ID. Le backend attend spécifiquement `baseProductId` (en camelCase).

**Code actuel (incorrect):**
```typescript
// Dans le payload, vous avez:
{
  baseProductId: 33,
  adminProductId: 33,
  base_product_id: 33,  // ⚠️ Doublon en snake_case
  // ...
}
```

**Code corrigé:**
```typescript
// Assurez-vous que baseProductId est bien défini
const wizardPayload = {
  baseProductId: Number(adminProductId || baseProductId), // Conversion en nombre
  vendorName: vendorName,
  vendorDescription: vendorDescription,
  vendorPrice: Number(vendorPrice),
  vendorStock: Number(vendorStock || 10),
  selectedColors: selectedColors,
  selectedSizes: selectedSizes,
  productImages: productImages,
  forcedStatus: forcedStatus || 'DRAFT'
};

// Validation avant envoi
if (!wizardPayload.baseProductId || isNaN(wizardPayload.baseProductId)) {
  throw new Error('baseProductId est requis et doit être un nombre valide');
}
```

### 2. Structure attendue par le backend `/vendor/wizard-products`

```typescript
interface CreateWizardProductDto {
  baseProductId: number;          // ✅ REQUIS - ID du produit de base
  vendorName: string;              // ✅ REQUIS - Nom du produit
  vendorDescription: string;       // ✅ REQUIS - Description
  vendorPrice: number;             // ✅ REQUIS - Prix en FCFA
  vendorStock?: number;            // Optionnel - Stock initial (défaut: 10)
  selectedColors: Array<{          // ✅ REQUIS - Couleurs sélectionnées
    id: number;
    name: string;
    colorCode: string;
  }>;
  selectedSizes: Array<{           // ✅ REQUIS - Tailles sélectionnées
    id: number;
    sizeName: string;
  }>;
  productImages: {                 // ✅ REQUIS - Images du produit
    baseImage: string;             // Image principale en base64
    detailImages?: string[];       // Images de détail en base64
  };
  forcedStatus?: 'DRAFT' | 'PUBLISHED'; // Optionnel - Statut initial
}
```

### 3. Mise à jour du hook `useWizardProductUpload.ts`

```typescript
// Ligne ~270-280: Préparer le payload
const uploadProduct = async () => {
  try {
    // Validation des données requises
    if (!baseProductId && !adminProductId) {
      throw new Error('Un ID de produit de base est requis');
    }

    // Construction du payload avec la bonne structure
    const wizardPayload: CreateWizardProductDto = {
      // Utiliser le bon ID et le convertir en nombre
      baseProductId: Number(adminProductId || baseProductId),
      vendorName: vendorName.trim(),
      vendorDescription: vendorDescription.trim(),
      vendorPrice: Number(vendorPrice),
      vendorStock: vendorStock ? Number(vendorStock) : 10,
      selectedColors: selectedColors.map(color => ({
        id: Number(color.id),
        name: color.name,
        colorCode: color.colorCode
      })),
      selectedSizes: selectedSizes.map(size => ({
        id: Number(size.id),
        sizeName: size.sizeName
      })),
      productImages: {
        baseImage: productImages.baseImage,
        detailImages: productImages.detailImages || []
      },
      forcedStatus: forcedStatus || 'DRAFT'
    };

    // Validation finale avant envoi
    validateWizardPayload(wizardPayload);

    console.log('📤 Envoi du payload wizard:', wizardPayload);

    // Appel API
    const response = await fetch(`${API_URL}/vendor/wizard-products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(wizardPayload)
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('❌ Erreur wizard endpoint:', error);
      throw new Error(error.message || 'Erreur lors de la création du produit');
    }

    const result = await response.json();
    console.log('✅ Produit wizard créé:', result);
    return result;

  } catch (error) {
    console.error('❌ Erreur upload wizard product:', error);
    throw error;
  }
};

// Fonction de validation helper
const validateWizardPayload = (payload: CreateWizardProductDto) => {
  const errors: string[] = [];

  if (!payload.baseProductId || isNaN(payload.baseProductId)) {
    errors.push('baseProductId doit être un nombre valide');
  }

  if (!payload.vendorName || payload.vendorName.length === 0) {
    errors.push('vendorName est requis');
  }

  if (!payload.vendorDescription || payload.vendorDescription.length === 0) {
    errors.push('vendorDescription est requise');
  }

  if (!payload.vendorPrice || payload.vendorPrice <= 0) {
    errors.push('vendorPrice doit être supérieur à 0');
  }

  if (!payload.selectedColors || payload.selectedColors.length === 0) {
    errors.push('Au moins une couleur doit être sélectionnée');
  }

  if (!payload.selectedSizes || payload.selectedSizes.length === 0) {
    errors.push('Au moins une taille doit être sélectionnée');
  }

  if (!payload.productImages || !payload.productImages.baseImage) {
    errors.push('Une image principale est requise');
  }

  if (errors.length > 0) {
    throw new Error(`Validation échouée: ${errors.join(', ')}`);
  }
};
```

### 4. Supprimer le fallback vers `/vendor/products`

Le fallback vers l'ancien endpoint ne fonctionne pas car les structures sont incompatibles. Il vaut mieux échouer proprement:

```typescript
// ❌ SUPPRIMER CE CODE:
if (error.message.includes('baseProductId')) {
  console.log('↩️ Fallback vers /vendor/products avec isWizardProduct');
  // NE PAS faire de fallback
}

// ✅ REMPLACER PAR:
if (error.message.includes('baseProductId')) {
  // Afficher une erreur claire à l'utilisateur
  toast.error('Erreur: L\'ID du produit de base est manquant. Veuillez sélectionner un produit de base.');
  return;
}
```

### 5. Vérification dans `ProductCreationWizard.tsx`

Assurez-vous que l'ID du produit de base est bien passé au hook:

```typescript
// Ligne ~418
const handleSubmit = async () => {
  try {
    // Vérifier que adminProductId est bien défini
    if (!adminProductId && !baseProductId) {
      toast.error('Veuillez sélectionner un produit de base');
      return;
    }

    const result = await uploadProduct({
      baseProductId: adminProductId || baseProductId, // Passer l'ID correct
      // ... autres paramètres
    });

    // ...
  } catch (error) {
    console.error('Erreur création produit wizard:', error);
    toast.error(error.message);
  }
};
```

## 🎯 Points clés à retenir

1. **Toujours utiliser `/vendor/wizard-products`** pour les produits wizard
2. **`baseProductId` est REQUIS** et doit être un nombre
3. **Ne pas mélanger** les structures wizard et standard
4. **Valider les données** avant l'envoi
5. **Pas de fallback** vers l'ancien endpoint

## 📝 Checklist de validation

- [ ] `baseProductId` est un nombre valide
- [ ] `vendorName` n'est pas vide
- [ ] `vendorDescription` n'est pas vide
- [ ] `vendorPrice` est > 0
- [ ] Au moins une couleur sélectionnée
- [ ] Au moins une taille sélectionnée
- [ ] Image principale fournie (base64)
- [ ] Structure du payload correspond exactement au DTO

## 🔍 Debug rapide

Si l'erreur persiste, ajouter ces logs pour débugger:

```typescript
console.log('Debug - adminProductId:', adminProductId);
console.log('Debug - baseProductId:', baseProductId);
console.log('Debug - Type adminProductId:', typeof adminProductId);
console.log('Debug - Payload final:', JSON.stringify(wizardPayload, null, 2));
```

## 📞 Support

Si le problème persiste après ces corrections, vérifiez:
1. Que le produit de base existe bien dans la base de données
2. Que le token d'authentification est valide
3. Que le vendeur a les permissions nécessaires