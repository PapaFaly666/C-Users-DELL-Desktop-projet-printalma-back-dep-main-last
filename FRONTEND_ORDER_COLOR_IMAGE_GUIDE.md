# Guide Frontend - Images de Couleur dans les Commandes

## 📋 Vue d'ensemble

Ce guide explique comment utiliser la nouvelle fonctionnalité permettant d'inclure l'image de la couleur spécifique du produit commandé dans vos commandes PrintAlma.

## 🚀 Fonctionnalité

### Avant vs Après

**Avant** : 
- Les commandes stockaient seulement le nom/code de couleur comme chaîne
- L'image de couleur était récupérée en cherchant dans toutes les couleurs du produit
- Problème quand `color` était `null` ou ne correspondait pas exactement

**Après** :
- Les commandes peuvent stocker une référence directe vers la couleur via `colorId`
- L'image de couleur est garantie et accessible directement
- Compatibilité backward maintenue avec l'ancien système

## 🗄️ Structure de Base de Données

### Nouveau Champ OrderItem
```prisma
model OrderItem {
  id        Int     @id @default(autoincrement())
  // ... autres champs existants
  color     String? // Gardé pour compatibilité (nom/code couleur)
  colorId   Int?    // 🆕 NOUVEAU : ID de la couleur sélectionnée
  selectedColor Color? @relation(fields: [colorId], references: [id])
}
```

## 🔧 Utilisation Frontend

### 1. Création de Commande avec Color ID

```javascript
// Exemple de création de commande avec colorId
const orderData = {
  shippingDetails: {
    firstName: "John",
    lastName: "Doe",
    street: "123 Main St",
    city: "Paris",
    postalCode: "75001",
    country: "France"
  },
  phoneNumber: "+33123456789",
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      size: "M",
      colorId: 5, // 🆕 NOUVEAU : ID de la couleur (prioritaire)
      color: "Rouge" // OPTIONNEL : garde pour compatibilité
    },
    {
      productId: 2,
      quantity: 1,
      size: "L",
      color: "Bleu" // ANCIEN : fonctionne encore sans colorId
    }
  ]
};

// Envoi de la commande
const response = await fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(orderData)
});
```

### 2. Récupération des Couleurs Disponibles

```javascript
// Récupérer les couleurs d'un produit pour afficher les options
const getProductColors = async (productId) => {
  const response = await fetch(`/api/products/${productId}`);
  const product = await response.json();
  
  return product.colors.map(color => ({
    id: color.id,           // Pour colorId dans la commande
    name: color.name,       // Pour affichage
    hexCode: color.hexCode, // Pour aperçu couleur
    imageUrl: color.imageUrl // Pour prévisualisation
  }));
};

// Exemple d'utilisation dans un composant React
const ColorSelector = ({ productId, onColorSelect }) => {
  const [colors, setColors] = useState([]);
  
  useEffect(() => {
    getProductColors(productId).then(setColors);
  }, [productId]);
  
  return (
    <div className="color-selector">
      {colors.map(color => (
        <div 
          key={color.id}
          className="color-option"
          onClick={() => onColorSelect(color)}
        >
          <img 
            src={color.imageUrl} 
            alt={color.name}
            className="color-preview"
          />
          <span>{color.name}</span>
        </div>
      ))}
    </div>
  );
};
```

### 3. Affichage des Commandes avec Images

```javascript
// Réponse de GET /api/orders ou GET /api/orders/:id
const orderResponse = {
  id: 123,
  orderNumber: "CMD20241218001",
  status: "PENDING",
  orderItems: [
    {
      id: 456,
      quantity: 2,
      unitPrice: 25.99,
      size: "M",
      color: "Rouge", // Valeur string (peut être null)
      product: {
        id: 1,
        name: "T-shirt Custom",
        designImageUrl: "https://...",
        // 🆕 INFORMATIONS DE COULEUR GARANTIES
        orderedColorName: "Rouge Écarlate",
        orderedColorHexCode: "#DC143C",
        orderedColorImageUrl: "https://cloudinary.../red-tshirt.jpg"
      }
    }
  ]
};

// Composant React pour afficher un item de commande
const OrderItem = ({ item }) => {
  const { product } = item;
  
  return (
    <div className="order-item">
      <div className="product-info">
        <h3>{product.name}</h3>
        <p>Quantité: {item.quantity}</p>
        <p>Taille: {item.size}</p>
      </div>
      
      <div className="product-visuals">
        {/* Design du produit */}
        <img 
          src={product.designImageUrl} 
          alt={`Design ${product.name}`}
          className="design-image"
        />
        
        {/* 🆕 IMAGE DE LA COULEUR COMMANDÉE */}
        {product.orderedColorImageUrl && (
          <div className="ordered-color">
            <img 
              src={product.orderedColorImageUrl}
              alt={`Couleur ${product.orderedColorName}`}
              className="color-image"
            />
            <div className="color-info">
              <span className="color-name">{product.orderedColorName}</span>
              {product.orderedColorHexCode && (
                <span 
                  className="color-swatch"
                  style={{ backgroundColor: product.orderedColorHexCode }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
```

## 🎯 Logique de Priorité

Le système utilise une logique de priorité pour déterminer l'image de couleur :

1. **Priorité 1** : `selectedColor` (relation directe via `colorId`)
2. **Priorité 2** : Recherche dans `product.colors` avec `item.color`
3. **Priorité 3** : Utilise `item.color` comme nom seulement

```javascript
// Logique backend (pour référence)
let orderedColorName = null;
let orderedColorHexCode = null;
let orderedColorImageUrl = null;

if (item.selectedColor) {
  // 🆕 Priorité 1: Relation directe
  orderedColorName = item.selectedColor.name;
  orderedColorHexCode = item.selectedColor.hexCode;
  orderedColorImageUrl = item.selectedColor.imageUrl;
} else if (item.product.colors && item.color) {
  // Priorité 2: Recherche dans les couleurs du produit
  const foundColor = item.product.colors.find(
    c => c.name === item.color || c.hexCode === item.color
  );
  if (foundColor) {
    orderedColorName = foundColor.name;
    orderedColorHexCode = foundColor.hexCode;
    orderedColorImageUrl = foundColor.imageUrl;
  }
} else if (item.color) {
  // Priorité 3: Nom seulement
  orderedColorName = item.color;
}
```

## 🚨 Migration et Déploiement

### Étapes de Migration

1. **Appliquer la migration** :
   ```bash
   npx prisma migrate dev --name add_color_relation_to_order_item
   ```

2. **Activer les includes** dans `order.service.ts` :
   ```typescript
   // Décommenter cette ligne après la migration
   selectedColor: true
   ```

3. **Tester la compatibilité** avec les anciennes commandes

### Compatibilité Backward

- ✅ Les anciennes commandes continuent de fonctionner
- ✅ L'API accepte toujours `color` comme string
- ✅ Les réponses incluent toujours le champ `color` existant
- 🆕 Nouvelles commandes peuvent utiliser `colorId` pour garantir l'image

## 🔍 Résolution des Problèmes

### Problème : `orderedColorImageUrl` est null

```javascript
// Vérifications à faire :
if (!product.orderedColorImageUrl) {
  console.log('Couleur commandée:', item.color);
  console.log('ID couleur:', item.colorId);
  console.log('Couleurs disponibles:', product.colors);
  
  // Solutions possibles :
  // 1. Utiliser colorId au lieu de color string
  // 2. Vérifier que la couleur existe dans product.colors
  // 3. Utiliser une image par défaut
}
```

### Problème : colorId invalide

```javascript
// Validation côté frontend avant envoi
const validateColorSelection = (productId, colorId) => {
  const product = getProductById(productId);
  const colorExists = product.colors.some(c => c.id === colorId);
  
  if (!colorExists) {
    throw new Error(`Couleur ${colorId} non disponible pour le produit ${productId}`);
  }
};
```

## 📋 Checklist d'Implémentation

### Pour les Développeurs Frontend

- [ ] Modifier le formulaire de commande pour permettre la sélection par `colorId`
- [ ] Récupérer les couleurs disponibles depuis l'API produits
- [ ] Afficher les images de couleur dans le sélecteur
- [ ] Mettre à jour l'affichage des commandes pour utiliser `orderedColorImageUrl`
- [ ] Tester la compatibilité avec les anciennes commandes
- [ ] Implémenter une gestion d'erreur pour les couleurs invalides

### Pour les Tests

- [ ] Créer une commande avec `colorId` valide
- [ ] Créer une commande avec `color` string (ancien système)
- [ ] Vérifier que `orderedColorImageUrl` est présent dans les réponses
- [ ] Tester avec `colorId` invalide (doit retourner erreur 400)
- [ ] Vérifier la rétrocompatibilité avec les anciennes commandes

## 🎨 Exemple Complet

### Composant de Création de Commande

```jsx
import React, { useState, useEffect } from 'react';

const CreateOrderForm = () => {
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [availableColors, setAvailableColors] = useState({});

  const addProductToOrder = async (productId) => {
    // Récupérer les couleurs disponibles
    const colors = await getProductColors(productId);
    setAvailableColors(prev => ({
      ...prev,
      [productId]: colors
    }));

    // Ajouter le produit avec la première couleur par défaut
    const newItem = {
      productId,
      quantity: 1,
      size: 'M',
      colorId: colors[0]?.id,
      selectedColor: colors[0]
    };

    setSelectedProducts(prev => [...prev, newItem]);
  };

  const updateItemColor = (index, color) => {
    setSelectedProducts(prev => 
      prev.map((item, i) => 
        i === index 
          ? { ...item, colorId: color.id, selectedColor: color }
          : item
      )
    );
  };

  const submitOrder = async () => {
    const orderData = {
      shippingDetails: {
        // ... détails d'adresse
      },
      phoneNumber: "+33123456789",
      orderItems: selectedProducts.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        colorId: item.colorId // 🆕 Utilise l'ID de couleur
      }))
    };

    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderData)
    });

    if (response.ok) {
      const order = await response.json();
      console.log('Commande créée:', order);
      // Rediriger vers la page de confirmation
    }
  };

  return (
    <div className="create-order-form">
      {selectedProducts.map((item, index) => (
        <div key={index} className="order-item-form">
          <h3>Produit {item.productId}</h3>
          
          {/* Sélecteur de couleur avec images */}
          <div className="color-selector">
            <label>Couleur :</label>
            <div className="color-options">
              {availableColors[item.productId]?.map(color => (
                <div 
                  key={color.id}
                  className={`color-option ${item.colorId === color.id ? 'selected' : ''}`}
                  onClick={() => updateItemColor(index, color)}
                >
                  <img 
                    src={color.imageUrl} 
                    alt={color.name}
                    className="color-preview"
                  />
                  <span>{color.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Aperçu de la couleur sélectionnée */}
          {item.selectedColor && (
            <div className="selected-color-preview">
              <img 
                src={item.selectedColor.imageUrl}
                alt={`Aperçu ${item.selectedColor.name}`}
                className="large-color-preview"
              />
              <p>Couleur sélectionnée : {item.selectedColor.name}</p>
            </div>
          )}
        </div>
      ))}

      <button onClick={submitOrder}>Créer la Commande</button>
    </div>
  );
};

export default CreateOrderForm;
```

## 📞 Support

Pour toute question ou problème avec cette fonctionnalité :

1. Vérifiez que la migration a été appliquée
2. Confirmez que les includes `selectedColor` sont activés
3. Testez avec des données de couleur valides
4. Consultez les logs backend pour les erreurs de validation

---

✅ **Cette fonctionnalité garantit que chaque commande aura accès à l'image exacte de la couleur commandée, améliorant significativement l'expérience utilisateur.** 