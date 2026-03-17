# Guide Complet - Délimitations et Boundaries des Produits

## 🎯 Vue d'Ensemble

Les **délimitations** (boundaries) définissent les **zones d'impression** sur les images des produits. Elles indiquent précisément où les designs peuvent être appliqués.

---

## 📐 Structure des Délimitations

### **Modèle de Base de Données**

```prisma
model Delimitation {
  id             Int     @id @default(autoincrement())
  x              Float   // Position X en pixels
  y              Float   // Position Y en pixels  
  width          Float   // Largeur de la zone en pixels
  height         Float   // Hauteur de la zone en pixels
  rotation       Float   // Rotation en degrés (0-360)
  productImageId Int     // ID de l'image associée
  productImage   ProductImage @relation(fields: [productImageId], references: [id], onDelete: Cascade)
}
```

### **Structure TypeScript**

```typescript
interface Delimitation {
  id: number;                    // Identifiant unique
  x: number;                     // Position horizontale (pixels)
  y: number;                     // Position verticale (pixels)
  width: number;                 // Largeur de la zone (pixels)
  height: number;                // Hauteur de la zone (pixels)
  rotation: number;              // Angle de rotation (degrés)
  productImageId: number;        // ID de l'image parent
}
```

---

## 📊 Système de Coordonnées

### **Origine et Axes**

```
(0,0) ────────────── X+ (largeur image)
  │
  │    ┌─────────────┐
  │    │             │
  │    │   ZONE DE   │ 
  │    │ DELIMITATION│
  │    │  (x,y,w,h)  │
  │    │             │
  │    └─────────────┘
  │
  Y+ (hauteur image)
```

### **Coordonnées de Délimitation**

- **Point d'origine (x, y)** : Coin supérieur gauche de la zone
- **Largeur (width)** : Extension horizontale vers la droite
- **Hauteur (height)** : Extension verticale vers le bas
- **Rotation** : Pivote autour du centre de la zone

### **Exemple Concret**

```javascript
const delimitation = {
  x: 150.5,        // 150.5px du bord gauche
  y: 100.0,        // 100px du bord supérieur
  width: 200.0,    // Zone de 200px de large
  height: 250.0,   // Zone de 250px de haut  
  rotation: 15.0   // Tournée de 15° dans le sens horaire
};

// Zone finale : Rectangle de 200x250px
// Coin supérieur gauche à (150.5, 100)
// Tourné de 15° autour de son centre (250.5, 225)
```

---

## 🖼️ Relation avec les Images

### **Hiérarchie Complète**

```
Product
├── ColorVariation (couleur)
    ├── ProductImage (vue: Front/Back/etc.)
        ├── Delimitation 1 (zone d'impression 1)
        ├── Delimitation 2 (zone d'impression 2)
        └── ...
```

### **Exemples par Vue d'Image**

```javascript
// T-Shirt Rouge - Vue de Face
{
  "view": "Front",
  "url": "https://cloudinary.com/red_front.jpg",
  "delimitations": [
    {
      "id": 1,
      "x": 150.0,      // Zone poitrine
      "y": 80.0,
      "width": 200.0,
      "height": 250.0,
      "rotation": 0.0
    },
    {
      "id": 2,
      "x": 100.0,      // Zone poche gauche
      "y": 350.0,
      "width": 80.0,
      "height": 60.0,
      "rotation": 0.0
    }
  ]
}

// T-Shirt Rouge - Vue de Dos  
{
  "view": "Back",
  "url": "https://cloudinary.com/red_back.jpg",
  "delimitations": [
    {
      "id": 3,
      "x": 120.0,      // Zone dos complet
      "y": 60.0,
      "width": 260.0,
      "height": 350.0,
      "rotation": 0.0
    }
  ]
}
```

---

## 🎨 Cas d'Usage par Type de Produit

### **T-Shirts**

```javascript
const tshirtDelimitations = {
  "Front": [
    {
      name: "Zone Poitrine",
      x: 150, y: 80, width: 200, height: 250, rotation: 0
    },
    {
      name: "Poche Gauche", 
      x: 100, y: 350, width: 80, height: 60, rotation: 0
    }
  ],
  "Back": [
    {
      name: "Dos Complet",
      x: 120, y: 60, width: 260, height: 350, rotation: 0
    }
  ]
};
```

### **Hoodies**

```javascript
const hoodieDelimitations = {
  "Front": [
    {
      name: "Zone Centrale",
      x: 140, y: 120, width: 220, height: 280, rotation: 0
    },
    {
      name: "Capuche",
      x: 180, y: 20, width: 140, height: 80, rotation: 0
    }
  ],
  "Back": [
    {
      name: "Dos Large",
      x: 100, y: 80, width: 300, height: 400, rotation: 0
    }
  ]
};
```

### **Casquettes**

```javascript
const capDelimitations = {
  "Front": [
    {
      name: "Visière Avant",
      x: 80, y: 150, width: 160, height: 100, rotation: 0
    }
  ],
  "Left": [
    {
      name: "Côté Gauche",
      x: 50, y: 120, width: 120, height: 80, rotation: 0
    }
  ],
  "Back": [
    {
      name: "Arrière",
      x: 70, y: 140, width: 140, height: 90, rotation: 0
    }
  ]
};
```

---

## 💻 Utilisation Frontend

### **Affichage des Zones**

```javascript
// Dessiner les délimitations sur une image
function drawDelimitations(imageElement, delimitations) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Copier l'image sur le canvas
  canvas.width = imageElement.width;
  canvas.height = imageElement.height;
  ctx.drawImage(imageElement, 0, 0);
  
  // Dessiner chaque délimitation
  delimitations.forEach((delim, index) => {
    ctx.save();
    
    // Se déplacer au centre de la zone pour la rotation
    const centerX = delim.x + delim.width / 2;
    const centerY = delim.y + delim.height / 2;
    
    ctx.translate(centerX, centerY);
    ctx.rotate((delim.rotation * Math.PI) / 180); // Convertir en radians
    ctx.translate(-centerX, -centerY);
    
    // Dessiner le rectangle de délimitation
    ctx.strokeStyle = '#FF0000';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Ligne pointillée
    ctx.strokeRect(delim.x, delim.y, delim.width, delim.height);
    
    // Ajouter un numéro
    ctx.fillStyle = '#FF0000';
    ctx.font = '16px Arial';
    ctx.fillText(`${index + 1}`, delim.x + 5, delim.y + 20);
    
    ctx.restore();
  });
  
  return canvas;
}

// Utilisation
const productImage = document.getElementById('product-image');
const delimitations = product.colorVariations[0].images[0].delimitations;
const canvasWithZones = drawDelimitations(productImage, delimitations);
document.body.appendChild(canvasWithZones);
```

### **Vérification de Zone**

```javascript
// Vérifier si un point est dans une délimitation
function isPointInDelimitation(pointX, pointY, delimitation) {
  const { x, y, width, height, rotation } = delimitation;
  
  if (rotation === 0) {
    // Cas simple sans rotation
    return pointX >= x && pointX <= x + width &&
           pointY >= y && pointY <= y + height;
  }
  
  // Cas avec rotation (calcul plus complexe)
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  
  // Rotation inverse du point par rapport au centre
  const angle = -rotation * Math.PI / 180;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  
  const translatedX = pointX - centerX;
  const translatedY = pointY - centerY;
  
  const rotatedX = translatedX * cos - translatedY * sin + centerX;
  const rotatedY = translatedX * sin + translatedY * cos + centerY;
  
  return rotatedX >= x && rotatedX <= x + width &&
         rotatedY >= y && rotatedY <= y + height;
}

// Test
const isInZone = isPointInDelimitation(200, 150, {
  x: 150, y: 100, width: 200, height: 250, rotation: 15
});
```

### **Composant React pour Délimitations**

```tsx
interface DelimitationViewerProps {
  image: ProductImage;
  onZoneClick?: (delimitation: Delimitation) => void;
}

function DelimitationViewer({ image, onZoneClick }: DelimitationViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedZone, setSelectedZone] = useState<number | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Dessiner l'image
      ctx.drawImage(img, 0, 0);
      
      // Dessiner les délimitations
      image.delimitations.forEach((delim, index) => {
        ctx.save();
        
        const centerX = delim.x + delim.width / 2;
        const centerY = delim.y + delim.height / 2;
        
        ctx.translate(centerX, centerY);
        ctx.rotate((delim.rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
        
        // Style selon la sélection
        const isSelected = selectedZone === index;
        ctx.strokeStyle = isSelected ? '#00FF00' : '#FF0000';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.setLineDash([5, 5]);
        
        ctx.strokeRect(delim.x, delim.y, delim.width, delim.height);
        
        // Numéro de zone
        ctx.fillStyle = isSelected ? '#00FF00' : '#FF0000';
        ctx.font = '14px Arial';
        ctx.fillText(`Zone ${index + 1}`, delim.x + 5, delim.y + 20);
        
        ctx.restore();
      });
    };
    
    img.src = image.url;
  }, [image, selectedZone]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Vérifier quelle zone a été cliquée
    const clickedZone = image.delimitations.findIndex(delim => 
      isPointInDelimitation(x, y, delim)
    );
    
    if (clickedZone !== -1) {
      setSelectedZone(clickedZone);
      onZoneClick?.(image.delimitations[clickedZone]);
    }
  };

  return (
    <div className="delimitation-viewer">
      <canvas 
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="cursor-pointer border border-gray-300"
      />
      
      <div className="mt-4">
        <h3 className="font-semibold">Zones d'impression disponibles:</h3>
        <ul className="mt-2">
          {image.delimitations.map((delim, index) => (
            <li 
              key={delim.id}
              className={`p-2 cursor-pointer ${
                selectedZone === index ? 'bg-green-100' : 'bg-gray-100'
              }`}
              onClick={() => setSelectedZone(index)}
            >
              <strong>Zone {index + 1}</strong><br/>
              Position: ({delim.x}, {delim.y})<br/>
              Taille: {delim.width} × {delim.height}px<br/>
              Rotation: {delim.rotation}°
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

---

## 🛠️ Création et Modification

### **Ajouter des Délimitations lors de la Création**

```javascript
// Structure pour créer un produit avec délimitations
const productData = {
  name: "T-Shirt Premium",
  colorVariations: [
    {
      name: "Rouge",
      colorCode: "#FF0000",
      images: [
        {
          fileId: "red-front",
          view: "Front",
          delimitations: [
            {
              x: 150.5,
              y: 100.0,
              width: 200.0,
              height: 250.0,
              rotation: 0.0
            },
            {
              x: 100.0,
              y: 350.0,
              width: 80.0,
              height: 60.0,
              rotation: 0.0
            }
          ]
        },
        {
          fileId: "red-back",
          view: "Back",
          delimitations: [
            {
              x: 120.0,
              y: 60.0,
              width: 260.0,
              height: 350.0,
              rotation: 0.0
            }
          ]
        }
      ]
    }
  ]
};
```

### **Modifier les Délimitations**

```javascript
// Service pour modifier les délimitations
class DelimitationService {
  static async updateDelimitation(delimitationId: number, updates: Partial<Delimitation>) {
    const response = await fetch(`/api/delimitations/${delimitationId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
    
    return response.json();
  }
  
  static async deleteDelimitation(delimitationId: number) {
    const response = await fetch(`/api/delimitations/${delimitationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    return response.ok;
  }
  
  static async addDelimitation(productImageId: number, delimitation: Omit<Delimitation, 'id' | 'productImageId'>) {
    const response = await fetch(`/api/product-images/${productImageId}/delimitations`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(delimitation)
    });
    
    return response.json();
  }
}
```

---

## 📏 Validation et Contraintes

### **Règles de Validation**

```typescript
interface DelimitationValidation {
  // Coordonnées valides
  x: number;        // >= 0
  y: number;        // >= 0
  width: number;    // > 0
  height: number;   // > 0
  rotation: number; // 0-360 degrés
}

function validateDelimitation(delimitation: Delimitation, imageWidth: number, imageHeight: number): string[] {
  const errors: string[] = [];
  
  // Vérifications de base
  if (delimitation.x < 0) errors.push("La position X doit être positive");
  if (delimitation.y < 0) errors.push("La position Y doit être positive");
  if (delimitation.width <= 0) errors.push("La largeur doit être positive");
  if (delimitation.height <= 0) errors.push("La hauteur doit être positive");
  if (delimitation.rotation < 0 || delimitation.rotation >= 360) {
    errors.push("La rotation doit être entre 0 et 359 degrés");
  }
  
  // Vérification des limites de l'image
  if (delimitation.x + delimitation.width > imageWidth) {
    errors.push("La zone dépasse la largeur de l'image");
  }
  if (delimitation.y + delimitation.height > imageHeight) {
    errors.push("La zone dépasse la hauteur de l'image");
  }
  
  // Taille minimum
  if (delimitation.width < 50 || delimitation.height < 50) {
    errors.push("La zone doit faire au moins 50x50 pixels");
  }
  
  return errors;
}
```

### **Exemple d'Utilisation**

```javascript
const errors = validateDelimitation({
  x: 150,
  y: 100,
  width: 200,
  height: 250,
  rotation: 15
}, 500, 600); // Image de 500x600px

if (errors.length > 0) {
  console.error("Erreurs de validation:", errors);
} else {
  console.log("Délimitation valide");
}
```

---

## 🎯 Bonnes Pratiques

### **1. Nommage des Zones**

```javascript
const zoneNames = {
  "Front": ["Zone Centrale", "Poche Gauche", "Poche Droite"],
  "Back": ["Dos Complet", "Zone Nuque"],
  "Left": ["Manche Gauche"],
  "Right": ["Manche Droite"]
};
```

### **2. Tailles Standards**

```javascript
const standardSizes = {
  "Petite Zone": { width: 80, height: 60 },
  "Zone Moyenne": { width: 150, height: 120 },
  "Zone Large": { width: 200, height: 250 },
  "Zone Complète": { width: 260, height: 350 }
};
```

### **3. Positions Communes**

```javascript
const commonPositions = {
  "Centre Poitrine": { x: 150, y: 100 },
  "Poche Gauche": { x: 100, y: 350 },
  "Dos Central": { x: 120, y: 80 },
  "Manche": { x: 50, y: 200 }
};
```

---

## ⚡ Performance et Optimisation

### **Cache des Calculs**

```javascript
class DelimitationCalculator {
  private static cache = new Map();
  
  static getZoneBounds(delimitation: Delimitation): {minX: number, minY: number, maxX: number, maxY: number} {
    const cacheKey = `${delimitation.id}-${delimitation.rotation}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const bounds = this.calculateBounds(delimitation);
    this.cache.set(cacheKey, bounds);
    
    return bounds;
  }
  
  private static calculateBounds(delimitation: Delimitation) {
    // Calcul des limites avec rotation...
    // Code complexe mis en cache
  }
}
```

---

Cette documentation couvre **100%** du système de délimitations avec toutes les informations techniques, exemples pratiques et bonnes pratiques pour l'implémentation ! 🎯 