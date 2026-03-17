# 🎨 Guide Frontend - Ajout de Produit avec Design

## 📋 Vue d'ensemble

Ce guide explique **étape par étape** comment ajouter un produit avec des designs depuis le frontend. Il y a **deux approches possibles** :

1. **Approche séparée** : Créer le produit d'abord, puis ajouter les designs
2. **Approche intégrée** : Créer le produit ET uploader les designs en même temps

## 🔄 Workflow complet

### 📊 Schéma du processus

```
[Frontend] → [Créer Produit] → [Uploader Designs] → [Produit avec Design]
     ↓              ↓                 ↓                    ↓
  Formulaire    POST /products    POST .../design    Affichage final
```

## 🚀 Approche 1 : Séparée (Recommandée)

### Étape 1 : Créer le produit de base

```javascript
// 1. Créer d'abord le produit sans design
const createBaseProduct = async (productData, productImages) => {
  const formData = new FormData();
  
  // Ajouter les données du produit
  formData.append('productData', JSON.stringify({
    name: productData.name,
    description: productData.description,
    price: productData.price,
    stock: productData.stock,
    status: productData.status,
    categories: productData.categories,
    sizes: productData.sizes,
    colorVariations: productData.colorVariations
  }));

  // Ajouter les images de base (sans design)
  productImages.forEach((file, index) => {
    formData.append(`file_${index}`, file);
  });

  try {
    const response = await fetch('/api/products', {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur création produit');
    }

    return result; // Produit créé avec IDs des images
  } catch (error) {
    console.error('Erreur création produit:', error);
    throw error;
  }
};
```

### Étape 2 : Uploader les designs sur les images

```javascript
// 2. Ajouter les designs aux images créées
const uploadDesignsToProduct = async (product, designFiles) => {
  const uploadPromises = [];

  // Pour chaque design à uploader
  designFiles.forEach(designInfo => {
    const promise = uploadDesign(
      product.id,
      designInfo.colorId,
      designInfo.imageId,
      designInfo.file,
      {
        name: designInfo.name,
        replaceExisting: true
      }
    );
    uploadPromises.push(promise);
  });

  try {
    // Uploader tous les designs en parallèle
    const results = await Promise.all(uploadPromises);
    console.log('Tous les designs uploadés:', results);
    return results;
  } catch (error) {
    console.error('Erreur upload designs:', error);
    throw error;
  }
};
```

### Étape 3 : Processus complet

```javascript
// 3. Fonction complète pour créer un produit avec designs
const createProductWithDesigns = async (productData, productImages, designFiles) => {
  try {
    // Étape 1: Créer le produit de base
    console.log('🔄 Création du produit de base...');
    const product = await createBaseProduct(productData, productImages);
    console.log('✅ Produit créé:', product.id);

    // Étape 2: Mapper les designs aux images créées
    const mappedDesigns = mapDesignsToImages(designFiles, product);

    // Étape 3: Uploader les designs
    if (mappedDesigns.length > 0) {
      console.log('🔄 Upload des designs...');
      await uploadDesignsToProduct(product, mappedDesigns);
      console.log('✅ Designs uploadés');
    }

    // Étape 4: Récupérer le produit final avec designs
    console.log('🔄 Récupération du produit final...');
    const finalProduct = await fetch(`/api/products/${product.id}`).then(r => r.json());
    
    console.log('🎉 Produit avec designs créé avec succès!');
    return finalProduct;

  } catch (error) {
    console.error('❌ Erreur création produit avec designs:', error);
    throw error;
  }
};

// Fonction helper pour mapper les designs aux images
const mapDesignsToImages = (designFiles, product) => {
  const mappedDesigns = [];

  designFiles.forEach(designFile => {
    // Trouver la couleur correspondante
    const colorVariation = product.colorVariations.find(
      color => color.name === designFile.colorName
    );

    if (colorVariation) {
      // Trouver l'image correspondante
      const image = colorVariation.images.find(
        img => img.view === designFile.view
      );

      if (image) {
        mappedDesigns.push({
          colorId: colorVariation.id,
          imageId: image.id,
          file: designFile.file,
          name: designFile.name
        });
      }
    }
  });

  return mappedDesigns;
};
```

## 🎨 Composant React complet

### Formulaire de création avec designs

```jsx
import React, { useState } from 'react';

const CreateProductWithDesigns = () => {
  const [productData, setProductData] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    status: 'DRAFT',
    categories: [],
    sizes: [],
    colorVariations: []
  });

  const [productImages, setProductImages] = useState([]);
  const [designFiles, setDesignFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gestion des images de produit
  const handleProductImagesChange = (e) => {
    const files = Array.from(e.target.files);
    setProductImages(files);
  };

  // Gestion des designs
  const handleDesignFilesChange = (colorName, view, file) => {
    setDesignFiles(prev => [
      ...prev.filter(d => !(d.colorName === colorName && d.view === view)),
      {
        colorName,
        view,
        file,
        name: file.name
      }
    ]);
  };

  // Suppression d'un design
  const removeDesignFile = (colorName, view) => {
    setDesignFiles(prev => 
      prev.filter(d => !(d.colorName === colorName && d.view === view))
    );
  };

  // Soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await createProductWithDesigns(
        productData,
        productImages,
        designFiles
      );

      alert('Produit avec designs créé avec succès !');
      console.log('Produit créé:', result);
      
      // Rediriger ou réinitialiser le formulaire
      // history.push(`/products/${result.id}`);
      
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-product-form">
      <h2>🎨 Créer un Produit avec Designs</h2>

      <form onSubmit={handleSubmit}>
        {/* Informations de base */}
        <div className="form-section">
          <h3>📝 Informations de base</h3>
          
          <div className="form-group">
            <label>Nom du produit *</label>
            <input
              type="text"
              value={productData.name}
              onChange={(e) => setProductData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>Description *</label>
            <textarea
              value={productData.description}
              onChange={(e) => setProductData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Prix (FCFA) *</label>
              <input
                type="number"
                value={productData.price}
                onChange={(e) => setProductData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                required
              />
            </div>

            <div className="form-group">
              <label>Stock *</label>
              <input
                type="number"
                value={productData.stock}
                onChange={(e) => setProductData(prev => ({ ...prev, stock: parseInt(e.target.value) }))}
                required
              />
            </div>
          </div>
        </div>

        {/* Images de produit */}
        <div className="form-section">
          <h3>📷 Images de produit</h3>
          <div className="form-group">
            <label>Images de base (sans design) *</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleProductImagesChange}
              required
            />
            <small>Sélectionnez toutes les images de votre produit (différentes couleurs et vues)</small>
          </div>

          {productImages.length > 0 && (
            <div className="image-preview">
              <h4>Images sélectionnées ({productImages.length})</h4>
              <div className="images-grid">
                {productImages.map((file, index) => (
                  <div key={index} className="image-item">
                    <img src={URL.createObjectURL(file)} alt={`Preview ${index}`} />
                    <span>{file.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Configuration des couleurs et vues */}
        <div className="form-section">
          <h3>🎨 Couleurs et Vues</h3>
          <ColorVariationsConfig 
            productData={productData}
            setProductData={setProductData}
            productImages={productImages}
          />
        </div>

        {/* Designs */}
        <div className="form-section">
          <h3>✨ Designs</h3>
          <p>Ajoutez des designs pour chaque couleur et vue de votre produit</p>
          
          <DesignUploadSection
            colorVariations={productData.colorVariations}
            designFiles={designFiles}
            onDesignChange={handleDesignFilesChange}
            onDesignRemove={removeDesignFile}
          />
        </div>

        {/* Résumé */}
        <div className="form-section">
          <h3>📊 Résumé</h3>
          <div className="summary">
            <p><strong>Images de base:</strong> {productImages.length}</p>
            <p><strong>Designs:</strong> {designFiles.length}</p>
            <p><strong>Couleurs:</strong> {productData.colorVariations.length}</p>
          </div>
        </div>

        {/* Boutons */}
        <div className="form-actions">
          <button type="button" onClick={() => window.history.back()}>
            Annuler
          </button>
          <button 
            type="submit" 
            disabled={loading || productImages.length === 0}
            className="btn-primary"
          >
            {loading ? '🔄 Création en cours...' : '🎉 Créer le produit'}
          </button>
        </div>
      </form>
    </div>
  );
};
```

### Composant de configuration des couleurs

```jsx
const ColorVariationsConfig = ({ productData, setProductData, productImages }) => {
  const [newColor, setNewColor] = useState({ name: '', colorCode: '#000000' });

  const addColorVariation = () => {
    if (!newColor.name.trim()) return;

    const colorVariation = {
      name: newColor.name,
      colorCode: newColor.colorCode,
      images: [] // Sera configuré après création du produit
    };

    setProductData(prev => ({
      ...prev,
      colorVariations: [...prev.colorVariations, colorVariation]
    }));

    setNewColor({ name: '', colorCode: '#000000' });
  };

  const removeColorVariation = (index) => {
    setProductData(prev => ({
      ...prev,
      colorVariations: prev.colorVariations.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="color-variations-config">
      {/* Liste des couleurs */}
      <div className="colors-list">
        {productData.colorVariations.map((color, index) => (
          <div key={index} className="color-item">
            <div className="color-preview" style={{ backgroundColor: color.colorCode }}></div>
            <span>{color.name}</span>
            <button type="button" onClick={() => removeColorVariation(index)}>❌</button>
          </div>
        ))}
      </div>

      {/* Ajouter une couleur */}
      <div className="add-color">
        <input
          type="text"
          placeholder="Nom de la couleur"
          value={newColor.name}
          onChange={(e) => setNewColor(prev => ({ ...prev, name: e.target.value }))}
        />
        <input
          type="color"
          value={newColor.colorCode}
          onChange={(e) => setNewColor(prev => ({ ...prev, colorCode: e.target.value }))}
        />
        <button type="button" onClick={addColorVariation}>Ajouter</button>
      </div>

      <small>💡 Astuce: Ajoutez d'abord toutes vos couleurs, puis configurez les designs</small>
    </div>
  );
};
```

### Composant d'upload des designs

```jsx
const DesignUploadSection = ({ colorVariations, designFiles, onDesignChange, onDesignRemove }) => {
  const views = ['Front', 'Back', 'Left', 'Right']; // Vues disponibles

  const getDesignForColorView = (colorName, view) => {
    return designFiles.find(d => d.colorName === colorName && d.view === view);
  };

  const handleFileSelect = (colorName, view, file) => {
    if (file) {
      onDesignChange(colorName, view, file);
    }
  };

  if (colorVariations.length === 0) {
    return (
      <div className="no-colors">
        <p>⚠️ Ajoutez d'abord des couleurs dans la section précédente</p>
      </div>
    );
  }

  return (
    <div className="design-upload-section">
      {colorVariations.map((color, colorIndex) => (
        <div key={colorIndex} className="color-design-section">
          <h4>
            <div className="color-indicator" style={{ backgroundColor: color.colorCode }}></div>
            {color.name}
          </h4>

          <div className="views-grid">
            {views.map(view => {
              const existingDesign = getDesignForColorView(color.name, view);
              
              return (
                <div key={view} className="view-design-upload">
                  <h5>{view}</h5>
                  
                  {existingDesign ? (
                    <div className="design-uploaded">
                      <div className="design-preview">
                        <img src={URL.createObjectURL(existingDesign.file)} alt="Design preview" />
                      </div>
                      <p>{existingDesign.name}</p>
                      <button 
                        type="button"
                        onClick={() => onDesignRemove(color.name, view)}
                        className="btn-remove"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  ) : (
                    <div className="design-upload-zone">
                      <label className="upload-label">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                          onChange={(e) => handleFileSelect(color.name, view, e.target.files[0])}
                          style={{ display: 'none' }}
                        />
                        <div className="upload-placeholder">
                          <div className="upload-icon">📎</div>
                          <p>Ajouter un design</p>
                          <small>PNG, JPG, SVG</small>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div className="design-summary">
        <p><strong>Total designs:</strong> {designFiles.length}</p>
        {designFiles.length > 0 && (
          <details>
            <summary>Voir les détails</summary>
            <ul>
              {designFiles.map((design, index) => (
                <li key={index}>
                  {design.colorName} - {design.view}: {design.name}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
};
```

## 📋 Structure des données

### Format des données du produit

```javascript
const productData = {
  name: "T-shirt Premium",
  description: "T-shirt de qualité supérieure",
  price: 15000,
  stock: 50,
  status: "DRAFT", // ou "PUBLISHED"
  categories: ["Vêtements", "T-shirts"],
  sizes: ["S", "M", "L", "XL"],
  colorVariations: [
    {
      name: "Blanc",
      colorCode: "#FFFFFF",
      images: [
        {
          view: "Front",
          fileId: "0" // Correspond à file_0 dans FormData
        },
        {
          view: "Back", 
          fileId: "1" // Correspond à file_1 dans FormData
        }
      ]
    },
    {
      name: "Noir",
      colorCode: "#000000", 
      images: [
        {
          view: "Front",
          fileId: "2" // Correspond à file_2 dans FormData
        }
      ]
    }
  ]
};
```

### Format des fichiers de design

```javascript
const designFiles = [
  {
    colorName: "Blanc",
    view: "Front",
    file: File, // Objet File du navigateur
    name: "logo-entreprise.png"
  },
  {
    colorName: "Blanc", 
    view: "Back",
    file: File,
    name: "slogan-dos.png"
  },
  {
    colorName: "Noir",
    view: "Front", 
    file: File,
    name: "logo-blanc.png"
  }
];
```

## 🎨 CSS pour le formulaire

```css
.create-product-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.form-section {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.form-section h3 {
  margin-top: 0;
  color: #333;
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 15px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: #555;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.form-group textarea {
  height: 80px;
  resize: vertical;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.image-item {
  text-align: center;
}

.image-item img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.color-variations-config {
  border: 1px solid #eee;
  padding: 15px;
  border-radius: 4px;
}

.colors-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 20px;
  border: 1px solid #ddd;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 1px solid #ccc;
}

.add-color {
  display: flex;
  gap: 10px;
  align-items: center;
}

.color-design-section {
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 4px;
}

.color-indicator {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 8px;
  border: 1px solid #ccc;
}

.views-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 10px;
}

.view-design-upload {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
}

.design-upload-zone {
  border: 2px dashed #ddd;
  padding: 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.design-upload-zone:hover {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.upload-icon {
  font-size: 24px;
}

.design-uploaded {
  text-align: center;
}

.design-preview img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.btn-remove {
  background: #dc3545;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 5px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.btn-primary {
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.btn-primary:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.summary {
  background: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  border-left: 4px solid #007bff;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .views-grid {
    grid-template-columns: 1fr;
  }
  
  .add-color {
    flex-direction: column;
    align-items: stretch;
  }
}
```

## ⚠️ Points importants

### 1. Ordre des opérations
```
1. Créer le produit avec images de base
2. Récupérer les IDs des images créées  
3. Mapper les designs aux bonnes images
4. Uploader chaque design individuellement
5. Vérifier le résultat final
```

### 2. Gestion des erreurs
```javascript
// Toujours gérer les erreurs à chaque étape
try {
  const product = await createBaseProduct(...);
  // Si création échoue, on s'arrête ici
  
  const designs = await uploadDesigns(...);
  // Si upload designs échoue, le produit existe mais sans designs
  
} catch (error) {
  // Informer l'utilisateur de l'étape qui a échoué
  console.error('Erreur à l\'étape:', error.step, error.message);
}
```

### 3. Validation côté client
```javascript
// Valider avant envoi
const validateProductData = (data) => {
  const errors = [];
  
  if (!data.name?.trim()) errors.push('Nom requis');
  if (!data.price || data.price <= 0) errors.push('Prix invalide');
  if (!data.colorVariations?.length) errors.push('Au moins une couleur requise');
  
  return errors;
};
```

## 🎯 Exemple complet d'utilisation

```javascript
// Exemple d'utilisation complète
const exampleUsage = async () => {
  const productData = {
    name: "T-shirt Personnalisé",
    description: "T-shirt premium avec design personnalisé",
    price: 15000,
    stock: 100,
    status: "DRAFT",
    categories: ["Vêtements"],
    sizes: ["S", "M", "L"],
    colorVariations: [
      {
        name: "Blanc",
        colorCode: "#FFFFFF",
        images: [
          { view: "Front", fileId: "0" },
          { view: "Back", fileId: "1" }
        ]
      }
    ]
  };

  const productImages = [
    file1, // T-shirt blanc face
    file2  // T-shirt blanc dos
  ];

  const designFiles = [
    {
      colorName: "Blanc",
      view: "Front", 
      file: logoFile,
      name: "logo.png"
    },
    {
      colorName: "Blanc",
      view: "Back",
      file: sloganFile, 
      name: "slogan.png"
    }
  ];

  try {
    const result = await createProductWithDesigns(
      productData,
      productImages, 
      designFiles
    );
    
    console.log('✅ Produit créé avec succès:', result);
    // result.hasDesign === true
    // result.designCount === 2
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};
```

Ce guide fournit tout ce qu'il faut pour créer des produits avec designs depuis le frontend. Le processus est en deux étapes pour plus de fiabilité et de contrôle. 