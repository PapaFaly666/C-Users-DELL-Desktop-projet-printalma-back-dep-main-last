# 🎨 GUIDE FRONTEND - SYSTÈME DE DÉDUPLICATION DES DESIGNS

Ce guide explique comment utiliser le nouveau système de déduplication des designs côté frontend, avec gestion des brouillons et validation en cascade.

---

## 🎯 Nouveautés du Système

### ✅ Ce qui a été corrigé :
1. **Déduplication globale** : Un même design n'est créé qu'une seule fois, même entre différents vendeurs
2. **Gestion des brouillons** : Possibilité de créer des produits qui restent en brouillon après validation admin
3. **Validation unique** : L'admin valide le design une seule fois, tous les produits liés sont mis à jour
4. **Publication manuelle** : Les vendeurs peuvent publier leurs produits en brouillon quand ils le souhaitent

### ❌ Problèmes résolus :
- ~~Création de designs multiples pour le même contenu~~
- ~~Nécessité de valider chaque design séparément~~
- ~~Pas de contrôle sur la publication après validation~~

---

## 🚀 API Endpoints

### 1. Créer un Produit avec Design

```typescript
// POST /api/vendor/products
const createProduct = async (productData: {
  baseProductId: number;
  vendorName: string;
  vendorDescription: string;
  vendorPrice: number;
  vendorStock: number;
  selectedColors: Array<{id: number, name: string, colorCode: string}>;
  selectedSizes: Array<{id: number, sizeName: string}>;
  finalImagesBase64: { design: string }; // Base64 du design
  postValidationAction: 'AUTO_PUBLISH' | 'TO_DRAFT'; // 🆕 NOUVEAU
  productStructure: {
    adminProduct: AdminProduct;
    designApplication: { scale: number };
  };
}) => {
  const response = await fetch('/api/vendor/products', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(productData)
  });

  const result = await response.json();
  
  // 🆕 Nouvelle réponse avec info de déduplication
  console.log('Design réutilisé:', result.isDesignReused);
  console.log('Message:', result.message);
  // "Produit créé avec design réutilisé (déduplication globale)"
  // ou "Produit créé avec nouveau design"
  
  return result;
};
```

### 2. Publier un Produit en Brouillon

```typescript
// POST /api/vendor/products/:id/publish
const publishDraftProduct = async (productId: number) => {
  const response = await fetch(`/api/vendor/products/${productId}/publish`, {
    method: 'POST',
    credentials: 'include'
  });

  const result = await response.json();
  
  if (result.success) {
    console.log('Produit publié:', result.message);
    // Le produit passe de DRAFT à PUBLISHED
  }
  
  return result;
};
```

### 3. Obtenir les Produits du Vendeur

```typescript
// GET /api/vendor/products
const getVendorProducts = async (filters?: {
  status?: 'PUBLISHED' | 'DRAFT' | 'PENDING';
  limit?: number;
  offset?: number;
}) => {
  const params = new URLSearchParams();
  if (filters?.status) params.set('status', filters.status);
  if (filters?.limit) params.set('limit', filters.limit.toString());
  if (filters?.offset) params.set('offset', filters.offset.toString());

  const response = await fetch(`/api/vendor/products?${params}`, {
    credentials: 'include'
  });

  const result = await response.json();
  
  // Les produits incluent maintenant :
  result.data.products.forEach(product => {
    console.log('Produit:', product.id);
    console.log('Design ID:', product.designApplication.designId); // Même ID pour designs identiques
    console.log('Status:', product.status);
    console.log('Validé:', product.isValidated);
  });
  
  return result;
};
```

---

## 🎨 Composants Frontend

### 1. Formulaire de Création de Produit

```tsx
import React, { useState } from 'react';

const CreateProductForm = () => {
  const [formData, setFormData] = useState({
    vendorName: '',
    vendorDescription: '',
    vendorPrice: 0,
    vendorStock: 0,
    selectedColors: [],
    selectedSizes: [],
    designFile: null,
    postValidationAction: 'AUTO_PUBLISH' // 🆕 Nouveau champ
  });

  const [designPreview, setDesignPreview] = useState(null);

  const handleDesignUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDesignPreview(e.target.result);
        setFormData(prev => ({
          ...prev,
          designFile: e.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const productData = {
      baseProductId: selectedProduct.id,
      vendorName: formData.vendorName,
      vendorDescription: formData.vendorDescription,
      vendorPrice: formData.vendorPrice * 100, // Convertir en centimes
      vendorStock: formData.vendorStock,
      selectedColors: formData.selectedColors,
      selectedSizes: formData.selectedSizes,
      finalImagesBase64: {
        design: formData.designFile
      },
      postValidationAction: formData.postValidationAction, // 🆕 Action après validation
      productStructure: {
        adminProduct: selectedProduct,
        designApplication: { scale: 0.6 }
      }
    };

    try {
      const result = await createProduct(productData);
      
      if (result.success) {
        // 🆕 Afficher si le design a été réutilisé
        if (result.isDesignReused) {
          showNotification('✅ Produit créé avec design existant réutilisé', 'success');
        } else {
          showNotification('✅ Produit créé avec nouveau design', 'success');
        }
        
        // Rediriger selon l'action choisie
        if (formData.postValidationAction === 'TO_DRAFT') {
          showNotification('ℹ️ Produit sera en brouillon après validation admin', 'info');
        } else {
          showNotification('ℹ️ Produit sera publié automatiquement après validation admin', 'info');
        }
        
        // Rediriger vers la liste des produits
        navigate('/vendor/products');
      }
    } catch (error) {
      showNotification('❌ Erreur lors de la création du produit', 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Champs existants... */}
      
      {/* 🆕 Nouveau champ : Action après validation */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Action après validation admin
        </label>
        <select
          value={formData.postValidationAction}
          onChange={(e) => setFormData(prev => ({
            ...prev,
            postValidationAction: e.target.value
          }))}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="AUTO_PUBLISH">
            📤 Publier automatiquement
          </option>
          <option value="TO_DRAFT">
            📝 Garder en brouillon (je publierai manuellement)
          </option>
        </select>
        <p className="text-sm text-gray-500">
          {formData.postValidationAction === 'AUTO_PUBLISH' 
            ? 'Votre produit sera publié automatiquement dès que l\'admin validera le design'
            : 'Votre produit restera en brouillon après validation, vous pourrez le publier quand vous voulez'
          }
        </p>
      </div>

      {/* Upload design */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Design à appliquer
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleDesignUpload}
          className="w-full p-2 border border-gray-300 rounded-md"
          required
        />
        {designPreview && (
          <div className="mt-2">
            <img 
              src={designPreview} 
              alt="Aperçu du design" 
              className="max-w-xs max-h-48 object-contain border rounded"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Créer le produit
      </button>
    </form>
  );
};
```

### 2. Liste des Produits avec Gestion des Brouillons

```tsx
import React, { useState, useEffect } from 'react';

const ProductsList = () => {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, [filter]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getVendorProducts({
        status: filter === 'all' ? undefined : filter
      });
      setProducts(result.data.products);
    } catch (error) {
      console.error('Erreur chargement produits:', error);
    } finally {
      setLoading(false);
    }
  };

  const publishDraft = async (productId) => {
    try {
      const result = await publishDraftProduct(productId);
      if (result.success) {
        showNotification('✅ Produit publié avec succès', 'success');
        loadProducts(); // Recharger la liste
      }
    } catch (error) {
      showNotification('❌ Erreur lors de la publication', 'error');
    }
  };

  const getStatusBadge = (status, isValidated) => {
    const badges = {
      'PUBLISHED': 'bg-green-100 text-green-800',
      'DRAFT': isValidated ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800',
      'PENDING': 'bg-orange-100 text-orange-800'
    };

    const labels = {
      'PUBLISHED': '✅ Publié',
      'DRAFT': isValidated ? '📝 Brouillon (validé)' : '📝 Brouillon',
      'PENDING': '⏳ En attente'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badges[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex space-x-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('PUBLISHED')}
          className={`px-4 py-2 rounded ${filter === 'PUBLISHED' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
        >
          Publiés
        </button>
        <button
          onClick={() => setFilter('DRAFT')}
          className={`px-4 py-2 rounded ${filter === 'DRAFT' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
        >
          Brouillons
        </button>
        <button
          onClick={() => setFilter('PENDING')}
          className={`px-4 py-2 rounded ${filter === 'PENDING' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}
        >
          En attente
        </button>
      </div>

      {/* Liste des produits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Image du produit */}
            <div className="h-48 bg-gray-200 relative">
              {product.images.primaryImageUrl && (
                <img
                  src={product.images.primaryImageUrl}
                  alt={product.vendorName}
                  className="w-full h-full object-cover"
                />
              )}
              {product.designApplication.designUrl && (
                <div className="absolute top-2 right-2 bg-white p-1 rounded">
                  <img
                    src={product.designApplication.designUrl}
                    alt="Design"
                    className="w-8 h-8 object-contain"
                  />
                </div>
              )}
            </div>

            {/* Informations du produit */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-gray-900">{product.vendorName}</h3>
                {getStatusBadge(product.status, product.isValidated)}
              </div>
              
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-lg font-bold text-gray-900">
                  {(product.price / 100).toFixed(2)} €
                </span>
                <span className="text-sm text-gray-500">
                  Stock: {product.stock}
                </span>
              </div>

              {/* 🆕 Informations sur le design */}
              {product.designApplication.hasDesign && (
                <div className="text-xs text-gray-500 mb-3">
                  Design ID: {product.designApplication.designId || 'N/A'}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2">
                {/* 🆕 Bouton publier pour les brouillons validés */}
                {product.status === 'DRAFT' && product.isValidated && (
                  <button
                    onClick={() => publishDraft(product.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700"
                  >
                    📤 Publier
                  </button>
                )}
                
                <button
                  onClick={() => navigate(`/vendor/products/${product.id}`)}
                  className="flex-1 bg-blue-600 text-white py-2 px-3 rounded text-sm hover:bg-blue-700"
                >
                  Voir détails
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Chargement des produits...</p>
        </div>
      )}

      {!loading && products.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
};
```

### 3. Composant de Notification des Designs Réutilisés

```tsx
import React from 'react';

const DesignReuseNotification = ({ isReused, designId, onClose }) => {
  if (!isReused) return null;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-blue-800">
            Design existant réutilisé
          </h3>
          <p className="mt-1 text-sm text-blue-700">
            Ce design existe déjà dans le système (ID: {designId}). 
            Votre produit utilise le même design qu'un autre vendeur, 
            ce qui permet d'économiser l'espace de stockage.
          </p>
          <p className="mt-1 text-xs text-blue-600">
            ℹ️ Quand l'admin validera ce design, tous les produits qui l'utilisent seront mis à jour automatiquement.
          </p>
        </div>
        <div className="ml-3">
          <button
            onClick={onClose}
            className="text-blue-400 hover:text-blue-600"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

## 📊 Dashboard Vendeur

### Statistiques avec Brouillons

```tsx
const VendorDashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    publishedProducts: 0,
    draftProducts: 0,
    pendingProducts: 0,
    validatedDrafts: 0 // 🆕 Brouillons validés prêts à publier
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const result = await getVendorStats();
      setStats(result.data);
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Total Produits</h3>
        <p className="text-3xl font-bold text-gray-900">{stats.totalProducts}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Publiés</h3>
        <p className="text-3xl font-bold text-green-600">{stats.publishedProducts}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">Brouillons</h3>
        <p className="text-3xl font-bold text-blue-600">{stats.draftProducts}</p>
        {stats.validatedDrafts > 0 && (
          <p className="text-sm text-green-600 mt-1">
            {stats.validatedDrafts} prêts à publier
          </p>
        )}
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-2">En attente</h3>
        <p className="text-3xl font-bold text-orange-600">{stats.pendingProducts}</p>
      </div>
    </div>
  );
};
```

---

## 🔄 Gestion des États

### Hook personnalisé pour les produits

```tsx
import { useState, useEffect } from 'react';

const useVendorProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProducts = async (filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getVendorProducts(filters);
      setProducts(result.data.products);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const publishDraft = async (productId) => {
    try {
      const result = await publishDraftProduct(productId);
      if (result.success) {
        // Mettre à jour le produit dans la liste
        setProducts(prev => prev.map(p => 
          p.id === productId 
            ? { ...p, status: 'PUBLISHED' }
            : p
        ));
        return { success: true, message: result.message };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const createProduct = async (productData) => {
    try {
      const result = await createProduct(productData);
      if (result.success) {
        // Recharger la liste après création
        await loadProducts();
        return result;
      }
    } catch (err) {
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    loadProducts,
    publishDraft,
    createProduct
  };
};
```

---

## 📱 Notifications et Feedback

### Système de notifications

```tsx
const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);
    
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Messages spécifiques au système de déduplication
  const showDesignReuseNotification = (designId) => {
    addNotification(
      `✅ Design existant réutilisé (ID: ${designId}). Économie d'espace réalisée !`,
      'success',
      7000
    );
  };

  const showValidationCascadeNotification = (affectedProducts) => {
    addNotification(
      `🔄 Validation en cascade : ${affectedProducts} produits mis à jour automatiquement`,
      'info',
      6000
    );
  };

  const showDraftPublishedNotification = () => {
    addNotification(
      `📤 Produit publié avec succès ! Il est maintenant visible par les clients.`,
      'success',
      5000
    );
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg max-w-sm ${
            notification.type === 'success' ? 'bg-green-100 text-green-800' :
            notification.type === 'error' ? 'bg-red-100 text-red-800' :
            notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
          }`}
        >
          <div className="flex justify-between items-start">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🎉 Résumé des Fonctionnalités

### ✅ Pour les Vendeurs :
1. **Création simplifiée** : Téléchargez votre design, choisissez l'action après validation
2. **Réutilisation automatique** : Les designs identiques sont automatiquement détectés et réutilisés
3. **Contrôle de publication** : Choisissez si vos produits sont publiés automatiquement ou restent en brouillon
4. **Publication manuelle** : Publiez vos brouillons validés quand vous le souhaitez

### ✅ Pour les Admins :
1. **Validation unique** : Validez un design une seule fois, tous les produits liés sont mis à jour
2. **Vue d'ensemble** : Voyez combien de produits sont liés à chaque design
3. **Efficacité** : Plus besoin de valider le même design plusieurs fois

### ✅ Avantages Système :
1. **Performance** : Moins d'uploads vers Cloudinary
2. **Économie** : Réduction des coûts de stockage
3. **Consistance** : Tous les produits avec le même design sont synchronisés
4. **Flexibilité** : Gestion fine des statuts de publication

---

## 🚀 Déploiement

1. **Backend** : Le système est déjà implémenté et testé
2. **Frontend** : Utilisez les exemples de code ci-dessus
3. **Base de données** : Aucune migration supplémentaire nécessaire
4. **Tests** : Testez avec le script `test-final-deduplication.js`

Le système est **prêt pour la production** ! 🎉 