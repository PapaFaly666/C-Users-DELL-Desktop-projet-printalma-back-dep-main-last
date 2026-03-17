# Guide Frontend - Liaison Produits ↔ Catégories (Sélection Uniquement)

## 🎯 Objectif

Permettre de **sélectionner des catégories existantes** lors de la création/modification de produits, **sans possibilité de créer de nouvelles catégories** depuis le formulaire produit.

## 📋 Principes

1. ✅ **Sélection uniquement** : Afficher les catégories existantes
2. ❌ **Pas de création** : Rediriger vers `/admin/categories` pour créer
3. 🔗 **Liaison par IDs** : Envoyer un array `categoryIds: number[]` au backend
4. 📊 **Multi-sélection** : Permettre de sélectionner plusieurs catégories

## 🔌 Service API Frontend

### CategoryService - Récupérer les Catégories

```typescript
// src/services/categoryService.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface Category {
  id: number;
  name: string;
  description?: string;
  level: number; // 0 = Parent, 1 = Enfant, 2 = Variation
  parentId?: number | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
    children: number;
  };
  children?: Category[];
}

class CategoryService {
  /**
   * Récupérer toutes les catégories (liste plate)
   */
  async getAllCategories(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des catégories');
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('CategoryService.getAllCategories:', error);
      throw error;
    }
  }

  /**
   * Récupérer la hiérarchie complète (avec children)
   */
  async getCategoryHierarchy(): Promise<Category[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/categories/hierarchy`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération de la hiérarchie');
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('CategoryService.getCategoryHierarchy:', error);
      throw error;
    }
  }

  /**
   * Récupérer les catégories par niveau
   */
  async getCategoriesByLevel(level: number): Promise<Category[]> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/categories?level=${level}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération');
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('CategoryService.getCategoriesByLevel:', error);
      throw error;
    }
  }

  /**
   * Récupérer les produits d'une catégorie
   */
  async getProductsByCategory(categoryId: number) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/products/by-category/${categoryId}`,
        { credentials: 'include' }
      );

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des produits');
      }

      return await response.json();
    } catch (error) {
      console.error('CategoryService.getProductsByCategory:', error);
      throw error;
    }
  }
}

export default new CategoryService();
```

### ProductService - Mise à Jour pour Catégories

```typescript
// src/services/productService.ts

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  suggestedPrice?: number;
  stock: number;
  status: string;

  // 🔗 Catégories - Array d'IDs
  categoryIds: number[];

  sizes: string[];
  genre?: 'HOMME' | 'FEMME' | 'BEBE' | 'UNISEXE';
  isReadyProduct?: boolean;
  colorVariations: ColorVariationDto[];
}

class ProductService {
  async createProduct(
    payload: CreateProductPayload,
    files: { fileId: string; file: File }[]
  ): Promise<any> {
    try {
      const formData = new FormData();

      // Préparer les données avec categoryIds
      const productData = {
        ...payload,
        categoryIds: payload.categoryIds || [] // ✅ Array d'IDs
      };

      formData.append('productData', JSON.stringify(productData));

      // Ajouter les fichiers
      files.forEach(({ fileId, file }) => {
        formData.append(`file_${fileId}`, file);
      });

      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création du produit');
      }

      return await response.json();
    } catch (error) {
      console.error('ProductService.createProduct:', error);
      throw error;
    }
  }

  async updateProduct(
    productId: number,
    payload: Partial<CreateProductPayload>
  ): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...payload,
          categoryIds: payload.categoryIds || []
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la mise à jour');
      }

      return await response.json();
    } catch (error) {
      console.error('ProductService.updateProduct:', error);
      throw error;
    }
  }

  async getAllProducts(): Promise<any[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la récupération des produits');
      }

      const data = await response.json();
      return data.data || data;
    } catch (error) {
      console.error('ProductService.getAllProducts:', error);
      throw error;
    }
  }
}

export default new ProductService();
```

## 🎨 Composants React

### 1. Sélecteur Multi-Catégories (Vue Liste)

```tsx
// src/components/CategoryMultiSelector.tsx

import React, { useEffect, useState } from 'react';
import categoryService, { Category } from '../services/categoryService';

interface CategoryMultiSelectorProps {
  selectedIds: number[];
  onChange: (categoryIds: number[]) => void;
  disabled?: boolean;
}

export const CategoryMultiSelector: React.FC<CategoryMultiSelectorProps> = ({
  selectedIds,
  onChange,
  disabled = false
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await categoryService.getAllCategories();
      setCategories(data);
      console.log('📦 Catégories chargées:', data.length);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (categoryId: number) => {
    if (selectedIds.includes(categoryId)) {
      // Retirer la catégorie
      onChange(selectedIds.filter(id => id !== categoryId));
    } else {
      // Ajouter la catégorie
      onChange([...selectedIds, categoryId]);
    }
  };

  const handleSelectAll = () => {
    onChange(categories.map(c => c.id));
  };

  const handleClearAll = () => {
    onChange([]);
  };

  // Grouper par niveau
  const groupedByLevel = categories.reduce((acc, cat) => {
    const level = cat.level;
    if (!acc[level]) acc[level] = [];
    acc[level].push(cat);
    return acc;
  }, {} as Record<number, Category[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Chargement des catégories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800 text-sm">{error}</p>
        <button
          onClick={loadCategories}
          className="mt-2 text-red-600 underline text-sm"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-900">
          Catégories * (sélection multiple)
        </label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {selectedIds.length} / {categories.length} sélectionnée(s)
          </span>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Tout sélectionner
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-xs text-gray-600 hover:text-gray-800 underline"
            >
              Tout désélectionner
            </button>
          )}
        </div>
      </div>

      {/* Catégories groupées par niveau */}
      <div className="space-y-4">
        {Object.entries(groupedByLevel)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([level, cats]) => (
            <div key={level} className="space-y-2">
              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Niveau {level} {level === '0' ? '(Parents)' : level === '1' ? '(Enfants)' : '(Variations)'}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {cats.map(cat => {
                  const isSelected = selectedIds.includes(cat.id);
                  return (
                    <label
                      key={cat.id}
                      className={`
                        relative flex items-start gap-3 p-3 border rounded-lg cursor-pointer
                        transition-all duration-200
                        ${isSelected
                          ? 'bg-blue-50 border-blue-500 shadow-sm'
                          : 'bg-white border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggle(cat.id)}
                        disabled={disabled}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {cat.name}
                        </div>
                        {cat.description && (
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                            {cat.description}
                          </div>
                        )}
                        {cat._count && cat._count.products > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            📦 {cat._count.products} produit{cat._count.products > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Message informatif */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-xs text-blue-900">
          ℹ️ <strong>Sélectionnez les catégories existantes uniquement.</strong>
          <br />
          Pour créer de nouvelles catégories, rendez-vous dans{' '}
          <a
            href="/admin/categories"
            className="underline font-semibold hover:text-blue-700"
            target="_blank"
            rel="noopener noreferrer"
          >
            Gestion des catégories
          </a>
        </p>
      </div>

      {/* Tags des catégories sélectionnées */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-green-900 mb-3">
            ✅ Catégories sélectionnées ({selectedIds.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedIds.map(id => {
              const cat = categories.find(c => c.id === id);
              if (!cat) return null;

              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-300 rounded-full text-xs font-medium text-green-900"
                >
                  {cat.name}
                  <button
                    type="button"
                    onClick={() => handleToggle(id)}
                    className="text-red-500 hover:text-red-700 ml-1"
                    title="Retirer"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
```

### 2. Sélecteur Cascade (Parent → Enfant → Variations)

```tsx
// src/components/CategoryCascadeSelector.tsx

import React, { useEffect, useState } from 'react';
import categoryService, { Category } from '../services/categoryService';

interface CategoryCascadeSelectorProps {
  selectedIds: number[];
  onChange: (categoryIds: number[]) => void;
  disabled?: boolean;
}

export const CategoryCascadeSelector: React.FC<CategoryCascadeSelectorProps> = ({
  selectedIds,
  onChange,
  disabled = false
}) => {
  const [parents, setParents] = useState<Category[]>([]);
  const [children, setChildren] = useState<Category[]>([]);
  const [variations, setVariations] = useState<Category[]>([]);

  const [selectedParent, setSelectedParent] = useState<number | null>(null);
  const [selectedChild, setSelectedChild] = useState<number | null>(null);
  const [selectedVariations, setSelectedVariations] = useState<number[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParents();
  }, []);

  const loadParents = async () => {
    setLoading(true);
    try {
      const data = await categoryService.getCategoriesByLevel(0);
      setParents(data);
    } catch (error) {
      console.error('Erreur chargement parents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleParentChange = async (parentId: number | null) => {
    setSelectedParent(parentId);
    setSelectedChild(null);
    setSelectedVariations([]);
    setChildren([]);
    setVariations([]);

    if (!parentId) {
      onChange([]);
      return;
    }

    // Charger les enfants
    try {
      const allCategories = await categoryService.getAllCategories();
      const childCats = allCategories.filter(c => c.parentId === parentId && c.level === 1);
      setChildren(childCats);
    } catch (error) {
      console.error('Erreur chargement enfants:', error);
    }

    // Mettre à jour la sélection
    updateSelection(parentId, null, []);
  };

  const handleChildChange = async (childId: number | null) => {
    setSelectedChild(childId);
    setSelectedVariations([]);
    setVariations([]);

    if (!childId) {
      updateSelection(selectedParent, null, []);
      return;
    }

    // Charger les variations
    try {
      const allCategories = await categoryService.getAllCategories();
      const variationCats = allCategories.filter(c => c.parentId === childId && c.level === 2);
      setVariations(variationCats);
    } catch (error) {
      console.error('Erreur chargement variations:', error);
    }

    updateSelection(selectedParent, childId, []);
  };

  const handleVariationToggle = (variationId: number) => {
    const newVariations = selectedVariations.includes(variationId)
      ? selectedVariations.filter(id => id !== variationId)
      : [...selectedVariations, variationId];

    setSelectedVariations(newVariations);
    updateSelection(selectedParent, selectedChild, newVariations);
  };

  const updateSelection = (
    parentId: number | null,
    childId: number | null,
    variationIds: number[]
  ) => {
    const ids: number[] = [];
    if (parentId) ids.push(parentId);
    if (childId) ids.push(childId);
    ids.push(...variationIds);
    onChange(ids);
  };

  if (loading) {
    return <div className="text-sm text-gray-500">Chargement...</div>;
  }

  return (
    <div className="space-y-4">
      <label className="text-sm font-semibold text-gray-900">
        Catégories *
      </label>

      {/* Niveau 0 : Parent */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">
          Catégorie Principale (Niveau 0)
        </label>
        <select
          value={selectedParent || ''}
          onChange={(e) => handleParentChange(e.target.value ? Number(e.target.value) : null)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Sélectionnez une catégorie parent --</option>
          {parents.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Niveau 1 : Enfant */}
      {selectedParent && children.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Sous-catégorie (Niveau 1)
          </label>
          <select
            value={selectedChild || ''}
            onChange={(e) => handleChildChange(e.target.value ? Number(e.target.value) : null)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Sélectionnez une sous-catégorie --</option>
            {children.map(cat => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Niveau 2 : Variations (sélection multiple) */}
      {selectedChild && variations.length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Variations (Niveau 2) - Sélection multiple
          </label>
          <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
            {variations.map(cat => (
              <label
                key={cat.id}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedVariations.includes(cat.id)}
                  onChange={() => handleVariationToggle(cat.id)}
                  disabled={disabled}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-900">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Résumé de la sélection */}
      {selectedIds.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-green-900 mb-2">
            ✅ Sélection hiérarchique:
          </p>
          <ul className="text-xs text-green-800 space-y-1">
            {selectedParent && (
              <li>
                └─ {parents.find(p => p.id === selectedParent)?.name}
              </li>
            )}
            {selectedChild && (
              <li className="ml-4">
                └─ {children.find(c => c.id === selectedChild)?.name}
              </li>
            )}
            {selectedVariations.map(varId => (
              <li key={varId} className="ml-8">
                └─ {variations.find(v => v.id === varId)?.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Message info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          ℹ️ Pour créer de nouvelles catégories, rendez-vous dans{' '}
          <a
            href="/admin/categories"
            className="underline font-semibold"
            target="_blank"
          >
            Gestion des catégories
          </a>
        </p>
      </div>
    </div>
  );
};
```

## 🔧 Intégration dans ProductFormMain

### Option 1 : Sélecteur Multi (Liste Complète)

```tsx
// src/components/ProductFormMain.tsx

import React, { useState } from 'react';
import { CategoryMultiSelector } from './CategoryMultiSelector';
import productService from '../services/productService';

export const ProductFormMain: React.FC = () => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    // ... autres champs
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (selectedCategoryIds.length === 0) {
      alert('Veuillez sélectionner au moins une catégorie');
      return;
    }

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        price: formData.price,
        categoryIds: selectedCategoryIds, // ✅ Envoyer les IDs sélectionnés
        // ... autres champs
      };

      const result = await productService.createProduct(payload, files);
      alert('Produit créé avec succès !');
      console.log('Résultat:', result);
    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Autres champs... */}

      {/* Section Catégories */}
      <div className="bg-white rounded-lg shadow p-6">
        <CategoryMultiSelector
          selectedIds={selectedCategoryIds}
          onChange={setSelectedCategoryIds}
        />
      </div>

      {/* Bouton submit */}
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-3 rounded-lg"
      >
        Créer le produit
      </button>
    </form>
  );
};
```

### Option 2 : Sélecteur Cascade (Hiérarchique)

```tsx
// src/components/ProductFormMain.tsx

import React, { useState } from 'react';
import { CategoryCascadeSelector } from './CategoryCascadeSelector';
import productService from '../services/productService';

export const ProductFormMain: React.FC = () => {
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedCategoryIds.length === 0) {
      alert('Veuillez sélectionner au moins une catégorie');
      return;
    }

    const payload = {
      // ... formData
      categoryIds: selectedCategoryIds, // ✅ IDs hiérarchiques
    };

    await productService.createProduct(payload, files);
  };

  return (
    <form onSubmit={handleSubmit}>
      <CategoryCascadeSelector
        selectedIds={selectedCategoryIds}
        onChange={setSelectedCategoryIds}
      />
      {/* ... */}
    </form>
  );
};
```

## 📊 Format des Données Envoyées

### Requête au Backend

```json
{
  "name": "T-shirt Premium",
  "description": "T-shirt de qualité",
  "price": 2500,
  "stock": 100,
  "status": "DRAFT",

  "categoryIds": [1, 2, 5],

  "sizes": ["S", "M", "L", "XL"],
  "genre": "UNISEXE",
  "isReadyProduct": false,
  "colorVariations": [...]
}
```

### Réponse du Backend

```json
{
  "success": true,
  "message": "Produit créé avec succès",
  "data": {
    "id": 42,
    "name": "T-shirt Premium",
    "price": 2500,
    "categories": [
      {
        "id": 1,
        "name": "Vêtements",
        "level": 0
      },
      {
        "id": 2,
        "name": "T-shirts",
        "level": 1,
        "parentId": 1
      },
      {
        "id": 5,
        "name": "Col Rond",
        "level": 2,
        "parentId": 2
      }
    ],
    "colorVariations": [...]
  }
}
```

## ✅ Validation Frontend

```typescript
// Validation avant envoi
const validateForm = (): string[] => {
  const errors: string[] = [];

  if (!formData.name || formData.name.trim().length < 2) {
    errors.push('Le nom doit contenir au moins 2 caractères');
  }

  if (!formData.price || formData.price <= 0) {
    errors.push('Le prix doit être supérieur à 0');
  }

  if (selectedCategoryIds.length === 0) {
    errors.push('Veuillez sélectionner au moins une catégorie');
  }

  // Autres validations...

  return errors;
};

// Utilisation
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  const errors = validateForm();
  if (errors.length > 0) {
    alert('Erreurs de validation:\n\n' + errors.join('\n'));
    return;
  }

  // Continuer avec la création...
};
```

## 🎨 Styles CSS (Tailwind)

Les composants utilisent Tailwind CSS. Si vous n'utilisez pas Tailwind, voici les équivalents CSS :

```css
/* styles/CategorySelector.css */

.category-selector {
  padding: 1rem;
}

.category-checkbox-item {
  display: flex;
  align-items: start;
  gap: 0.75rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.category-checkbox-item:hover {
  border-color: #93c5fd;
  background-color: #f9fafb;
}

.category-checkbox-item.selected {
  background-color: #eff6ff;
  border-color: #3b82f6;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.category-level-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.category-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.category-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background-color: white;
  border: 1px solid #86efac;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  color: #166534;
}

.category-tag button {
  color: #ef4444;
  margin-left: 0.25rem;
}

.category-tag button:hover {
  color: #b91c1c;
}
```

## 🧪 Tests Frontend

### Test de Sélection

```typescript
// tests/CategoryMultiSelector.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryMultiSelector } from '../components/CategoryMultiSelector';
import categoryService from '../services/categoryService';

jest.mock('../services/categoryService');

describe('CategoryMultiSelector', () => {
  const mockCategories = [
    { id: 1, name: 'Vêtements', level: 0, order: 1 },
    { id: 2, name: 'T-shirts', level: 1, parentId: 1, order: 1 },
    { id: 3, name: 'Col Rond', level: 2, parentId: 2, order: 1 }
  ];

  beforeEach(() => {
    (categoryService.getAllCategories as jest.Mock).mockResolvedValue(mockCategories);
  });

  it('should load and display categories', async () => {
    render(<CategoryMultiSelector selectedIds={[]} onChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Vêtements')).toBeInTheDocument();
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });
  });

  it('should toggle category selection', async () => {
    const onChange = jest.fn();
    render(<CategoryMultiSelector selectedIds={[]} onChange={onChange} />);

    await waitFor(() => {
      const checkbox = screen.getByLabelText(/Vêtements/);
      fireEvent.click(checkbox);
    });

    expect(onChange).toHaveBeenCalledWith([1]);
  });

  it('should display selected categories as tags', async () => {
    render(<CategoryMultiSelector selectedIds={[1, 2]} onChange={jest.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('Vêtements')).toBeInTheDocument();
      expect(screen.getByText('T-shirts')).toBeInTheDocument();
    });
  });
});
```

## 📝 Checklist d'Implémentation

- [ ] Créer `CategoryService` avec méthodes API
- [ ] Mettre à jour `ProductService.createProduct()` pour envoyer `categoryIds`
- [ ] Créer composant `CategoryMultiSelector` OU `CategoryCascadeSelector`
- [ ] Ajouter les styles CSS/Tailwind
- [ ] Intégrer dans `ProductFormMain`
- [ ] Gérer l'état `selectedCategoryIds`
- [ ] Ajouter validation (au moins 1 catégorie)
- [ ] Afficher feedback visuel des catégories sélectionnées
- [ ] Ajouter lien vers `/admin/categories`
- [ ] Tester la sélection multiple
- [ ] Tester la création de produit
- [ ] Vérifier la réponse backend avec catégories liées

## 🔍 Debugging

### Vérifier les données envoyées

```typescript
console.log('📦 Données envoyées au backend:', {
  categoryIds: selectedCategoryIds,
  payload: productData
});
```

### Vérifier la réponse backend

```typescript
const result = await productService.createProduct(payload, files);
console.log('✅ Produit créé:', result.data);
console.log('📊 Catégories liées:', result.data.categories);
```

### Erreurs courantes

1. **categoryIds vide** → Vérifier que `selectedCategoryIds` est bien passé
2. **404 sur /categories** → Vérifier l'URL de l'API
3. **403 Forbidden** → Vérifier l'authentification (cookies)
4. **Catégories non affichées** → Vérifier le format de réponse API

Votre frontend est maintenant prêt pour lier les produits aux catégories existantes ! 🚀
