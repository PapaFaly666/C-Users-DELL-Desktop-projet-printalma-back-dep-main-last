# Guide Frontend - Ajout de Sous-Catégories

Guide d'intégration pour l'implémentation de l'ajout de sous-catégories à une catégorie principale existante.

## 📡 Endpoint Principal

### Ajouter une Sous-Catégorie
```http
POST /categories/subcategory
```

**URL complète :** `http://localhost:3004/categories/subcategory`

## 📋 Corps de la Requête

### Format JSON
```json
{
  "name": "T-Shirts",
  "description": "T-shirts en coton bio et tissus recyclés",
  "categoryId": 4,
  "level": 1
}
```

### Champs Obligatoires
| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `name` | string | Nom de la sous-catégorie (max 255 caractères) | "T-Shirts" |
| `categoryId` | number | ID de la catégorie principale parente | 4 |
| `level` | number | Doit être **1** pour une sous-catégorie | 1 |

### Champs Optionnels
| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `description` | string | Description détaillée de la sous-catégorie | "T-shirts en coton bio..." |
| `displayOrder` | number | Ordre d'affichage (calculé automatiquement si non fourni) | 1 |
| `parentId` | number | Alternative à `categoryId` (pour compatibilité) | 4 |

## ✅ Réponse Succès (201 Created)

### Structure de la Réponse
```json
{
  "success": true,
  "message": "Sous-catégorie créée avec succès",
  "data": {
    "id": 9,
    "name": "T-Shirts",
    "slug": "t-shirts",
    "description": "T-shirts en coton bio et tissus recyclés",
    "parentId": 4,
    "level": 1,
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-10-17T10:56:25.506Z",
    "updated_at": "2025-10-17T10:56:25.506Z"
  }
}
```

### Description des Champs de Réponse
| Champ | Type | Description |
|-------|------|-------------|
| `success` | boolean | Indique si l'opération a réussi |
| `message` | string | Message informatif |
| `data.id` | number | ID unique de la sous-catégorie créée |
| `data.name` | string | Nom de la sous-catégorie |
| `data.slug` | string | Slug URL-friendly généré automatiquement |
| `data.description` | string\|null | Description ou null si vide |
| `data.parentId` | number | ID de la catégorie parente |
| `data.level` | number | Toujours 1 pour les sous-catégories |
| `data.display_order` | number | Position d'affichage |
| `data.is_active` | boolean | Toujours true à la création |
| `data.created_at` | string | Date de création (ISO 8601) |
| `data.updated_at` | string | Date de mise à jour (ISO 8601) |

## ❌ Réponses d'Erreur

### 400 Bad Request - Données invalides
```json
{
  "message": ["name should not be empty", "name must be a string"],
  "error": "Bad Request",
  "statusCode": 400
}
```

### 404 Not Found - Catégorie parente non trouvée
```json
{
  "success": false,
  "error": "PARENT_CATEGORY_NOT_FOUND",
  "message": "La catégorie parente n'existe pas ou n'est pas une catégorie principale"
}
```

### 409 Conflict - Doublon
```json
{
  "success": false,
  "error": "DUPLICATE_SUBCATEGORY",
  "message": "Une sous-catégorie avec ce nom existe déjà dans cette catégorie"
}
```

## 🚀 Exemples d'Implémentation

### JavaScript (Fetch API)
```javascript
async function createSubCategory(categoryId, subCategoryData) {
  try {
    const response = await fetch('http://localhost:3004/categories/subcategory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: subCategoryData.name,
        description: subCategoryData.description || '',
        categoryId: categoryId,
        level: 1
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors de la création');
    }

    const result = await response.json();
    return result.data; // Retourne la sous-catégorie créée

  } catch (error) {
    console.error('Erreur:', error);
    throw error;
  }
}

// Utilisation
createSubCategory(4, {
  name: "T-Shirts",
  description: "T-shirts en coton bio"
})
.then(subCategory => {
  console.log('Sous-catégorie créée:', subCategory);
  // Rafraîchir la liste des catégories
  refreshCategories();
})
.catch(error => {
  // Afficher le message d'erreur à l'utilisateur
  showErrorMessage(error.message);
});
```

### React Hook
```javascript
import { useState } from 'react';

const useCreateSubCategory = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createSubCategory = async (categoryId, subCategoryData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/categories/subcategory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subCategoryData.name,
          description: subCategoryData.description || '',
          categoryId: categoryId,
          level: 1
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Erreur lors de la création');
      }

      return result.data;

    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createSubCategory, loading, error };
};

// Utilisation dans un composant
const SubCategoryForm = ({ categoryId, onSuccess }) => {
  const { createSubCategory, loading, error } = useCreateSubCategory();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newSubCategory = await createSubCategory(categoryId, formData);
      onSuccess(newSubCategory);
      setFormData({ name: '', description: '' });
    } catch (error) {
      // L'erreur est déjà gérée par le hook
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}

      <input
        type="text"
        placeholder="Nom de la sous-catégorie"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
      />

      <textarea
        placeholder="Description (optionnelle)"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
      />

      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer la sous-catégorie'}
      </button>
    </form>
  );
};
```

### Vue.js
```javascript
// Dans votre store ou service API
export const categoryService = {
  async createSubCategory(categoryId, subCategoryData) {
    try {
      const response = await this.axios.post('/categories/subcategory', {
        name: subCategoryData.name,
        description: subCategoryData.description || '',
        categoryId: categoryId,
        level: 1
      });
      return response.data.data;
    } catch (error) {
      if (error.response) {
        throw new Error(error.response.data.message || 'Erreur serveur');
      }
      throw error;
    }
  }
};

// Dans votre composant
export default {
  data() {
    return {
      formData: {
        name: '',
        description: ''
      },
      loading: false,
      error: null
    };
  },

  methods: {
    async handleSubmit() {
      this.loading = true;
      this.error = null;

      try {
        const newSubCategory = await categoryService.createSubCategory(
          this.parentCategoryId,
          this.formData
        );

        this.$emit('success', newSubCategory);
        this.formData = { name: '', description: '' };

      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
```

## 🎯 Bonnes Pratiques

### Validation Côté Client
```javascript
const validateSubCategoryData = (data) => {
  const errors = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Le nom est requis');
  }

  if (data.name && data.name.length > 255) {
    errors.push('Le nom ne doit pas dépasser 255 caractères');
  }

  if (!data.categoryId || isNaN(data.categoryId)) {
    errors.push('L\'ID de la catégorie parente est requis');
  }

  return errors;
};

// Utilisation avant l'envoi
const errors = validateSubCategoryData(formData);
if (errors.length > 0) {
  setErrors(errors);
  return;
}
```

### Gestion Optimiste
```javascript
const createSubCategoryOptimistic = async (categoryId, subCategoryData) => {
  // Générer un ID temporaire
  const tempId = `temp-${Date.now()}`;

  // Créer l'objet optimiste
  const optimisticSubCategory = {
    id: tempId,
    name: subCategoryData.name,
    description: subCategoryData.description,
    is_temp: true
  };

  // Ajouter immédiatement à l'UI
  addSubCategoryToUI(optimisticSubCategory);

  try {
    const realSubCategory = await createSubCategory(categoryId, subCategoryData);
    // Remplacer l'élément temporaire par le réel
    updateSubCategoryInUI(tempId, realSubCategory);
  } catch (error) {
    // Retirer l'élément temporaire en cas d'erreur
    removeSubCategoryFromUI(tempId);
    throw error;
  }
};
```

### Rafraîchissement des Données
Après une création réussie, il est recommandé de :
1. **Ajouter la nouvelle sous-catégorie** à l'état local (mise à jour immédiate)
2. **Rafraîchir la liste des catégories** depuis le serveur
3. **Fermer le modal** ou le formulaire
4. **Afficher une notification de succès**

## 🔄 Intégration avec le Frontend Existant

### Format Actuel Envoyé par le Frontend
Le frontend envoie actuellement ce format :
```javascript
{
  name: "ferfref",
  description: "fefrer",
  parentId: 4,
  level: 1
}
```

### Adaptation Recommandée
Utilisez `categoryId` au lieu de `parentId` pour plus de clarté :
```javascript
// Avant (avec parentId)
{
  name: "ferfref",
  description: "fefrer",
  parentId: 4,
  level: 1
}

// Après (avec categoryId - recommandé)
{
  name: "ferfref",
  description: "fefrer",
  categoryId: 4,
  level: 1
}
```

> **Note :** Les deux formats (`categoryId` et `parentId`) sont supportés pour la compatibilité.

## 🧪 Tests à Réaliser

### Tests de Base
```bash
# Test 1: Création réussie
curl -X POST http://localhost:3004/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{"name": "T-Shirts", "description": "T-shirts en coton bio", "categoryId": 4, "level": 1}'

# Test 2: Sans nom
curl -X POST http://localhost:3004/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{"description": "T-shirts", "categoryId": 4, "level": 1}'

# Test 3: Catégorie parente inexistante
curl -X POST http://localhost:3004/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{"name": "Test", "categoryId": 999, "level": 1}'

# Test 4: Doublon
curl -X POST http://localhost:3004/categories/subcategory \
  -H "Content-Type: application/json" \
  -d '{"name": "T-Shirts", "description": "Test", "categoryId": 4, "level": 1}'
```

## 📚 Checklist d'Intégration

- [ ] Implémenter l'appel API avec `POST /categories/subcategory`
- [ ] Ajouter la validation côté client (nom requis, categoryId valide)
- [ ] Gérer les différents cas d'erreur (400, 404, 409)
- [ ] Afficher les messages d'erreur appropriés
- [ ] Mettre à jour l'UI après une création réussie
- [ ] Rafraîchir la liste des catégories
- [ ] Ajouter un indicateur de chargement
- [ ] Tester avec les exemples ci-dessus

---

**🎯 L'endpoint est prêt et fonctionnel !** Utilisez ce guide pour intégrer rapidement la création de sous-catégories dans votre frontend.