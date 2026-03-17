# 🔄 Mise à jour backend – Délimitations uniquement en pourcentages

_Date : 17 juin 2025_

## 1. Résumé du changement
Le backend a été simplifié pour **toujours stocker les délimitations en pourcentages** (0-100), quelle que soit la façon dont elles sont envoyées.

### Avantages
• Cohérence : une seule unité de mesure.  
• Responsive : les zones suivent automatiquement le redimensionnement de l'image.  
• Plus de problèmes d'échelle ou de référence.

---
## 2. Endpoints

### 2.1 – POST `/delimitations`
```jsonc
{
  "productImageId": 42,
  "delimitation": {
    "x": 10,        // 0-100 (%) ou >100 (px, sera converti)
    "y": 20,        // idem
    "width": 30,    // idem
    "height": 25,   // idem
    "name": "Zone logo",
    "rotation": 0
  }
}
```
> 💡 Si vous envoyez des valeurs >100, le backend les considère comme des pixels et les convertit automatiquement en %.

### 2.2 – GET `/delimitations/image/:id`
```jsonc
{
  "imageId": 42,
  "naturalWidth": 2400,    // dimensions originales
  "naturalHeight": 3200,   // (pour info)
  "delimitations": [
    {
      "id": 1,
      "x": 10,           // toujours 0-100%
      "y": 20,
      "width": 30,
      "height": 25,
      "name": "Zone logo",
      "rotation": 0
    }
  ]
}
```

### 2.3 – PUT `/delimitations/:id`
Même format que le POST. Les coordonnées >100 sont converties en %.

---
## 3. Impact sur le frontend

### 3.1 – Si vous utilisiez déjà les pourcentages
✅ **Aucun changement requis !**

### 3.2 – Si vous utilisiez les pixels
1. Option simple : continuer à envoyer des pixels.  
   Le backend les convertira automatiquement.

2. Option recommandée : passer aux pourcentages.
   ```js
   // Conversion px → %
   const toPercentage = (px, total) => (px / total) * 100;
   
   // Exemple
   const delimitation = {
     x: toPercentage(120, imageWidth),      // ex: 120px → 10%
     y: toPercentage(240, imageHeight),     // 240px → 20%
     width: toPercentage(360, imageWidth),  // 360px → 30%
     height: toPercentage(300, imageHeight) // 300px → 25%
   };
   ```

### 3.3 – Affichage des zones
```js
// Conversion % → px pour le rendu
const toPx = (percent, total) => (percent / 100) * total;

function renderDelimitation(delimitation, displaySize) {
  return {
    x: toPx(delimitation.x, displaySize.width),
    y: toPx(delimitation.y, displaySize.height),
    width: toPx(delimitation.width, displaySize.width),
    height: toPx(delimitation.height, displaySize.height)
  };
}
```

---
## 4. Migration des données
• Toutes les anciennes délimitations ont été converties en %.  
• Les champs `referenceWidth/Height` ont été supprimés car inutiles.  
• Les coordonnées sont maintenant toujours relatives à l'image.

---
## 5. Validation
1. Créer une zone en pixels (ex: x=120, y=240, w=360, h=300).
2. GET : vérifier que les valeurs sont en % (ex: x=10, y=20, w=30, h=25).
3. Redimensionner l'image : la zone doit suivre proportionnellement.

---
Pour toute question : _backend @ printalma_. 