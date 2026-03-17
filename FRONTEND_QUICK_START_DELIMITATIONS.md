# ⚡ Quick Start - Délimitations avec Coordonnées Relatives

## 🎯 L'essentiel à retenir

- **Nouvelles délimitations = Pourcentages (0-100%)**
- **Anciennes délimitations = Pixels absolus (migration en cours)**
- **Base URL :** `http://localhost:3000/api/delimitations`

## 🚀 Endpoints principaux

```javascript
// 1. Récupérer délimitations d'une image
GET /api/delimitations/image/{imageId}

// 2. Créer une délimitation  
POST /api/delimitations
{
  "productImageId": 12,
  "delimitation": {
    "x": 25.5,      // 25.5% depuis la gauche
    "y": 30.0,      // 30% depuis le haut  
    "width": 40.0,  // 40% de largeur
    "height": 25.0, // 25% de hauteur
    "name": "Zone Poitrine"
  }
}

// 3. Modifier une délimitation
PUT /api/delimitations/{id}

// 4. Supprimer
DELETE /api/delimitations/{id}

// 5. Stats migration
GET /api/delimitations/stats
```

## 🎨 Affichage Frontend - Code prêt à copier

```javascript
// Fonction pour afficher une délimitation sur une image
function displayDelimitation(delimitation, imageElement) {
  const { x, y, width, height, rotation, name } = delimitation;
  
  const delimitationDiv = document.createElement('div');
  delimitationDiv.style.position = 'absolute';
  delimitationDiv.style.left = `${x}%`;
  delimitationDiv.style.top = `${y}%`;
  delimitationDiv.style.width = `${width}%`;
  delimitationDiv.style.height = `${height}%`;
  delimitationDiv.style.border = '2px dashed #007bff';
  delimitationDiv.style.backgroundColor = 'rgba(0, 123, 255, 0.1)';
  
  if (rotation) {
    delimitationDiv.style.transform = `rotate(${rotation}deg)`;
  }
  
  if (name) {
    delimitationDiv.title = name;
  }
  
  const container = imageElement.parentElement;
  container.style.position = 'relative';
  container.appendChild(delimitationDiv);
  
  return delimitationDiv;
}

// Charger et afficher toutes les délimitations d'une image
async function loadImageDelimitations(imageId, imageElement, token) {
  try {
    const response = await fetch(`/api/delimitations/image/${imageId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Effacer anciennes délimitations
      document.querySelectorAll('.delimitation-zone').forEach(el => el.remove());
      
      // Afficher nouvelles
      result.data.forEach(delimitation => {
        displayDelimitation(delimitation, imageElement);
      });
    }
  } catch (error) {
    console.error('Erreur chargement délimitations:', error);
  }
}
```

## ✅ Validation rapide

```javascript
function validateDelimitation(delim) {
  const errors = [];
  if (delim.x < 0 || delim.x > 100) errors.push('X invalide (0-100%)');
  if (delim.y < 0 || delim.y > 100) errors.push('Y invalide (0-100%)');
  if (delim.width < 0.1 || delim.width > 100) errors.push('Largeur invalide (0.1-100%)');
  if (delim.height < 0.1 || delim.height > 100) errors.push('Hauteur invalide (0.1-100%)');
  if (delim.x + delim.width > 100) errors.push('Zone dépasse horizontalement');
  if (delim.y + delim.height > 100) errors.push('Zone dépasse verticalement');
  return errors;
}
```

## 🎛️ CSS de base

```css
.image-container {
  position: relative;
  display: inline-block;
}

.image-container img {
  width: 100%;
  height: auto;
  display: block;
}

.delimitation-zone {
  position: absolute;
  border: 2px dashed #007bff;
  background: rgba(0, 123, 255, 0.1);
  cursor: move;
  pointer-events: auto;
}

.delimitation-zone:hover {
  border-color: #0056b3;
  background: rgba(0, 123, 255, 0.2);
}
```

## 🔧 Migration des données existantes

```javascript
// Migrer un produit complet vers les pourcentages
async function migrateProduct(productId, token) {
  const response = await fetch(`/api/delimitations/migrate/product/${productId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const result = await response.json();
  console.log(`Migration: ${result.data.success} succès, ${result.data.errors} erreurs`);
  
  return result;
}

// Vérifier l'état de migration  
async function checkMigrationStatus(token) {
  const response = await fetch('/api/delimitations/stats', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  const stats = await response.json();
  return stats.data.migrationProgress; // Pourcentage migré
}
```

## 🆚 Différences Avant/Après

### **Avant (Coordonnées absolues)**
```javascript
{
  x: 734,        // pixels
  y: 410,        // pixels
  width: 489,    // pixels  
  height: 364    // pixels
}
```

### **Maintenant (Coordonnées relatives)**
```javascript
{
  x: 48.93,      // pourcentage (0-100%)
  y: 51.25,      // pourcentage (0-100%) 
  width: 32.6,   // pourcentage (0-100%)
  height: 45.5,  // pourcentage (0-100%)
  coordinateType: "PERCENTAGE"
}
```

## 📱 Avantages pour le Frontend

1. **✅ Responsive automatique** - Pas de recalculs nécessaires
2. **✅ Indépendant de la taille d'image** - Fonctionne sur tous écrans  
3. **✅ Précision maintenue** - Position relative constante
4. **✅ Calculs simplifiés** - Plus de conversions pixels/taille
5. **✅ Maintenance facile** - Une seule définition pour tous formats

## 🚨 Points d'attention

- **Valider les coordonnées** avant envoi (0-100%)
- **Gérer les erreurs** de l'API proprement  
- **Tester la responsivité** sur différentes tailles
- **Utiliser les pourcentages** pour toutes nouvelles délimitations
- **Migrer progressivement** les anciennes données

## 🔗 Ressources

- **Documentation complète :** `FRONTEND_DELIMITATIONS_COORDONNEES_RELATIVES.md`
- **Serveur de dev :** `http://localhost:3000`
- **Migration automatique :** Disponible via API
- **Support :** Les anciennes délimitations continuent de fonctionner

**🎯 En résumé : Utilisez des pourcentages, validez les coordonnées, et profitez du responsive automatique !** 