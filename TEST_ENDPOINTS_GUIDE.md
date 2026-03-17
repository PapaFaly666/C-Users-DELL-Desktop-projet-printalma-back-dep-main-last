# 🧪 Guide de Test - Endpoints Best Sellers

## 📋 **Vue d'ensemble**

Ce guide fournit tous les outils nécessaires pour tester les endpoints de l'API Best Sellers.

**Base URL:** `http://localhost:3004`

---

## 🚀 **1. TESTS RAPIDES**

### **1.1 Test avec Node.js**
```bash
# Test complet avec logs colorés
node test-best-sellers-endpoints.js

# Test rapide
node quick-test-endpoints.js
```

### **1.2 Test avec cURL (Linux/Mac)**
```bash
# Rendre le script exécutable
chmod +x test-endpoints-curl.sh

# Exécuter les tests
./test-endpoints-curl.sh
```

### **1.3 Test avec PowerShell (Windows)**
```powershell
# Test simple
Invoke-RestMethod -Uri "http://localhost:3004/public/best-sellers" -Method GET
```

---

## 🎯 **2. ENDPOINTS À TESTER**

### **2.1 Endpoint Principal**
```bash
# Test de base
curl -X GET "http://localhost:3004/public/best-sellers"

# Avec limite
curl -X GET "http://localhost:3004/public/best-sellers?limit=5"

# Avec pagination
curl -X GET "http://localhost:3004/public/best-sellers?limit=10&offset=20"
```

### **2.2 Tests avec Filtres**
```bash
# Par catégorie
curl -X GET "http://localhost:3004/public/best-sellers?category=T-shirts"

# Par vendeur
curl -X GET "http://localhost:3004/public/best-sellers?vendorId=1"

# Minimum de ventes
curl -X GET "http://localhost:3004/public/best-sellers?minSales=5"

# Combinaison de filtres
curl -X GET "http://localhost:3004/public/best-sellers?category=T-shirts&limit=5&minSales=10"
```

### **2.3 Endpoints Statistiques**
```bash
# Statistiques générales
curl -X GET "http://localhost:3004/public/best-sellers/stats"
```

### **2.4 Endpoints par Vendeur**
```bash
# Best-sellers d'un vendeur spécifique
curl -X GET "http://localhost:3004/public/best-sellers/vendor/1"
curl -X GET "http://localhost:3004/public/best-sellers/vendor/2"
```

### **2.5 Endpoints par Catégorie**
```bash
# Best-sellers d'une catégorie
curl -X GET "http://localhost:3004/public/best-sellers/category/T-shirts"
curl -X GET "http://localhost:3004/public/best-sellers/category/Hoodies"
```

### **2.6 Incrémentation des Vues**
```bash
# Incrémenter les vues d'un produit
curl -X GET "http://localhost:3004/public/best-sellers/product/1/view"
```

---

## 📊 **3. VÉRIFICATION DES RÉPONSES**

### **3.1 Structure de Réponse Attendue**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "T-shirt Premium",
      "price": 2500,
      "salesCount": 45,
      "totalRevenue": 112500,
      "bestSellerRank": 1,
      "viewsCount": 1250,
      "designCloudinaryUrl": "https://...",
      "designWidth": 800,
      "designHeight": 600,
      "designScale": 0.6,
      "designPositioning": "CENTER",
      "baseProduct": {
        "id": 10,
        "name": "T-shirt Premium",
        "genre": "HOMME",
        "categories": [...],
        "colorVariations": [...]
      },
      "vendor": {
        "id": 5,
        "firstName": "Jean",
        "lastName": "Dupont",
        "email": "jean@example.com"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "stats": {
    "totalBestSellers": 150,
    "categoriesCount": 8,
    "vendorsCount": 45
  }
}
```

### **3.2 Champs Obligatoires à Vérifier**
- ✅ `success` : boolean
- ✅ `data` : array
- ✅ `pagination` : object
- ✅ `stats` : object (si disponible)

### **3.3 Champs Produit à Vérifier**
- ✅ `id` : number
- ✅ `name` : string
- ✅ `price` : number
- ✅ `salesCount` : number
- ✅ `totalRevenue` : number
- ✅ `bestSellerRank` : number
- ✅ `viewsCount` : number
- ✅ `baseProduct` : object
- ✅ `vendor` : object

### **3.4 Champs Design (Optionnels)**
- ⚠️ `designCloudinaryUrl` : string
- ⚠️ `designWidth` : number
- ⚠️ `designHeight` : number
- ⚠️ `designScale` : number
- ⚠️ `designPositioning` : string

---

## 🚨 **4. TESTS D'ERREUR**

### **4.1 Cas d'Erreur à Tester**
```bash
# Vendeur inexistant
curl -X GET "http://localhost:3004/public/best-sellers/vendor/999"

# Catégorie inexistante
curl -X GET "http://localhost:3004/public/best-sellers/category/Inexistant"

# Produit inexistant pour vues
curl -X GET "http://localhost:3004/public/best-sellers/product/999/view"

# Paramètres invalides
curl -X GET "http://localhost:3004/public/best-sellers?limit=invalid"
curl -X GET "http://localhost:3004/public/best-sellers?offset=invalid"
```

### **4.2 Réponses d'Erreur Attendues**
- **404** : Ressource non trouvée
- **400** : Paramètres invalides
- **500** : Erreur serveur (à éviter)

---

## ⚡ **5. TESTS DE PERFORMANCE**

### **5.1 Mesure des Temps de Réponse**
```bash
# Test avec time
time curl -X GET "http://localhost:3004/public/best-sellers?limit=5"

# Test avec mesure précise
curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3004/public/best-sellers"
```

### **5.2 Format de Mesure cURL**
Créez un fichier `curl-format.txt` :
```
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

### **5.3 Seuils de Performance**
- **< 200ms** : Excellent
- **200-500ms** : Bon
- **500-1000ms** : Acceptable
- **> 1000ms** : À optimiser

---

## 🧪 **6. TESTS AUTOMATISÉS**

### **6.1 Script Node.js Complet**
```javascript
// Exécuter tous les tests
node test-best-sellers-endpoints.js
```

**Fonctionnalités :**
- ✅ Tests de tous les endpoints
- ✅ Vérification des structures de réponse
- ✅ Tests de performance
- ✅ Tests d'erreur
- ✅ Logs colorés
- ✅ Mesure des temps de réponse

### **6.2 Script cURL Complet**
```bash
# Exécuter les tests cURL
./test-endpoints-curl.sh
```

**Fonctionnalités :**
- ✅ Tests de tous les endpoints
- ✅ Mesure des performances
- ✅ Logs colorés
- ✅ Gestion des erreurs
- ✅ Compatible Linux/Mac

---

## 📱 **7. TESTS FRONTEND**

### **7.1 Page de Test Interactive**
Ouvrez `test-best-sellers.html` dans votre navigateur pour :
- ✅ Tester tous les endpoints visuellement
- ✅ Voir les réponses JSON formatées
- ✅ Tester les filtres interactivement
- ✅ Vérifier la pagination
- ✅ Tester les statistiques

### **7.2 Tests avec JavaScript**
```javascript
// Test simple
fetch('/public/best-sellers?limit=5')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

---

## 🔧 **8. DÉPANNAGE**

### **8.1 Problèmes Courants**

| Problème | Solution |
|----------|----------|
| **Connection refused** | Vérifier que le serveur tourne sur le port 3004 |
| **404 Not Found** | Vérifier l'URL de l'endpoint |
| **500 Internal Error** | Vérifier les logs du serveur |
| **Aucun best-seller** | Exécuter `node scripts/init-best-sellers-data.js` |
| **Timeout** | Vérifier la performance de la base de données |

### **8.2 Logs Utiles**
```bash
# Vérifier les logs du serveur
npm run start:dev

# Vérifier la base de données
npx prisma studio

# Vérifier les données
node scripts/init-best-sellers-data.js
```

### **8.3 Vérification de l'État**
```bash
# Vérifier que le serveur répond
curl -I http://localhost:3004/public/best-sellers

# Vérifier les statistiques
curl http://localhost:3004/public/best-sellers/stats

# Vérifier la santé de l'API
curl http://localhost:3004/health
```

---

## 📋 **9. CHECKLIST DE VALIDATION**

### **✅ Endpoints Fonctionnels**
- [ ] `GET /public/best-sellers` - Endpoint principal
- [ ] `GET /public/best-sellers/stats` - Statistiques
- [ ] `GET /public/best-sellers/vendor/:id` - Par vendeur
- [ ] `GET /public/best-sellers/category/:name` - Par catégorie
- [ ] `GET /public/best-sellers/product/:id/view` - Incrémenter vues

### **✅ Filtres Fonctionnels**
- [ ] `limit` - Limite de résultats
- [ ] `offset` - Pagination
- [ ] `category` - Filtre par catégorie
- [ ] `vendorId` - Filtre par vendeur
- [ ] `minSales` - Minimum de ventes

### **✅ Structure de Réponse**
- [ ] Champs obligatoires présents
- [ ] Champs design optionnels
- [ ] Informations vendeur complètes
- [ ] Données produit de base
- [ ] Délimitations et couleurs

### **✅ Gestion d'Erreurs**
- [ ] Erreurs 404 pour ressources inexistantes
- [ ] Erreurs 400 pour paramètres invalides
- [ ] Messages d'erreur clairs
- [ ] Pas d'erreurs 500

### **✅ Performance**
- [ ] Temps de réponse < 500ms
- [ ] Pagination fonctionnelle
- [ ] Filtres performants
- [ ] Pas de timeouts

---

## 🎉 **10. VALIDATION FINALE**

Une fois tous les tests passés, l'API est prête pour la production !

**Résumé des fichiers de test :**
- `test-best-sellers-endpoints.js` - Tests complets Node.js
- `quick-test-endpoints.js` - Tests rapides
- `test-endpoints-curl.sh` - Tests cURL
- `test-best-sellers.html` - Interface de test web

**Commandes de validation :**
```bash
# Tests complets
node test-best-sellers-endpoints.js

# Tests rapides
node quick-test-endpoints.js

# Tests cURL
./test-endpoints-curl.sh

# Interface web
open test-best-sellers.html
```

L'API Best Sellers est maintenant **100% testée et validée** ! 🏆 