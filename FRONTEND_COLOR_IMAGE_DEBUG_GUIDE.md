# 🔧 Guide de Débogage : Upload d'Images de Couleur

## 🚨 Problème identifié

**Erreur 404 :** `POST http://localhost:3004/products/upload-color-image/4/1 404 (Not Found)`

**Erreur de validation :** `Variation couleur introuvable pour ce produit`

---

## 🔍 Diagnostic

### 1. **Vérification de l'endpoint**

L'endpoint existe dans le contrôleur :
```typescript
@Post('upload-color-image/:productId/:colorId')
async uploadColorImage(
  @Param('productId', ParseIntPipe) productId: number,
  @Param('colorId', ParseIntPipe) colorId: number,
  @UploadedFile() image: Express.Multer.File
) {
  return this.productService.uploadColorImage(productId, colorId, image);
}
```

### 2. **Vérification du service**

Le service a été corrigé pour :
- ✅ Vérifier que le produit existe
- ✅ Vérifier que la variation de couleur existe
- ✅ Créer l'image dans la base de données
- ✅ Retourner les données complètes

---

## 🛠️ Solutions

### **Solution 1 : Vérifier les données**

```jsx
// Vérifier que le produit et la couleur existent
const checkProductAndColor = async (productId, colorId) => {
  try {
    // Vérifier le produit
    const productResponse = await fetch(`/products/${productId}`);
    if (!productResponse.ok) {
      throw new Error(`Produit ${productId} non trouvé`);
    }
    
    const product = await productResponse.json();
    console.log('📋 Produit:', product);
    
    // Vérifier la variation de couleur
    const colorVar = product.colorVariations?.find(cv => cv.id === colorId);
    if (!colorVar) {
      throw new Error(`Variation de couleur ${colorId} non trouvée pour le produit ${productId}`);
    }
    
    console.log('✅ Variation de couleur trouvée:', colorVar);
    return { product, colorVar };
  } catch (error) {
    console.error('❌ Erreur de vérification:', error.message);
    throw error;
  }
};
```

### **Solution 2 : Fonction d'upload corrigée**

```jsx
const uploadColorImageDirect = async (productId, colorId, imageFile) => {
  try {
    // 1. Vérifier les données d'abord
    await checkProductAndColor(productId, colorId);
    
    // 2. Préparer FormData
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // 3. Faire l'upload
    const response = await fetch(`/products/upload-color-image/${productId}/${colorId}`, {
      method: 'POST',
      body: formData
    });
    
    console.log('📡 Statut:', response.status);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de l\'upload');
    }
    
    const result = await response.json();
    console.log('✅ Upload réussi:', result);
    
    return result;
  } catch (error) {
    console.error('💥 Erreur upload:', error);
    throw error;
  }
};
```

### **Solution 3 : Composant avec gestion d'erreur**

```jsx
function ColorImageUploader({ productId, colorId, onImageUploaded }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [productData, setProductData] = useState(null);

  // Vérifier les données au chargement
  useEffect(() => {
    const checkData = async () => {
      try {
        const data = await checkProductAndColor(productId, colorId);
        setProductData(data);
        setError(null);
      } catch (err) {
        setError(err.message);
      }
    };
    
    checkData();
  }, [productId, colorId]);

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validation du fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Format d\'image non supporté. Utilisez JPG, PNG ou WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('L\'image est trop volumineuse. Taille maximum: 5MB.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadColorImageDirect(productId, colorId, file);
      
      if (onImageUploaded) {
        onImageUploaded(result.image);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (error) {
    return (
      <div className="error-container">
        <h4>❌ Erreur de validation</h4>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Recharger la page
        </button>
      </div>
    );
  }

  if (!productData) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="color-image-uploader">
      <div className="product-info">
        <p>Produit: {productData.product.name}</p>
        <p>Couleur: {productData.colorVar.name}</p>
      </div>
      
      <div className="upload-area">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          disabled={isUploading}
          id={`color-image-${colorId}`}
        />
        <label htmlFor={`color-image-${colorId}`}>
          {isUploading ? 'Upload en cours...' : 'Ajouter une image'}
        </label>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="upload-progress">
          <div className="spinner"></div>
          <span>Upload en cours...</span>
        </div>
      )}
    </div>
  );
}
```

---

## 🧪 Tests de diagnostic

### **Test 1 : Vérifier l'endpoint**

```bash
# Test avec curl
curl -X POST http://localhost:3004/products/upload-color-image/4/1 \
  -F "image=@test-image.jpg" \
  -H "Content-Type: multipart/form-data"
```

### **Test 2 : Vérifier les données**

```jsx
// Dans la console du navigateur
fetch('/products/4')
  .then(res => res.json())
  .then(product => {
    console.log('Produit:', product);
    const colorVar = product.colorVariations?.find(cv => cv.id === 1);
    console.log('Variation couleur:', colorVar);
  });
```

### **Test 3 : Test d'upload simple**

```jsx
// Test simple dans la console
const testUpload = async () => {
  const formData = new FormData();
  formData.append('image', new Blob(['test'], { type: 'image/jpeg' }));
  
  const response = await fetch('/products/upload-color-image/4/1', {
    method: 'POST',
    body: formData
  });
  
  console.log('Statut:', response.status);
  const result = await response.json();
  console.log('Résultat:', result);
};

testUpload();
```

---

## 🔧 Corrections apportées

### **1. Service corrigé**

```typescript
async uploadColorImage(productId: number, colorId: number, image: Express.Multer.File) {
  // ✅ Vérification du produit
  const product = await this.prisma.product.findUnique({ 
    where: { id: productId, isDelete: false } 
  });
  if (!product) throw new NotFoundException('Produit admin introuvable');
  
  // ✅ Vérification de la variation de couleur
  const colorVar = await this.prisma.colorVariation.findUnique({ 
    where: { id: colorId } 
  });
  if (!colorVar || colorVar.productId !== productId) {
    throw new NotFoundException('Variation couleur introuvable pour ce produit');
  }
  
  // ✅ Upload sur Cloudinary
  const uploadResult = await this.cloudinaryService.uploadImage(image);
  
  // ✅ Création dans la base de données
  const productImage = await this.prisma.productImage.create({
    data: {
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      naturalWidth: uploadResult.width,
      naturalHeight: uploadResult.height,
      view: 'Front',
      colorVariationId: colorId
    },
    include: { delimitations: true }
  });
  
  return {
    success: true,
    message: 'Image uploadée avec succès',
    image: productImage
  };
}
```

### **2. Validation améliorée**

- ✅ Vérification de l'existence du produit
- ✅ Vérification de l'existence de la variation de couleur
- ✅ Vérification de la relation produit-couleur
- ✅ Gestion d'erreur claire

---

## ✅ Résumé des corrections

1. **✅ Service corrigé** : Création de l'image dans la base de données
2. **✅ Validation améliorée** : Vérification des données avant upload
3. **✅ Gestion d'erreur** : Messages d'erreur clairs
4. **✅ Tests de diagnostic** : Scripts pour vérifier le fonctionnement

**L'endpoint devrait maintenant fonctionner correctement !** 🎉 