# 🎨 Guide Frontend - Affichage des Thèmes

## 📋 **Vue d'ensemble**

Ce guide contient uniquement les endpoints et réponses nécessaires pour afficher les thèmes dans le frontend.

## 🔐 **Configuration de base**

```javascript
// Configuration API
const API_BASE_URL = 'http://localhost:3004';
const API_HEADERS = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};
```

## 🚀 **Endpoints et Réponses**

### **1. GET /themes - Liste des thèmes**

**Endpoint :**
```javascript
GET ${API_BASE_URL}/themes
```

**Headers :**
```javascript
{
  'Authorization': 'Bearer YOUR_TOKEN',
  'Content-Type': 'application/json'
}
```

**Query Parameters (optionnels) :**
```javascript
{
  status: 'active' | 'inactive' | 'all',
  category: 'string',
  search: 'string',
  limit: 20,
  offset: 0,
  featured: true | false
}
```

**Exemple de requête :**
```javascript
// Récupérer tous les thèmes actifs
const response = await fetch(`${API_BASE_URL}/themes?status=active`, {
  headers: API_HEADERS
});

// Récupérer les thèmes avec filtres
const response = await fetch(`${API_BASE_URL}/themes?status=active&category=anime&limit=10`, {
  headers: API_HEADERS
});
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Manga Collection",
      "description": "Thème dédié aux mangas et animes populaires",
      "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
      "productCount": 15,
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-20T14:45:00.000Z",
      "status": "active",
      "category": "anime",
      "featured": true
    },
    {
      "id": 2,
      "name": "Sport Elite",
      "description": "Produits pour les passionnés de sport",
      "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/sport-cover.jpg",
      "productCount": 8,
      "createdAt": "2024-01-10T09:15:00.000Z",
      "updatedAt": "2024-01-18T16:20:00.000Z",
      "status": "active",
      "category": "sports",
      "featured": false
    }
  ],
  "pagination": {
    "total": 25,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Réponse (404) :**
```json
{
  "success": false,
  "error": "Aucun thème trouvé",
  "statusCode": 404
}
```

### **2. GET /themes/:id - Détails d'un thème**

**Endpoint :**
```javascript
GET ${API_BASE_URL}/themes/${themeId}
```

**Exemple de requête :**
```javascript
const response = await fetch(`${API_BASE_URL}/themes/1`, {
  headers: API_HEADERS
});
```

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Manga Collection",
    "description": "Thème dédié aux mangas et animes populaires",
    "coverImage": "https://res.cloudinary.com/example/image/upload/v1/themes/manga-cover.jpg",
    "productCount": 15,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z",
    "status": "active",
    "category": "anime",
    "featured": true,
    "products": [
      {
        "id": 101,
        "name": "T-Shirt Naruto",
        "price": 2500,
        "status": "published"
      },
      {
        "id": 102,
        "name": "Hoodie Dragon Ball",
        "price": 3500,
        "status": "published"
      }
    ]
  }
}
```

**Réponse (404) :**
```json
{
  "success": false,
  "error": "Thème non trouvé",
  "statusCode": 404
}
```

## 🎨 **Exemples d'utilisation Frontend**

### **1. Service API pour les thèmes**

```javascript
// services/themeService.js
class ThemeService {
  constructor() {
    this.baseURL = 'http://localhost:3004';
    this.headers = {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    };
  }

  // Récupérer tous les thèmes
  async getThemes(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/themes?${params}`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des thèmes');
    }
    
    return response.json();
  }

  // Récupérer un thème par ID
  async getTheme(id) {
    const response = await fetch(`${this.baseURL}/themes/${id}`, {
      headers: this.headers
    });
    
    if (!response.ok) {
      throw new Error('Thème non trouvé');
    }
    
    return response.json();
  }
}

export default new ThemeService();
```

### **2. Composant React - Liste des thèmes**

```jsx
// components/ThemesList.jsx
import React, { useState, useEffect } from 'react';
import themeService from '../services/themeService';

const ThemesList = () => {
  const [themes, setThemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'active',
    limit: 20
  });

  useEffect(() => {
    loadThemes();
  }, [filters]);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const response = await themeService.getThemes(filters);
      setThemes(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement des thèmes...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="themes-grid">
      {themes.map(theme => (
        <div key={theme.id} className="theme-card">
          <img 
            src={theme.coverImage || '/default-theme.jpg'} 
            alt={theme.name}
            className="theme-cover"
          />
          <div className="theme-info">
            <h3>{theme.name}</h3>
            <p>{theme.description}</p>
            <div className="theme-meta">
              <span className="category">{theme.category}</span>
              <span className="product-count">{theme.productCount} produits</span>
              {theme.featured && <span className="featured">⭐ Mis en avant</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ThemesList;
```

### **3. Composant React - Détails d'un thème**

```jsx
// components/ThemeDetails.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import themeService from '../services/themeService';

const ThemeDetails = () => {
  const { id } = useParams();
  const [theme, setTheme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTheme();
  }, [id]);

  const loadTheme = async () => {
    try {
      setLoading(true);
      const response = await themeService.getTheme(id);
      setTheme(response.data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement du thème...</div>;
  if (error) return <div>Erreur: {error}</div>;
  if (!theme) return <div>Thème non trouvé</div>;

  return (
    <div className="theme-details">
      <div className="theme-header">
        <img 
          src={theme.coverImage || '/default-theme.jpg'} 
          alt={theme.name}
          className="theme-cover-large"
        />
        <div className="theme-info">
          <h1>{theme.name}</h1>
          <p className="description">{theme.description}</p>
          <div className="meta">
            <span>Catégorie: {theme.category}</span>
            <span>Produits: {theme.productCount}</span>
            <span>Statut: {theme.status}</span>
            {theme.featured && <span>⭐ Mis en avant</span>}
          </div>
        </div>
      </div>

      {theme.products && theme.products.length > 0 && (
        <div className="theme-products">
          <h2>Produits du thème</h2>
          <div className="products-grid">
            {theme.products.map(product => (
              <div key={product.id} className="product-card">
                <h3>{product.name}</h3>
                <p>Prix: {product.price / 100}€</p>
                <span className="status">{product.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeDetails;
```

### **4. Filtres et recherche**

```jsx
// components/ThemeFilters.jsx
import React from 'react';

const ThemeFilters = ({ filters, onFilterChange }) => {
  return (
    <div className="theme-filters">
      <select 
        value={filters.status || 'all'} 
        onChange={(e) => onFilterChange('status', e.target.value)}
      >
        <option value="all">Tous les statuts</option>
        <option value="active">Actifs</option>
        <option value="inactive">Inactifs</option>
      </select>

      <input 
        type="text" 
        placeholder="Rechercher un thème..."
        value={filters.search || ''}
        onChange={(e) => onFilterChange('search', e.target.value)}
      />

      <select 
        value={filters.category || ''} 
        onChange={(e) => onFilterChange('category', e.target.value)}
      >
        <option value="">Toutes les catégories</option>
        <option value="anime">Anime</option>
        <option value="sports">Sports</option>
        <option value="gaming">Gaming</option>
      </select>

      <label>
        <input 
          type="checkbox" 
          checked={filters.featured || false}
          onChange={(e) => onFilterChange('featured', e.target.checked)}
        />
        Mis en avant seulement
      </label>
    </div>
  );
};

export default ThemeFilters;
```

## 🎯 **Structure des données**

### **Objet Thème**
```javascript
{
  id: number,              // ID unique du thème
  name: string,            // Nom du thème
  description: string,     // Description du thème
  coverImage: string,      // URL de l'image de couverture
  productCount: number,    // Nombre de produits dans le thème
  createdAt: string,       // Date de création (ISO)
  updatedAt: string,       // Date de modification (ISO)
  status: 'active' | 'inactive',  // Statut du thème
  category: string,        // Catégorie du thème
  featured: boolean        // Si le thème est mis en avant
}
```

### **Objet Produit (dans les détails)**
```javascript
{
  id: number,              // ID du produit
  name: string,            // Nom du produit
  price: number,           // Prix en centimes
  status: string           // Statut du produit
}
```

## 🚨 **Gestion des erreurs**

```javascript
// Exemple de gestion d'erreur
try {
  const response = await themeService.getThemes();
  // Traitement des données
} catch (error) {
  if (error.message.includes('401')) {
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  } else if (error.message.includes('404')) {
    // Afficher un message "Aucun thème trouvé"
    setMessage('Aucun thème trouvé');
  } else {
    // Erreur générique
    setMessage('Erreur lors du chargement des thèmes');
  }
}
```

## 📱 **Responsive Design**

```css
/* CSS pour une grille responsive */
.themes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  padding: 20px;
}

.theme-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  overflow: hidden;
  transition: transform 0.2s;
}

.theme-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.theme-cover {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .themes-grid {
    grid-template-columns: 1fr;
    gap: 15px;
    padding: 15px;
  }
}
```

---

**✅ Ce guide contient tout ce qu'il faut pour afficher les thèmes dans le frontend !** 