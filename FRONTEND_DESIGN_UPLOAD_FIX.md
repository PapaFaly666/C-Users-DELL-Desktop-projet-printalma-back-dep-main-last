# 🎨 Guide de Correction - Upload de Designs Frontend

## 🔥 **PROBLÈME URGENT - "Unexpected field"**

L'erreur `{"message":"Unexpected field","error":"Bad Request","statusCode":400}` sur l'endpoint `/api/designs` vient d'une incompatibilité entre le nom du champ FormData envoyé par le frontend et celui attendu par le backend.

---

## 🔍 **ANALYSE TECHNIQUE**

### **Backend - Configuration Multer**
```typescript
// Dans src/design/design.controller.ts:128
@UseInterceptors(FileInterceptor('file', multerConfig))
async createDesign(
    @UploadedFile() file: Express.Multer.File
) {
    // Le backend attend un champ nommé 'file'
}
```

### **Frontend - Problème probable**
```typescript
// ❌ SI le frontend fait ceci (nom incorrect)
const formData = new FormData();
formData.append('image', fileBlob);        // ❌ Nom incorrect
formData.append('design', fileBlob);       // ❌ Nom incorrect
formData.append('designFile', fileBlob);   // ❌ Nom incorrect
formData.append('designImage', fileBlob);  // ❌ Nom incorrect
```

---

## 🛠 **SOLUTIONS IMMÉDIATES**

### **Solution 1 : Corriger le nom du champ (RECOMMANDÉ)**

```typescript
// ✅ CORRECTION dans designService.ts
const createDesignViaApiDesigns = async (designData) => {
    const formData = new FormData();

    // 🔥 CRUCIAL : Le champ DOIT s'appeler 'file'
    formData.append('file', designData.fileBlob);  // ✅ Nom correct

    // Autres champs requis par l'API
    formData.append('name', designData.name);
    formData.append('description', designData.description || '');
    formData.append('price', designData.price.toString());
    formData.append('category', designData.category);

    if (designData.tags && designData.tags.length > 0) {
        formData.append('tags', designData.tags.join(','));
    }

    const response = await fetch('/api/designs', {
        method: 'POST',
        credentials: 'include', // Important pour les cookies
        body: formData // Pas de Content-Type header avec FormData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
};
```

### **Solution 2 : Utiliser l'endpoint qui fonctionne**

```typescript
// ✅ Alternative - Utiliser /vendor/designs (JSON + base64)
const createDesignViaVendorEndpoint = async (designData) => {
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
            category: designData.category,
            imageBase64: base64, // Format: "data:image/png;base64,..."
            price: designData.price,
            tags: designData.tags || []
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
    }

    return response.json();
};

// Fonction utilitaire pour convertir File en base64
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

## 📊 **COMPARAISON DES ENDPOINTS**

| Aspect | `/api/designs` | `/vendor/designs` |
|--------|----------------|-------------------|
| **Format** | `multipart/form-data` | `application/json` |
| **Image** | Fichier binaire | Base64 string |
| **Champ requis** | `'file'` | `'imageBase64'` |
| **Status** | ❌ Échoue actuellement | ✅ Fonctionne |
| **Avantage** | Upload direct | Pas de problème FormData |

---

## 🔧 **MODIFICATION RECOMMANDÉE - designService.ts**

```typescript
// ✅ Code à implémenter dans designService.ts
const createDesign = async (designData) => {
    console.log('🎨 Création design avec données:', designData);

    try {
        // Méthode 1 : Essayer /api/designs avec le bon nom de champ
        return await createDesignViaApiDesigns(designData);
    } catch (error) {
        console.warn('⚠️ Échec /api/designs:', error.message);

        // Méthode 2 : Fallback vers /vendor/designs
        console.log('🔄 Fallback vers /vendor/designs...');
        return await createDesignViaVendorEndpoint(designData);
    }
};

const createDesignViaApiDesigns = async (designData) => {
    console.log('📝 FormData préparée avec prix:', designData.price);

    const formData = new FormData();

    // 🔥 CORRECTION CRITIQUE : Nom du champ = 'file'
    formData.append('file', designData.fileBlob);
    formData.append('name', designData.name);
    formData.append('price', designData.price.toString());
    formData.append('category', designData.category);

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
    console.log('✅ Designs créé via /api/designs:', result);
    return result;
};
```

---

## 🧪 **TEST DE VALIDATION**

### **1. Vérifier le nom du champ dans le frontend**
```typescript
// Dans la fonction de création, ajouter ce debug
console.log('🔍 Analyse FormData:');
for (let [key, value] of formData.entries()) {
    console.log(`  ${key}:`, value);
}
// Vous devez voir : "file: File {...}"
```

### **2. Test curl pour valider**
```bash
# Test direct avec curl
curl -X POST \
  -H "Cookie: auth_token=your_auth_cookie" \
  -F "file=@test-image.png" \
  -F "name=Test Design" \
  -F "price=1500" \
  -F "category=logo" \
  http://localhost:3004/api/designs
```

### **3. Vérifier l'endpoint de fallback**
```bash
# Test de l'endpoint alternatif
curl -X POST \
  -H "Cookie: auth_token=your_auth_cookie" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","category":"ILLUSTRATION","imageBase64":"data:image/png;base64,iVBORw0...","price":1000}' \
  http://localhost:3004/vendor/designs
```

---

## ⚡ **ACTION IMMÉDIATE**

1. **Vérifier dans `designService.ts`** quel nom de champ est utilisé pour le fichier
2. **Changer le nom du champ** pour `'file'` si ce n'est pas déjà fait
3. **Tester l'upload** pour confirmer que l'erreur "Unexpected field" disparaît
4. **Alternative** : Utiliser uniquement `/vendor/designs` qui fonctionne déjà

La correction est **simple** mais **critique** pour résoudre l'erreur !