# 📊 Guide de Population des Données de Meilleures Ventes

## 📋 Vue d'ensemble

Ce guide explique comment remplir les champs `isBestSeller`, `salesCount` et `totalRevenue` dans la table `VendorProduct` avec des données simulées pour tester les fonctionnalités de meilleures ventes.

## 🛠️ Scripts Disponibles

### 1. **Script JavaScript (Recommandé)**

**Fichier :** `populate-best-seller-data.js`

```bash
node populate-best-seller-data.js
```

**Fonctionnalités :**
- ✅ Récupère tous les produits vendeurs publiés
- ✅ Génère des données de vente simulées réalistes
- ✅ Marque automatiquement les meilleures ventes (top 10%)
- ✅ Crée des produits simulés si aucun n'existe
- ✅ Affiche des statistiques détaillées

### 2. **Script SQL (Alternative)**

**Fichier :** `populate-best-seller-data.sql`

```sql
-- Exécuter dans votre client SQL PostgreSQL
\i populate-best-seller-data.sql
```

**Fonctionnalités :**
- ✅ Mise à jour directe en base de données
- ✅ Calcul automatique des revenus
- ✅ Marquage des meilleures ventes via CTE
- ✅ Requêtes de vérification incluses

### 3. **Script de Test**

**Fichier :** `test-populated-best-seller-data.js`

```bash
node test-populated-best-seller-data.js
```

**Fonctionnalités :**
- ✅ Vérifie la cohérence des données
- ✅ Affiche les statistiques par vendeur
- ✅ Teste le format API
- ✅ Valide les meilleures ventes

## 🚀 Utilisation

### Étape 1 : Préparation

1. **Vérifier la migration :**
   ```bash
   npx prisma generate
   ```

2. **Vérifier la connexion à la base de données :**
   ```bash
   npx prisma db pull
   ```

### Étape 2 : Population des Données

**Option A - Script JavaScript (Recommandé) :**
```bash
node populate-best-seller-data.js
```

**Option B - Script SQL :**
```sql
-- Dans votre client PostgreSQL
\i populate-best-seller-data.sql
```

### Étape 3 : Vérification

```bash
node test-populated-best-seller-data.js
```

## 📊 Logique de Génération des Données

### 1. **Calcul des Ventes Simulées**

```javascript
// Génération réaliste des ventes
const baseSales = Math.floor(Math.random() * 100) + 10; // 10-110 ventes
const popularityMultiplier = Math.random() * 2 + 0.5; // 0.5-2.5
const salesCount = Math.floor(baseSales * popularityMultiplier);
const totalRevenue = salesCount * product.price;
```

### 2. **Marquage des Meilleures Ventes**

```javascript
// Top 10% des produits par revenus (minimum 3)
const topSellerCount = Math.max(3, Math.ceil(totalProducts * 0.1));
const topSellers = productsWithRevenue.slice(0, topSellerCount);
```

### 3. **Critères de Sélection**

- ✅ Produits publiés uniquement (`PUBLISHED`)
- ✅ Produits non supprimés (`isDelete = false`)
- ✅ Revenus > 0 pour être éligible
- ✅ Tri par revenus décroissants

## 📈 Exemples de Données Générées

### Produit avec Meilleures Ventes
```json
{
  "id": 1,
  "name": "T-shirt Design Dragon Rouge",
  "price": 25000,
  "salesCount": 85,
  "totalRevenue": 2125000,
  "isBestSeller": true,
  "vendor": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "shop_name": "Boutique Créative"
  }
}
```

### Statistiques Générées
```
📊 Statistiques de la population :
   - Total produits traités: 15
   - Meilleures ventes marquées: 3
   - Ventes totales simulées: 1,250
   - Revenus totaux simulés: 28,500,000 FCFA

🏆 Top 5 des meilleures ventes :
   1. T-shirt Design Dragon Rouge (Boutique Créative)
      - Ventes: 85 unités
      - Revenus: 2,125,000 FCFA
      - Prix unitaire: 25,000 FCFA
```

## 🔍 Vérification des Données

### 1. **Cohérence des Revenus**
```javascript
// Vérifier que totalRevenue = salesCount * price
const inconsistentProducts = await prisma.vendorProduct.findMany({
  where: {
    NOT: {
      totalRevenue: {
        equals: {
          multiply: ['salesCount', 'price']
        }
      }
    }
  }
});
```

### 2. **Validation des Meilleures Ventes**
```javascript
// Vérifier que les meilleures ventes ont des revenus > 0
const invalidBestSellers = await prisma.vendorProduct.findMany({
  where: {
    isBestSeller: true,
    totalRevenue: { lte: 0 }
  }
});
```

## 🧪 Test des Endpoints API

Après la population, testez les endpoints :

```bash
# Test des meilleures ventes globales
curl "http://localhost:3004/vendor/products/best-sellers?limit=5"

# Test des meilleures ventes d'un vendeur
curl "http://localhost:3004/vendor/products/best-sellers?vendorId=1&limit=3"

# Test des produits avec informations de meilleures ventes
curl "http://localhost:3004/vendor/products?limit=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 Résultat Attendu

Après exécution du script, vous devriez voir :

```
🚀 Démarrage de la population des données de meilleures ventes...

📦 Récupération des produits vendeurs...
✅ 15 produits trouvés

📊 Génération des données de vente simulées...
🏆 3 produits seront marqués comme meilleures ventes

💾 Mise à jour de la base de données...
   ✅ 10/15 produits mis à jour
   ✅ 15/15 produits mis à jour

📈 Statistiques de la population :
   - Total produits traités: 15
   - Meilleures ventes marquées: 3
   - Ventes totales simulées: 1,250
   - Revenus totaux simulés: 28,500,000 FCFA

🏆 Top 5 des meilleures ventes :
   1. T-shirt Design Dragon Rouge (Boutique Créative)
      - Ventes: 85 unités
      - Revenus: 2,125,000 FCFA
      - Prix unitaire: 25,000 FCFA

✅ Population des données de meilleures ventes terminée avec succès !
```

## 🔄 Réinitialisation

Pour réinitialiser les données :

```sql
-- Réinitialiser tous les champs de meilleures ventes
UPDATE "VendorProduct" 
SET 
  "isBestSeller" = false,
  "salesCount" = 0,
  "totalRevenue" = 0
WHERE "isDelete" = false;
```

## ⚠️ Notes Importantes

1. **Données Simulées :** Les données générées sont simulées pour les tests
2. **Production :** En production, utilisez les vraies données de commandes
3. **Performance :** Le script peut prendre du temps avec beaucoup de produits
4. **Sauvegarde :** Faites une sauvegarde avant d'exécuter le script

## 🎯 Prochaines Étapes

1. **Exécuter le script de population**
2. **Vérifier les données avec le script de test**
3. **Tester les endpoints API**
4. **Intégrer les badges "Meilleure Vente" dans le frontend**

---

**Résultat :** Vos produits vendeurs auront maintenant des données de meilleures ventes pour tester toutes les fonctionnalités ! 🏆 

## 📋 Vue d'ensemble

Ce guide explique comment remplir les champs `isBestSeller`, `salesCount` et `totalRevenue` dans la table `VendorProduct` avec des données simulées pour tester les fonctionnalités de meilleures ventes.

## 🛠️ Scripts Disponibles

### 1. **Script JavaScript (Recommandé)**

**Fichier :** `populate-best-seller-data.js`

```bash
node populate-best-seller-data.js
```

**Fonctionnalités :**
- ✅ Récupère tous les produits vendeurs publiés
- ✅ Génère des données de vente simulées réalistes
- ✅ Marque automatiquement les meilleures ventes (top 10%)
- ✅ Crée des produits simulés si aucun n'existe
- ✅ Affiche des statistiques détaillées

### 2. **Script SQL (Alternative)**

**Fichier :** `populate-best-seller-data.sql`

```sql
-- Exécuter dans votre client SQL PostgreSQL
\i populate-best-seller-data.sql
```

**Fonctionnalités :**
- ✅ Mise à jour directe en base de données
- ✅ Calcul automatique des revenus
- ✅ Marquage des meilleures ventes via CTE
- ✅ Requêtes de vérification incluses

### 3. **Script de Test**

**Fichier :** `test-populated-best-seller-data.js`

```bash
node test-populated-best-seller-data.js
```

**Fonctionnalités :**
- ✅ Vérifie la cohérence des données
- ✅ Affiche les statistiques par vendeur
- ✅ Teste le format API
- ✅ Valide les meilleures ventes

## 🚀 Utilisation

### Étape 1 : Préparation

1. **Vérifier la migration :**
   ```bash
   npx prisma generate
   ```

2. **Vérifier la connexion à la base de données :**
   ```bash
   npx prisma db pull
   ```

### Étape 2 : Population des Données

**Option A - Script JavaScript (Recommandé) :**
```bash
node populate-best-seller-data.js
```

**Option B - Script SQL :**
```sql
-- Dans votre client PostgreSQL
\i populate-best-seller-data.sql
```

### Étape 3 : Vérification

```bash
node test-populated-best-seller-data.js
```

## 📊 Logique de Génération des Données

### 1. **Calcul des Ventes Simulées**

```javascript
// Génération réaliste des ventes
const baseSales = Math.floor(Math.random() * 100) + 10; // 10-110 ventes
const popularityMultiplier = Math.random() * 2 + 0.5; // 0.5-2.5
const salesCount = Math.floor(baseSales * popularityMultiplier);
const totalRevenue = salesCount * product.price;
```

### 2. **Marquage des Meilleures Ventes**

```javascript
// Top 10% des produits par revenus (minimum 3)
const topSellerCount = Math.max(3, Math.ceil(totalProducts * 0.1));
const topSellers = productsWithRevenue.slice(0, topSellerCount);
```

### 3. **Critères de Sélection**

- ✅ Produits publiés uniquement (`PUBLISHED`)
- ✅ Produits non supprimés (`isDelete = false`)
- ✅ Revenus > 0 pour être éligible
- ✅ Tri par revenus décroissants

## 📈 Exemples de Données Générées

### Produit avec Meilleures Ventes
```json
{
  "id": 1,
  "name": "T-shirt Design Dragon Rouge",
  "price": 25000,
  "salesCount": 85,
  "totalRevenue": 2125000,
  "isBestSeller": true,
  "vendor": {
    "firstName": "Jean",
    "lastName": "Dupont",
    "shop_name": "Boutique Créative"
  }
}
```

### Statistiques Générées
```
📊 Statistiques de la population :
   - Total produits traités: 15
   - Meilleures ventes marquées: 3
   - Ventes totales simulées: 1,250
   - Revenus totaux simulés: 28,500,000 FCFA

🏆 Top 5 des meilleures ventes :
   1. T-shirt Design Dragon Rouge (Boutique Créative)
      - Ventes: 85 unités
      - Revenus: 2,125,000 FCFA
      - Prix unitaire: 25,000 FCFA
```

## 🔍 Vérification des Données

### 1. **Cohérence des Revenus**
```javascript
// Vérifier que totalRevenue = salesCount * price
const inconsistentProducts = await prisma.vendorProduct.findMany({
  where: {
    NOT: {
      totalRevenue: {
        equals: {
          multiply: ['salesCount', 'price']
        }
      }
    }
  }
});
```

### 2. **Validation des Meilleures Ventes**
```javascript
// Vérifier que les meilleures ventes ont des revenus > 0
const invalidBestSellers = await prisma.vendorProduct.findMany({
  where: {
    isBestSeller: true,
    totalRevenue: { lte: 0 }
  }
});
```

## 🧪 Test des Endpoints API

Après la population, testez les endpoints :

```bash
# Test des meilleures ventes globales
curl "http://localhost:3004/vendor/products/best-sellers?limit=5"

# Test des meilleures ventes d'un vendeur
curl "http://localhost:3004/vendor/products/best-sellers?vendorId=1&limit=3"

# Test des produits avec informations de meilleures ventes
curl "http://localhost:3004/vendor/products?limit=3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📋 Résultat Attendu

Après exécution du script, vous devriez voir :

```
🚀 Démarrage de la population des données de meilleures ventes...

📦 Récupération des produits vendeurs...
✅ 15 produits trouvés

📊 Génération des données de vente simulées...
🏆 3 produits seront marqués comme meilleures ventes

💾 Mise à jour de la base de données...
   ✅ 10/15 produits mis à jour
   ✅ 15/15 produits mis à jour

📈 Statistiques de la population :
   - Total produits traités: 15
   - Meilleures ventes marquées: 3
   - Ventes totales simulées: 1,250
   - Revenus totaux simulés: 28,500,000 FCFA

🏆 Top 5 des meilleures ventes :
   1. T-shirt Design Dragon Rouge (Boutique Créative)
      - Ventes: 85 unités
      - Revenus: 2,125,000 FCFA
      - Prix unitaire: 25,000 FCFA

✅ Population des données de meilleures ventes terminée avec succès !
```

## 🔄 Réinitialisation

Pour réinitialiser les données :

```sql
-- Réinitialiser tous les champs de meilleures ventes
UPDATE "VendorProduct" 
SET 
  "isBestSeller" = false,
  "salesCount" = 0,
  "totalRevenue" = 0
WHERE "isDelete" = false;
```

## ⚠️ Notes Importantes

1. **Données Simulées :** Les données générées sont simulées pour les tests
2. **Production :** En production, utilisez les vraies données de commandes
3. **Performance :** Le script peut prendre du temps avec beaucoup de produits
4. **Sauvegarde :** Faites une sauvegarde avant d'exécuter le script

## 🎯 Prochaines Étapes

1. **Exécuter le script de population**
2. **Vérifier les données avec le script de test**
3. **Tester les endpoints API**
4. **Intégrer les badges "Meilleure Vente" dans le frontend**

---

**Résultat :** Vos produits vendeurs auront maintenant des données de meilleures ventes pour tester toutes les fonctionnalités ! 🏆 