# 🎨 Guide Frontend - Intégration Publication Vendeur

## 📋 Vue d'ensemble

Ce guide détaille l'intégration frontend avec le nouveau système de **publication vendeur avec images multi-couleurs**. Le backend est maintenant prêt à traiter les données complètes envoyées par le frontend.

## 🚀 Endpoint Principal

```javascript
POST /api/vendor/publish
Content-Type: application/json
Authorization: Bearer <jwt_token>
```

## 🔧 Solution au Problème Blob URLs

**Problème :** Les blob URLs générées côté frontend ne sont pas accessibles depuis le serveur.

**Solution implémentée :** Conversion en base64 avant envoi au backend.

### Fonction de Conversion Base64

```javascript
// Fonction utilitaire pour convertir blob en base64
const convertBlobToBase64 = async (blobUrl) => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Erreur conversion blob:', error);
    throw error;
  }
};

// Fonction pour convertir toutes les images capturées
const convertAllImages = async (capturedImages) => {
  const base64Images = {};
  
  for (const [key, blobUrl] of Object.entries(capturedImages)) {
    try {
      console.log(`🔄 Conversion ${key}:`, blobUrl);
      const base64 = await convertBlobToBase64(blobUrl);
      base64Images[key] = base64;
      console.log(`✅ ${key} converti`);
    } catch (error) {
      console.error(`❌ Erreur conversion ${key}:`, error);
      throw new Error(`Échec conversion image ${key}`);
    }
  }
  
  return base64Images;
};
```

## 📤 Fonction de Publication Complète

```javascript
// Service de publication vendeur
const publishVendorProduct = async (productData, capturedImages) => {
  try {
    console.log('📦 Début publication produit vendeur');
    
    // 1. Convertir toutes les images en base64
    console.log('🔄 Conversion des images...');
    const finalImagesBase64 = await convertAllImages(capturedImages);
    
    // 2. Préparer le payload complet
    const payload = {
      // Données du produit de base
      baseProductId: productData.baseProductId,
      designUrl: productData.designUrl, // blob URL (pour référence)
      designFile: {
        name: productData.designFile.name,
        size: productData.designFile.size,
        type: productData.designFile.type
      },
      
      // Images multi-couleurs avec métadonnées
      finalImages: {
        colorImages: productData.finalImages.colorImages,
        defaultImage: productData.finalImages.defaultImage,
        statistics: productData.finalImages.statistics
      },
      
      // Informations vendeur
      vendorPrice: productData.vendorPrice,
      vendorName: productData.vendorName,
      vendorDescription: productData.vendorDescription,
      vendorStock: productData.vendorStock,
      basePriceAdmin: productData.basePriceAdmin,
      
      // Sélections
      selectedSizes: productData.selectedSizes,
      selectedColors: productData.selectedColors,
      
      // Aperçu et métadonnées
      previewView: productData.previewView,
      publishedAt: new Date().toISOString(),
      
      // 🔑 SOLUTION : Images en base64 pour traitement serveur
      finalImagesBase64: finalImagesBase64
    };
    
    console.log('📊 Payload préparé:', {
      baseProductId: payload.baseProductId,
      totalImages: payload.finalImages.statistics.totalImagesGenerated,
      imagesBase64Count: Object.keys(finalImagesBase64).length
    });
    
    // 3. Envoyer au backend
    const response = await fetch('/api/vendor/publish', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}` // Votre système d'auth
      },
      body: JSON.stringify(payload)
    });
    
    // 4. Traiter la réponse
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur de publication');
    }
    
    console.log('🎉 Produit publié avec succès:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur publication:', error);
    throw error;
  }
};
```

## 🖼️ Exemple d'Usage avec Données Réelles

```javascript
// Exemple d'intégration dans votre composant
const handlePublishProduct = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Données récupérées de votre état/formulaire
    const productData = {
      baseProductId: selectedProduct.id,
      designUrl: designBlobUrl,
      designFile: {
        name: uploadedDesign.name,
        size: uploadedDesign.size,
        type: uploadedDesign.type
      },
      finalImages: {
        colorImages: {
          'Rouge': {
            colorInfo: { id: 12, name: 'Rouge', colorCode: '#ff0000' },
            imageUrl: capturedImages['Rouge'],
            imageKey: `${selectedProduct.id}_12`
          },
          'Vert': {
            colorInfo: { id: 13, name: 'Vert', colorCode: '#00ff00' },
            imageUrl: capturedImages['Vert'],
            imageKey: `${selectedProduct.id}_13`
          },
          'Noir': {
            colorInfo: { id: 14, name: 'Noir', colorCode: '#000000' },
            imageUrl: capturedImages['Noir'],
            imageKey: `${selectedProduct.id}_14`
          }
        },
        defaultImage: capturedImages['default'] ? {
          imageUrl: capturedImages['default'],
          imageKey: `${selectedProduct.id}_default`
        } : undefined,
        statistics: {
          totalColorImages: Object.keys(capturedImages).filter(k => k !== 'default').length,
          hasDefaultImage: !!capturedImages['default'],
          availableColors: Object.keys(capturedImages).filter(k => k !== 'default'),
          totalImagesGenerated: Object.keys(capturedImages).length
        }
      },
      vendorPrice: formData.price,
      vendorName: formData.name,
      vendorDescription: formData.description,
      vendorStock: formData.stock,
      basePriceAdmin: selectedProduct.basePrice,
      selectedSizes: selectedSizes,
      selectedColors: selectedColors,
      previewView: {
        viewType: 'FRONT',
        url: previewImageUrl,
        delimitations: delimitations
      }
    };
    
    // Publication
    const result = await publishVendorProduct(productData, capturedImages);
    
    // Succès
    showSuccessMessage(`Produit publié avec succès ! ID: ${result.productId}`);
    
    // Redirection ou mise à jour UI
    router.push(`/vendor/products/${result.productId}`);
    
  } catch (error) {
    console.error('Erreur publication:', error);
    setError(error.message);
  } finally {
    setLoading(false);
  }
};
```

## 📊 Gestion des Réponses

### Réponse de Succès

```javascript
{
  "success": true,
  "productId": 123,
  "message": "Produit publié avec succès",
  "imagesProcessed": 4,
  "imageDetails": {
    "totalImages": 4,
    "colorImages": 3,
    "defaultImage": 1,
    "uploadedToCloudinary": 4
  }
}
```

### Gestion des Erreurs

```javascript
// Fonction de gestion d'erreurs
const handlePublishError = (error) => {
  console.error('Erreur publication:', error);
  
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        // Erreurs de validation
        const errors = data.errors || [data.message];
        setValidationErrors(errors);
        showErrorMessage(`Données invalides: ${errors.join(', ')}`);
        break;
        
      case 401:
        // Non authentifié
        showErrorMessage('Session expirée, veuillez vous reconnecter');
        redirectToLogin();
        break;
        
      case 403:
        // Pas les droits vendeur
        showErrorMessage('Accès refusé - Compte vendeur requis');
        break;
        
      case 404:
        // Produit de base non trouvé
        showErrorMessage('Produit de base introuvable');
        break;
        
      default:
        showErrorMessage('Erreur serveur, veuillez réessayer');
    }
  } else {
    // Erreur réseau ou autre
    showErrorMessage('Erreur de connexion, vérifiez votre réseau');
  }
};
```

## 🔄 Hook React Personnalisé

```javascript
// Hook pour la publication vendeur
const useVendorPublish = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  
  const publishProduct = async (productData, capturedImages) => {
    try {
      setLoading(true);
      setError(null);
      
      const publishResult = await publishVendorProduct(productData, capturedImages);
      
      setResult(publishResult);
      return publishResult;
      
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  const reset = () => {
    setLoading(false);
    setError(null);
    setResult(null);
  };
  
  return {
    publishProduct,
    loading,
    error,
    result,
    reset
  };
};

// Utilisation dans un composant
const VendorPublishForm = () => {
  const { publishProduct, loading, error, result } = useVendorPublish();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await publishProduct(formData, capturedImages);
      // Succès géré par le hook
    } catch (error) {
      // Erreur gérée par le hook
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Votre formulaire */}
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      {result && (
        <div className="success-message">
          Produit publié ! ID: {result.productId}
        </div>
      )}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Publication...' : 'Publier le produit'}
      </button>
    </form>
  );
};
```

## 📝 Validation Frontend

```javascript
// Validation avant envoi
const validatePublishData = (productData, capturedImages) => {
  const errors = [];
  
  // Vérifications de base
  if (!productData.baseProductId) {
    errors.push('Produit de base requis');
  }
  
  if (!productData.vendorPrice || productData.vendorPrice <= 0) {
    errors.push('Prix vendeur requis et positif');
  }
  
  if (productData.vendorPrice < productData.basePriceAdmin) {
    errors.push(`Prix vendeur (${productData.vendorPrice}) inférieur au minimum (${productData.basePriceAdmin})`);
  }
  
  if (!productData.selectedColors.length) {
    errors.push('Au moins une couleur requise');
  }
  
  if (!productData.selectedSizes.length) {
    errors.push('Au moins une taille requise');
  }
  
  // Vérification des images
  if (!Object.keys(capturedImages).length) {
    errors.push('Aucune image générée');
  }
  
  // Vérifier que toutes les couleurs ont une image
  const missingImages = productData.selectedColors
    .map(c => c.name)
    .filter(colorName => !capturedImages[colorName]);
    
  if (missingImages.length) {
    errors.push(`Images manquantes: ${missingImages.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Utilisation
const handlePublish = async () => {
  const validation = validatePublishData(productData, capturedImages);
  
  if (!validation.isValid) {
    setValidationErrors(validation.errors);
    return;
  }
  
  // Procéder à la publication
  await publishProduct(productData, capturedImages);
};
```

## 🎯 API de Consultation

### Récupérer les Produits du Vendeur

```javascript
// GET /api/vendor/products
const getVendorProducts = async (options = {}) => {
  const {
    limit = 20,
    offset = 0,
    status = 'all',
    search = ''
  } = options;
  
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    status,
    ...(search && { search })
  });
  
  const response = await fetch(`/api/vendor/products?${params}`, {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  return response.json();
};

// Utilisation avec pagination
const VendorProductsList = () => {
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(false);
  
  const loadProducts = async (page = 0) => {
    setLoading(true);
    try {
      const result = await getVendorProducts({
        limit: 20,
        offset: page * 20
      });
      
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  return (
    <div>
      {/* Liste des produits */}
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.vendorName}</h3>
          <p>Prix: {product.price}€</p>
          <p>Statut: {product.status}</p>
          <p>Images: {product.imageCount}</p>
        </div>
      ))}
      
      {/* Pagination */}
      {pagination.hasNext && (
        <button onClick={() => loadProducts(pagination.offset / 20 + 1)}>
          Suivant
        </button>
      )}
    </div>
  );
};
```

### Statistiques Vendeur

```javascript
// GET /api/vendor/stats
const getVendorStats = async () => {
  const response = await fetch('/api/vendor/stats', {
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });
  
  return response.json();
};

// Composant de dashboard
const VendorDashboard = () => {
  const [stats, setStats] = useState(null);
  
  useEffect(() => {
    const loadStats = async () => {
      try {
        const result = await getVendorStats();
        setStats(result.stats);
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      }
    };
    
    loadStats();
  }, []);
  
  if (!stats) return <div>Chargement...</div>;
  
  return (
    <div className="vendor-dashboard">
      <h2>Tableau de bord vendeur</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Produits totaux</h3>
          <p>{stats.totalProducts}</p>
        </div>
        
        <div className="stat-card">
          <h3>Produits publiés</h3>
          <p>{stats.publishedProducts}</p>
        </div>
        
        <div className="stat-card">
          <h3>Revenus totaux</h3>
          <p>{stats.totalRevenue}€</p>
        </div>
        
        <div className="stat-card">
          <h3>Prix moyen</h3>
          <p>{stats.averagePrice}€</p>
        </div>
      </div>
    </div>
  );
};
```

## ✅ Checklist d'Intégration

### 📋 Côté Frontend

- [ ] **Conversion blob → base64** implémentée
- [ ] **Fonction de publication** complète
- [ ] **Gestion d'erreurs** robuste
- [ ] **Validation données** avant envoi
- [ ] **UI de chargement** pendant publication
- [ ] **Messages de succès/erreur** pour l'utilisateur
- [ ] **API de consultation** intégrée
- [ ] **Gestion de l'authentification** JWT

### 🔧 Points d'Attention

1. **Performance** : Optimiser la conversion base64 pour gros volumes
2. **Sécurité** : Valider côté frontend ET backend
3. **UX** : Indicateurs de progression clairs
4. **Erreurs** : Messages d'erreur explicites
5. **Tests** : Tester avec différentes tailles d'images

### 🚀 Prochaines Étapes

1. **Tests d'intégration** avec le backend réel
2. **Optimisation performance** pour gros volumes
3. **Tests de montée en charge** avec multiples publications
4. **Monitoring** des erreurs et performance

---

## 🎉 Résumé

L'intégration frontend est maintenant **complète et documentée** pour fonctionner avec le nouveau système de publication vendeur :

- ✅ **Solution blob URLs** → conversion base64
- ✅ **API complète** de publication et consultation  
- ✅ **Gestion d'erreurs** robuste
- ✅ **Validation** côté client
- ✅ **Hooks React** réutilisables
- ✅ **Exemples concrets** d'implémentation

**Le système frontend/backend est prêt pour la production !** 🚀 