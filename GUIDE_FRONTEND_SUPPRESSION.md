# Guide Frontend - Suppression des Éléments de Catégorie

Guide d'intégration pour la suppression sécurisée des catégories, sous-catégories et variations.

## 🚨 Problème Identifié

Le frontend essayait de supprimer une variation (ID 12) en utilisant l'endpoint de suppression de catégories (`DELETE /categories/12`), ce qui a causé une erreur 404 car l'ID 12 est une **variation**, pas une catégorie principale.

## 📡 Endpoints de Suppression

### 1. Supprimer une Catégorie Principale
```http
DELETE /categories/{id}
```

**URL complète :** `http://localhost:3004/categories/{id}`

**Exemple :** `DELETE http://localhost:3004/categories/6`

### 2. Supprimer une Sous-Catégorie ⭐ **NOUVEAU**
```http
DELETE /sub-categories/{id}
```

**URL complète :** `http://localhost:3004/sub-categories/{id}`

**Exemple :** `DELETE http://localhost:3004/sub-categories/11`

### 3. Supprimer une Variation ⭐ **NOUVEAU**
```http
DELETE /variations/{id}
```

**URL complète :** `http://localhost:3004/variations/{id}`

**Exemple :** `DELETE http://localhost:3004/variations/12`

## 🎯 Logique de Suppression

### Règle Principale
**Seuls les éléments qui ne sont pas utilisés par des produits peuvent être supprimés.**

### Vérification des Produits Associés
Avant de supprimer un élément, le système vérifie s'il y a des produits liés :

- **Catégorie principale** : Vérifie les produits avec `categoryId`
- **Sous-catégorie** : Vérifie les produits avec `subCategoryId`
- **Variation** : Vérifie les produits avec `variationId`

## ✅ Réponses Succès (204 No Content)

### Suppression réussie
```json
// Corps vide avec statut 204
```

### Réponse HTTP
```http
HTTP/1.1 204 No Content
X-Powered-By: Express
Vary: Origin
Access-Control-Allow-Credentials: true
Content-Length: 0
```

## ❌ Réponses d'Erreur

### 404 Not Found - Élément non trouvé
```json
{
  "message": "Sous-catégorie avec ID 999 non trouvée",
  "error": "Not Found",
  "statusCode": 404
}
```

### 409 Conflict - Élément utilisé par des produits
```json
{
  "success": false,
  "error": "SUBCATEGORY_IN_USE",
  "message": "La sous-catégorie est utilisée par 3 produit(s). Elle ne peut pas être supprimée.",
  "details": {
    "subCategoryId": 11,
    "productsCount": 3
  }
}
```

### 409 Conflict - Variation utilisée par des produits
```json
{
  "success": false,
  "error": "VARIATION_IN_USE",
  "message": "La variation est utilisée par 1 produit(s). Elle ne peut pas être supprimée.",
  "details": {
    "variationId": 12,
    "productsCount": 1
  }
}
```

## 🔧 Implémentation Frontend

### Fonction Générique de Suppression
```javascript
/**
 * Supprime un élément de catégorie (catégorie, sous-catégorie ou variation)
 * @param {string} type - Type d'élément ('category', 'subcategory', 'variation')
 * @param {number} id - ID de l'élément à supprimer
 * @returns {Promise<void>}
 */
async function deleteCategoryElement(type, id) {
  const endpoints = {
    category: `/categories/${id}`,
    subcategory: `/sub-categories/${id}`,
    variation: `/variations/${id}`
  };

  const endpoint = endpoints[type];
  if (!endpoint) {
    throw new Error(`Type d'élément non supporté: ${type}`);
  }

  try {
    const response = await fetch(`http://localhost:3004${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (response.status === 204) {
      // Suppression réussie - pas de contenu à parser
      return;
    }

    const error = await response.json();

    if (response.status === 404) {
      throw new Error(`Élément non trouvé: ${error.message}`);
    }

    if (response.status === 409) {
      throw new Error(error.message);
    }

    throw new Error(`Erreur ${response.status}: ${error.message || 'Erreur inconnue'}`);

  } catch (error) {
    console.error(`Erreur lors de la suppression ${type} ${id}:`, error);
    throw error;
  }
}
```

### Hook React avec Gestion d'État
```javascript
import { useState } from 'react';

const useDeleteCategoryElement = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteElement = async (type, id) => {
    setLoading(true);
    setError(null);

    try {
      await deleteCategoryElement(type, id);
      // Succès - le composant parent gérera le rafraîchissement
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { deleteElement, loading, error };
};

// Utilisation dans un composant
const CategoryTree = () => {
  const { deleteElement, loading, error } = useDeleteCategoryElement();

  const handleDelete = async (type, id, name) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      return;
    }

    try {
      await deleteElement(type, id);
      // Rafraîchir la liste des catégories
      refreshCategories();
      showSuccessMessage(`${type} supprimé avec succès`);
    } catch (error) {
      showErrorMessage(error.message);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}

      {/* Catégorie principale */}
      <button
        onClick={() => handleDelete('category', 6, 'Vêtements')}
        disabled={loading}
      >
        {loading ? 'Suppression...' : 'Supprimer'}
      </button>

      {/* Sous-catégorie */}
      <button
        onClick={() => handleDelete('subcategory', 11, 'ffef')}
        disabled={loading}
      >
        {loading ? 'Suppression...' : 'Supprimer'}
      </button>

      {/* Variation */}
      <button
        onClick={() => handleDelete('variation', 12, '250ML')}
        disabled={loading}
      >
        {loading ? 'Suppression...' : 'Supprimer'}
      </button>
    </div>
  );
};
```

### Composant de Confirmation Avancé
```javascript
const DeleteConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  element,
  usageInfo
}) => {
  const canDelete = usageInfo.productsCount === 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmer la suppression</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p>
            Êtes-vous sûr de vouloir supprimer
            <strong> "{element.name}" </strong> ?
          </p>

          {!canDelete && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <p className="text-red-800 font-medium">
                    Impossible de supprimer cet élément
                  </p>
                  <p className="text-red-600 text-sm mt-1">
                    {usageInfo.productsCount} produit(s) sont lié(s) à cet élément.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={!canDelete}
            >
              Supprimer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
```

### Détermination du Type d'Élément
```javascript
/**
 * Détermine le type d'un élément de catégorie
 * @param {Object} element - Élément de catégorie
 * @returns {string} - Type ('category', 'subcategory', 'variation')
 */
function determineElementType(element) {
  // Vérifier les champs spécifiques
  if (element.variations !== undefined && element.subCategories !== undefined) {
    return 'category'; // Catégorie principale a subCategories et products
  }

  if (element.variations !== undefined) {
    return 'subcategory'; // Sous-catégorie a variations
  }

  if (element.subCategory !== undefined) {
    return 'variation'; // Variation a subCategory
  }

  // Fallback basé sur l'ID et la structure des données
  if (element.categoryId && !element.subCategoryId) {
    return 'subcategory';
  }

  if (element.subCategoryId) {
    return 'variation';
  }

  if (element.subCategories) {
    return 'category';
  }

  return 'unknown';
}
```

## 🔄 Intégration avec le Code Existant

### Modification du code de suppression actuel
```javascript
// Avant (incorrect)
const handleDelete = async (elementId) => {
  try {
    await axios.delete(`/categories/${elementId}`);
    // ...
  } catch (error) {
    console.error('Erreur:', error);
  }
};

// Après (correct)
const handleDelete = async (element) => {
  const type = determineElementType(element);

  try {
    await deleteCategoryElement(type, element.id);
    // ...
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### Exemple avec CategoryTree.tsx
```typescript
interface CategoryNodeProps {
  category: any; // Votre type de catégorie
  onDelete: (type: string, id: number, name: string) => void;
}

const CategoryNode: React.FC<CategoryNodeProps> = ({ category, onDelete }) => {
  const handleDelete = () => {
    const type = determineElementType(category);
    onDelete(type, category.id, category.name);
  };

  return (
    <div className="category-node">
      <span>{category.name}</span>

      {/* Bouton de suppression */}
      <button
        onClick={handleDelete}
        className="delete-button"
        title="Supprimer cet élément"
      >
        🗑️
      </button>
    </div>
  );
};
```

## 🧪 Tests avec curl

### 1. Supprimer une sous-catégorie sans produits
```bash
curl -X DELETE http://localhost:3004/sub-categories/11 \
  -H "Content-Type: application/json" \
  -v
```

### 2. Essayer de supprimer une sous-catégorie avec produits
```bash
curl -X DELETE http://localhost:3004/sub-categories/6 \
  -H "Content-Type: application/json" \
  -v
```

### 3. Supprimer une variation sans produits
```bash
curl -X DELETE http://localhost:3004/variations/23 \
  -H "Content-Type: application/json" \
  -v
```

### 4. Essayer de supprimer une variation avec produits
```bash
curl -X DELETE http://localhost:3004/variations/6 \
  -H "Content-Type: application/json" \
  -v
```

## 📋 Checklist d'Intégration Frontend

- [ ] Mettre à jour les appels API pour utiliser les bons endpoints
- [ ] Ajouter la logique de détermination du type d'élément
- [ ] Gérer les différentes réponses d'erreur (404, 409)
- [ ] Afficher des messages d'erreur clairs à l'utilisateur
- [ ] Ajouter des confirmations de suppression
- [ ] Rafraîchir l'interface après une suppression réussie
- [ ] Désactiver les boutons de suppression pendant le chargement
- [ ] Tester avec les exemples curl ci-dessus

## 🎯 Cas d'Usage Spécifique

### Cas de l'erreur initiale (ID 12)
```javascript
// Avant (incorrect)
axios.delete('/categories/12') // ❌ 404 - ID 12 est une variation

// Après (correct)
axios.delete('/variations/12') // ✅ 204 - Supprime la variation 250ML
```

### Flux utilisateur type
1. **Utilisateur clique sur "Supprimer"** sur une variation
2. **Frontend détecte le type** (`variation`) grâce à `determineElementType()`
3. **Frontend appelle le bon endpoint** (`DELETE /variations/12`)
4. **Système vérifie** si des produits utilisent cette variation
5. **Si aucun produit** → Suppression réussie (204)
6. **Si produits existent** → Erreur 409 avec message explicite
7. **Frontend affiche** le résultat à l'utilisateur

---

**✅ Les nouveaux endpoints sont maintenant prêts et sécurisés !** Utilisez ce guide pour mettre à jour votre frontend et éviter les erreurs 404 lors de la suppression d'éléments de catégorie.