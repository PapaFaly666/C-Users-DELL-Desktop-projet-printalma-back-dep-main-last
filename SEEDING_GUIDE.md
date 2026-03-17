# Guide de Seeding de la Base de Données Printalma

## 📋 Vue d'ensemble

Ce système de seeding permet de peupler rapidement votre base de données avec des données de test réalistes pour le développement et les tests.

## 🗂️ Structure des Scripts

Le système est organisé en plusieurs modules :

```
prisma/
├── seed.ts                    # Script principal orchestrant tout
├── seed-categories.ts         # Catégories à 3 niveaux
├── seed-users.ts              # Utilisateurs (Admin, Vendeurs, Clients)
├── seed-products.ts           # Produits avec variantes
├── seed-orders.ts             # Commandes avec articles
└── seed-funds-requests.ts     # Demandes d'appel de fonds
```

## 🚀 Utilisation

### Commande rapide
```bash
npm run db:seed
```

ou

```bash
npm run prisma:seed
```

### Exécution directe
```bash
ts-node prisma/seed.ts
```

## 📊 Données générées

### 1. Catégories (Hiérarchie à 3 niveaux)

**Niveau 0 - Catégories principales:**
- Vêtements
- Accessoires
- Maison

**Niveau 1 - Sous-catégories:**
- T-Shirts (sous Vêtements)
- Sweats (sous Vêtements)
- Pantalons (sous Vêtements)
- Sacs (sous Accessoires)
- Casquettes (sous Accessoires)

**Niveau 2 - Variations:**
- Col Rond (sous T-Shirts)
- Col V (sous T-Shirts)
- Manches Longues (sous T-Shirts)
- Hoodie (sous Sweats)
- Zip Hoodie (sous Sweats)

### 2. Utilisateurs

**Super Admin:**
- Email: `superadmin@printalma.com`
- Password: `password123`
- Rôle: SUPERADMIN

**Admins (2):**
- Email: `admin1@printalma.com` / `admin2@printalma.com`
- Password: `password123`
- Rôle: ADMIN

**Vendeurs (20):**
- Emails: `prenom.nom@vendor.com`
- Password: `password123`
- Rôle: VENDEUR
- Types: Designer, Influenceur, Artiste
- Exemples:
  - `ahmed.diop@vendor.com` (Designer)
  - `fatima.sow@vendor.com` (Artiste)
  - `mamadou.fall@vendor.com` (Designer)
  - etc.

**Clients (10):**
- Emails: `prenom.nom@client.com`
- Password: `password123`
- Exemples:
  - `sophie.martin@client.com`
  - `lucas.bernard@client.com`
  - etc.

### 3. Produits (8 produits)

Chaque produit inclut :
- Plusieurs tailles (XS, S, M, L, XL, XXL selon le produit)
- Plusieurs couleurs avec codes hexadécimaux
- Images de placeholder
- Stocks par combinaison couleur/taille
- Catégorisation complète (catégorie, sous-catégorie, variation)

**Liste des produits:**
1. T-Shirt Col Rond Blanc (3 couleurs, 6 tailles)
2. T-Shirt Col V Noir (3 couleurs, 5 tailles)
3. T-Shirt Manches Longues (2 couleurs, 4 tailles)
4. Hoodie Classique (3 couleurs, 5 tailles)
5. Zip Hoodie Premium (2 couleurs, 4 tailles)
6. Jogging Confort (3 couleurs, 4 tailles)
7. Tote Bag Canvas (2 couleurs, taille unique)
8. Casquette Snapback (3 couleurs, taille unique)

### 4. Commandes (100 commandes)

**Statuts distribués:**
- 30% DELIVERED (livrées)
- 20% SHIPPED (expédiées)
- 20% CONFIRMED (confirmées)
- 15% PROCESSING (en traitement)
- 10% PENDING (en attente)
- 5% CANCELLED (annulées)

**Caractéristiques:**
- Dates de création réparties sur les 3 derniers mois
- 1 à 5 articles par commande
- Calcul automatique: sous-total, frais de port, TVA (20%)
- Informations de livraison complètes
- Méthodes de paiement: CARD, PAYPAL, WAVE, ORANGE_MONEY

### 5. Commissions Vendeurs

Chaque vendeur a :
- Une commission entre 30% et 50%
- Un enregistrement VendorCommission
- Un compte VendorEarnings avec:
  - Total des gains
  - Montant disponible
  - Montant en attente
  - Gains du mois
  - Total des commissions payées

### 6. Appels de Fonds (Variables par vendeur)

**Statuts:**
- 30% PAID (payées)
- 20% APPROVED (approuvées)
- 20% PENDING (en attente)
- 30% REJECTED (rejetées)

**Caractéristiques:**
- Montant demandé entre 50% et 100% du solde disponible
- Commission de 10%
- Méthodes de paiement: WAVE, ORANGE_MONEY, BANK_TRANSFER
- Liaison avec les commandes correspondantes
- Notes admin et raisons de rejet

## 🎯 Cas d'usage

### Développement
```bash
# Reset complet + seed
npx prisma migrate reset --force
npm run db:seed
```

### Tests
```bash
# Peupler une base de test
DATABASE_URL="postgresql://..." npm run db:seed
```

### Démo
```bash
# Créer des données de démonstration
npm run db:seed
```

## 🔧 Personnalisation

### Modifier le nombre d'entités

Dans `seed-users.ts`:
```typescript
// Changer le nombre de vendeurs (actuellement 20)
const vendorNames = [
  // Ajouter ou retirer des vendeurs ici
];

// Changer le nombre de clients (actuellement 10)
const clientNames = [
  // Ajouter ou retirer des clients ici
];
```

Dans `seed-orders.ts`:
```typescript
// Changer le nombre de commandes (actuellement 100)
for (let i = 0; i < 100; i++) {
  // ...
}
```

### Modifier les produits

Dans `seed-products.ts`:
```typescript
// Ajouter de nouveaux produits
const newProducts = [
  {
    name: 'Mon Nouveau Produit',
    description: 'Description',
    price: 25.99,
    stock: 100,
    // ...
  }
];
```

### Ajuster les probabilités de statuts

Dans `seed-orders.ts`:
```typescript
// Modifier la distribution des statuts de commandes
if (rand < 0.3) status = 'DELIVERED';      // 30%
else if (rand < 0.5) status = 'SHIPPED';   // 20%
// etc.
```

## 📈 Résumé après exécution

Le script affiche un résumé détaillé :

```
📊 SEEDING SUMMARY:
══════════════════════════════════════════════════
👥 Users Total: 33
   ├─ Super Admins: 1
   ├─ Admins: 2
   └─ Vendors: 20

🏷️  Categories: 3
   ├─ Sub-Categories: 5
   └─ Variations: 5

🛍️  Products: 8
   └─ Color Variations: 20

📦 Orders: 100
   ├─ Pending: 10
   └─ Delivered: 30

💰 Funds Requests: X
   ├─ Pending: X
   └─ Paid: X

💵 Vendor Commissions: 20
📈 Vendor Earnings Tracked: 20
```

## ⚠️ Notes importantes

1. **Mot de passe par défaut:** Tous les utilisateurs ont le mot de passe `password123`
2. **Données de test uniquement:** Ne jamais utiliser en production
3. **Reset la base:** Le seeding n'écrase pas les données existantes, utilisez `migrate reset` pour un reset complet
4. **Performance:** L'exécution peut prendre 1-2 minutes selon votre machine
5. **Images:** Les images produits utilisent des placeholders (placeholder.com)

## 🐛 Dépannage

### Erreur de connexion
```
Error: Can't reach database server
```
**Solution:** Vérifiez votre `DATABASE_URL` dans `.env`

### Erreur de contrainte unique
```
Unique constraint failed on the fields: (`email`)
```
**Solution:** Utilisez `npx prisma migrate reset` pour réinitialiser la base

### Timeout
```
Command timed out after 2m 0s
```
**Solution:** Le script fonctionne toujours, attendez qu'il termine ou augmentez le timeout

### Erreur TypeScript
```
Cannot find module '@prisma/client'
```
**Solution:** Exécutez `npx prisma generate`

## 📝 Commandes utiles

```bash
# Générer le client Prisma
npx prisma generate

# Réinitialiser la base de données
npx prisma migrate reset

# Voir les données dans Prisma Studio
npx prisma studio

# Reset + Seed en une commande
npx prisma migrate reset --force && npm run db:seed

# Vérifier les migrations
npx prisma migrate status
```

## 🎓 Pour aller plus loin

- Modifiez les scripts dans `prisma/seed-*.ts` selon vos besoins
- Ajoutez de nouvelles catégories/produits/utilisateurs
- Créez des scénarios de test spécifiques
- Intégrez le seeding dans vos tests automatisés

## 📞 Support

En cas de problème, vérifiez :
1. La connexion à la base de données
2. Les migrations Prisma sont à jour
3. Les dépendances sont installées (`npm install`)
4. Le fichier `.env` contient `DATABASE_URL`

---

**Date de création:** 2025-10-14
**Version:** 1.0.0
