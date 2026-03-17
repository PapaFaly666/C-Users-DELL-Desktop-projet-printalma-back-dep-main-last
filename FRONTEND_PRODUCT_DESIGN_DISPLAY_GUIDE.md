# 🎨 Guide Front-End – Affichage du Design sur un Produit (Architecture v2)

Ce guide explique **comment superposer correctement le design** d’un vendeur sur l’image produit à partir des données retournées par l’endpoint :

```
GET /vendor/products/:id
```

Exemple de champs reçus :
```jsonc
{
  // …
  "adminProduct": { /* images officielles */ },
  "designApplication": {
    "designUrl": "https://…/design.png",
    "positioning": "CENTER", // alignement par défaut si aucune position sauvegardée
    "scale": 0.6,             // échelle par défaut
    "mode": "PRESERVED"      // toujours « PRESERVED » en archi v2
  },
  "design": { /* métadonnées du design */ },
  "designPositions": [
    {
      "designId": 9,
      "position": {
        "x": -86,
        "y": -122,
        "scale": 0.375,
        "rotation": 0,
        "constraints": {}
      }
    }
  ],
  "designTransforms": [
    {
      "transforms": {
        "0": { "x": -86, "y": -122, "scale": 0.375 }
      }
    }
  ]
}
```

---

## 1. Choisir l’image de fond (produit)

1. Parcourir `adminProduct.colorVariations[]` pour trouver la variation à afficher (ex. première couleur ou couleur sélectionnée par l’utilisateur).
2. Récupérer l’URL de l’image :
```ts
const baseImageUrl = adminProduct.colorVariations[0].images[0].url;
```

---

## 2. Récupérer les paramètres du design

1. **URL du design** :
```ts
const designUrl = product.designApplication.designUrl; // PNG transparent
```
2. **Position / Scale / Rotation** :
```ts
const { x, y, scale, rotation } = product.designPositions[0]?.position || {
  x: 0,
  y: 0,
  scale: product.designApplication.scale, // fallback 0.6
  rotation: 0
};
```
3. **Note** : les coordonnées sont exprimées en **pixels relatifs au coin supérieur gauche** de l’image produit originale (pas de pourcentage).

---

## 3. Affichage avec HTML + CSS (exemple React)

```tsx
import React from 'react';

interface Props {
  baseImage: string;   // URL arrière-plan (produit)
  designImage: string; // URL design PNG
  pos: { x: number; y: number; scale: number; rotation: number };
}

const Canvas: React.FC<Props> = ({ baseImage, designImage, pos }) => {
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      {/* Image produit */}
      <img src={baseImage} style={{ width: '100%', display: 'block' }} />

      {/* Design superposé */}
      <img
        src={designImage}
        alt="Design"
        style={{
          position: 'absolute',
          left: pos.x,
          top: pos.y,
          transform: `scale(${pos.scale}) rotate(${pos.rotation}deg)`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
```

---

## 4. Exemple d’utilisation avec les données API

```tsx
// productDetail = réponse JSON de GET /vendor/products/:id
const baseImage = productDetail.adminProduct.colorVariations[0].images[0].url;
const designImage = productDetail.designApplication.designUrl;

const defaultPos = {
  x: 0,
  y: 0,
  scale: productDetail.designApplication.scale || 0.6,
  rotation: 0,
};

const apiPos = productDetail.designPositions?.[0]?.position;

const position = apiPos ? { ...apiPos } : defaultPos;

return <Canvas baseImage={baseImage} designImage={designImage} pos={position} />;
```

---

## 5. Gestion des interactivités (éditeur)

Si vous permettez au vendeur de déplacer / redimensionner le design côté client :

1. **Mettre à jour** le state local lors du drag/scale.
2. À la sauvegarde, appeler :
```
POST /vendor/design-transforms/save   // pour les transformations
POST /vendor/design-positions        // si endpoint dédié
```
*(en archi v2, un seul endpoint peut suffire selon votre implémentation)*
3. Une fois sauvegardé, rafraîchir la page détail :
```ts
mutate(`/vendor/products/${productId}`); // SWR / React Query
```

---

## 6. Résumé

1. **Image produit** : `adminProduct.colorVariations[].images[].url`
2. **Design PNG** : `designApplication.designUrl`
3. **Position / Échelle** : `designPositions[0].position` (fallback `designApplication.scale`)
4. **CSS transform** : `translate(x, y) scale(scale) rotate(rotation)`
5. **Aucune fusion d’images côté backend** : tout est _client-side_ → rendu temps réel.

> Dernière mise à jour : 2025-07-10 – Architecture v2 (_admin structure preserved_). 