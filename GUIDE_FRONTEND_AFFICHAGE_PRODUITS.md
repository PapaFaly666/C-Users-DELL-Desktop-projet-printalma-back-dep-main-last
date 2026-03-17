# 🎨 GUIDE FRONTEND - AFFICHAGE DES PRODUITS AVEC DESIGNS

## 📋 **SOMMAIRE**

1. [🔗 Endpoints Disponibles](#endpoints-disponibles)
2. [📊 Structure des Données](#structure-des-données)
3. [🎨 Affichage des Designs](#affichage-des-designs)
4. [📏 Gestion des Dimensions](#gestion-des-dimensions)
5. [🎯 Positionnement des Designs](#positionnement-des-designs)
6. [🎨 Délimitations et Zones d'Application](#délimitations-et-zones-dapplication)
7. [💻 Exemples de Code](#exemples-de-code)
8. [🧪 Tests et Validation](#tests-et-validation)

---

## 🔗 **ENDPOINTS DISPONIBLES**

### **1. Endpoint Principal - Meilleures Ventes**
```http
GET http://localhost:3004/public/best-sellers
```

**Paramètres optionnels :**
- `vendorId` : ID du vendeur spécifique
- `limit` : Nombre de produits (défaut: 10)

### **2. Endpoint Alternatif - Structure Optimisée**
```http
GET http://localhost:3004/public/best-sellers-v2
```

**Paramètres optionnels :**
- `limit` : Nombre de produits (défaut: 20)
- `offset` : Pagination (défaut: 0)
- `category` : Catégorie de design
- `vendorId` : ID du vendeur
- `minSales` : Nombre minimum de ventes

---

## 📊 **STRUCTURE DES DONNÉES**

### **Réponse de `/public/best-sellers` :**

```json
{
  "success": true,
  "message": "Meilleures ventes récupérées",
  "data": {
    "bestSellers": [
      {
        "id": 1,
        "vendorName": "Nom du produit vendeur",
        "price": 25000,
        "status": "PUBLISHED",
        
        "bestSeller": {
          "isBestSeller": true,
          "salesCount": 85,
          "totalRevenue": 2125000
        },
        
        "adminProduct": {
          "id": 1,
          "name": "Mugs",
          "genre": "UNISEXE",
          "categories": [
            { "id": 1, "name": "Accessoires" }
          ],
          "colorVariations": [
            {
              "id": 1,
              "name": "Blanc",
              "colorCode": "#FFFFFF",
              "images": [
                {
                  "id": 1,
                  "url": "https://res.cloudinary.com/.../mug-blanc.png",
                  "view": "FRONT",
                  "naturalWidth": 800,
                  "naturalHeight": 600,
                  "delimitations": [
                    {
                      "id": 1,
                      "name": "Zone principale",
                      "x": 200,
                      "y": 150,
                      "width": 400,
                      "height": 300
                    }
                  ]
                }
              ]
            }
          ]
        },
        
        "designApplication": {
          "hasDesign": true,
          "designUrl": "https://res.cloudinary.com/.../design.png",
          "positioning": "{\"x\":-4,\"y\":1,\"scale\":1,\"rotation\":0}",
          "scale": 0.6,
          "mode": "PRESERVED"
        },
        
        "designPositions": [
          {
            "designId": 1,
            "position": {
              "x": -4,
              "y": 1,
              "scale": 1,
              "rotation": 0,
              "constraints": {
                "minScale": 0.1,
                "maxScale": 2.0
              },
              "designWidth": 50,      // ✅ VRAIES DIMENSIONS
              "designHeight": 75.35   // ✅ VRAIES DIMENSIONS
            }
          }
        ],
        
        "vendor": {
          "id": 2,
          "fullName": "Nom Prénom",
          "shop_name": "Nom de la boutique",
          "profile_photo_url": "https://..."
        },
        
        "images": {
          "adminReferences": [...],
          "total": 3,
          "primaryImageUrl": "https://..."
        }
      }
    ],
    "total": 2
  }
}
```

### **Réponse de `/public/best-sellers-v2` :**

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Nom du produit",
      "price": 25000,
      "salesCount": 85,
      "totalRevenue": 2125000,
      "bestSellerRank": 1,
      "viewsCount": 150,
      
      "designCloudinaryUrl": "https://res.cloudinary.com/.../design.png",
      "designWidth": 50,      // ✅ VRAIES DIMENSIONS
      "designHeight": 75.35,  // ✅ VRAIES DIMENSIONS
      "designScale": 0.6,
      "designPositioning": "{\"x\":-4,\"y\":1,\"scale\":1,\"rotation\":0}",
      
      "baseProduct": {
        "id": 1,
        "name": "Mugs",
        "genre": "UNISEXE",
        "categories": [...],
        "colorVariations": [...]
      },
      
      "vendor": {
        "id": 2,
        "firstName": "Prénom",
        "lastName": "Nom",
        "email": "email@example.com",
        "profilePhotoUrl": "https://...",
        "businessName": "Nom de la boutique"
      }
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

## 🎨 **AFFICHAGE DES DESIGNS**

### **Principe de Base**

1. **Image de base** : `adminProduct.colorVariations[0].images[0].url`
2. **Design à superposer** : `designApplication.designUrl` ou `designCloudinaryUrl`
3. **Position** : `designPositions[0].position`
4. **Dimensions réelles** : `designPositions[0].position.designWidth/designHeight`

### **Étapes d'Affichage**

```javascript
function displayProductWithDesign(product) {
  // 1. Récupérer l'image de base du produit
  const baseImage = product.adminProduct.colorVariations[0].images[0];
  const baseImageUrl = baseImage.url;
  const baseWidth = baseImage.naturalWidth || 800;
  const baseHeight = baseImage.naturalHeight || 600;
  
  // 2. Récupérer le design et sa position
  const designUrl = product.designApplication.designUrl;
  const position = product.designPositions[0].position;
  
  // 3. Utiliser les VRAIES dimensions du design
  const designWidth = position.designWidth;   // Ex: 50
  const designHeight = position.designHeight; // Ex: 75.35
  
  // 4. Calculer la position finale
  const finalX = position.x; // Ex: -4
  const finalY = position.y; // Ex: 1
  const scale = position.scale; // Ex: 1
  const rotation = position.rotation; // Ex: 0
  
  return {
    baseImage: { url: baseImageUrl, width: baseWidth, height: baseHeight },
    design: { 
      url: designUrl, 
      width: designWidth, 
      height: designHeight,
      x: finalX,
      y: finalY,
      scale: scale,
      rotation: rotation
    }
  };
}
```

---

## 📏 **GESTION DES DIMENSIONS**

### **⚠️ IMPORTANT - Utiliser les Vraies Dimensions**

```javascript
// ❌ INCORRECT - Ne pas utiliser de valeurs codées en dur
const designWidth = 500;
const designHeight = 500;

// ✅ CORRECT - Utiliser les dimensions stockées
const position = product.designPositions[0].position;
const designWidth = position.designWidth;   // 50, 43, etc.
const designHeight = position.designHeight; // 75.35, 64.80, etc.
```

### **Calcul des Proportions**

```javascript
function calculateDesignDisplaySize(position, containerWidth, containerHeight) {
  const { designWidth, designHeight, scale } = position;
  
  // Calculer la taille d'affichage avec le scale
  const displayWidth = designWidth * scale;
  const displayHeight = designHeight * scale;
  
  // S'assurer que le design reste dans les limites du conteneur
  const maxWidth = containerWidth * 0.8; // 80% max
  const maxHeight = containerHeight * 0.8;
  
  const scaleToFit = Math.min(
    maxWidth / displayWidth,
    maxHeight / displayHeight,
    1 // Ne pas agrandir au-delà de la taille originale
  );
  
  return {
    width: displayWidth * scaleToFit,
    height: displayHeight * scaleToFit,
    finalScale: scale * scaleToFit
  };
}
```

---

## 🎯 **POSITIONNEMENT DES DESIGNS**

### **Système de Coordonnées**

```javascript
function positionDesignOnProduct(baseElement, designElement, position) {
  const { x, y, scale, rotation, designWidth, designHeight } = position;
  
  // Récupérer les dimensions du conteneur de base
  const baseRect = baseElement.getBoundingClientRect();
  const centerX = baseRect.width / 2;
  const centerY = baseRect.height / 2;
  
  // Calculer la position finale (relative au centre)
  const finalX = centerX + x;
  const finalY = centerY + y;
  
  // Appliquer les transformations CSS
  designElement.style.position = 'absolute';
  designElement.style.left = `${finalX}px`;
  designElement.style.top = `${finalY}px`;
  designElement.style.width = `${designWidth * scale}px`;
  designElement.style.height = `${designHeight * scale}px`;
  designElement.style.transform = `
    translate(-50%, -50%) 
    rotate(${rotation}deg) 
    scale(${scale})
  `;
  designElement.style.transformOrigin = 'center center';
}
```

---

## 🎨 **DÉLIMITATIONS ET ZONES D'APPLICATION**

### **Affichage des Zones de Design**

```javascript
function showDesignDelimitations(product) {
  const delimitations = product.adminProduct.colorVariations[0].images[0].delimitations;
  
  delimitations.forEach(zone => {
    console.log(`Zone: ${zone.name}`);
    console.log(`Position: x=${zone.x}, y=${zone.y}`);
    console.log(`Taille: ${zone.width}x${zone.height}`);
    
    // Créer une zone visuelle pour l'éditeur
    const zoneElement = document.createElement('div');
    zoneElement.style.position = 'absolute';
    zoneElement.style.left = `${zone.x}px`;
    zoneElement.style.top = `${zone.y}px`;
    zoneElement.style.width = `${zone.width}px`;
    zoneElement.style.height = `${zone.height}px`;
    zoneElement.style.border = '2px dashed #007bff';
    zoneElement.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
    zoneElement.title = zone.name;
  });
}
```

---

## 💻 **EXEMPLES DE CODE**

### **React Component - Affichage Produit**

```jsx
import React, { useState, useEffect } from 'react';

const ProductDisplay = ({ productId }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch('/public/best-sellers');
      const data = await response.json();
      
      if (data.success && data.data.bestSellers.length > 0) {
        const foundProduct = data.data.bestSellers.find(p => p.id === productId);
        setProduct(foundProduct);
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!product) return <div>Produit non trouvé</div>;

  const baseImage = product.adminProduct.colorVariations[0].images[0];
  const position = product.designPositions[0].position;
  const designUrl = product.designApplication.designUrl;

  return (
    <div className="product-display">
      <h2>{product.vendorName}</h2>
      <p>Prix: {product.price / 100}€</p>
      <p>Ventes: {product.bestSeller.salesCount}</p>
      
      <div className="product-preview" style={{ position: 'relative', display: 'inline-block' }}>
        {/* Image de base du produit */}
        <img
          src={baseImage.url}
          alt={product.adminProduct.name}
          style={{
            width: baseImage.naturalWidth || 400,
            height: baseImage.naturalHeight || 300,
            display: 'block'
          }}
        />
        
        {/* Design superposé avec VRAIES dimensions */}
        {designUrl && (
          <img
            src={designUrl}
            alt="Design"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: `${position.designWidth * position.scale}px`,
              height: `${position.designHeight * position.scale}px`,
              transform: `
                translate(-50%, -50%) 
                translate(${position.x}px, ${position.y}px)
                rotate(${position.rotation}deg)
              `,
              transformOrigin: 'center center',
              zIndex: 10
            }}
          />
        )}
      </div>
      
      <div className="vendor-info">
        <h3>{product.vendor.shop_name}</h3>
        <p>Par: {product.vendor.fullName}</p>
        {product.vendor.profile_photo_url && (
          <img 
            src={product.vendor.profile_photo_url} 
            alt="Photo vendeur"
            style={{ width: 50, height: 50, borderRadius: '50%' }}
          />
        )}
      </div>
    </div>
  );
};

export default ProductDisplay;
```

### **Vanilla JavaScript - Liste des Produits**

```javascript
class ProductsDisplay {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.products = [];
  }

  async loadBestSellers(limit = 10) {
    try {
      const response = await fetch(`/public/best-sellers?limit=${limit}`);
      const data = await response.json();
      
      if (data.success) {
        this.products = data.data.bestSellers;
        this.render();
      }
    } catch (error) {
      console.error('Erreur:', error);
      this.container.innerHTML = '<p>Erreur de chargement</p>';
    }
  }

  render() {
    this.container.innerHTML = '';
    
    this.products.forEach(product => {
      const productElement = this.createProductElement(product);
      this.container.appendChild(productElement);
    });
  }

  createProductElement(product) {
    const div = document.createElement('div');
    div.className = 'product-card';
    
    const baseImage = product.adminProduct.colorVariations[0].images[0];
    const position = product.designPositions[0].position;
    const designUrl = product.designApplication.designUrl;
    
    div.innerHTML = `
      <h3>${product.vendorName}</h3>
      <div class="product-preview" style="position: relative; display: inline-block;">
        <img src="${baseImage.url}" 
             alt="${product.adminProduct.name}"
             style="width: 200px; height: auto; display: block;">
        ${designUrl ? `
          <img src="${designUrl}" 
               alt="Design"
               style="
                 position: absolute;
                 left: 50%;
                 top: 50%;
                 width: ${position.designWidth * position.scale * 0.5}px;
                 height: ${position.designHeight * position.scale * 0.5}px;
                 transform: translate(-50%, -50%) 
                           translate(${position.x * 0.5}px, ${position.y * 0.5}px)
                           rotate(${position.rotation}deg);
                 z-index: 10;
               ">
        ` : ''}
      </div>
      <p>Prix: ${product.price / 100}€</p>
      <p>Ventes: ${product.bestSeller.salesCount}</p>
      <p>Boutique: ${product.vendor.shop_name}</p>
    `;
    
    return div;
  }
}

// Utilisation
const productsDisplay = new ProductsDisplay('products-container');
productsDisplay.loadBestSellers(6);
```

### **CSS pour l'Affichage**

```css
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 16px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.product-preview {
  position: relative;
  display: inline-block;
  margin: 16px 0;
  overflow: hidden;
  border-radius: 4px;
}

.product-preview img {
  max-width: 100%;
  height: auto;
}

.vendor-info {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #eee;
}

.design-overlay {
  position: absolute;
  pointer-events: none;
  transition: all 0.3s ease;
}

.delimitation-zone {
  position: absolute;
  border: 2px dashed #007bff;
  background-color: rgba(0, 123, 255, 0.1);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}

.product-preview:hover .delimitation-zone {
  opacity: 1;
}
```

---

## 🧪 **TESTS ET VALIDATION**

### **Test de Récupération des Données**

```javascript
async function testProductData() {
  console.log('🧪 Test de récupération des données...');
  
  try {
    const response = await fetch('/public/best-sellers?limit=1');
    const data = await response.json();
    
    if (data.success && data.data.bestSellers.length > 0) {
      const product = data.data.bestSellers[0];
      const position = product.designPositions[0].position;
      
      console.log('✅ Données récupérées:');
      console.log(`   ID: ${product.id}`);
      console.log(`   Nom: ${product.vendorName}`);
      console.log(`   Design Width: ${position.designWidth}`);
      console.log(`   Design Height: ${position.designHeight}`);
      console.log(`   Position: x=${position.x}, y=${position.y}`);
      console.log(`   Scale: ${position.scale}`);
      
      // Vérifier que les dimensions ne sont pas les valeurs par défaut
      if (position.designWidth !== 500 || position.designHeight !== 500) {
        console.log('✅ Vraies dimensions détectées !');
      } else {
        console.log('⚠️  Dimensions par défaut détectées');
      }
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

// Lancer le test
testProductData();
```

### **Validation des Dimensions**

```javascript
function validateProductDimensions(product) {
  const position = product.designPositions[0].position;
  const checks = [];
  
  // Vérifier que les dimensions existent
  checks.push({
    test: 'Dimensions définies',
    passed: position.designWidth && position.designHeight,
    value: `${position.designWidth}x${position.designHeight}`
  });
  
  // Vérifier que ce ne sont pas les valeurs par défaut
  checks.push({
    test: 'Pas de valeurs par défaut',
    passed: position.designWidth !== 500 || position.designHeight !== 500,
    value: position.designWidth === 500 ? 'Défaut détecté' : 'OK'
  });
  
  // Vérifier que les dimensions sont réalistes
  checks.push({
    test: 'Dimensions réalistes',
    passed: position.designWidth > 0 && position.designHeight > 0 && 
            position.designWidth < 5000 && position.designHeight < 5000,
    value: 'Dans les limites acceptables'
  });
  
  console.log(`🔍 Validation produit ${product.id}:`);
  checks.forEach(check => {
    console.log(`   ${check.passed ? '✅' : '❌'} ${check.test}: ${check.value}`);
  });
  
  return checks.every(check => check.passed);
}
```

---

## 📝 **CHECKLIST FRONTEND**

### **✅ Implémentation Requise**

- [ ] **Récupération des données** depuis `/public/best-sellers`
- [ ] **Utilisation des vraies dimensions** (`position.designWidth/designHeight`)
- [ ] **Positionnement correct** du design sur l'image de base
- [ ] **Gestion du scale** et de la rotation
- [ ] **Affichage des informations vendeur** (boutique, photo)
- [ ] **Gestion des erreurs** de chargement
- [ ] **Interface responsive** pour mobile/desktop
- [ ] **Tests de validation** des dimensions

### **🎨 Fonctionnalités Recommandées**

- [ ] **Prévisualisation interactive** avec zoom
- [ ] **Affichage des délimitations** en mode édition
- [ ] **Animation de transition** entre les couleurs
- [ ] **Lazy loading** des images
- [ ] **Cache** des données produits
- [ ] **Mode comparaison** de produits
- [ ] **Filtres** par vendeur/catégorie
- [ ] **Système de favoris**

---

## 🚀 **DÉMARRAGE RAPIDE**

```bash
# 1. Tester l'endpoint
curl -X 'GET' 'http://localhost:3004/public/best-sellers' -H 'accept: */*'

# 2. Vérifier les dimensions
node -e "
fetch('http://localhost:3004/public/best-sellers')
  .then(r => r.json())
  .then(d => {
    const pos = d.data.bestSellers[0].designPositions[0].position;
    console.log(\`Dimensions: \${pos.designWidth}x\${pos.designHeight}\`);
  });
"

# 3. Intégrer dans votre application React/Vue/Angular
```

---

## 📞 **SUPPORT**

Pour toute question sur l'implémentation :

1. **Vérifiez** que l'endpoint retourne les bonnes données
2. **Testez** les dimensions avec les scripts fournis
3. **Validez** l'affichage avec les exemples de code
4. **Documentez** vos cas d'usage spécifiques

---

**🎉 Avec ce guide, vous avez tout ce qu'il faut pour afficher parfaitement les produits avec leurs designs aux vraies dimensions !** 