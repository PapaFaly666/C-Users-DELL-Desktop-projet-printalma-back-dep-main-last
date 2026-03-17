# 🎯 Guide API Produits - Documentation Frontend

## 📋 **Vue d'ensemble**

Ce guide documente tous les endpoints de l'API produits avec les filtres de genre, catégorie, et autres options disponibles.

**Base URL:** `http://localhost:3004`

---

## 🔍 **1. RÉCUPÉRER LES PRODUITS AVEC FILTRES**

### **Endpoint Principal**
```http
GET /products
```

### **Paramètres de Query (Tous optionnels)**

| Paramètre | Type | Valeurs | Description |
|-----------|------|---------|-------------|
| `isReadyProduct` | boolean | `true`, `false` | Filtrer par type de produit |
| `hasDelimitations` | boolean | `true`, `false` | Produits avec zones de personnalisation |
| `forVendorDesign` | boolean | `true`, `false` | Mockups prêts pour design vendeur |
| `status` | string | `PUBLISHED`, `DRAFT` | Statut de publication |
| `category` | string | ex: `"T-shirts"` | Nom de catégorie |
| `genre` | string | `HOMME`, `FEMME`, `BEBE`, `UNISEXE` | Genre/public cible |
| `search` | string | ex: `"premium"` | Recherche par nom |
| `limit` | number | ex: `20` | Nombre de résultats |
| `offset` | number | ex: `0` | Pagination |

### **Exemples d'Utilisation**

#### **1. Tous les produits pour hommes**
```javascript
const response = await fetch('/products?genre=HOMME');
```

#### **2. Mockups pour femmes avec délimitations**
```javascript
const response = await fetch('/products?genre=FEMME&isReadyProduct=false&hasDelimitations=true');
```

#### **3. Produits prêts publiés avec pagination**
```javascript
const response = await fetch('/products?isReadyProduct=true&status=PUBLISHED&limit=10&offset=0');
```

#### **4. Recherche dans une catégorie spécifique**
```javascript
const response = await fetch('/products?category=T-shirts&search=premium');
```

### **Réponse Type**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt Premium Homme",
      "description": "T-shirt de qualité pour homme",
      "price": 2500,
      "stock": 10,
      "status": "PUBLISHED",
      "isReadyProduct": false,
      "genre": "HOMME",
      "createdAt": "2024-01-15T10:30:00Z",
      "categories": [
        {
          "id": 1,
          "name": "T-shirts"
        }
      ],
      "sizes": [
        {
          "id": 1,
          "sizeName": "M"
        }
      ],
      "colorVariations": [
        {
          "id": 1,
          "name": "Noir",
          "colorCode": "#000000",
          "images": [
            {
              "id": 1,
              "url": "https://res.cloudinary.com/example/image.jpg",
              "view": "Front",
              "delimitations": [
                {
                  "id": 1,
                  "name": "Zone Poitrine",
                  "x": 30,
                  "y": 40,
                  "width": 40,
                  "height": 20
                }
              ]
            }
          ]
        }
      ],
      "hasCustomDesigns": false,
      "hasDelimitations": true
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "filters": {
    "applied": {
      "genre": "HOMME",
      "isReadyProduct": false
    },
    "resultsCount": 25
  }
}
```

---

## 🏷️ **2. RÉCUPÉRER LES FILTRES DISPONIBLES**

### **2.1 Catégories Disponibles**
```http
GET /products/filters/categories
```

**Réponse:**
```json
{
  "success": true,
  "categories": [
    {
      "id": 1,
      "name": "T-shirts",
      "productCount": 45
    },
    {
      "id": 2,
      "name": "Hoodies",
      "productCount": 23
    },
    {
      "id": 3,
      "name": "Polos",
      "productCount": 18
    }
  ]
}
```

### **2.2 Genres Disponibles**
```http
GET /products/filters/genres
```

**Réponse:**
```json
{
  "success": true,
  "genres": [
    {
      "genre": "HOMME",
      "count": 35,
      "label": "Homme"
    },
    {
      "genre": "FEMME",
      "count": 28,
      "label": "Femme"
    },
    {
      "genre": "BEBE",
      "count": 15,
      "label": "Bébé"
    },
    {
      "genre": "UNISEXE",
      "count": 22,
      "label": "Unisexe"
    }
  ],
  "total": 100
}
```

### **2.3 Statistiques Complètes**
```http
GET /products/filters/stats
```

**Réponse:**
```json
{
  "success": true,
  "stats": {
    "total": 100,
    "byStatus": {
      "PUBLISHED": 75,
      "DRAFT": 25
    },
    "byType": {
      "mockups": 60,
      "readyProducts": 40
    },
    "byGenre": {
      "HOMME": 35,
      "FEMME": 28,
      "BEBE": 15,
      "UNISEXE": 22
    }
  }
}
```

---

## 🆕 **3. CRÉER UN PRODUIT**

### **Endpoint**
```http
POST /products
Content-Type: multipart/form-data
```

### **Données Requises**
- `productData`: JSON string avec les données du produit
- `file_[fileId]`: Fichiers images (un par image)

### **Structure ProductData**
```json
{
  "name": "T-shirt Premium Homme",
  "description": "T-shirt de qualité supérieure",
  "price": 2500,
  "stock": 10,
  "status": "published",
  "categories": ["T-shirts", "Premium"],
  "sizes": ["S", "M", "L", "XL"],
  "genre": "HOMME",
  "isReadyProduct": false,
  "colorVariations": [
    {
      "name": "Noir",
      "colorCode": "#000000",
      "images": [
        {
          "fileId": "main_image",
          "view": "Front",
          "delimitations": [
            {
              "name": "Zone Poitrine",
              "x": 30,
              "y": 40,
              "width": 40,
              "height": 20,
              "coordinateType": "PERCENTAGE"
            }
          ]
        }
      ]
    }
  ]
}
```

### **Exemple JavaScript**
```javascript
async function createProduct(productData, imageFiles) {
  const formData = new FormData();
  
  // Ajouter les données JSON
  formData.append('productData', JSON.stringify(productData));
  
  // Ajouter les fichiers images
  imageFiles.forEach((file, index) => {
    formData.append(`file_image_${index}`, file);
  });
  
  const response = await fetch('/products', {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}
```

---

## 📦 **4. PRODUITS PRÊTS (ADMIN)**

### **4.1 Créer un Produit Prêt**
```http
POST /products/ready
Content-Type: multipart/form-data
Authorization: Bearer [admin_token]
```

### **4.2 Lister les Produits Prêts**
```http
GET /products/ready?status=published&limit=10
Authorization: Bearer [admin_token]
```

### **4.3 Modifier un Produit Prêt**
```http
PATCH /products/ready/1
Content-Type: multipart/form-data
Authorization: Bearer [admin_token]
```

---

## 🎨 **5. GESTION DES DESIGNS**

### **5.1 Uploader un Design**
```http
POST /products/1/colors/1/images/1/design
Content-Type: multipart/form-data
```

### **5.2 Récupérer un Design**
```http
GET /products/1/colors/1/images/1/design
```

### **5.3 Supprimer un Design**
```http
DELETE /products/1/colors/1/images/1/design
```

---

## 🔧 **6. EXEMPLES D'INTÉGRATION FRONTEND**

### **6.1 Composant de Filtres React**
```jsx
import { useState, useEffect } from 'react';

function ProductFilters({ onFiltersChange }) {
  const [categories, setCategories] = useState([]);
  const [genres, setGenres] = useState([]);
  const [filters, setFilters] = useState({
    genre: '',
    category: '',
    status: '',
    isReadyProduct: null
  });

  useEffect(() => {
    // Charger les catégories
    fetch('/products/filters/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories));

    // Charger les genres
    fetch('/products/filters/genres')
      .then(res => res.json())
      .then(data => setGenres(data.genres));
  }, []);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  return (
    <div className="filters">
      <select 
        value={filters.genre} 
        onChange={(e) => handleFilterChange('genre', e.target.value)}
      >
        <option value="">Tous les genres</option>
        {genres.map(genre => (
          <option key={genre.genre} value={genre.genre}>
            {genre.label} ({genre.count})
          </option>
        ))}
      </select>

      <select 
        value={filters.category} 
        onChange={(e) => handleFilterChange('category', e.target.value)}
      >
        <option value="">Toutes les catégories</option>
        {categories.map(cat => (
          <option key={cat.id} value={cat.name}>
            {cat.name} ({cat.productCount})
          </option>
        ))}
      </select>

      <select 
        value={filters.status} 
        onChange={(e) => handleFilterChange('status', e.target.value)}
      >
        <option value="">Tous les statuts</option>
        <option value="PUBLISHED">Publié</option>
        <option value="DRAFT">Brouillon</option>
      </select>
    </div>
  );
}
```

### **6.2 Hook de Récupération des Produits**
```javascript
import { useState, useEffect } from 'react';

function useProducts(filters = {}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      // Construire l'URL avec les filtres
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          params.append(key, value);
        }
      });

      try {
        const response = await fetch(`/products?${params}`);
        const data = await response.json();
        
        setProducts(data.data);
        setPagination(data.pagination);
      } catch (error) {
        console.error('Erreur lors du chargement des produits:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [filters]);

  return { products, loading, pagination };
}
```

### **6.3 Fonction de Création de Produit**
```javascript
async function createProductWithGenre(productInfo, imageFiles) {
  try {
    const productData = {
      name: productInfo.name,
      description: productInfo.description,
      price: parseFloat(productInfo.price),
      stock: parseInt(productInfo.stock),
      status: productInfo.status || "draft",
      categories: productInfo.categories || [],
      sizes: productInfo.sizes || [],
      genre: productInfo.genre || "UNISEXE", // ✅ Champ genre
      isReadyProduct: productInfo.isReadyProduct || false, // ✅ Type de produit
      colorVariations: productInfo.colorVariations || []
    };

    const formData = new FormData();
    formData.append('productData', JSON.stringify(productData));
    
    // Ajouter les images
    imageFiles.forEach((file, index) => {
      formData.append(`file_image_${index}`, file);
    });

    const response = await fetch('/products', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('Erreur création produit:', error);
    throw error;
  }
}
```

---

## 📊 **7. CODES D'ERREUR COURANTS**

| Code | Description | Solution |
|------|-------------|----------|
| 400 | Données invalides | Vérifier le format JSON et les champs requis |
| 401 | Non authentifié | Ajouter le token d'authentification |
| 403 | Accès refusé | Vérifier les permissions utilisateur |
| 404 | Produit non trouvé | Vérifier l'ID du produit |
| 413 | Fichier trop volumineux | Réduire la taille des images |

---

## ✅ **8. CHECKLIST D'INTÉGRATION**

### **Frontend**
- [ ] Implémenter les filtres par genre
- [ ] Ajouter les filtres par catégorie
- [ ] Gérer la pagination
- [ ] Afficher les compteurs de produits
- [ ] Implémenter la recherche
- [ ] Gérer les états de chargement
- [ ] Ajouter la gestion d'erreurs

### **Tests**
- [ ] Tester tous les filtres individuellement
- [ ] Tester les combinaisons de filtres
- [ ] Tester la création avec genre
- [ ] Tester la pagination
- [ ] Tester les cas d'erreur

---

## 🎯 **9. EXEMPLES DE REQUÊTES CURL**

### **Récupérer les produits pour hommes**
```bash
curl -X GET "http://localhost:3004/products?genre=HOMME&limit=5"
```

### **Créer un produit avec genre**
```bash
curl -X POST "http://localhost:3004/products" \
  -F 'productData={"name":"Test Homme","genre":"HOMME","isReadyProduct":false,"categories":["T-shirts"],"colorVariations":[{"name":"Noir","colorCode":"#000000","images":[{"fileId":"test","view":"Front"}]}]}' \
  -F 'file_test=@image.jpg'
```

### **Récupérer les statistiques**
```bash
curl -X GET "http://localhost:3004/products/filters/stats"
```

---

## 📞 **Support**

Pour toute question ou problème d'intégration, consultez les logs backend ou contactez l'équipe de développement.

**URL de test:** `http://localhost:3004/products/filters/genres` 