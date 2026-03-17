# 📖 Guide Complet Frontend - Système Brouillon/Publication

## 🎯 Vue d'ensemble du Système

Le vendeur peut choisir entre **BROUILLON** ou **PUBLICATION DIRECTE** pour ses produits. Le système vérifie automatiquement si le design est validé par l'admin pour appliquer le bon statut.

### ✅ Règle Fondamentale
**Le design DOIT être validé par l'admin pour pouvoir publier un produit.**

---

## 🔗 Endpoints API

### 1. Endpoint Principal (Recommandé)
```http
PUT /vendor-product-validation/set-draft/{productId}
Content-Type: application/json
Authorization: Bearer {token}

{
  "isDraft": true   // true = brouillon, false = publication directe
}
```

### 2. Endpoint Raccourci (Publication Directe)
```http
POST /vendor-product-validation/publish-direct/{productId}
Authorization: Bearer {token}
```

---

## 📊 Logique de Fonctionnement

| Design Validé | Choix Vendeur | Statut Final | Description |
|---------------|---------------|--------------|-------------|
| ✅ **Oui** | Brouillon | **`DRAFT`** | Prêt à publier quand le vendeur veut |
| ✅ **Oui** | Publication | **`PUBLISHED`** | Publié immédiatement |
| ❌ **Non** | Brouillon | **`PENDING`** | En attente validation admin |
| ❌ **Non** | Publication | **`PENDING`** | En attente validation admin |

---

## 🎨 Interface Utilisateur Complète

### Composant Principal

```jsx
import React, { useState } from 'react';
import { toast } from 'react-toastify'; // ou votre système de notifications

const ProductPublishChoice = ({ productId, onSuccess }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChoice = async (isDraft) => {
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/vendor-product-validation/set-draft/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ isDraft })
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      const result = await response.json();
      handleResult(result);

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de l\'opération');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResult = (result) => {
    const { status, message, designValidationStatus } = result;

    switch (status) {
      case 'PUBLISHED':
        toast.success('🎉 ' + message);
        break;
      case 'DRAFT':
        toast.success('📝 ' + message);
        break;
      case 'PENDING':
        if (designValidationStatus === 'pending') {
          toast.info('⏳ ' + message);
        } else {
          toast.warning('❓ ' + message);
        }
        break;
      default:
        toast.info(message);
    }
  };

  return (
    <div className="product-publish-choice">
      <div className="choice-header">
        <h3>Comment souhaitez-vous gérer ce produit ?</h3>
        <p className="validation-notice">
          ℹ️ Votre design doit être validé par l'admin pour pouvoir être publié
        </p>
      </div>

      <div className="choice-buttons">
        <button
          className="btn-draft"
          onClick={() => handleChoice(true)}
          disabled={isSubmitting}
        >
          <div className="btn-icon">📝</div>
          <div className="btn-content">
            <h4>Mettre en brouillon</h4>
            <p>Je publierai plus tard quand je veux</p>
          </div>
        </button>

        <button
          className="btn-publish"
          onClick={() => handleChoice(false)}
          disabled={isSubmitting}
        >
          <div className="btn-icon">🚀</div>
          <div className="btn-content">
            <h4>Publier directement</h4>
            <p>Publier maintenant si design validé</p>
          </div>
        </button>
      </div>

      {isSubmitting && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Traitement en cours...</p>
        </div>
      )}
    </div>
  );
};

export default ProductPublishChoice;
```

### Affichage du Statut Produit

```jsx
const ProductStatusBadge = ({ product }) => {
  const { status, isValidated, canPublish } = product;

  const getStatusConfig = () => {
    switch (status) {
      case 'PUBLISHED':
        return {
          text: 'Publié',
          className: 'status-published',
          icon: '✅',
          description: 'Produit visible par tous'
        };

      case 'DRAFT':
        return {
          text: canPublish ? 'Brouillon (Prêt)' : 'Brouillon',
          className: 'status-draft',
          icon: '📝',
          description: canPublish ?
            'Prêt à publier' :
            'En attente de validation design'
        };

      case 'PENDING':
        return {
          text: 'En attente',
          className: 'status-pending',
          icon: '⏳',
          description: 'Design en cours de validation admin'
        };

      default:
        return {
          text: status,
          className: 'status-unknown',
          icon: '❓',
          description: 'Statut inconnu'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`product-status-badge ${config.className}`}>
      <span className="status-icon">{config.icon}</span>
      <div className="status-content">
        <span className="status-text">{config.text}</span>
        <span className="status-description">{config.description}</span>
      </div>
    </div>
  );
};
```

---

## 🔧 Fonctions JavaScript Utilitaires

### Service API

```javascript
// services/productService.js
class ProductService {
  constructor() {
    this.baseURL = '/api/vendor-product-validation';
    this.token = localStorage.getItem('authToken');
  }

  async setProductDraft(productId, isDraft) {
    const response = await fetch(`${this.baseURL}/set-draft/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      },
      body: JSON.stringify({ isDraft })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    return await response.json();
  }

  async publishDirect(productId) {
    const response = await fetch(`${this.baseURL}/publish-direct/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    return await response.json();
  }

  async publishFromDraft(productId) {
    // Utilise l'ancien endpoint pour publier un brouillon validé
    const response = await fetch(`${this.baseURL}/publish/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Erreur ${response.status}`);
    }

    return await response.json();
  }
}

export const productService = new ProductService();
```

### Gestion des États

```javascript
// hooks/useProductStatus.js
import { useState, useCallback } from 'react';
import { productService } from '../services/productService';

export const useProductStatus = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const setProductDraft = useCallback(async (productId, isDraft) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.setProductDraft(productId, isDraft);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishDirect = useCallback(async (productId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.publishDirect(productId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const publishFromDraft = useCallback(async (productId) => {
    setLoading(true);
    setError(null);

    try {
      const result = await productService.publishFromDraft(productId);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    setProductDraft,
    publishDirect,
    publishFromDraft
  };
};
```

---

## 🎨 Styles CSS

```css
/* styles/productChoice.css */
.product-publish-choice {
  max-width: 600px;
  margin: 2rem auto;
  padding: 2rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.choice-header {
  text-align: center;
  margin-bottom: 2rem;
}

.choice-header h3 {
  color: #333;
  margin-bottom: 0.5rem;
}

.validation-notice {
  color: #666;
  font-size: 0.9rem;
  background: #f8f9fa;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 4px solid #007bff;
}

.choice-buttons {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.btn-draft,
.btn-publish {
  flex: 1;
  display: flex;
  align-items: center;
  padding: 1.5rem;
  border: 2px solid transparent;
  border-radius: 8px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-draft:hover {
  background: #e9ecef;
  border-color: #6c757d;
}

.btn-publish:hover {
  background: #d4edda;
  border-color: #28a745;
}

.btn-draft:disabled,
.btn-publish:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  font-size: 2rem;
  margin-right: 1rem;
}

.btn-content h4 {
  margin: 0 0 0.5rem 0;
  color: #333;
}

.btn-content p {
  margin: 0;
  color: #666;
  font-size: 0.9rem;
}

/* Status badges */
.product-status-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9rem;
}

.status-published {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status-draft {
  background: #cce7ff;
  color: #004085;
  border: 1px solid #99d6ff;
}

.status-pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.status-icon {
  margin-right: 0.5rem;
}

.status-content {
  display: flex;
  flex-direction: column;
}

.status-text {
  font-weight: 600;
}

.status-description {
  font-size: 0.8rem;
  opacity: 0.8;
}

/* Loading state */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f3f3;
  border-top: 2px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 0.5rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Responsive */
@media (max-width: 768px) {
  .choice-buttons {
    flex-direction: column;
  }

  .product-publish-choice {
    margin: 1rem;
    padding: 1rem;
  }
}
```

---

## 📱 Exemples d'Utilisation

### Dans une page de création de produit

```jsx
import React, { useState } from 'react';
import ProductPublishChoice from '../components/ProductPublishChoice';

const CreateProductPage = () => {
  const [productId, setProductId] = useState(null);
  const [showChoice, setShowChoice] = useState(false);

  const handleProductCreated = (newProductId) => {
    setProductId(newProductId);
    setShowChoice(true);
  };

  const handlePublishSuccess = (result) => {
    console.log('Produit configuré:', result);
    // Rediriger vers la liste des produits ou afficher un message
  };

  return (
    <div className="create-product-page">
      {!showChoice ? (
        <CreateProductForm onSuccess={handleProductCreated} />
      ) : (
        <ProductPublishChoice
          productId={productId}
          onSuccess={handlePublishSuccess}
        />
      )}
    </div>
  );
};
```

### Dans une liste de produits

```jsx
const ProductList = ({ products }) => {
  const { publishFromDraft } = useProductStatus();

  const handlePublishFromDraft = async (productId) => {
    try {
      const result = await publishFromDraft(productId);
      toast.success('Produit publié avec succès !');
      // Rafraîchir la liste
      window.location.reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="product-list">
      {products.map(product => (
        <div key={product.id} className="product-item">
          <div className="product-info">
            <h3>{product.name}</h3>
            <ProductStatusBadge product={product} />
          </div>

          <div className="product-actions">
            {product.status === 'DRAFT' && product.canPublish && (
              <button
                onClick={() => handlePublishFromDraft(product.id)}
                className="btn-publish-now"
              >
                🚀 Publier maintenant
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## 🚨 Gestion des Erreurs

```javascript
// utils/errorHandler.js
export const handleApiError = (error, toast) => {
  console.error('API Error:', error);

  if (error.message.includes('404')) {
    toast.error('Produit non trouvé');
  } else if (error.message.includes('403')) {
    toast.error('Accès non autorisé');
  } else if (error.message.includes('400')) {
    toast.error('Données invalides');
  } else {
    toast.error('Une erreur est survenue');
  }
};

// Dans votre composant
try {
  const result = await setProductDraft(productId, isDraft);
  // ...
} catch (error) {
  handleApiError(error, toast);
}
```

---

## ✅ Checklist d'Intégration

- [ ] **Endpoints configurés** avec la bonne URL de base
- [ ] **Token d'authentification** correctement passé
- [ ] **Gestion des erreurs** implémentée
- [ ] **Messages utilisateur** configurés (toasts/notifications)
- [ ] **Interface responsive** sur mobile
- [ ] **Loading states** pendant les requêtes
- [ ] **Styles CSS** appliqués
- [ ] **Tests** des différents scénarios
- [ ] **Gestion des permissions** vendeur
- [ ] **Rafraîchissement** des données après actions

---

## 🎯 Points Clés à Retenir

1. **Validation admin obligatoire** : Aucun produit ne peut être publié sans validation
2. **Choix vendeur respecté** : Brouillon ou publication selon intention
3. **Statut automatique** : PENDING si design non validé
4. **Interface claire** : Messages explicites pour chaque situation
5. **Gestion d'erreurs** : Feedback utilisateur approprié

Ce système offre une expérience utilisateur fluide tout en maintenant le contrôle qualité via la validation admin ! 🚀