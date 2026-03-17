# BACKEND - Mise à jour dimensions images de 500px vers 1200px

## Contexte
Actuellement, quand l'admin ajoute un mockup dans `/admin/add-product`, les images sont automatiquement redimensionnées à 500x500px. Nous souhaitons passer cette dimension à **1200x1200px** pour une meilleure qualité d'image.

## Modifications requises côté backend

### 1. **Configuration de redimensionnement d'images**

Identifier et modifier tous les endroits où les images sont redimensionnées à 500px :

```bash
# Rechercher tous les fichiers contenant 500 en relation avec les images
grep -r "500" --include="*.js" --include="*.ts" --include="*.json" .
grep -r "resize.*500" --include="*.js" --include="*.ts" .
grep -r "width.*500\|height.*500" --include="*.js" --include="*.ts" .
```

### 2. **Services de traitement d'images**

Vérifier et modifier dans les services suivants :

#### A) Service d'upload d'images produits
- **Fichier probable :** `services/imageService.js` ou `services/uploadService.js`
- **Modification :** Changer les paramètres de redimensionnement de 500 vers 1200
- **Exemple de code à chercher :**
```javascript
// AVANT
const resizeOptions = {
  width: 500,
  height: 500,
  fit: 'cover'
}

// APRÈS
const resizeOptions = {
  width: 1200,
  height: 1200,
  fit: 'cover'
}
```

#### B) Endpoint d'upload d'images couleurs
- **Endpoint :** `POST /products/upload-color-image/:productId/:colorId`
- **Modification :** Paramètres de redimensionnement Sharp/Jimp/autre
- **Exemple :**
```javascript
// AVANT
.resize(500, 500)

// APRÈS  
.resize(1200, 1200)
```

#### C) Service de traitement Cloudinary (si utilisé)
- **Configuration :** Paramètres de transformation Cloudinary
- **Exemple :**
```javascript
// AVANT
cloudinary.uploader.upload(file, {
  width: 500,
  height: 500,
  crop: 'fill'
})

// APRÈS
cloudinary.uploader.upload(file, {
  width: 1200,
  height: 1200,
  crop: 'fill'
})
```

### 3. **Endpoints à vérifier**

#### A) Création de produits admin
- **Endpoints :**
  - `POST /products` (création produit)
  - `POST /products/:id/colors/:colorId/images` (ajout image couleur)
  - `PATCH /products/:id` (modification produit)

#### B) Validation et métadonnées d'images
- **Propriétés à mettre à jour dans la base de données :**
  - `naturalWidth: 500` → `naturalWidth: 1200`
  - `naturalHeight: 500` → `naturalHeight: 1200`
  - `originalImageWidth: 500` → `originalImageWidth: 1200`
  - `originalImageHeight: 500` → `originalImageHeight: 1200`

### 4. **Configuration et constantes**

Rechercher et modifier les constantes de configuration :

```javascript
// Fichiers à vérifier
config/imageConfig.js
utils/imageUtils.js
constants/imageConstants.js

// Exemples de constantes à modifier
const MAX_IMAGE_WIDTH = 500;  // → 1200
const MAX_IMAGE_HEIGHT = 500; // → 1200
const DEFAULT_IMAGE_SIZE = 500; // → 1200
```

### 5. **Middleware de validation**

Vérifier les middlewares de validation d'images :

```javascript
// AVANT
const imageValidation = {
  maxWidth: 500,
  maxHeight: 500,
  minWidth: 100,
  minHeight: 100
}

// APRÈS
const imageValidation = {
  maxWidth: 1200,
  maxHeight: 1200,
  minWidth: 100,
  minHeight: 100
}
```

### 6. **Base de données - Scripts de migration**

Si nécessaire, créer un script de migration pour mettre à jour les données existantes :

```sql
-- Mettre à jour les dimensions existantes en base
UPDATE product_images 
SET 
  naturalWidth = 1200,
  naturalHeight = 1200,
  originalImageWidth = 1200,
  originalImageHeight = 1200
WHERE 
  naturalWidth = 500 
  AND naturalHeight = 500;

-- Mettre à jour les délimitations si nécessaire
UPDATE delimitations 
SET 
  originalImageWidth = 1200,
  originalImageHeight = 1200
WHERE 
  originalImageWidth = 500 
  AND originalImageHeight = 500;
```

### 7. **Qualité et compression**

Ajuster les paramètres de qualité pour compenser l'augmentation de taille :

```javascript
// Exemple avec Sharp
.jpeg({ 
  quality: 85,  // Réduire légèrement la qualité si nécessaire
  progressive: true 
})
.png({ 
  compressionLevel: 6,
  progressive: true 
})
```

### 8. **Validation côté serveur**

Mettre à jour les validations de taille d'image :

```javascript
// AVANT
if (width > 500 || height > 500) {
  throw new Error('Image trop grande (max 500x500px)')
}

// APRÈS
if (width > 1200 || height > 1200) {
  throw new Error('Image trop grande (max 1200x1200px)')
}
```

## Tests recommandés

1. **Test d'upload d'image :**
   - Upload d'une image via `/admin/add-product`
   - Vérifier que les dimensions finales sont 1200x1200px
   - Vérifier les métadonnées en base de données

2. **Test de performance :**
   - Mesurer l'impact sur le temps d'upload
   - Vérifier l'espace disque/stockage utilisé

3. **Test de compatibilité :**
   - Vérifier que les images existantes fonctionnent toujours
   - Tester la prévisualisation frontend avec les nouvelles dimensions

## Impact attendu

- **✅ Avantages :** Meilleure qualité d'image, rendu plus net
- **⚠️ Inconvénients :** Fichiers plus volumineux, temps d'upload légèrement plus long
- **📊 Taille :** Facteur d'augmentation ~5.76x (1200²/500² = 5.76)

## Commandes utiles pour l'investigation

```bash
# Rechercher les configurations d'images
find . -name "*.js" -o -name "*.ts" | xargs grep -l "500" | grep -v node_modules

# Rechercher les services de redimensionnement
grep -r "resize\|sharp\|jimp\|cloudinary" --include="*.js" --include="*.ts" .

# Vérifier les endpoints d'upload
grep -r "upload.*image\|image.*upload" --include="*.js" --include="*.ts" .
```

## Checklist de validation

- [ ] Modifier les paramètres de redimensionnement (500 → 1200)
- [ ] Mettre à jour les constantes et configurations
- [ ] Ajuster les validations côté serveur
- [ ] Tester l'upload d'une nouvelle image
- [ ] Vérifier les métadonnées en base de données
- [ ] Tester la compatibilité avec le frontend
- [ ] Documenter les changements dans le changelog

---

**Note :** Le frontend a déjà été mis à jour avec les nouvelles dimensions. Cette modification backend est nécessaire pour que les images uploadées aient effectivement les bonnes dimensions.