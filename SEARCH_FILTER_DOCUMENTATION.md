# 🔍 Documentation - Filtre `search` Vendor Products

## 🌐 Endpoint

### `GET http://localhost:3004/public/vendor-products?search=VOTRE_RECHERCHE`

**Description** : Recherche textuelle globale dans tous les produits vendeurs.

---

## 🎯 Filtre `search`

### Paramètre

| Paramètre | Type | Description | Exemple |
|-----------|------|-------------|---------|
| `search` | string | Terme de recherche textuelle | `tshirt` |

### Caractéristiques

- ✅ **Recherche insensible à la casse** : `Tshirt` = `tshirt` = `TSHIRT`
- ✅ **Recherche partielle** : recherche du mot clé dans les textes
- ✅ **Multiple champs analysés** : nom, description, catégories, vendeur, etc.
- ✅ **Recherche fléxible** : trouve les contenus similaires

---

## 📝 Exemples d'Utilisation

### 1. Recherche de base

```bash
# Rechercher des tshirts
curl "http://localhost:3004/public/vendor-products?search=tshirt"

# Rechercher des polos
curl "http://localhost:3004/public/vendor-products?search=polos"

# Rechercher des chemises
curl "http://localhost:3004/public/vendor-products?search=chemise"
```

### 2. Recherche par couleur

```bash
# Rechercher des produits bleus
curl "http://localhost:3004/public/vendor-products?search=bleu"

# Rechercher des produits rouges
curl "http://localhost:3004/public/vendor-products?search=rouge"

# Rechercher des produits noirs
curl "http://localhost:3004/public/vendor-products?search=noir"
```

### 3. Recherche par vendeur

```bash
# Rechercher par nom de vendeur
curl "http://localhost:3004/public/vendor-products?search=PAPA"

# Rechercher par nom de boutique
curl "http://localhost:3004/public/vendor-products?search=carré"
```

### 4. Recherche par description

```bash
# Rechercher des produits d'été
curl "http://localhost:3004/public/vendor-products?search=été"

# Rechercher des produits pour sortie
curl "http://localhost:3004/public/vendor-products?search=sortie"
```

---

## 📊 Structure de la Réponse

### Format JSON

```json
{
  "success": true,
  "message": "Produits récupérés avec succès",
  "data": [
    {
      "id": 36,
      "vendorName": "Tshirt",
      "price": 6000,
      "status": "PUBLISHED",
      "adminProduct": {
        "id": 66,
        "name": "Tshirt",
        "description": "Tshirt pour été",
        // ... autres champs
      },
      "vendor": {
        "id": 37,
        "fullName": "Papa DIAGNE",
        "shop_name": "C'est carré"
        // ... autres champs
      }
      // ... autres champs
    }
  ],
  "pagination": {
    "total": 2,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

---

## 🧪 Tests Validés

### Résultats des tests

```bash
# ✅ Test 1: Recherche "tshirt"
curl "http://localhost:3004/public/vendor-products?search=tshirt"
# Résultat: 2 produits trouvés

# ✅ Test 2: Recherche "polo"
curl "http://localhost:3004/public/vendor-products?search=polo"
# Résultat: 1 produit trouvé

# ✅ Test 3: Recherche "PIRATE" (design)
curl "http://localhost:3004/public/vendor-products?search=PIRATE"
# Résultat: 0 produit (recherche trop spécifique)
```

---

## 💡 Utilisation Frontend

### JavaScript/React

```javascript
// Fonction de recherche
async function searchProducts(query) {
  if (!query.trim()) return; // Éviter les recherches vides

  try {
    const response = await fetch(`http://localhost:3004/public/vendor-products?search=${encodeURIComponent(query)}`);
    const data = await response.json();

    if (data.success) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Erreur de recherche:', error);
    return [];
  }
}

// Hook React avec debouncing
import { useState, useEffect } from 'react';

function useProductSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      if (searchTerm.trim()) {
        setLoading(true);
        const products = await searchProducts(searchTerm);
        setResults(products);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 300); // 300ms de debouncing

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  return { searchTerm, setSearchTerm, results, loading };
}

// Composant de recherche
function SearchComponent() {
  const { searchTerm, setSearchTerm, results, loading } = useProductSearch();

  return (
    <div>
      <input
        type="text"
        placeholder="Rechercher des produits..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {loading && <div>Recherche en cours...</div>}

      <div className="results">
        {results.map(product => (
          <div key={product.id}>
            <h3>{product.adminProduct.name}</h3>
            <p>{product.adminProduct.description}</p>
            <p>{product.price / 100}€</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vue.js

```javascript
// Dans un composant Vue
export default {
  data() {
    return {
      searchQuery: '',
      results: [],
      loading: false
    };
  },

  methods: {
    async performSearch() {
      if (!this.searchQuery.trim()) {
        this.results = [];
        return;
      }

      this.loading = true;
      try {
        const response = await fetch(`http://localhost:3004/public/vendor-products?search=${encodeURIComponent(this.searchQuery)}`);
        const data = await response.json();

        if (data.success) {
          this.results = data.data;
        }
      } catch (error) {
        console.error('Erreur:', error);
        this.results = [];
      } finally {
        this.loading = false;
      }
    },

    // Debouncing
    debouncedSearch: _.debounce(function() {
      this.performSearch();
    }, 300)
  },

  watch: {
    searchQuery(newQuery) {
      this.debouncedSearch();
    }
  }
};
```

---

## 🚀 Bonnes Pratiques

### 1. Debouncing

Évitez les appels multiples lors de la saisie :

```javascript
let timeoutId;
const searchInput = document.getElementById('search');

searchInput.addEventListener('input', (e) => {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    // Appel API après 300ms d'inactivité
    performSearch(e.target.value);
  }, 300);
});
```

### 2. Gestion des espaces et minuscules

```javascript
function normalizeSearchQuery(query) {
  return query.trim().toLowerCase();
}
```

### 3. Affichage des résultats

```javascript
function displaySearchResults(results) {
  if (results.length === 0) {
    return "Aucun produit trouvé pour votre recherche.";
  }

  return `Trouvé ${results.length} produit(s) pour votre recherche.`;
}
```

### 4. Gestion d'erreurs

```javascript
async function safeSearch(query) {
  try {
    const response = await fetch(`http://localhost:3004/public/vendor-products?search=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur de recherche:', error);
    return { success: false, data: [] };
  }
}
```

---

## 🧪 Script de Test Simple

```bash
#!/bin/bash
# test-search.sh

echo "🔍 Tests du filtre search"
echo "========================"

API_URL="http://localhost:3004/public/vendor-products"

# Test avec différents termes
search_terms=("tshirt" "polo" "bleu" "rouge" "été" "PAPA" "Inexistant")

for term in "${search_terms[@]}"; do
    echo "Recherche: '$term'"
    response=$(curl -s "$API_URL?search=$term")
    success=$(echo "$response" | jq -r '.success')
    count=$(echo "$response" | jq '.data | length')

    echo "✅ Success: $success"
    echo "📦 Résultats: $count"
    echo "---"
done

echo "🏁 Tests terminés"
```

---

## 📈 Performance

### Optimisations

1. **Évitez les recherches trop courtes** : minimum 2-3 caractères
2. **Utilisez le debouncing** : attendez 300ms après la saisie
3. **Limitez les résultats** : utilisez `limit` pour les grandes recherches
4. **Cachez les résultats** : pour les recherches fréquentes

### Exemple optimisé

```javascript
const searchCache = new Map();

async function optimizedSearch(query) {
  if (searchCache.has(query)) {
    return searchCache.get(query);
  }

  if (query.length < 3) {
    return [];
  }

  const response = await fetch(`http://localhost:3004/public/vendor-products?search=${encodeURIComponent(query)}&limit=20`);
  const data = await response.json();

  if (data.success) {
    searchCache.set(query, data.data);
    return data.data;
  }

  return [];
}
```

---

## 📞 Support

- **Endpoint** : `GET http://localhost:3004/public/vendor-products?search=query`
- **Documentation complète** : Voir `VENDOR_PRODUCTS_API_DOCS.md`
- **Tests** : Utilisez les exemples ci-dessus

---

---

## 🎨 Positionnement Design Inclus

**✅ Information importante** : L'endpoint `/public/vendor-products` inclut déjà le **positionnement exact du design** pour chaque produit, similaire à l'endpoint `/vendor/products`.

### Données de Positionnement Incluses

```json
{
  "designPositions": [
    {
      "designId": 1,
      "position": {
        "x": -4,                    // Position X exacte en pixels
        "y": -18.138621875,         // Position Y exacte en pixels
        "scale": 0.85,               // Échelle du design (0.1 à 2.0)
        "rotation": 0,                // Rotation en degrés
        "constraints": {
          "minScale": 0.1,           // Échelle minimale autorisée
          "maxScale": 2.0            // Échelle maximale autorisée
        },
        "designWidth": 1200,          // Largeur originale du design
        "designHeight": 1200           // Hauteur originale du design
      }
    }
  ]
}
```

### Documentation Complète

Pour plus de détails sur l'utilisation du positionnement du design, consultez :
- 📄 `DESIGN_POSITIONING_PUBLIC_API_GUIDE.md` - Guide complet d'intégration
- 🌐 `design-positioning-demo.html` - Démonstration interactive
- 🧪 `test-design-positioning.sh` - Script de validation

---

**Dernière mise à jour** : 22 octobre 2025
**Version** : v1.1 (avec positionnement design)
**Statut** : ✅ Production Ready