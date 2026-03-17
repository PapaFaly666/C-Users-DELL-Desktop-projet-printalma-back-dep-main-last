# 🎯 Guide Frontend – Positionnement précis des délimitations

> Version : 1.0 – 2025-05-21  
> Auteur : Équipe Backend PrintAlma

---

## 1️⃣ Pour quoi ?

Depuis la mise à niveau du backend (voir `FRONTEND_DELIMITATIONS_UPGRADE_GUIDE.md`), chaque délimitation possède maintenant :

* `referenceWidth`  – Largeur native de l'image lors de la création
* `referenceHeight` – Hauteur native

En utilisant ces valeurs, le front peut **afficher la zone exactement au même endroit** quelle que soit la taille d'affichage.

---

## 2️⃣ Données reçues

Exemple renvoyé par `GET /delimitations/image/:id` :

```jsonc
{
  "x": 665,
  "y": 407,
  "width": 662,
  "height": 790,
  "referenceWidth": 2000,
  "referenceHeight": 1600,
  "coordinateType": "PIXEL"
}
```

---

## 3️⃣ Calcul des coordonnées affichées

### 3.1 Facteurs d'échelle

```ts
const scaleX = displayedImageWidth  / referenceWidth;
const scaleY = displayedImageHeight / referenceHeight;
```

### 3.2 Rectangle absolu (coin supérieur gauche)

```ts
const displayLeft = imageRect.left + x * scaleX;
const displayTop  = imageRect.top  + y * scaleY;
const displayWidth  = width  * scaleX;
const displayHeight = height * scaleY;
```

### 3.3 Version « centrée »

```ts
const centerX = displayLeft + displayWidth / 2;
const centerY = displayTop  + displayHeight / 2;
```

---

## 4️⃣ Utilitaire prêt-à-l'emploi

Un helper TypeScript est fourni dans le repo : `scripts/computeOverlayRect.ts` .

```ts
import { computeOverlayRect, computeOverlayCenter } from '../scripts/computeOverlayRect';

const rect = computeOverlayRect(payload, imageElement.getBoundingClientRect());
// rect: { left, top, width, height }

const center = computeOverlayCenter(payload, imageElement.getBoundingClientRect());
// center: { centerX, centerY, width, height }
```

### Intégration rapide React

```tsx
const Overlay = ({ payload, imgRef }) => {
  const [style, setStyle] = useState({});

  useEffect(() => {
    if (!imgRef.current) return;
    const imgRect = imgRef.current.getBoundingClientRect();
    const rect = computeOverlayRect(payload, imgRect);
    setStyle({
      position: 'absolute',
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      border: '2px dashed red',
    });
  }, [payload, imgRef]);

  return <div style={style} />;
};
```

---

## 5️⃣ Points de vigilance

1. L'élément image doit être dans un conteneur `position: relative` si l'overlay est `absolute`.
2. Vérifiez l'absence de marges, paddings ou bordures qui décaleraient la zone.
3. Si l'image est affichée avec `object-fit: contain`, utilisez les dimensions réelles du `<img>` (pas celles du conteneur).

---

## 6️⃣ TODO Frontend

- [ ] Ajouter le helper ou recoder la logique dans votre lib UI.
- [ ] Mettre à jour le composant `DelimitationPreviewImage`.
- [ ] Tester : différentes tailles d'écran, zoom navigateur, retina, etc.

---

## 7️⃣ Support

Slack : `#frontend-support`  
Email : dev@printalma.io 