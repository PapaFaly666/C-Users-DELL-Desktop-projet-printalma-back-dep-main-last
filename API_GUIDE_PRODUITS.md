# 📖 Guide API - Création de Produits

Ce guide explique comment créer des produits et les affecter à des catégories, sous-catégories et variations via l'API Printalma.

## 🌐 Configuration de l'API

- **URL Base**: `http://localhost:3004`
- **Content-Type**: `application/json` (pour la plupart des endpoints)
- **Port**: 3004
- **Authentification**: Cookies/Credentials requis

---

## 📋 Récupération des données existantes

### 1. Obtenir toutes les catégories

```javascript
// GET /categories
const response = await fetch('http://localhost:3004/categories', {
  credentials: 'include'
});

const categories = await response.json();
// Format: [{ id: 1, name: "Vêtements", slug: "vetements", ... }]
```

### 2. Obtenir les sous-catégories d'une catégorie

```javascript
// GET /sub-categories?categoryId=X
const response = await fetch(`http://localhost:3004/sub-categories?categoryId=${categoryId}`, {
  credentials: 'include'
});

const subCategories = await response.json();
```

### 3. Obtenir les variations d'une sous-catégorie

```javascript
// GET /variations?subCategoryId=X
const response = await fetch(`http://localhost:3004/variations?subCategoryId=${subCategoryId}`, {
  credentials: 'include'
});

const variations = await response.json();
```

---

## 🏗️ Création des éléments de base

### 1. Créer une catégorie

```javascript
// POST /categories
const categoryData = {
  name: "Nouvelle Catégorie",
  description: "Description de la catégorie",
  slug: "nouvelle-categorie",
  displayOrder: 1,
  isActive: true
};

const response = await fetch('http://localhost:3004/categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(categoryData)
});

const result = await response.json();
// Format: { success: true, data: { id: 1, name: "...", ... } }
const categoryId = result.data.id;
```

### 2. Créer une sous-catégorie

```javascript
// POST /sub-categories
const subCategoryData = {
  name: "Sous-Catégorie",
  description: "Description de la sous-catégorie",
  slug: "sous-categorie",
  categoryId: 1, // ⚠️ Doit être un nombre entier
  displayOrder: 1,
  isActive: true
};

const response = await fetch('http://localhost:3004/sub-categories', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(subCategoryData)
});

const result = await response.json();
const subCategoryId = result.data.id;
```

### 3. Créer une variation

```javascript
// POST /variations
const variationData = {
  name: "Couleurs",
  slug: "couleurs",
  description: "Variations de couleurs",
  type: "COLOR", // ou "SIZE", "MATERIAL", etc.
  values: ["Rouge", "Vert", "Bleu"],
  subCategoryId: 1, // ⚠️ Doit être un nombre entier
  displayOrder: 1,
  isActive: true
};

const response = await fetch('http://localhost:3004/variations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify(variationData)
});

const result = await response.json();
const variationId = result.data.id;
```

---

## 🛍️ Création de Produits

### ⚠️ Important: Les produits nécessitent des images

L'API exige au moins une image pour créer un produit. Vous devez utiliser `multipart/form-data`.

### 1. Structure complète du produit

```javascript
const productData = {
  // Informations de base
  name: "Mon Produit",
  description: "Description détaillée du produit",
  sku: "SKU-001",
  price: 99.99,
  comparePrice: 149.99,
  cost: 50.00,

  // Stock et logistique
  stock: 100,
  weight: 1.5,
  barcode: "1234567890123",

  // Relations
  categoryId: 1,        // ⚠️ Nombre entier obligatoire
  subcategoryId: 1,     // ⚠️ Nombre entier obligatoire

  // Variations du produit
  variations: [
    {
      variationId: 1,    // ID de la variation (ex: couleur)
      value: "Rouge",    // Valeur spécifique (ex: "Rouge")
      price: 109.99,     // Prix optionnel pour cette variation
      sku: "SKU-001-RED", // SKU optionnel pour cette variation
      stock: 50,         // Stock optionnel pour cette variation
      images: []         // Images spécifiques à cette variation
    },
    {
      variationId: 1,
      value: "Vert",
      price: 104.99,
      sku: "SKU-001-GREEN",
      stock: 30,
      images: []
    }
  ],

  // Métadonnées
  status: "ACTIVE",      // ou "DRAFT", "INACTIVE"
  tags: ["tag1", "tag2"],
  seoTitle: "Titre SEO",
  seoDescription: "Description SEO"
};
```

### 2. Méthode 1: Création avec FormData (Recommandé)

```javascript
const createProduct = async (productData, imageFiles) => {
  const formData = new FormData();

  // Ajouter les données du produit en JSON
  formData.append('productData', JSON.stringify(productData));

  // Ajouter les images (au moins une requise)
  imageFiles.forEach((file, index) => {
    formData.append('images', file);
  });

  try {
    const response = await fetch('http://localhost:3004/products', {
      method: 'POST',
      credentials: 'include',
      body: formData
      // Ne pas définir Content-Type, FormData le fait automatiquement
    });

    const result = await response.json();

    if (result.success) {
      console.log('Produit créé avec succès:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    throw error;
  }
};

// Utilisation
const imageFiles = [fileInput.files[0], fileInput.files[1]]; // Fichiers d'images
createProduct(productData, imageFiles);
```

### 3. Méthode 2: Création avec axios

```javascript
import axios from 'axios';

const createProductWithAxios = async (productData, imageFiles) => {
  const formData = new FormData();

  formData.append('productData', JSON.stringify(productData));

  imageFiles.forEach((file) => {
    formData.append('images', file);
  });

  try {
    const response = await axios.post('http://localhost:3004/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      withCredentials: true
    });

    return response.data.data;
  } catch (error) {
    console.error('Erreur:', error.response?.data || error.message);
    throw error;
  }
};
```

---

## 🔄 Workflow Complet

### Étape 1: Charger les données initiales

```javascript
const loadInitialData = async () => {
  try {
    // Charger les catégories
    const categoriesResponse = await fetch('http://localhost:3004/categories', {
      credentials: 'include'
    });
    const categories = await categoriesResponse.json();

    // Stocker les catégories pour les select/options
    return categories;
  } catch (error) {
    console.error('Erreur de chargement:', error);
  }
};
```

### Étape 2: Gérer le changement de catégorie

```javascript
const handleCategoryChange = async (categoryId) => {
  try {
    // Charger les sous-catégories
    const subCategoriesResponse = await fetch(
      `http://localhost:3004/sub-categories?categoryId=${categoryId}`,
      { credentials: 'include' }
    );
    const subCategories = await subCategoriesResponse.json();

    // Mettre à jour le select des sous-catégories
    updateSubCategorySelect(subCategories);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Étape 3: Gérer le changement de sous-catégorie

```javascript
const handleSubCategoryChange = async (subCategoryId) => {
  try {
    // Charger les variations
    const variationsResponse = await fetch(
      `http://localhost:3004/variations?subCategoryId=${subCategoryId}`,
      { credentials: 'include' }
    );
    const variations = await variationsResponse.json();

    // Mettre à jour l'interface des variations
    updateVariationsInterface(variations);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Étape 4: Construction du produit final

```javascript
const buildProductData = (formData, variations) => {
  const productData = {
    name: formData.get('name'),
    description: formData.get('description'),
    sku: formData.get('sku'),
    price: parseFloat(formData.get('price')),
    categoryId: parseInt(formData.get('categoryId')),
    subcategoryId: parseInt(formData.get('subcategoryId')),

    // Construire les variations
    variations: variations.map(variation => ({
      variationId: variation.id,
      value: formData.get(`variation_${variation.id}_value`),
      price: formData.get(`variation_${variation.id}_price`)
        ? parseFloat(formData.get(`variation_${variation.id}_price`))
        : undefined,
      stock: formData.get(`variation_${variation.id}_stock`)
        ? parseInt(formData.get(`variation_${variation.id}_stock`))
        : undefined
    })).filter(v => v.value) // Garder seulement les variations avec des valeurs

  };

  return productData;
};
```

---

## 📨 Exemples de réponses API

### Succès - Catégorie créée
```json
{
  "success": true,
  "message": "Catégorie créée avec succès",
  "data": {
    "id": 25,
    "name": "Catégorie Test",
    "slug": "categorie-test",
    "description": "Description",
    "displayOrder": 0,
    "isActive": true,
    "createdAt": "2025-10-19T17:37:15.894Z",
    "updatedAt": "2025-10-19T17:37:15.894Z",
    "subCategories": [],
    "_count": { "products": 0 }
  }
}
```

### Succès - Produit créé
```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 123,
    "name": "Mon Produit",
    "sku": "SKU-001",
    "price": 99.99,
    "category": { "id": 1, "name": "Vêtements" },
    "subcategory": { "id": 1, "name": "T-Shirts" },
    "variations": [...],
    "images": [...]
  }
}
```

---

## ⚠️ Erreurs communes et solutions

### 1. "categoryId must be an integer number"
**Erreur**: Envoyer un string au lieu d'un nombre
**Solution**: `categoryId: parseInt(categoryId)`

### 2. "At least one image file is required"
**Erreur**: Essayer de créer un produit sans images
**Solution**: Toujours inclure au moins une image en `multipart/form-data`

### 3. "productData is required"
**Erreur**: Mauvais format de données envoyé
**Solution**: Envoyer `{ productData: {...} }` ou utiliser `FormData.append('productData', JSON.stringify(...))`

### 4. "Cannot POST /endpoint"
**Erreur**: Mauvais endpoint ou port
**Solution**: Vérifier l'URL base (`http://localhost:3004`) et le chemin de l'endpoint

---

## 🔧 Validation côté frontend

### Validation avant envoi
```javascript
const validateProductData = (productData, imageFiles) => {
  const errors = [];

  // Validation des champs obligatoires
  if (!productData.name) errors.push("Le nom du produit est requis");
  if (!productData.price || productData.price <= 0) errors.push("Le prix doit être positif");
  if (!productData.categoryId) errors.push("La catégorie est requise");
  if (!productData.subcategoryId) errors.push("La sous-catégorie est requise");

  // Validation des images
  if (!imageFiles || imageFiles.length === 0) errors.push("Au moins une image est requise");

  // Validation des IDs
  if (isNaN(productData.categoryId)) errors.push("ID de catégorie invalide");
  if (isNaN(productData.subcategoryId)) errors.push("ID de sous-catégorie invalide");

  return errors;
};

// Utilisation
const errors = validateProductData(productData, imageFiles);
if (errors.length > 0) {
  alert("Erreurs de validation:\n" + errors.join("\n"));
  return;
}
```

---

## 🚀 Exemple d'implémentation React

```jsx
import React, { useState, useEffect } from 'react';

const ProductForm = () => {
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [variations, setVariations] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger les catégories au montage
  useEffect(() => {
    fetchCategories();
  }, []);

  // Charger les sous-catégories quand la catégorie change
  useEffect(() => {
    if (selectedCategory) {
      fetchSubCategories(selectedCategory);
    }
  }, [selectedCategory]);

  // Charger les variations quand la sous-catégorie change
  useEffect(() => {
    if (selectedSubCategory) {
      fetchVariations(selectedSubCategory);
    }
  }, [selectedSubCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:3004/categories', {
        credentials: 'include'
      });
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchSubCategories = async (categoryId) => {
    try {
      const response = await fetch(
        `http://localhost:3004/sub-categories?categoryId=${categoryId}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setSubCategories(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const fetchVariations = async (subCategoryId) => {
    try {
      const response = await fetch(
        `http://localhost:3004/variations?subCategoryId=${subCategoryId}`,
        { credentials: 'include' }
      );
      const data = await response.json();
      setVariations(data);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.target);

    const productData = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      categoryId: parseInt(selectedCategory),
      subcategoryId: parseInt(selectedSubCategory),
      variations: variations.map(variation => ({
        variationId: variation.id,
        value: formData.get(`variation_${variation.id}`),
        price: formData.get(`variation_${variation.id}_price`)
          ? parseFloat(formData.get(`variation_${variation.id}_price`))
          : undefined
      })).filter(v => v.value)
    };

    try {
      const requestFormData = new FormData();
      requestFormData.append('productData', JSON.stringify(productData));

      images.forEach(image => {
        requestFormData.append('images', image);
      });

      const response = await fetch('http://localhost:3004/products', {
        method: 'POST',
        credentials: 'include',
        body: requestFormData
      });

      const result = await response.json();

      if (result.success) {
        alert('Produit créé avec succès!');
        // Réinitialiser le formulaire ou rediriger
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (error) {
      alert('Erreur lors de la création: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Formulaire de produit avec selects pour catégories/sous-catégories */}
      {/* ... */}
    </form>
  );
};

export default ProductForm;
```

---

## 📞 Support

Pour toute question ou problème d'implémentation:
- Vérifiez les logs du serveur backend
- Testez les endpoints avec Postman ou curl
- Contactez l'équipe backend pour les problèmes d'API

**URL du serveur de développement**: `http://localhost:3004`
**Documentation des erreurs**: Consulter les messages d'erreur retournés par l'API