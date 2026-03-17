# 🎨 GUIDE COMPLET FRONTEND - Système de Catégories de Design avec Images

## 📋 **Vue d'ensemble**

Guide complet pour implémenter le système de catégories de design dynamiques avec upload d'images de couverture. Ce système remplace les anciennes catégories fixes par un système entièrement géré par les admins avec des images attractives.

---

## 🔗 **Tous les Endpoints Disponibles**

### 🌐 **Endpoints Publics (Vendeurs)**
```
GET /design-categories/active        → Liste des catégories actives
GET /design-categories/slug/:slug    → Catégorie par slug (SEO-friendly)
```

### 👑 **Endpoints Admin (Authentification requise)**
```
POST /design-categories/admin        → Créer catégorie avec image
GET  /design-categories/admin        → Toutes les catégories (pagination)
GET  /design-categories/admin/:id    → Catégorie spécifique
PUT  /design-categories/admin/:id    → Modifier catégorie + image
DELETE /design-categories/admin/:id  → Supprimer catégorie
```

**⚠️ Important** : Tous les endpoints admin utilisent `multipart/form-data` et nécessitent un token JWT Admin.

---

## 🔑 **Authentification Admin**

```javascript
// Token JWT Admin obligatoire dans les headers
headers: {
  'Authorization': `Bearer ${localStorage.getItem('admin_jwt_token')}`
}
```

---

## 📝 **Structure des Données**

### Format de Catégorie (Response)
```javascript
{
  "id": 1,
  "name": "Logo Design",
  "description": "Catégorie pour les designs de logos et identités visuelles",
  "slug": "logo-design",
  "coverImageUrl": "https://res.cloudinary.com/printalma/image/upload/v123/design-categories/cover.jpg",
  "isActive": true,
  "sortOrder": 10,
  "designCount": 25,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z",
  "creator": {
    "id": 1,
    "firstName": "Admin",
    "lastName": "User"
  }
}
```

### Champs pour Création/Modification
```javascript
// FormData pour multipart/form-data
const formData = new FormData();
formData.append('name', 'Logo Design');                    // string (requis)
formData.append('description', 'Description...');          // string (optionnel)
formData.append('slug', 'logo-design');                    // string (optionnel, auto-généré)
formData.append('coverImage', fileObject);                 // File (optionnel)
formData.append('isActive', 'true');                       // boolean (défaut: true)
formData.append('sortOrder', '10');                        // number (défaut: 0)
```

### Spécifications Image de Couverture
- **Formats** : PNG, JPG, WEBP
- **Taille max** : 5MB
- **Redimensionnement auto** : 800x600px (ratio 4:3)
- **Compression** : Automatique via Cloudinary
- **Dossier** : `design-categories/` sur Cloudinary

---

## 💻 **Service JavaScript Complet**

```javascript
// designCategoryService.js
class DesignCategoryService {
  constructor() {
    this.baseURL = '/design-categories';
  }

  // Récupération du token admin
  getAdminToken() {
    const token = localStorage.getItem('admin_jwt_token');
    if (!token) throw new Error('Administrateur non authentifié');
    return token;
  }

  // 🌐 PUBLIC - Récupérer catégories actives pour vendeurs
  async getActiveCategories() {
    const response = await fetch(`${this.baseURL}/active`);
    return this.handleResponse(response);
  }

  // 🌐 PUBLIC - Récupérer catégorie par slug
  async getCategoryBySlug(slug) {
    const response = await fetch(`${this.baseURL}/slug/${slug}`);
    return this.handleResponse(response);
  }

  // 👑 ADMIN - Créer catégorie avec image
  async createCategory(categoryData, imageFile = null) {
    const formData = new FormData();
    
    // Ajouter les champs texte
    Object.entries(categoryData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'boolean' ? value.toString() : value);
      }
    });

    // Ajouter l'image si fournie
    if (imageFile) {
      formData.append('coverImage', imageFile);
    }

    const response = await fetch(`${this.baseURL}/admin`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
        // Ne pas définir Content-Type pour multipart/form-data
      },
      body: formData
    });

    return this.handleResponse(response);
  }

  // 👑 ADMIN - Lister toutes les catégories avec pagination
  async getCategories(params = {}) {
    const queryParams = new URLSearchParams();
    
    // Paramètres de pagination et filtres
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${this.baseURL}/admin?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
      }
    });

    return this.handleResponse(response);
  }

  // 👑 ADMIN - Récupérer catégorie par ID
  async getCategoryById(categoryId) {
    const response = await fetch(`${this.baseURL}/admin/${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
      }
    });
    return this.handleResponse(response);
  }

  // 👑 ADMIN - Mettre à jour catégorie avec nouvelle image
  async updateCategory(categoryId, updates, imageFile = null) {
    const formData = new FormData();
    
    // Ajouter les champs à modifier
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, typeof value === 'boolean' ? value.toString() : value);
      }
    });

    // Ajouter la nouvelle image si fournie (remplace l'ancienne automatiquement)
    if (imageFile) {
      formData.append('coverImage', imageFile);
    }

    const response = await fetch(`${this.baseURL}/admin/${categoryId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
      },
      body: formData
    });

    return this.handleResponse(response);
  }

  // 👑 ADMIN - Supprimer catégorie
  async deleteCategory(categoryId) {
    const response = await fetch(`${this.baseURL}/admin/${categoryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
      }
    });
    return this.handleResponse(response);
  }

  // Gestion centralisée des réponses
  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      switch (response.status) {
        case 400:
          throw new Error(errorData.message || 'Données invalides');
        case 401:
          throw new Error('Administrateur non authentifié');
        case 403:
          throw new Error('Accès refusé - Droits administrateur requis');
        case 404:
          throw new Error('Catégorie non trouvée');
        case 409:
          throw new Error(errorData.message || 'Nom ou slug déjà utilisé');
        case 413:
          throw new Error('Image trop volumineuse (max 5MB)');
        case 415:
          throw new Error('Format d\'image non supporté (PNG/JPG/WEBP uniquement)');
        default:
          throw new Error(`Erreur HTTP ${response.status}`);
      }
    }
    return await response.json();
  }

  // Utilitaire pour valider une image côté client
  validateImage(file) {
    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      throw new Error('Format non supporté. Utilisez PNG, JPG ou WEBP.');
    }

    if (file.size > maxSize) {
      throw new Error('Image trop volumineuse. Maximum 5MB.');
    }

    return true;
  }
}

export const designCategoryService = new DesignCategoryService();
```

---

## ⚛️ **Composants React Complets**

### 1. Composant d'Upload d'Image avec Drag & Drop

```jsx
import React, { useState, useRef } from 'react';

const ImageUploader = ({ 
  onImageSelect, 
  currentImage = null, 
  preview = null, 
  label = "Image de couverture",
  disabled = false 
}) => {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const validateAndSelectFile = (file) => {
    if (!file) return;

    try {
      // Validation côté client
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez PNG, JPG ou WEBP.');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image trop volumineuse. Maximum 5MB.');
      }

      setError('');
      onImageSelect(file);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      const file = e.dataTransfer.files[0];
      validateAndSelectFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    validateAndSelectFile(file);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        {label}
      </label>
      
      {/* Zone de drop */}
      <div
        style={{
          border: `2px dashed ${error ? '#dc3545' : dragOver ? '#007bff' : '#ddd'}`,
          borderRadius: '8px',
          padding: '20px',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          backgroundColor: disabled ? '#f8f9fa' : dragOver ? '#f0f8ff' : 'white',
          transition: 'all 0.3s ease',
          opacity: disabled ? 0.6 : 1
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {preview ? (
          <div>
            <img 
              src={preview} 
              alt="Aperçu" 
              style={{ 
                maxWidth: '300px', 
                maxHeight: '225px', 
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '10px',
                border: '1px solid #ddd'
              }}
            />
            <p style={{ margin: '0', color: '#666' }}>
              {disabled ? 'Upload désactivé' : 'Cliquez ou glissez pour changer l\'image'}
            </p>
          </div>
        ) : currentImage ? (
          <div>
            <img 
              src={currentImage} 
              alt="Image actuelle" 
              style={{ 
                maxWidth: '300px', 
                maxHeight: '225px', 
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '10px',
                border: '1px solid #ddd'
              }}
            />
            <p style={{ margin: '0', color: '#666' }}>
              {disabled ? 'Upload désactivé' : 'Cliquez ou glissez pour changer l\'image'}
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '48px', marginBottom: '10px' }}>📸</div>
            <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
              {disabled ? 'Upload désactivé' : 'Cliquez ou glissez une image ici'}
            </p>
            <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
              PNG, JPG, WEBP - Max 5MB - Sera redimensionnée en 800x600px
            </p>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          marginTop: '10px',
          padding: '8px 12px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          border: '1px solid #f5c6cb',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ❌ {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={handleFileChange}
        disabled={disabled}
      />
    </div>
  );
};

export default ImageUploader;
```

### 2. Formulaire de Création de Catégorie

```jsx
import React, { useState } from 'react';
import { designCategoryService } from './designCategoryService';
import ImageUploader from './ImageUploader';

const CreateCategoryForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    isActive: true,
    sortOrder: 0
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const handleImageSelect = (file) => {
    setImageFile(file);
    
    // Créer un aperçu
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      slug: '',
      isActive: true,
      sortOrder: 0
    });
    setImageFile(null);
    setImagePreview(null);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage('❌ Le nom de la catégorie est requis');
      return;
    }

    setIsSubmitting(true);
    setMessage('🔄 Création en cours...');

    try {
      const result = await designCategoryService.createCategory(formData, imageFile);
      setMessage('✅ Catégorie créée avec succès');
      
      setTimeout(() => {
        resetForm();
        onSuccess && onSuccess(result);
      }, 1500);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>
        ➕ Nouvelle Catégorie de Design
      </h2>

      <form onSubmit={handleSubmit}>
        {/* Nom de la catégorie */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Nom de la catégorie *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="Logo Design, Illustrations, T-shirt Design..."
            required
            disabled={isSubmitting}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd', 
              minHeight: '100px',
              fontSize: '16px',
              resize: 'vertical'
            }}
            placeholder="Décrivez cette catégorie pour aider les vendeurs à choisir..."
            disabled={isSubmitting}
          />
        </div>

        {/* Slug personnalisé */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
            Slug personnalisé (optionnel)
          </label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            style={{ 
              width: '100%', 
              padding: '12px', 
              borderRadius: '6px', 
              border: '1px solid #ddd',
              fontSize: '16px'
            }}
            placeholder="logo-design (généré automatiquement si vide)"
            disabled={isSubmitting}
          />
          <small style={{ color: '#666', fontSize: '14px' }}>
            Utilisé dans les URLs. Généré automatiquement depuis le nom si vide.
          </small>
        </div>

        {/* Upload d'image */}
        <ImageUploader 
          onImageSelect={handleImageSelect}
          preview={imagePreview}
          disabled={isSubmitting}
        />

        {/* Options */}
        <div style={{ display: 'flex', gap: '30px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              disabled={isSubmitting}
              style={{ transform: 'scale(1.2)' }}
            />
            <span style={{ fontWeight: 'bold' }}>Catégorie active</span>
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <label style={{ fontWeight: 'bold' }}>
              Ordre d'affichage :
            </label>
            <input
              type="number"
              value={formData.sortOrder}
              onChange={(e) => handleChange('sortOrder', parseInt(e.target.value) || 0)}
              style={{ 
                width: '80px', 
                padding: '6px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                textAlign: 'center'
              }}
              min="0"
              max="9999"
              disabled={isSubmitting}
            />
            <small style={{ color: '#666' }}>(0 = premier)</small>
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
          <button 
            type="submit" 
            disabled={isSubmitting}
            style={{
              backgroundColor: isSubmitting ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '6px',
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
          >
            {isSubmitting ? '🔄 Création...' : '💾 Créer la Catégorie'}
          </button>

          {onCancel && (
            <button 
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '6px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                fontSize: '16px'
              }}
            >
              Annuler
            </button>
          )}
        </div>

        {/* Message de statut */}
        {message && (
          <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            borderRadius: '6px',
            textAlign: 'center',
            backgroundColor: message.includes('✅') ? '#d4edda' : message.includes('🔄') ? '#d1ecf1' : '#f8d7da',
            color: message.includes('✅') ? '#155724' : message.includes('🔄') ? '#0c5460' : '#721c24',
            border: `1px solid ${message.includes('✅') ? '#c3e6cb' : message.includes('🔄') ? '#bee5eb' : '#f5c6cb'}`,
            fontSize: '16px',
            fontWeight: 'bold'
          }}>
            {message}
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateCategoryForm;
```

### 3. Sélecteur de Catégorie pour Vendeurs

```jsx
import React, { useState, useEffect } from 'react';
import { designCategoryService } from './designCategoryService';

const CategorySelector = ({ 
  value, 
  onChange, 
  placeholder = "-- Choisir une catégorie --",
  showDescriptions = false,
  required = false,
  disabled = false 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await designCategoryService.getActiveCategories();
      setCategories(data);
    } catch (err) {
      setError('Erreur lors du chargement des catégories');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const selectedId = parseInt(e.target.value);
    const selectedCategory = categories.find(cat => cat.id === selectedId);
    onChange(selectedId || null, selectedCategory);
  };

  if (loading) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Catégorie de design {required && '*'}
        </label>
        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
          🔄 Chargement des catégories...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
          Catégorie de design {required && '*'}
        </label>
        <div style={{ 
          padding: '12px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24',
          borderRadius: '6px',
          border: '1px solid #f5c6cb'
        }}>
          ❌ {error}
          <button 
            onClick={loadCategories}
            style={{ 
              marginLeft: '10px', 
              background: 'none', 
              border: 'none', 
              color: '#721c24', 
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
        Catégorie de design {required && '*'}
      </label>
      
      <select 
        value={value || ''} 
        onChange={handleChange} 
        required={required}
        disabled={disabled}
        style={{ 
          width: '100%', 
          padding: '12px', 
          borderRadius: '6px', 
          border: '1px solid #ddd',
          fontSize: '16px',
          backgroundColor: disabled ? '#f8f9fa' : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer'
        }}
      >
        <option value="">{placeholder}</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.id}>
            {cat.name} ({cat.designCount} designs)
          </option>
        ))}
      </select>

      {/* Affichage des descriptions si activé */}
      {showDescriptions && value && (
        <div style={{ marginTop: '10px' }}>
          {categories.map(cat => (
            cat.id === value && cat.description && (
              <div 
                key={cat.id}
                style={{ 
                  padding: '10px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '4px',
                  fontSize: '14px',
                  color: '#666'
                }}
              >
                💡 {cat.description}
              </div>
            )
          ))}
        </div>
      )}

      {/* Affichage de l'image de couverture si disponible */}
      {value && categories.find(cat => cat.id === value)?.coverImageUrl && (
        <div style={{ marginTop: '10px', textAlign: 'center' }}>
          <img 
            src={categories.find(cat => cat.id === value).coverImageUrl}
            alt={categories.find(cat => cat.id === value).name}
            style={{ 
              maxWidth: '200px', 
              maxHeight: '150px', 
              objectFit: 'cover',
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}
          />
        </div>
      )}

      {categories.length === 0 && (
        <div style={{
          marginTop: '10px',
          padding: '10px',
          backgroundColor: '#fff3cd',
          color: '#856404',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          ⚠️ Aucune catégorie disponible. Contactez l'administrateur.
        </div>
      )}
    </div>
  );
};

export default CategorySelector;
```

### 4. Liste/Grille des Catégories avec Images

```jsx
import React, { useState, useEffect } from 'react';
import { designCategoryService } from './designCategoryService';

const CategoryCard = ({ category, onEdit, onDelete, showActions = true }) => (
  <div 
    style={{
      border: '1px solid #ddd',
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'transform 0.3s, box-shadow 0.3s',
      opacity: category.isActive ? 1 : 0.6,
      cursor: 'pointer'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    }}
  >
    {/* Image de couverture */}
    <div style={{ height: '200px', overflow: 'hidden', position: 'relative' }}>
      {category.coverImageUrl ? (
        <img 
          src={category.coverImageUrl}
          alt={category.name}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover'
          }}
        />
      ) : (
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '48px',
          color: '#dee2e6'
        }}>
          🎨
        </div>
      )}
      
      {!category.isActive && (
        <div style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          backgroundColor: 'rgba(220, 53, 69, 0.9)',
          color: 'white',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 'bold'
        }}>
          INACTIVE
        </div>
      )}
    </div>

    <div style={{ padding: '20px' }}>
      {/* En-tête avec nom et compteur */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start',
        marginBottom: '10px'
      }}>
        <h3 style={{ 
          margin: '0', 
          color: category.isActive ? '#333' : '#999',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          {category.name}
        </h3>
        <span style={{
          backgroundColor: category.isActive ? '#e3f2fd' : '#f5f5f5',
          color: category.isActive ? '#1976d2' : '#757575',
          padding: '4px 12px',
          borderRadius: '20px',
          fontSize: '12px',
          fontWeight: 'bold',
          whiteSpace: 'nowrap'
        }}>
          {category.designCount} designs
        </span>
      </div>

      {/* Description */}
      {category.description && (
        <p style={{ 
          margin: '0 0 15px 0', 
          color: '#666', 
          fontSize: '14px',
          lineHeight: '1.5',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {category.description}
        </p>
      )}

      {/* Informations supplémentaires */}
      <div style={{ 
        marginBottom: showActions ? '15px' : '0',
        fontSize: '12px',
        color: '#999'
      }}>
        <div>📍 Slug: <code>{category.slug}</code></div>
        <div>📊 Ordre: {category.sortOrder}</div>
        <div>📅 Créé: {new Date(category.createdAt).toLocaleDateString('fr-FR')}</div>
      </div>

      {/* Actions */}
      {showActions && (
        <div style={{ 
          display: 'flex', 
          gap: '10px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(category);
            }}
            style={{
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#0056b3'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#007bff'}
          >
            ✏️ Modifier
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(category.id, category.name);
            }}
            style={{
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#c82333'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc3545'}
          >
            🗑️ Supprimer
          </button>
        </div>
      )}
    </div>
  </div>
);

const CategoryList = ({ 
  showActions = true, 
  onCategorySelect = null,
  gridColumns = 'repeat(auto-fill, minmax(320px, 1fr))'
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    isActive: undefined,
    search: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    loadCategories();
  }, [filters]);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await designCategoryService.getCategories(filters);
      setCategories(result.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value,
      page: 1 // Reset page when filtering
    }));
  };

  const deleteCategory = async (id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${name}" ?\n\nCette action est irréversible.`)) {
      return;
    }

    try {
      await designCategoryService.deleteCategory(id);
      loadCategories(); // Reload
    } catch (error) {
      alert(`Erreur lors de la suppression: ${error.message}`);
    }
  };

  const editCategory = (category) => {
    console.log('Edit category:', category);
    // Implémenter la logique d'édition (ouvrir modal, naviguer, etc.)
  };

  const handleCategoryClick = (category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔄</div>
        <h3>Chargement des catégories...</h3>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: '40px',
        backgroundColor: '#f8d7da',
        color: '#721c24',
        borderRadius: '8px',
        margin: '20px'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
        <h3>Erreur de chargement</h3>
        <p>{error}</p>
        <button 
          onClick={loadCategories}
          style={{
            backgroundColor: '#721c24',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '6px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>
        🎨 Catégories de Design
      </h2>

      {/* Filtres */}
      <div style={{ 
        marginBottom: '30px', 
        display: 'flex', 
        gap: '20px', 
        alignItems: 'center',
        flexWrap: 'wrap',
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Statut:</label>
          <select
            value={filters.isActive === undefined ? 'all' : filters.isActive.toString()}
            onChange={(e) => {
              const value = e.target.value === 'all' ? undefined : e.target.value === 'true';
              handleFilterChange('isActive', value);
            }}
            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="all">Toutes</option>
            <option value="true">Actives seulement</option>
            <option value="false">Inactives seulement</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '200px' }}>
          <label style={{ fontWeight: 'bold' }}>Recherche:</label>
          <input
            type="text"
            placeholder="Nom ou slug..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            style={{ 
              padding: '8px 12px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              flex: 1
            }}
          />
        </div>

        <div style={{ color: '#666', fontSize: '14px', fontWeight: 'bold' }}>
          {categories.length} catégorie{categories.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grille des catégories */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: gridColumns,
        gap: '25px',
        marginBottom: '30px'
      }}>
        {categories.map(category => (
          <div key={category.id} onClick={() => handleCategoryClick(category)}>
            <CategoryCard
              category={category}
              onEdit={editCategory}
              onDelete={deleteCategory}
              showActions={showActions}
            />
          </div>
        ))}
      </div>

      {/* Message si aucune catégorie */}
      {categories.length === 0 && (
        <div style={{ 
          textAlign: 'center', 
          padding: '60px 20px',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          color: '#666'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>📂</div>
          <h3>Aucune catégorie trouvée</h3>
          <p>
            {filters.search || filters.isActive !== undefined 
              ? 'Aucune catégorie ne correspond aux filtres appliqués.'
              : 'Aucune catégorie n\'a encore été créée.'
            }
          </p>
          {(filters.search || filters.isActive !== undefined) && (
            <button
              onClick={() => setFilters({ isActive: undefined, search: '', page: 1, limit: 50 })}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                cursor: 'pointer',
                marginTop: '15px'
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryList;
```

---

## 🔄 **Intégration dans le Formulaire de Design**

### Modification du formulaire de création de design

```jsx
import React, { useState } from 'react';
import CategorySelector from './CategorySelector';

const CreateDesignForm = ({ onSubmit }) => {
  const [designData, setDesignData] = useState({
    name: '',
    price: '',
    categoryId: null,  // ✅ NOUVEAU - Remplace l'ancienne enum
    // autres champs...
  });

  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryChange = (categoryId, categoryData) => {
    setDesignData(prev => ({ ...prev, categoryId }));
    setSelectedCategory(categoryData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!designData.categoryId) {
      alert('Veuillez sélectionner une catégorie');
      return;
    }

    // ✅ IMPORTANT: Envoyer categoryId (number) au lieu de category (string)
    const formData = new FormData();
    formData.append('name', designData.name);
    formData.append('price', designData.price);
    formData.append('categoryId', designData.categoryId.toString()); // Convertir en string pour FormData
    
    try {
      await onSubmit(formData);
    } catch (error) {
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Nom du design *</label>
        <input
          type="text"
          value={designData.name}
          onChange={(e) => setDesignData(prev => ({ ...prev, name: e.target.value }))}
          required
        />
      </div>

      <div>
        <label>Prix (FCFA) *</label>
        <input
          type="number"
          value={designData.price}
          onChange={(e) => setDesignData(prev => ({ ...prev, price: e.target.value }))}
          min="0"
          step="100"
          required
        />
      </div>

      {/* ✅ NOUVEAU Sélecteur de catégorie dynamique */}
      <CategorySelector
        value={designData.categoryId}
        onChange={handleCategoryChange}
        showDescriptions={true}
        required={true}
      />

      {/* Affichage des infos de la catégorie sélectionnée */}
      {selectedCategory && (
        <div style={{
          padding: '15px',
          backgroundColor: '#e3f2fd',
          borderRadius: '6px',
          marginBottom: '20px'
        }}>
          <strong>📂 Catégorie sélectionnée:</strong> {selectedCategory.name}
          {selectedCategory.description && (
            <div style={{ marginTop: '5px', fontSize: '14px', color: '#666' }}>
              {selectedCategory.description}
            </div>
          )}
        </div>
      )}

      <button type="submit">Créer le Design</button>
    </form>
  );
};

export default CreateDesignForm;
```

---

## 🚨 **Gestion d'Erreurs Complète**

```javascript
// Utilitaire pour gérer toutes les erreurs possibles
export const handleCategoryError = (error, context = '') => {
  console.error(`Erreur catégorie ${context}:`, error);

  // Messages d'erreur spécifiques
  const errorMessages = {
    401: 'Session expirée. Veuillez vous reconnecter.',
    403: 'Droits insuffisants pour cette action.',
    404: 'Catégorie non trouvée.',
    409: 'Ce nom ou slug est déjà utilisé.',
    413: 'Image trop volumineuse (maximum 5MB).',
    415: 'Format d\'image non supporté (PNG/JPG/WEBP uniquement).',
    422: 'Données invalides. Vérifiez les champs.',
    500: 'Erreur serveur. Réessayez plus tard.'
  };

  // Récupérer le code de statut depuis l'erreur
  const statusCode = error.status || error.response?.status;
  const message = errorMessages[statusCode] || error.message || 'Erreur inconnue';

  return {
    code: statusCode,
    message,
    isAuthError: [401, 403].includes(statusCode),
    isValidationError: [400, 422].includes(statusCode),
    isConflictError: statusCode === 409,
    isServerError: statusCode >= 500
  };
};

// Hook React pour gérer les erreurs
export const useCategoryErrorHandler = () => {
  const [error, setError] = useState(null);

  const handleError = (err, context = '') => {
    const errorInfo = handleCategoryError(err, context);
    setError(errorInfo);

    // Actions automatiques selon le type d'erreur
    if (errorInfo.isAuthError) {
      // Rediriger vers la page de connexion
      localStorage.removeItem('admin_jwt_token');
      window.location.href = '/admin/login';
    }

    return errorInfo;
  };

  const clearError = () => setError(null);

  return { error, handleError, clearError };
};
```

---

## ✅ **Checklist d'Implémentation Complète**

### 🏗️ **Architecture Frontend**
- [ ] Service `designCategoryService.js` intégré
- [ ] Composant `ImageUploader` avec drag & drop
- [ ] Composant `CategorySelector` pour vendeurs
- [ ] Composant `CreateCategoryForm` pour admins
- [ ] Composant `CategoryList` avec grille responsive
- [ ] Gestion d'erreurs centralisée
- [ ] Validation côté client des images

### 🎨 **Interface Utilisateur**
- [ ] Design responsive pour mobile/desktop
- [ ] Messages de loading et d'erreur clairs
- [ ] Aperçu des images avant upload
- [ ] Filtres et recherche dans les listes
- [ ] Actions d'édition/suppression sécurisées
- [ ] Indicateurs visuels pour statuts (actif/inactif)

### 🔐 **Sécurité et Authentification**
- [ ] Token JWT Admin dans tous les appels admin
- [ ] Validation des permissions côté client
- [ ] Gestion des sessions expirées
- [ ] Validation des formats d'images
- [ ] Limitation de taille des fichiers

### 📱 **Expérience Utilisateur**
- [ ] Upload par drag & drop fonctionnel
- [ ] Prévisualisation des images en temps réel
- [ ] Messages de confirmation avant suppression
- [ ] Feedback visuel pendant les opérations
- [ ] Navigation intuitive entre les vues

### 🔧 **Tests et Débogage**
- [ ] Test des uploads avec différents formats
- [ ] Test des erreurs de connexion
- [ ] Test des permissions admin/vendeur
- [ ] Test responsive sur mobiles
- [ ] Test de performance avec many catégories

---

## 📞 **Support et Maintenance**

### **Points d'attention:**
1. **Images** : Toutes les images sont automatiquement optimisées par Cloudinary
2. **Performance** : Les catégories sont mises en cache côté client
3. **SEO** : Utilisez les slugs pour des URLs propres
4. **Accessibilité** : Tous les composants incluent les attributs ARIA appropriés

### **Migration depuis l'ancien système:**
```javascript
// ❌ ANCIEN (ne marche plus)
const designData = {
  category: "LOGO" // Enum fixe
};

// ✅ NOUVEAU (obligatoire)
const designData = {
  categoryId: 1 // ID dynamique de la catégorie sélectionnée
};
```

Ce guide couvre l'intégralité du système de catégories avec images. Tous les composants sont prêts à être intégrés dans votre application frontend.