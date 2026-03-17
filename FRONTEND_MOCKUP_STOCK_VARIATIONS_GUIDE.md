# Guide Frontend - Gestion Stocks Variations Catégories pour Mockups

## 📋 Concept Principal

Lorsqu'on crée un produit mockup (T-shirt, Hoodie, etc.), les stocks sont gérés selon **3 dimensions** :

1. **Catégorie Variation** : Type de produit (Col Rond, Col V, Manches Longues, etc.)
2. **Couleur** : Variantes de couleur disponibles
3. **Taille** : Tailles disponibles (S, M, L, XL, etc.)

## 🎯 Structure des Données

### Architecture Complète

```typescript
interface ProductMockup {
  name: string;
  description: string;
  price: number;

  // Catégories sélectionnées (Parent → Enfant → Variations)
  categoryIds: string[];

  // Variations de catégorie (les variations level 2)
  categoryVariations: CategoryVariation[];
}

interface CategoryVariation {
  categoryId: string;        // ID de la variation de catégorie (level 2)
  categoryName: string;      // "Col Rond", "Col V", etc.

  // Pour chaque variation de catégorie, on a des couleurs
  colorVariations: ColorVariation[];
}

interface ColorVariation {
  name: string;              // "Bleu Marine"
  colorCode: string;         // "#001F3F"

  // Pour chaque couleur, on a des stocks par taille
  stockBySize: StockBySize;

  // Images spécifiques à cette couleur
  images: ProductImage[];
}

interface StockBySize {
  [size: string]: number;
  // Exemple: { "S": 10, "M": 15, "L": 20, "XL": 5 }
}
```

### Exemple Concret

```json
{
  "name": "T-shirt Premium Personnalisable",
  "description": "T-shirt de qualité pour impression personnalisée",
  "price": 2500,
  "categoryIds": ["parent-vetements", "child-tshirts"],

  "categoryVariations": [
    {
      "categoryId": "variation-col-rond",
      "categoryName": "Col Rond",
      "colorVariations": [
        {
          "name": "Bleu Marine",
          "colorCode": "#001F3F",
          "stockBySize": {
            "S": 10,
            "M": 15,
            "L": 20,
            "XL": 5
          },
          "images": [...]
        },
        {
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "stockBySize": {
            "S": 8,
            "M": 12,
            "L": 18,
            "XL": 7
          },
          "images": [...]
        }
      ]
    },
    {
      "categoryId": "variation-col-v",
      "categoryName": "Col V",
      "colorVariations": [
        {
          "name": "Noir",
          "colorCode": "#000000",
          "stockBySize": {
            "S": 12,
            "M": 18,
            "L": 22,
            "XL": 8
          },
          "images": [...]
        }
      ]
    }
  ]
}
```

## 🔌 Service API

```typescript
// services/mockupProductService.ts
const API_BASE_URL = 'http://localhost:3004/api';

export interface StockBySize {
  [size: string]: number;
}

export interface ColorVariationDto {
  name: string;
  colorCode: string;
  stockBySize: StockBySize;
  images: ProductImageDto[];
}

export interface CategoryVariationDto {
  categoryId: string;
  categoryName: string;
  colorVariations: ColorVariationDto[];
}

export interface CreateMockupProductDto {
  name: string;
  description: string;
  price: number;
  categoryIds: string[];
  sizes: string[];
  categoryVariations: CategoryVariationDto[];
}

export class MockupProductService {
  static async createMockupProduct(
    productData: CreateMockupProductDto,
    files: { fileId: string; file: File }[]
  ): Promise<any> {
    try {
      const formData = new FormData();

      formData.append('productData', JSON.stringify(productData));

      files.forEach(({ fileId, file }) => {
        formData.append(`file_${fileId}`, file);
      });

      const response = await fetch(`${API_BASE_URL}/products/mockup`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }

      return await response.json();
    } catch (error) {
      console.error('MockupProductService.createMockupProduct:', error);
      throw error;
    }
  }
}
```

## 🎨 Composant Principal - Gestionnaire de Stocks pour Variations

```tsx
// components/CategoryVariationStockManager.tsx
import React, { useState, useEffect } from 'react';

interface StockBySize {
  [size: string]: number;
}

interface ColorVariation {
  name: string;
  colorCode: string;
  stockBySize: StockBySize;
  images: any[];
}

interface CategoryVariation {
  categoryId: string;
  categoryName: string;
  colorVariations: ColorVariation[];
}

interface CategoryVariationStockManagerProps {
  sizes: string[];
  categoryVariations: CategoryVariation[];
  onStockChange: (
    categoryIndex: number,
    colorIndex: number,
    stockBySize: StockBySize
  ) => void;
}

export const CategoryVariationStockManager: React.FC<CategoryVariationStockManagerProps> = ({
  sizes,
  categoryVariations,
  onStockChange
}) => {
  // Initialiser les stocks
  useEffect(() => {
    categoryVariations.forEach((catVar, catIndex) => {
      catVar.colorVariations.forEach((colorVar, colorIndex) => {
        if (!colorVar.stockBySize || Object.keys(colorVar.stockBySize).length === 0) {
          const initialStock: StockBySize = {};
          sizes.forEach(size => {
            initialStock[size] = 0;
          });
          onStockChange(catIndex, colorIndex, initialStock);
        }
      });
    });
  }, [sizes]);

  const handleStockChange = (
    categoryIndex: number,
    colorIndex: number,
    size: string,
    quantity: number
  ) => {
    const currentStock = categoryVariations[categoryIndex].colorVariations[colorIndex].stockBySize || {};
    const newStock = {
      ...currentStock,
      [size]: Math.max(0, quantity)
    };
    onStockChange(categoryIndex, colorIndex, newStock);
  };

  const getTotalStockForColor = (stockBySize: StockBySize): number => {
    return Object.values(stockBySize).reduce((sum, qty) => sum + qty, 0);
  };

  const getTotalStockForCategory = (categoryVar: CategoryVariation): number => {
    return categoryVar.colorVariations.reduce(
      (sum, colorVar) => sum + getTotalStockForColor(colorVar.stockBySize || {}),
      0
    );
  };

  const fillAllStocks = (categoryIndex: number, colorIndex: number, defaultQty: number) => {
    const newStock: StockBySize = {};
    sizes.forEach(size => {
      newStock[size] = defaultQty;
    });
    onStockChange(categoryIndex, colorIndex, newStock);
  };

  if (sizes.length === 0) {
    return (
      <div className="stock-manager-empty">
        <p>⚠️ Veuillez d'abord définir les tailles disponibles</p>
      </div>
    );
  }

  return (
    <div className="category-variation-stock-manager">
      <h3>Gestion des Stocks par Variation de Catégorie</h3>
      <p className="help-text">
        Définissez les stocks pour chaque variation de catégorie, couleur et taille
      </p>

      {categoryVariations.map((categoryVar, catIndex) => (
        <div key={catIndex} className="category-variation-section">
          {/* En-tête de variation de catégorie */}
          <div className="category-variation-header">
            <div className="category-info">
              <span className="category-badge">Variation {catIndex + 1}</span>
              <h4>{categoryVar.categoryName}</h4>
            </div>
            <div className="category-total">
              Stock total: {getTotalStockForCategory(categoryVar)} unités
            </div>
          </div>

          {/* Couleurs pour cette variation de catégorie */}
          {categoryVar.colorVariations.map((colorVar, colorIndex) => (
            <div key={colorIndex} className="color-stock-section">
              <div className="color-stock-header">
                <div className="color-info">
                  <span
                    className="color-preview"
                    style={{ backgroundColor: colorVar.colorCode }}
                  />
                  <span className="color-name">
                    {colorVar.name || `Couleur ${colorIndex + 1}`}
                  </span>
                </div>
                <div className="color-total">
                  Total: {getTotalStockForColor(colorVar.stockBySize || {})} unités
                </div>
              </div>

              {/* Grille de stocks par taille */}
              <div className="stock-grid">
                <div className="stock-grid-header">
                  <span>Taille</span>
                  <span>Quantité en stock</span>
                </div>

                {sizes.filter(s => s.trim()).map((size, sizeIndex) => (
                  <div key={sizeIndex} className="stock-grid-row">
                    <label className="size-label">
                      <span className="size-badge">{size}</span>
                    </label>
                    <div className="stock-input-wrapper">
                      <input
                        type="number"
                        min="0"
                        value={colorVar.stockBySize?.[size] || 0}
                        onChange={(e) => handleStockChange(
                          catIndex,
                          colorIndex,
                          size,
                          parseInt(e.target.value) || 0
                        )}
                        placeholder="0"
                        className="stock-input"
                      />
                      <span className="stock-unit">unités</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Actions rapides */}
              <div className="stock-quick-actions">
                <button
                  type="button"
                  onClick={() => fillAllStocks(catIndex, colorIndex, 10)}
                  className="btn-quick-fill"
                  title="Mettre 10 unités pour toutes les tailles"
                >
                  📦 Remplir 10/taille
                </button>
                <button
                  type="button"
                  onClick={() => fillAllStocks(catIndex, colorIndex, 20)}
                  className="btn-quick-fill"
                  title="Mettre 20 unités pour toutes les tailles"
                >
                  📦 Remplir 20/taille
                </button>
                <button
                  type="button"
                  onClick={() => fillAllStocks(catIndex, colorIndex, 0)}
                  className="btn-clear-stock"
                  title="Réinitialiser tous les stocks à 0"
                >
                  🗑️ Réinitialiser
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Tableau récapitulatif global */}
      <div className="stock-global-summary">
        <h4>📊 Récapitulatif Global des Stocks</h4>

        {categoryVariations.map((categoryVar, catIndex) => (
          <div key={catIndex} className="summary-category-block">
            <h5 className="summary-category-title">
              {categoryVar.categoryName}
            </h5>

            <table className="stock-summary-table">
              <thead>
                <tr>
                  <th>Couleur</th>
                  {sizes.filter(s => s.trim()).map((size, idx) => (
                    <th key={idx}>{size}</th>
                  ))}
                  <th className="total-column">Total</th>
                </tr>
              </thead>
              <tbody>
                {categoryVar.colorVariations.map((colorVar, colorIdx) => (
                  <tr key={colorIdx}>
                    <td>
                      <span
                        className="color-dot"
                        style={{ backgroundColor: colorVar.colorCode }}
                      />
                      {colorVar.name}
                    </td>
                    {sizes.filter(s => s.trim()).map((size, sIdx) => (
                      <td key={sIdx} className="stock-cell">
                        {colorVar.stockBySize?.[size] || 0}
                      </td>
                    ))}
                    <td className="total-cell">
                      {getTotalStockForColor(colorVar.stockBySize || {})}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="subtotal-row">
                  <td>Sous-total {categoryVar.categoryName}</td>
                  {sizes.filter(s => s.trim()).map((size, idx) => (
                    <td key={idx} className="subtotal-cell">
                      {categoryVar.colorVariations.reduce(
                        (sum, cv) => sum + (cv.stockBySize?.[size] || 0),
                        0
                      )}
                    </td>
                  ))}
                  <td className="total-cell">
                    {getTotalStockForCategory(categoryVar)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ))}

        {/* Total général */}
        <div className="grand-total-section">
          <div className="grand-total-label">Total général de tous les stocks:</div>
          <div className="grand-total-value">
            {categoryVariations.reduce(
              (sum, catVar) => sum + getTotalStockForCategory(catVar),
              0
            )} unités
          </div>
        </div>
      </div>
    </div>
  );
};
```

## 🏗️ Formulaire Complet avec Variations de Catégories

```tsx
// components/MockupProductForm.tsx
import React, { useState, useEffect } from 'react';
import { CategorySelector } from './CategorySelector';
import { CategoryVariationStockManager } from './CategoryVariationStockManager';
import { MockupProductService } from '../services/mockupProductService';
import { CategoryService, Category } from '../services/categoryService';

interface ColorVariation {
  name: string;
  colorCode: string;
  stockBySize: { [size: string]: number };
  images: any[];
}

interface CategoryVariation {
  categoryId: string;
  categoryName: string;
  colorVariations: ColorVariation[];
}

export const MockupProductForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    categoryIds: [] as string[],
    sizes: ['S', 'M', 'L', 'XL']
  });

  const [selectedVariationCategories, setSelectedVariationCategories] = useState<Category[]>([]);
  const [categoryVariations, setCategoryVariations] = useState<CategoryVariation[]>([]);

  const [loading, setLoading] = useState(false);

  // Quand les catégories changent, extraire les variations (level 2)
  useEffect(() => {
    extractVariationCategories(formData.categoryIds);
  }, [formData.categoryIds]);

  const extractVariationCategories = async (categoryIds: string[]) => {
    try {
      // Récupérer toutes les catégories
      const allCategories = await CategoryService.getHierarchy();

      // Filtrer les catégories de niveau 2 (variations)
      const variationCats = categoryIds
        .map(id => findCategoryById(allCategories, id))
        .filter(cat => cat && cat.level === 2) as Category[];

      setSelectedVariationCategories(variationCats);

      // Créer les structures de variation si elles n'existent pas
      const newCategoryVariations = variationCats.map(cat => {
        const existing = categoryVariations.find(cv => cv.categoryId === cat.id);
        if (existing) return existing;

        return {
          categoryId: cat.id,
          categoryName: cat.name,
          colorVariations: []
        };
      });

      setCategoryVariations(newCategoryVariations);
    } catch (error) {
      console.error('Erreur extraction variations:', error);
    }
  };

  const findCategoryById = (categories: Category[], id: string): Category | null => {
    for (const cat of categories) {
      if (cat.id === id) return cat;
      if (cat.children) {
        const found = findCategoryById(cat.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Gérer les tailles
  const handleSizeChange = (index: number, value: string) => {
    const newSizes = [...formData.sizes];
    newSizes[index] = value;
    setFormData(prev => ({ ...prev, sizes: newSizes }));
  };

  const addSize = () => {
    setFormData(prev => ({ ...prev, sizes: [...prev.sizes, ''] }));
  };

  const removeSize = (index: number) => {
    if (formData.sizes.length > 1) {
      const newSizes = formData.sizes.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, sizes: newSizes }));
    }
  };

  // Gérer les couleurs pour une variation de catégorie
  const addColorToCategory = (categoryIndex: number) => {
    const newCategoryVariations = [...categoryVariations];
    newCategoryVariations[categoryIndex].colorVariations.push({
      name: '',
      colorCode: '#000000',
      stockBySize: {},
      images: []
    });
    setCategoryVariations(newCategoryVariations);
  };

  const removeColorFromCategory = (categoryIndex: number, colorIndex: number) => {
    const newCategoryVariations = [...categoryVariations];
    if (newCategoryVariations[categoryIndex].colorVariations.length > 1) {
      newCategoryVariations[categoryIndex].colorVariations.splice(colorIndex, 1);
      setCategoryVariations(newCategoryVariations);
    }
  };

  const handleColorChange = (
    categoryIndex: number,
    colorIndex: number,
    field: string,
    value: any
  ) => {
    const newCategoryVariations = [...categoryVariations];
    newCategoryVariations[categoryIndex].colorVariations[colorIndex] = {
      ...newCategoryVariations[categoryIndex].colorVariations[colorIndex],
      [field]: value
    };
    setCategoryVariations(newCategoryVariations);
  };

  const handleStockChange = (
    categoryIndex: number,
    colorIndex: number,
    stockBySize: { [size: string]: number }
  ) => {
    const newCategoryVariations = [...categoryVariations];
    newCategoryVariations[categoryIndex].colorVariations[colorIndex].stockBySize = stockBySize;
    setCategoryVariations(newCategoryVariations);
  };

  const handleImageUpload = (
    categoryIndex: number,
    colorIndex: number,
    files: FileList
  ) => {
    const newCategoryVariations = [...categoryVariations];
    const newImages = Array.from(files).map((file, idx) => ({
      fileId: `${Date.now()}_${categoryIndex}_${colorIndex}_${idx}`,
      file: file,
      view: 'Front',
      delimitations: []
    }));

    newCategoryVariations[categoryIndex].colorVariations[colorIndex].images = [
      ...newCategoryVariations[categoryIndex].colorVariations[colorIndex].images,
      ...newImages
    ];

    setCategoryVariations(newCategoryVariations);
  };

  // Validation
  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!formData.name.trim() || formData.name.length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      errors.push('Le prix doit être supérieur à 0');
    }

    if (formData.categoryIds.length === 0) {
      errors.push('Veuillez sélectionner au moins une catégorie');
    }

    const validSizes = formData.sizes.filter(s => s.trim() !== '');
    if (validSizes.length === 0) {
      errors.push('Au moins une taille est requise');
    }

    if (categoryVariations.length === 0) {
      errors.push('Aucune variation de catégorie sélectionnée');
    }

    categoryVariations.forEach((catVar, catIdx) => {
      if (catVar.colorVariations.length === 0) {
        errors.push(`Aucune couleur définie pour "${catVar.categoryName}"`);
      }

      catVar.colorVariations.forEach((colorVar, colorIdx) => {
        if (!colorVar.name.trim()) {
          errors.push(
            `Couleur ${colorIdx + 1} de "${catVar.categoryName}" sans nom`
          );
        }

        const totalStock = Object.values(colorVar.stockBySize).reduce(
          (sum, qty) => sum + qty,
          0
        );
        if (totalStock === 0) {
          errors.push(
            `"${colorVar.name}" dans "${catVar.categoryName}" n'a aucun stock`
          );
        }

        if (colorVar.images.length === 0) {
          errors.push(
            `"${colorVar.name}" dans "${catVar.categoryName}" sans image`
          );
        }
      });
    });

    return errors;
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = validateForm();
    if (errors.length > 0) {
      alert('Erreurs de validation:\n\n' + errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      const validSizes = formData.sizes.filter(s => s.trim() !== '');

      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        categoryIds: formData.categoryIds,
        sizes: validSizes,
        categoryVariations: categoryVariations.map(catVar => ({
          categoryId: catVar.categoryId,
          categoryName: catVar.categoryName,
          colorVariations: catVar.colorVariations.map(colorVar => ({
            name: colorVar.name,
            colorCode: colorVar.colorCode.toUpperCase(),
            stockBySize: colorVar.stockBySize,
            images: colorVar.images.map(img => ({
              fileId: img.fileId,
              view: img.view,
              delimitations: img.delimitations
            }))
          }))
        }))
      };

      const files = categoryVariations.flatMap(catVar =>
        catVar.colorVariations.flatMap(colorVar =>
          colorVar.images.map(img => ({
            fileId: img.fileId,
            file: img.file
          }))
        )
      );

      const result = await MockupProductService.createMockupProduct(productData, files);

      alert(`Produit mockup "${result.name}" créé avec succès !`);
      window.location.reload();

    } catch (error: any) {
      alert(`Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mockup-product-form">
      <h2>🎨 Créer un Produit Mockup</h2>

      {/* Informations de base */}
      <section className="form-section">
        <h3>Informations générales</h3>

        <div className="form-group">
          <label htmlFor="name">Nom du produit mockup *</label>
          <input
            type="text"
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Ex: T-shirt Premium Personnalisable"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={4}
            placeholder="Description du produit mockup..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="price">Prix de base (FCFA) *</label>
          <input
            type="number"
            id="price"
            value={formData.price}
            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
            step="0.01"
            min="0"
            placeholder="2500"
            required
          />
        </div>
      </section>

      {/* Sélection des catégories */}
      <section className="form-section">
        <CategorySelector
          selectedCategoryIds={formData.categoryIds}
          onCategoriesChange={(ids) => setFormData(prev => ({ ...prev, categoryIds: ids }))}
        />
      </section>

      {/* Tailles disponibles */}
      <section className="form-section">
        <h3>Tailles disponibles *</h3>
        <p className="help-text">Définissez toutes les tailles pour ce produit</p>

        {formData.sizes.map((size, index) => (
          <div key={index} className="form-row">
            <input
              type="text"
              value={size}
              onChange={(e) => handleSizeChange(index, e.target.value)}
              placeholder="Ex: M, Large, 42..."
              list="predefined-sizes"
            />
            {formData.sizes.length > 1 && (
              <button
                type="button"
                onClick={() => removeSize(index)}
                className="btn-remove"
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addSize} className="btn-add">
          + Ajouter une taille
        </button>

        <datalist id="predefined-sizes">
          <option value="XS" />
          <option value="S" />
          <option value="M" />
          <option value="L" />
          <option value="XL" />
          <option value="XXL" />
          <option value="XXXL" />
        </datalist>
      </section>

      {/* Variations de catégories avec couleurs */}
      {categoryVariations.length > 0 && (
        <section className="form-section">
          <h3>Couleurs par Variation de Catégorie</h3>

          {categoryVariations.map((catVar, catIndex) => (
            <div key={catIndex} className="category-variation-block">
              <div className="category-variation-title">
                <h4>📁 {catVar.categoryName}</h4>
              </div>

              {catVar.colorVariations.map((colorVar, colorIndex) => (
                <div key={colorIndex} className="color-variation-item">
                  <div className="color-variation-header">
                    <span>Couleur {colorIndex + 1}</span>
                    {catVar.colorVariations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeColorFromCategory(catIndex, colorIndex)}
                        className="btn-remove-small"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Nom de la couleur *</label>
                      <input
                        type="text"
                        value={colorVar.name}
                        onChange={(e) => handleColorChange(
                          catIndex,
                          colorIndex,
                          'name',
                          e.target.value
                        )}
                        placeholder="Ex: Bleu Marine"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Code couleur *</label>
                      <input
                        type="color"
                        value={colorVar.colorCode}
                        onChange={(e) => handleColorChange(
                          catIndex,
                          colorIndex,
                          'colorCode',
                          e.target.value
                        )}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Images *</label>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={(e) => e.target.files && handleImageUpload(
                        catIndex,
                        colorIndex,
                        e.target.files
                      )}
                    />
                    <small>{colorVar.images.length} image(s) ajoutée(s)</small>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addColorToCategory(catIndex)}
                className="btn-add-color"
              >
                + Ajouter une couleur pour {catVar.categoryName}
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Gestion des stocks */}
      {categoryVariations.length > 0 && (
        <section className="form-section">
          <CategoryVariationStockManager
            sizes={formData.sizes.filter(s => s.trim() !== '')}
            categoryVariations={categoryVariations}
            onStockChange={handleStockChange}
          />
        </section>
      )}

      {/* Bouton de soumission */}
      <div className="form-actions">
        <button
          type="submit"
          disabled={loading}
          className="btn-submit"
        >
          {loading ? '⏳ Création en cours...' : '✅ Créer le produit mockup'}
        </button>
      </div>
    </form>
  );
};
```

## 🎨 Styles CSS

```css
/* styles/MockupProductForm.css */

.mockup-product-form {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.category-variation-stock-manager {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.category-variation-section {
  background: white;
  border: 2px solid #007bff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.category-variation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 3px solid #007bff;
}

.category-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.category-badge {
  background: #007bff;
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
}

.category-info h4 {
  margin: 0;
  font-size: 20px;
  color: #333;
}

.category-total {
  background: #e8f4f8;
  padding: 8px 15px;
  border-radius: 6px;
  font-weight: bold;
  color: #007bff;
}

.color-stock-section {
  background: #f9f9f9;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.color-stock-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ddd;
}

.color-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-preview {
  width: 35px;
  height: 35px;
  border-radius: 50%;
  border: 3px solid #333;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.color-name {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.color-total {
  background: #fff3cd;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  color: #856404;
}

.stock-grid {
  display: grid;
  grid-template-columns: 150px 1fr;
  gap: 12px;
  margin-bottom: 15px;
}

.stock-grid-header {
  display: contents;
}

.stock-grid-header span {
  padding: 10px;
  background: #495057;
  color: white;
  font-weight: bold;
  border-radius: 4px;
  text-align: center;
}

.stock-grid-row {
  display: contents;
}

.size-label {
  padding: 10px;
  background: #e9ecef;
  border: 1px solid #ced4da;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.size-badge {
  background: #6c757d;
  color: white;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.stock-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  background: white;
  border: 1px solid #ced4da;
  border-radius: 4px;
  padding: 5px 10px;
}

.stock-input {
  flex: 1;
  border: none;
  padding: 5px;
  font-size: 16px;
  font-weight: bold;
}

.stock-input:focus {
  outline: none;
}

.stock-unit {
  color: #6c757d;
  font-size: 12px;
}

.stock-quick-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px dashed #dee2e6;
}

.btn-quick-fill {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn-quick-fill:hover {
  background: #218838;
}

.btn-clear-stock {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  transition: background 0.2s;
}

.btn-clear-stock:hover {
  background: #5a6268;
}

/* Récapitulatif global */
.stock-global-summary {
  margin-top: 30px;
  padding: 20px;
  background: white;
  border: 3px solid #28a745;
  border-radius: 8px;
}

.stock-global-summary h4 {
  margin-top: 0;
  color: #28a745;
  border-bottom: 2px solid #28a745;
  padding-bottom: 10px;
}

.summary-category-block {
  margin-bottom: 25px;
}

.summary-category-title {
  background: #007bff;
  color: white;
  padding: 10px 15px;
  border-radius: 4px;
  margin-bottom: 10px;
}

.stock-summary-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.stock-summary-table th,
.stock-summary-table td {
  padding: 10px;
  text-align: center;
  border: 1px solid #dee2e6;
}

.stock-summary-table thead th {
  background: #495057;
  color: white;
  font-weight: bold;
}

.stock-summary-table tbody tr:nth-child(even) {
  background: #f8f9fa;
}

.stock-summary-table tbody tr:hover {
  background: #e9ecef;
}

.stock-cell {
  font-weight: 500;
}

.total-column {
  background: #fff3cd;
  font-weight: bold;
}

.total-cell {
  background: #fff3cd !important;
  font-weight: bold;
  font-size: 15px;
}

.subtotal-row {
  background: #d1ecf1 !important;
  font-weight: bold;
}

.subtotal-cell {
  background: #d1ecf1 !important;
  font-weight: bold;
}

.color-dot {
  display: inline-block;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #333;
  margin-right: 8px;
  vertical-align: middle;
}

.grand-total-section {
  margin-top: 20px;
  padding: 15px;
  background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.grand-total-label {
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.grand-total-value {
  background: white;
  color: #28a745;
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 24px;
  font-weight: bold;
}

/* Blocks de variation de catégorie */
.category-variation-block {
  background: #e8f4f8;
  border: 1px solid #bee5eb;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 15px;
}

.category-variation-title h4 {
  margin: 0 0 15px 0;
  color: #007bff;
}

.color-variation-item {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 10px;
}

.color-variation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
}

.btn-add-color {
  background: #17a2b8;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}

.btn-add-color:hover {
  background: #138496;
}

.stock-manager-empty {
  padding: 20px;
  text-align: center;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 6px;
  color: #856404;
}

.help-text {
  color: #6c757d;
  font-size: 14px;
  margin-top: 5px;
}
```

## 📊 Exemple de Flux Complet

```
1. Utilisateur sélectionne catégories:
   Parent: T-shirts
   Enfant: Manches courtes
   Variations: Col Rond, Col V

2. Système détecte 2 variations de niveau 2:
   - Col Rond
   - Col V

3. Pour CHAQUE variation, l'utilisateur ajoute des couleurs:

   Col Rond:
     - Bleu Marine (#001F3F)
       Stock: S:10, M:15, L:20, XL:5
     - Blanc (#FFFFFF)
       Stock: S:8, M:12, L:18, XL:7

   Col V:
     - Noir (#000000)
       Stock: S:12, M:18, L:22, XL:8
     - Gris (#808080)
       Stock: S:6, M:10, L:14, XL:4

4. Tableau récapitulatif affiche:

   COL ROND:
   +---------+----+----+----+----+-------+
   | Couleur | S  | M  | L  | XL | Total |
   +---------+----+----+----+----+-------+
   | Bleu    | 10 | 15 | 20 | 5  |  50   |
   | Blanc   | 8  | 12 | 18 | 7  |  45   |
   +---------+----+----+----+----+-------+
   | Total   | 18 | 27 | 38 | 12 |  95   |
   +---------+----+----+----+----+-------+

   COL V:
   +---------+----+----+----+----+-------+
   | Couleur | S  | M  | L  | XL | Total |
   +---------+----+----+----+----+-------+
   | Noir    | 12 | 18 | 22 | 8  |  60   |
   | Gris    | 6  | 10 | 14 | 4  |  34   |
   +---------+----+----+----+----+-------+
   | Total   | 18 | 28 | 36 | 12 |  94   |
   +---------+----+----+----+----+-------+

   TOTAL GÉNÉRAL: 189 unités
```

## ✅ Checklist d'intégration

- [ ] Créer le service MockupProductService
- [ ] Implémenter CategoryVariationStockManager
- [ ] Créer le formulaire MockupProductForm
- [ ] Ajouter la détection automatique des variations level 2
- [ ] Implémenter le tableau récapitulatif par catégorie
- [ ] Ajouter les actions rapides (remplir 10/20, reset)
- [ ] Créer le grand total général
- [ ] Ajouter les styles CSS
- [ ] Tester avec 1 variation + 2 couleurs
- [ ] Tester avec 2 variations + multiple couleurs
- [ ] Vérifier la validation des stocks
- [ ] Tester l'upload des images
- [ ] Vérifier le FormData final

## 🎯 Points clés à retenir

1. **3 dimensions** : Variation de catégorie → Couleur → Taille
2. **Stocks séparés** : Chaque combinaison a son propre stock
3. **Tableau récapitulatif** : Par catégorie + total général
4. **Actions rapides** : Remplissage automatique pour gagner du temps
5. **Validation stricte** : Tous les stocks doivent être > 0
6. **Images par couleur** : Chaque couleur a ses propres images

Votre frontend peut maintenant gérer des mockups avec stocks multi-dimensionnels ! 🎨📦
