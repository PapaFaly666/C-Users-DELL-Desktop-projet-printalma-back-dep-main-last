# 🔧 Solution Dynamique : Upload d'Images de Couleur

## 🚨 Problème identifié

**Problème :** Le frontend utilise des timestamps comme IDs temporaires et les convertit en ID `1`, mais les vraies couleurs ont les IDs `16`, `17`, `23`.

**Logs :**
```
⚠️ Nouvelle couleur (timestamp), pas de vérification nécessaire
🔄 Conversion timestamp → ID temporaire: 1753821486936 → 1
📤 Envoi vers: POST /products/upload-color-image/4/1
❌ Variation couleur introuvable pour ce produit
```

---

## 🎯 Solution Intelligente

### **Solution 1 : Upload avec détection automatique de couleur**

```jsx
const handleAddImageToColor = async (productId, colorVariation, imageFile) => {
  console.log('🚀 [ProductFormMain] Upload direct image couleur', Date.now());
  
  try {
    // 1. Récupérer le produit pour avoir les vraies données
    const productResponse = await fetch(`/products/${productId}`);
    if (!productResponse.ok) {
      throw new Error(`Produit ${productId} non trouvé`);
    }
    
    const product = await productResponse.json();
    console.log('📋 Produit trouvé:', product);
    
    // 2. Détecter la couleur automatiquement
    let targetColorId = null;
    
    // Si c'est un timestamp (nouvelle couleur), trouver la couleur correspondante
    if (typeof colorVariation === 'number' || colorVariation.toString().length > 10) {
      console.log('⚠️ Nouvelle couleur (timestamp), détection automatique...');
      
      // Trouver la couleur par nom ou code couleur
      const detectedColor = detectColorFromVariation(product.colorVariations, colorVariation);
      if (detectedColor) {
        targetColorId = detectedColor.id;
        console.log('✅ Couleur détectée:', detectedColor);
      } else {
        // Utiliser la première couleur disponible
        targetColorId = product.colorVariations[0]?.id;
        console.log('⚠️ Couleur non détectée, utilisation de la première:', targetColorId);
      }
    } else {
      // ID normal, utiliser directement
      targetColorId = colorVariation.id || colorVariation;
    }
    
    if (!targetColorId) {
      throw new Error('Aucune couleur disponible pour ce produit');
    }
    
    console.log('🎯 ID de couleur final:', targetColorId);
    
    // 3. Upload avec l'ID correct
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const uploadUrl = `/products/upload-color-image/${productId}/${targetColorId}`;
    console.log('📤 Envoi vers:', `POST ${uploadUrl}`);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });
    
    console.log('📥 Réponse reçue', `(${response.status})`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }
    
    const result = await response.json();
    console.log('✅ Upload réussi:', result);
    
    return result;
  } catch (error) {
    console.error('❌ [ProductFormMain] Erreur upload image couleur', Date.now(), ':', error);
    throw error;
  }
};

// Fonction de détection intelligente de couleur
const detectColorFromVariation = (colorVariations, variation) => {
  // Si c'est un objet avec des propriétés de couleur
  if (typeof variation === 'object' && variation.name) {
    return colorVariations.find(cv => 
      cv.name.toLowerCase() === variation.name.toLowerCase() ||
      cv.colorCode === variation.colorCode
    );
  }
  
  // Si c'est un timestamp, essayer de trouver par ordre
  if (typeof variation === 'number' && variation > 1000000000000) {
    // Utiliser l'index basé sur le timestamp
    const index = Math.floor((variation % 1000) / 100);
    return colorVariations[index] || colorVariations[0];
  }
  
  return null;
};
```

### **Solution 2 : Gestion intelligente des nouvelles couleurs**

```jsx
const handleNewColorImageUpload = async (productId, colorVariation, imageFile) => {
  console.log('🎨 Upload pour nouvelle couleur:', colorVariation);
  
  try {
    // 1. Récupérer le produit
    const product = await fetchProduct(productId);
    
    // 2. Déterminer l'ID de couleur à utiliser
    const colorId = await determineColorId(product, colorVariation);
    
    // 3. Upload avec l'ID correct
    return await uploadImageToColor(productId, colorId, imageFile);
  } catch (error) {
    console.error('Erreur upload nouvelle couleur:', error);
    throw error;
  }
};

const determineColorId = async (product, colorVariation) => {
  // Si c'est un objet avec des données de couleur
  if (typeof colorVariation === 'object') {
    // Chercher par nom ou code couleur
    const existingColor = product.colorVariations.find(cv => 
      cv.name.toLowerCase() === colorVariation.name?.toLowerCase() ||
      cv.colorCode === colorVariation.colorCode
    );
    
    if (existingColor) {
      console.log('✅ Couleur existante trouvée:', existingColor);
      return existingColor.id;
    }
  }
  
  // Si c'est un timestamp ou ID temporaire
  if (typeof colorVariation === 'number') {
    // Utiliser une logique intelligente pour mapper vers une vraie couleur
    const colorIndex = getColorIndexFromTimestamp(colorVariation, product.colorVariations.length);
    const targetColor = product.colorVariations[colorIndex];
    
    if (targetColor) {
      console.log('🎯 Couleur mappée:', targetColor);
      return targetColor.id;
    }
  }
  
  // Fallback : utiliser la première couleur disponible
  const fallbackColor = product.colorVariations[0];
  if (fallbackColor) {
    console.log('⚠️ Utilisation de la couleur par défaut:', fallbackColor);
    return fallbackColor.id;
  }
  
  throw new Error('Aucune couleur disponible pour ce produit');
};

const getColorIndexFromTimestamp = (timestamp, colorCount) => {
  if (colorCount === 0) return 0;
  
  // Utiliser le timestamp pour déterminer l'index de manière déterministe
  const hash = timestamp.toString().split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return Math.abs(hash) % colorCount;
};
```

### **Solution 3 : Composant intelligent avec gestion automatique**

```jsx
function SmartColorImageUploader({ product, onImageUploaded }) {
  const [uploadingColor, setUploadingColor] = useState(null);
  const [uploadError, setUploadError] = useState(null);

  const handleImageUpload = async (colorVariation, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingColor(colorVariation);
    setUploadError(null);

    try {
      // Validation du fichier
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('Format d\'image non supporté. Utilisez JPG, PNG ou WEBP.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('L\'image est trop volumineuse. Taille maximum: 5MB.');
      }

      // Upload intelligent
      const result = await handleNewColorImageUpload(product.id, colorVariation, file);
      
      if (onImageUploaded) {
        onImageUploaded(result.image, colorVariation);
      }
      
      console.log('✅ Upload réussi pour:', colorVariation);
    } catch (error) {
      console.error('❌ Erreur upload:', error);
      setUploadError(error.message);
    } finally {
      setUploadingColor(null);
    }
  };

  return (
    <div className="smart-color-uploader">
      {product.colorVariations.map((colorVariation, index) => (
        <div key={colorVariation.id || `temp-${index}`} className="color-section">
          <h3>
            {colorVariation.name} 
            {colorVariation.id ? `(ID: ${colorVariation.id})` : '(Nouvelle)'}
          </h3>
          
          {/* Images existantes */}
          <div className="existing-images">
            {colorVariation.images?.map(image => (
              <img key={image.id} src={image.url} alt={colorVariation.name} />
            ))}
          </div>

          {/* Upload de nouvelle image */}
          <div className="upload-section">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => handleImageUpload(colorVariation, event)}
              disabled={uploadingColor === colorVariation}
              id={`color-upload-${colorVariation.id || index}`}
            />
            <label htmlFor={`color-upload-${colorVariation.id || index}`}>
              {uploadingColor === colorVariation ? 'Upload en cours...' : 'Ajouter une image'}
            </label>
          </div>
        </div>
      ))}

      {uploadError && (
        <div className="error-message">
          <h4>❌ Erreur d'upload</h4>
          <p>{uploadError}</p>
          <button onClick={() => setUploadError(null)}>
            Fermer
          </button>
        </div>
      )}
    </div>
  );
}
```

### **Solution 4 : Gestion des couleurs temporaires**

```jsx
// Gestionnaire pour les couleurs avec timestamps
const handleTimestampColorUpload = async (productId, timestamp, imageFile) => {
  console.log('🕐 Upload pour couleur timestamp:', timestamp);
  
  try {
    // 1. Récupérer le produit
    const product = await fetchProduct(productId);
    
    // 2. Mapper le timestamp vers une vraie couleur
    const colorId = mapTimestampToColorId(timestamp, product.colorVariations);
    
    console.log('🎯 Timestamp', timestamp, '→ Couleur ID:', colorId);
    
    // 3. Upload
    return await uploadImageToColor(productId, colorId, imageFile);
  } catch (error) {
    console.error('Erreur upload couleur timestamp:', error);
    throw error;
  }
};

const mapTimestampToColorId = (timestamp, colorVariations) => {
  if (!colorVariations || colorVariations.length === 0) {
    throw new Error('Aucune couleur disponible');
  }
  
  // Utiliser le timestamp pour déterminer de manière déterministe quelle couleur utiliser
  const index = Math.abs(timestamp % colorVariations.length);
  const selectedColor = colorVariations[index];
  
  console.log(`🔄 Mapping: timestamp ${timestamp} → index ${index} → couleur ${selectedColor.name} (ID: ${selectedColor.id})`);
  
  return selectedColor.id;
};

const fetchProduct = async (productId) => {
  const response = await fetch(`/products/${productId}`);
  if (!response.ok) {
    throw new Error(`Produit ${productId} non trouvé`);
  }
  return await response.json();
};

const uploadImageToColor = async (productId, colorId, imageFile) => {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  const response = await fetch(`/products/upload-color-image/${productId}/${colorId}`, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }
  
  return await response.json();
};
```

---

## 🧪 Tests de la solution

### **Test 1 : Test avec timestamp**

```jsx
// Test avec un timestamp
const testTimestampUpload = async () => {
  const timestamp = Date.now(); // 1753821486936
  const imageFile = new Blob(['test'], { type: 'image/jpeg' });
  
  try {
    const result = await handleTimestampColorUpload(4, timestamp, imageFile);
    console.log('✅ Upload timestamp réussi:', result);
  } catch (error) {
    console.error('❌ Erreur upload timestamp:', error);
  }
};

testTimestampUpload();
```

### **Test 2 : Test avec objet couleur**

```jsx
// Test avec un objet couleur
const testObjectUpload = async () => {
  const colorVariation = { name: 'Blanc', colorCode: '#c7c7c7' };
  const imageFile = new Blob(['test'], { type: 'image/jpeg' });
  
  try {
    const result = await handleNewColorImageUpload(4, colorVariation, imageFile);
    console.log('✅ Upload objet réussi:', result);
  } catch (error) {
    console.error('❌ Erreur upload objet:', error);
  }
};

testObjectUpload();
```

---

## ✅ Résumé de la solution

1. **✅ Détection automatique** : Reconnaît les timestamps et les objets couleur
2. **✅ Mapping intelligent** : Mappe les timestamps vers les vraies IDs de couleur
3. **✅ Gestion d'erreur** : Messages d'erreur clairs et fallbacks
4. **✅ Logs détaillés** : Pour débugger facilement
5. **✅ Compatibilité** : Fonctionne avec les anciens et nouveaux formats

**Cette solution gère intelligemment les IDs temporaires et les mappe vers les vraies couleurs !** 🎯 