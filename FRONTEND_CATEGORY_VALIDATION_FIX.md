# 🏷️ Guide de Correction - Validation des Catégories

## 🔥 **NOUVEAU PROBLÈME IDENTIFIÉ**

L'erreur "Unexpected field" est résolue ! Mais maintenant l'API `/api/designs` rejette la création avec des erreurs de validation de catégorie :

```json
{
  "message": [
    "L'ID de la catégorie doit être supérieur à 0",
    "L'ID de la catégorie doit être un nombre entier",
    "La catégorie est requise"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🔍 **ANALYSE DU PROBLÈME**

### **Problème détecté**
- Le frontend envoie probablement la catégorie comme **string** (ex: `"Mangas"`)
- Le backend `/api/designs` attend un **ID numérique** de catégorie (ex: `5`)
- Différence avec `/vendor/designs` qui accepte les strings

### **Backend - DTO de validation**
```typescript
// Dans src/design/dto/create-design.dto.ts:66-71
@ApiProperty({
  description: 'ID de la catégorie du design (créée par l\'admin)',
  example: 1,
  type: 'number'
})
@IsNotEmpty({ message: 'La catégorie est requise' })
@Type(() => Number)
@IsInt({ message: 'L\'ID de la catégorie doit être un nombre entier' })
@Min(1, { message: 'L\'ID de la catégorie doit être supérieur à 0' })
categoryId: number; // 🔥 ATTEND UN ID NUMÉRIQUE, PAS UNE STRING
```

---

## 🛠 **SOLUTIONS POUR LE FRONTEND**

### **Solution 1 : Mapper les noms vers les IDs (RECOMMANDÉ)**

```typescript
// ✅ Créer un mapping des catégories dans designService.ts
const CATEGORY_MAPPING = {
    'Mangas': 5,
    'ILLUSTRATION': 1,
    'LOGO': 2,
    'PATTERN': 3,
    'TYPOGRAPHY': 4,
    'ABSTRACT': 6,
    // Ajouter d'autres mappings selon les catégories disponibles
};

// ✅ Fonction pour convertir nom → ID
const getCategoryId = (categoryName) => {
    const categoryId = CATEGORY_MAPPING[categoryName];
    if (!categoryId) {
        console.warn(`⚠️ Catégorie inconnue: ${categoryName}`);
        throw new Error(`Catégorie "${categoryName}" non reconnue`);
    }
    console.log(`🏷️ Conversion categoryId ${categoryId} -> "${categoryName}"`);
    return categoryId;
};

// ✅ Modification de createDesignViaApiDesigns
const createDesignViaApiDesigns = async (designData) => {
    console.log('📝 FormData préparée avec prix:', designData.price);

    const formData = new FormData();

    // ✅ Correction critique : Utiliser categoryId au lieu de category
    formData.append('file', designData.fileBlob);
    formData.append('name', designData.name);
    formData.append('price', designData.price.toString());
    formData.append('categoryId', getCategoryId(designData.category).toString()); // 🔥 CHANGEMENT ICI

    if (designData.description) {
        formData.append('description', designData.description);
    }

    if (designData.tags && designData.tags.length > 0) {
        formData.append('tags', designData.tags.join(','));
    }

    const response = await fetch('http://localhost:3004/api/designs', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    console.log('📡 Réponse /api/designs:', response.status, response.statusText);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Erreur /api/designs:', errorData);
        throw new Error(`API designs error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    const result = await response.json();
    console.log('✅ Design créé via /api/designs:', result);
    return result;
};
```

### **Solution 2 : Récupérer les catégories dynamiquement**

```typescript
// ✅ Fonction pour récupérer les catégories de l'API
const getDesignCategories = async () => {
    try {
        const response = await fetch('/api/design-categories', {
            credentials: 'include'
        });

        if (response.ok) {
            const categories = await response.json();
            return categories.data || categories;
        }

        console.warn('⚠️ Impossible de récupérer les catégories, utilisation du fallback');
        return [];
    } catch (error) {
        console.error('❌ Erreur récupération catégories:', error);
        return [];
    }
};

// ✅ Cache des catégories
let categoriesCache = null;

// ✅ Fonction pour trouver l'ID d'une catégorie par nom
const findCategoryId = async (categoryName) => {
    if (!categoriesCache) {
        categoriesCache = await getDesignCategories();
    }

    const category = categoriesCache.find(cat =>
        cat.name === categoryName ||
        cat.name.toLowerCase() === categoryName.toLowerCase()
    );

    if (!category) {
        throw new Error(`Catégorie "${categoryName}" non trouvée dans l'API`);
    }

    console.log(`🏷️ Catégorie trouvée: ${categoryName} → ID ${category.id}`);
    return category.id;
};

// ✅ Usage dans createDesignViaApiDesigns
const createDesignViaApiDesigns = async (designData) => {
    const categoryId = await findCategoryId(designData.category);

    const formData = new FormData();
    formData.append('file', designData.fileBlob);
    formData.append('name', designData.name);
    formData.append('price', designData.price.toString());
    formData.append('categoryId', categoryId.toString()); // ID numérique

    // ... reste du code
};
```

### **Solution 3 : Utiliser uniquement l'endpoint qui fonctionne**

```typescript
// ✅ Simplification - Supprimer /api/designs et utiliser seulement /vendor/designs
const createDesign = async (designData) => {
    console.log('🎨 Création design - utilisation de /vendor/designs uniquement');

    try {
        // Convertir le fichier en base64
        const base64 = await fileToBase64(designData.fileBlob);

        const response = await fetch('/vendor/designs', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: designData.name,
                description: designData.description || '',
                category: designData.category, // ✅ Accepte les strings
                imageBase64: base64,
                price: designData.price,
                tags: designData.tags || []
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Vendor designs error: ${response.status} - ${JSON.stringify(errorData)}`);
        }

        const result = await response.json();
        console.log('✅ Design créé via /vendor/designs:', result);
        return result;
    } catch (error) {
        console.error('❌ Erreur création design:', error);
        throw error;
    }
};

// Fonction utilitaire
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
```

---

## 🔧 **MODIFICATION RECOMMANDÉE**

```typescript
// ✅ Code de production recommandé pour designService.ts
const CATEGORY_MAPPING = {
    'Mangas': 5,
    'ILLUSTRATION': 1,
    'LOGO': 2,
    'PATTERN': 3,
    'TYPOGRAPHY': 4,
    'ABSTRACT': 6
};

const getCategoryId = (categoryName) => {
    const categoryId = CATEGORY_MAPPING[categoryName];
    if (!categoryId) {
        console.warn(`⚠️ Catégorie "${categoryName}" non reconnue, fallback vers /vendor/designs`);
        return null;
    }
    console.log(`🏷️ Conversion categoryId ${categoryId} -> "${categoryName}"`);
    return categoryId;
};

const createDesign = async (designData) => {
    const categoryId = getCategoryId(designData.category);

    if (categoryId) {
        // Essayer /api/designs avec l'ID numérique
        try {
            return await createDesignViaApiDesigns({ ...designData, categoryId });
        } catch (error) {
            console.warn('⚠️ Échec /api/designs:', error.message);
        }
    }

    // Fallback vers /vendor/designs avec string
    console.log('🔄 Fallback vers /vendor/designs...');
    return await createDesignViaVendorEndpoint(designData);
};

const createDesignViaApiDesigns = async (designData) => {
    const formData = new FormData();
    formData.append('file', designData.fileBlob);
    formData.append('name', designData.name);
    formData.append('price', designData.price.toString());
    formData.append('categoryId', designData.categoryId.toString()); // ID numérique

    if (designData.description) {
        formData.append('description', designData.description);
    }

    const response = await fetch('/api/designs', {
        method: 'POST',
        credentials: 'include',
        body: formData
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API error: ${response.status} - ${JSON.stringify(errorData)}`);
    }

    return response.json();
};
```

---

## 🧪 **TEST DE VALIDATION**

### **1. Vérifier le mapping des catégories**
```typescript
console.log('🧪 Test mapping catégories:');
console.log('Mangas →', getCategoryId('Mangas')); // Doit retourner 5
console.log('ILLUSTRATION →', getCategoryId('ILLUSTRATION')); // Doit retourner 1
```

### **2. Test curl avec categoryId**
```bash
# Test avec l'ID numérique
curl -X POST \
  -H "Cookie: auth_token=your_cookie" \
  -F "file=@test.png" \
  -F "name=Test Design" \
  -F "price=1500" \
  -F "categoryId=5" \
  http://localhost:3004/api/designs
```

---

## ⚡ **ACTION IMMÉDIATE**

1. **Identifier les catégories disponibles** dans le système
2. **Créer le mapping** nom → ID dans le frontend
3. **Modifier le code** pour envoyer `categoryId` au lieu de `category`
4. **Tester** que l'erreur de validation disparaît

La solution est **simple** : convertir les noms de catégories en IDs numériques ! 🎯