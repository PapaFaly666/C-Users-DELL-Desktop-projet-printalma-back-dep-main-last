# 📁 Guide Frontend - Création de Catégories avec Hiérarchie Parent/Enfant

## 🎯 Vue d'Ensemble

Le système de catégories supporte **3 niveaux hiérarchiques** :

```
📦 Niveau 0 - PARENT (Catégorie principale)
    └── 📂 Niveau 1 - ENFANT (Sous-catégorie)
        └── 📄 Niveau 2 - VARIATION (Variation spécifique)
```

### Exemples Concrets

```
📦 Téléphone (parent)
    ├── 📂 Coque (enfant)
    │   ├── 📄 iPhone 13 (variation)
    │   ├── 📄 iPhone 14 (variation)
    │   └── 📄 iPhone 15 (variation)
    ├── 📂 Écouteur (enfant)
    │   ├── 📄 Sans fil (variation)
    │   └── 📄 Avec fil (variation)
    └── 📂 Chargeur (enfant)
        ├── 📄 USB-C (variation)
        └── 📄 Lightning (variation)

📦 Vêtements (parent)
    ├── 📂 T-Shirt (enfant)
    │   ├── 📄 Homme (variation)
    │   ├── 📄 Femme (variation)
    │   └── 📄 Enfant (variation)
    └── 📂 Pantalon (enfant)
        ├── 📄 Jean (variation)
        └── 📄 Jogging (variation)
```

---

## 📡 API Endpoints Disponibles

### 1️⃣ Créer une catégorie simple

```http
POST /categories
Content-Type: application/json

{
  "name": "T-Shirt",
  "description": "T-shirts personnalisables",
  "parentId": null,  // null = catégorie parent
  "level": 0         // 0 = parent, 1 = enfant, 2 = variation
}
```

### 2️⃣ Créer une structure complète (RECOMMANDÉ)

```http
POST /categories/structure
Content-Type: application/json

{
  "parentName": "Téléphone",
  "parentDescription": "Accessoires téléphone",
  "childName": "Coque",  // Optionnel
  "variations": [
    "iPhone 13",
    "iPhone 14",
    "iPhone 15"
  ]
}
```

**Avantages** :
- ✅ Crée toute la hiérarchie en une seule requête
- ✅ Réutilise les catégories existantes
- ✅ Saute automatiquement les doublons
- ✅ Calcule automatiquement les niveaux

### 3️⃣ Récupérer la hiérarchie complète

```http
GET /categories/hierarchy
```

**Réponse** :
```json
[
  {
    "id": 1,
    "name": "Téléphone",
    "description": "Accessoires téléphone",
    "level": 0,
    "parentId": null,
    "productCount": 15,
    "subcategories": [
      {
        "id": 2,
        "name": "Coque",
        "level": 1,
        "parentId": 1,
        "subcategories": [
          {
            "id": 3,
            "name": "iPhone 13",
            "level": 2,
            "parentId": 2,
            "subcategories": []
          },
          {
            "id": 4,
            "name": "iPhone 14",
            "level": 2,
            "parentId": 2,
            "subcategories": []
          }
        ]
      }
    ]
  }
]
```

### 4️⃣ Vérifier si une catégorie existe

```http
GET /categories/check-duplicate?name=iPhone 13&parentId=2
```

**Réponse** :
```json
{
  "exists": true,
  "category": {
    "id": 3,
    "name": "iPhone 13",
    "parentId": 2
  }
}
```

### 5️⃣ Mettre à jour une catégorie

```http
PUT /categories/:id
Content-Type: application/json

{
  "name": "iPhone 13 Pro",
  "description": "Coques pour iPhone 13 Pro"
}
```

### 6️⃣ Supprimer une catégorie (cascade)

```http
DELETE /categories/:id
```

⚠️ **Attention** : Supprime aussi tous les enfants !

---

## 💻 Implémentation Frontend

### 1️⃣ Interface TypeScript

```typescript
// src/types/category.types.ts

export interface Category {
  id: number;
  name: string;
  description?: string;
  level: number;           // 0 = parent, 1 = enfant, 2 = variation
  parentId: number | null;
  order?: number;
  productCount?: number;
  subcategories?: Category[];
  parent?: Category;
  children?: Category[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateCategoryDto {
  name: string;
  description?: string;
  parentId?: number | null;
  level?: number;
  order?: number;
}

export interface CreateCategoryStructureDto {
  parentName: string;
  parentDescription?: string;
  childName?: string;
  variations: string[];
}

export interface CategoryHierarchy {
  parent: Category;
  child?: Category;
  totalVariations: number;
  createdVariations: number;
}
```

---

### 2️⃣ Service API

```typescript
// src/services/category.service.ts

import api from './api';
import {
  Category,
  CreateCategoryDto,
  CreateCategoryStructureDto,
  CategoryHierarchy
} from '@/types/category.types';

class CategoryService {
  /**
   * Créer une catégorie simple
   */
  async createCategory(data: CreateCategoryDto): Promise<Category> {
    try {
      const response = await api.post('/categories', data);
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.error === 'DUPLICATE_CATEGORY') {
        throw new Error(`La catégorie "${data.name}" existe déjà`);
      }
      throw error;
    }
  }

  /**
   * Créer une structure complète (RECOMMANDÉ)
   */
  async createStructure(data: CreateCategoryStructureDto): Promise<{
    success: boolean;
    createdCount: number;
    skippedVariations: string[];
    message: string;
    data: CategoryHierarchy;
  }> {
    const response = await api.post('/categories/structure', data);
    return response.data;
  }

  /**
   * Récupérer toutes les catégories (liste plate)
   */
  async getAllCategories(): Promise<Category[]> {
    const response = await api.get('/categories');
    return response.data;
  }

  /**
   * Récupérer la hiérarchie complète (arbre)
   */
  async getCategoryHierarchy(): Promise<Category[]> {
    const response = await api.get('/categories/hierarchy');
    return response.data;
  }

  /**
   * Récupérer une catégorie par ID
   */
  async getCategoryById(id: number): Promise<Category> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  }

  /**
   * Vérifier si une catégorie existe
   */
  async checkDuplicate(name: string, parentId?: number): Promise<{
    exists: boolean;
    category: Category | null;
  }> {
    const params = new URLSearchParams({ name });
    if (parentId) params.append('parentId', parentId.toString());

    const response = await api.get(`/categories/check-duplicate?${params}`);
    return response.data;
  }

  /**
   * Mettre à jour une catégorie
   */
  async updateCategory(id: number, data: Partial<CreateCategoryDto>): Promise<Category> {
    const response = await api.put(`/categories/${id}`, data);
    return response.data.data;
  }

  /**
   * Supprimer une catégorie
   */
  async deleteCategory(id: number): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export default new CategoryService();
```

---

### 3️⃣ Composants React

#### 🎯 Formulaire de Création (Structure Complète)

```tsx
// src/components/categories/CreateCategoryStructureForm.tsx

import React, { useState } from 'react';
import categoryService from '@/services/category.service';
import { CreateCategoryStructureDto } from '@/types/category.types';

const CreateCategoryStructureForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState<CreateCategoryStructureDto>({
    parentName: '',
    parentDescription: '',
    childName: '',
    variations: [''],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVariationChange = (index: number, value: string) => {
    const newVariations = [...formData.variations];
    newVariations[index] = value;
    setFormData({ ...formData, variations: newVariations });
  };

  const addVariation = () => {
    setFormData({
      ...formData,
      variations: [...formData.variations, '']
    });
  };

  const removeVariation = (index: number) => {
    setFormData({
      ...formData,
      variations: formData.variations.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filtrer les variations vides
      const cleanedVariations = formData.variations.filter(v => v.trim() !== '');

      if (cleanedVariations.length === 0) {
        setError('Veuillez ajouter au moins une variation');
        return;
      }

      const result = await categoryService.createStructure({
        ...formData,
        variations: cleanedVariations
      });

      alert(`✅ ${result.message}\n\n` +
            `Créé: ${result.createdCount} élément(s)\n` +
            `Ignoré: ${result.skippedVariations.length} doublon(s)`);

      onSuccess();

      // Reset form
      setFormData({
        parentName: '',
        parentDescription: '',
        childName: '',
        variations: ['']
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-category-structure-form">
      <h2>Créer une Structure de Catégories</h2>

      {error && <div className="error-message">{error}</div>}

      {/* Catégorie Parent */}
      <div className="form-section">
        <h3>📦 Catégorie Parent (Niveau 0)</h3>

        <div className="form-group">
          <label>Nom de la catégorie parent *</label>
          <input
            type="text"
            value={formData.parentName}
            onChange={e => setFormData({ ...formData, parentName: e.target.value })}
            placeholder="Ex: Téléphone, Vêtements, Accessoires"
            required
          />
          <small>Si elle existe déjà, elle sera réutilisée</small>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.parentDescription}
            onChange={e => setFormData({ ...formData, parentDescription: e.target.value })}
            placeholder="Description de la catégorie parent"
            rows={2}
          />
        </div>
      </div>

      {/* Sous-catégorie (optionnel) */}
      <div className="form-section">
        <h3>📂 Sous-catégorie (Niveau 1) - Optionnel</h3>

        <div className="form-group">
          <label>Nom de la sous-catégorie</label>
          <input
            type="text"
            value={formData.childName}
            onChange={e => setFormData({ ...formData, childName: e.target.value })}
            placeholder="Ex: Coque, T-Shirt, Écouteur"
          />
          <small>Laisser vide si vous voulez ajouter les variations directement au parent</small>
        </div>
      </div>

      {/* Variations */}
      <div className="form-section">
        <h3>📄 Variations (Niveau 2) *</h3>

        {formData.variations.map((variation, index) => (
          <div key={index} className="variation-input-group">
            <input
              type="text"
              value={variation}
              onChange={e => handleVariationChange(index, e.target.value)}
              placeholder={`Variation ${index + 1} (Ex: iPhone 13, Homme, Bleu)`}
            />
            {formData.variations.length > 1 && (
              <button
                type="button"
                onClick={() => removeVariation(index)}
                className="btn-remove"
              >
                ❌
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addVariation}
          className="btn-add-variation"
        >
          ➕ Ajouter une variation
        </button>
      </div>

      {/* Aperçu de la structure */}
      <div className="structure-preview">
        <h4>Aperçu de la structure :</h4>
        <pre>
📦 {formData.parentName || 'Catégorie Parent'}
{formData.childName && `    └── 📂 ${formData.childName}`}
{formData.variations.filter(v => v.trim()).map((v, i) => (
  `        ${i === formData.variations.filter(v => v.trim()).length - 1 ? '└──' : '├──'} 📄 ${v}\n`
)).join('')}
        </pre>
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="submit" disabled={loading} className="btn-submit">
          {loading ? 'Création en cours...' : 'Créer la Structure'}
        </button>
      </div>
    </form>
  );
};

export default CreateCategoryStructureForm;
```

---

#### 📊 Affichage Hiérarchique

```tsx
// src/components/categories/CategoryTree.tsx

import React, { useState, useEffect } from 'react';
import categoryService from '@/services/category.service';
import { Category } from '@/types/category.types';

const CategoryTree = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getCategoryHierarchy();
      setCategories(data);
    } catch (error) {
      console.error('Erreur chargement catégories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (category: Category) => {
    const childCount = category.subcategories?.length || 0;
    const message = childCount > 0
      ? `Supprimer "${category.name}" et ses ${childCount} sous-catégorie(s) ?`
      : `Supprimer "${category.name}" ?`;

    if (!confirm(message)) return;

    try {
      await categoryService.deleteCategory(category.id);
      await loadCategories();
      alert('✅ Catégorie supprimée avec succès');
    } catch (error: any) {
      alert(`❌ ${error.response?.data?.message || 'Erreur suppression'}`);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="category-tree">
      <h2>Hiérarchie des Catégories</h2>
      {categories.map(category => (
        <CategoryNode
          key={category.id}
          category={category}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};

const CategoryNode = ({
  category,
  onDelete,
  level = 0
}: {
  category: Category;
  onDelete: (cat: Category) => void;
  level?: number;
}) => {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.subcategories && category.subcategories.length > 0;

  const getIcon = () => {
    switch (category.level) {
      case 0: return '📦';
      case 1: return '📂';
      case 2: return '📄';
      default: return '•';
    }
  };

  const getIndentation = () => ({
    paddingLeft: `${level * 24}px`
  });

  return (
    <div className="category-node">
      <div className="category-row" style={getIndentation()}>
        {hasChildren && (
          <button
            className="expand-btn"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? '▼' : '▶'}
          </button>
        )}

        <span className="category-icon">{getIcon()}</span>

        <div className="category-info">
          <span className="category-name">{category.name}</span>
          {category.description && (
            <span className="category-description">{category.description}</span>
          )}
          <span className="category-meta">
            Level {category.level} • {category.productCount || 0} produit(s)
          </span>
        </div>

        <div className="category-actions">
          <button className="btn-edit" title="Modifier">
            ✏️
          </button>
          <button
            className="btn-delete"
            onClick={() => onDelete(category)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      {expanded && hasChildren && (
        <div className="category-children">
          {category.subcategories!.map(child => (
            <CategoryNode
              key={child.id}
              category={child}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryTree;
```

---

#### 📝 Formulaire Simple (Catégorie Unique)

```tsx
// src/components/categories/CreateCategoryForm.tsx

import React, { useState, useEffect } from 'react';
import categoryService from '@/services/category.service';
import { Category, CreateCategoryDto } from '@/types/category.types';

const CreateCategoryForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [parents, setParents] = useState<Category[]>([]);
  const [formData, setFormData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
    parentId: null,
    level: 0
  });

  useEffect(() => {
    loadParentCategories();
  }, []);

  const loadParentCategories = async () => {
    const categories = await categoryService.getAllCategories();
    // Afficher seulement les parents et enfants (pas les variations)
    setParents(categories.filter(cat => cat.level < 2));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await categoryService.createCategory(formData);
      alert('✅ Catégorie créée avec succès');
      onSuccess();
      setFormData({
        name: '',
        description: '',
        parentId: null,
        level: 0
      });
    } catch (error: any) {
      alert(`❌ ${error.message || 'Erreur création'}`);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer une Catégorie</h2>

      <div className="form-group">
        <label>Catégorie Parent</label>
        <select
          value={formData.parentId || ''}
          onChange={e => setFormData({
            ...formData,
            parentId: e.target.value ? parseInt(e.target.value) : null
          })}
        >
          <option value="">-- Aucun (catégorie parent) --</option>
          {parents.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.level === 0 ? '📦' : '📂'} {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Nom *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({ ...formData, description: e.target.value })}
        />
      </div>

      <button type="submit">Créer</button>
    </form>
  );
};

export default CreateCategoryForm;
```

---

### 4️⃣ Sélecteur de Catégorie (pour les produits)

```tsx
// src/components/categories/CategorySelector.tsx

import React, { useState, useEffect } from 'react';
import categoryService from '@/services/category.service';
import { Category } from '@/types/category.types';

interface Props {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  multiple?: boolean;
}

const CategorySelector = ({ selectedIds, onChange, multiple = true }: Props) => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const data = await categoryService.getCategoryHierarchy();
    setCategories(data);
  };

  const handleToggle = (id: number) => {
    if (multiple) {
      const newIds = selectedIds.includes(id)
        ? selectedIds.filter(i => i !== id)
        : [...selectedIds, id];
      onChange(newIds);
    } else {
      onChange([id]);
    }
  };

  const renderCategory = (category: Category, level = 0) => {
    const isSelected = selectedIds.includes(category.id);
    const indent = level * 20;

    return (
      <React.Fragment key={category.id}>
        <div
          className={`category-option ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${indent}px` }}
          onClick={() => handleToggle(category.id)}
        >
          <input
            type={multiple ? 'checkbox' : 'radio'}
            checked={isSelected}
            readOnly
          />
          <span className="category-icon">
            {category.level === 0 ? '📦' : category.level === 1 ? '📂' : '📄'}
          </span>
          <span>{category.name}</span>
          <span className="product-count">({category.productCount || 0})</span>
        </div>

        {category.subcategories?.map(sub => renderCategory(sub, level + 1))}
      </React.Fragment>
    );
  };

  return (
    <div className="category-selector">
      <h4>Sélectionner {multiple ? 'les catégories' : 'une catégorie'}</h4>
      <div className="category-list">
        {categories.map(cat => renderCategory(cat))}
      </div>
    </div>
  );
};

export default CategorySelector;
```

---

## 🎨 CSS (Exemple)

```css
/* Formulaire de création structure */
.create-category-structure-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.form-section {
  margin-bottom: 2rem;
  padding: 1.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
}

.form-section h3 {
  margin-top: 0;
  color: #333;
  font-size: 1.1rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #555;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group small {
  display: block;
  margin-top: 0.25rem;
  color: #666;
  font-size: 0.875rem;
}

.variation-input-group {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.variation-input-group input {
  flex: 1;
}

.btn-remove {
  padding: 0.5rem 1rem;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-add-variation {
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
}

.structure-preview {
  background: #f5f5f5;
  padding: 1rem;
  border-radius: 4px;
  margin-top: 1.5rem;
}

.structure-preview h4 {
  margin-top: 0;
  font-size: 0.9rem;
  color: #666;
}

.structure-preview pre {
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  color: #333;
  margin: 0;
  white-space: pre-wrap;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 1rem;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.btn-submit {
  width: 100%;
  padding: 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-submit:hover {
  background: #1976d2;
}

.btn-submit:disabled {
  background: #bdbdbd;
  cursor: not-allowed;
}

/* Arbre de catégories */
.category-tree {
  padding: 1.5rem;
}

.category-node {
  margin-bottom: 0.25rem;
}

.category-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  transition: background 0.2s;
}

.category-row:hover {
  background: #f5f5f5;
}

.expand-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 0.25rem 0.5rem;
}

.category-icon {
  font-size: 1.25rem;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category-name {
  font-weight: 500;
  font-size: 1rem;
}

.category-description {
  font-size: 0.875rem;
  color: #666;
}

.category-meta {
  font-size: 0.75rem;
  color: #999;
}

.category-actions {
  display: flex;
  gap: 0.5rem;
}

.category-actions button {
  padding: 0.5rem;
  background: none;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.category-actions button:hover {
  background: #f5f5f5;
}

.btn-delete:hover {
  background: #ffebee !important;
  border-color: #f44336 !important;
}
```

---

## ✅ Cas d'Usage Pratiques

### Cas 1 : Créer une structure téléphone

```typescript
await categoryService.createStructure({
  parentName: 'Téléphone',
  parentDescription: 'Accessoires téléphone',
  childName: 'Coque',
  variations: ['iPhone 13', 'iPhone 14', 'iPhone 15', 'Samsung S23']
});
```

**Résultat** :
```
📦 Téléphone
    └── 📂 Coque
        ├── 📄 iPhone 13
        ├── 📄 iPhone 14
        ├── 📄 iPhone 15
        └── 📄 Samsung S23
```

---

### Cas 2 : Ajouter des variations à une catégorie existante

Si "Téléphone > Coque" existe déjà, vous pouvez ajouter de nouvelles variations :

```typescript
await categoryService.createStructure({
  parentName: 'Téléphone',  // Existe déjà
  childName: 'Coque',        // Existe déjà
  variations: ['Google Pixel 8', 'Xiaomi 13']  // Nouvelles variations
});
```

**Résultat** : Ajoute seulement les nouvelles variations !

---

### Cas 3 : Créer sans sous-catégorie

```typescript
await categoryService.createStructure({
  parentName: 'Couleurs',
  variations: ['Rouge', 'Bleu', 'Vert', 'Jaune']
});
```

**Résultat** :
```
📦 Couleurs
    ├── 📄 Rouge
    ├── 📄 Bleu
    ├── 📄 Vert
    └── 📄 Jaune
```

---

## 🐛 Gestion des Erreurs

### Doublon de catégorie

```typescript
try {
  await categoryService.createCategory({
    name: 'iPhone 13',
    parentId: 2
  });
} catch (error: any) {
  if (error.message.includes('existe déjà')) {
    // Catégorie déjà existante
    console.log('Cette catégorie existe déjà');
  }
}
```

### Suppression avec produits liés

```typescript
try {
  await categoryService.deleteCategory(5);
} catch (error: any) {
  if (error.response?.data?.message.includes('liée à')) {
    alert('Impossible de supprimer : des produits utilisent cette catégorie');
  }
}
```

---

## 🎯 Bonnes Pratiques

1. **Utiliser `createStructure` pour créer plusieurs niveaux** :
   - Plus rapide
   - Gère automatiquement les doublons
   - Réutilise les catégories existantes

2. **Vérifier les doublons avant création** :
   ```typescript
   const { exists } = await categoryService.checkDuplicate('iPhone 13', 2);
   if (exists) {
     alert('Cette catégorie existe déjà');
     return;
   }
   ```

3. **Afficher la hiérarchie complète** :
   - Utiliser `/categories/hierarchy` plutôt que `/categories`
   - Permet un affichage en arbre

4. **Filtrer par niveau** :
   ```typescript
   const parents = categories.filter(cat => cat.level === 0);
   const enfants = categories.filter(cat => cat.level === 1);
   const variations = categories.filter(cat => cat.level === 2);
   ```

---

## 📊 Résumé

| Tâche | Endpoint | Méthode |
|-------|----------|---------|
| Créer structure complète | `/categories/structure` | `POST` ✅ RECOMMANDÉ |
| Créer catégorie simple | `/categories` | `POST` |
| Liste hiérarchique | `/categories/hierarchy` | `GET` ✅ RECOMMANDÉ |
| Liste plate | `/categories` | `GET` |
| Vérifier doublon | `/categories/check-duplicate` | `GET` |
| Mettre à jour | `/categories/:id` | `PUT` |
| Supprimer | `/categories/:id` | `DELETE` |

---

🎉 **Vous avez maintenant tout pour gérer les catégories hiérarchiques !**
