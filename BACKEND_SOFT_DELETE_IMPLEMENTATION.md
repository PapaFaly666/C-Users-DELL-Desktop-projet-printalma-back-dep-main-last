# Implémentation du Soft Delete des Vendeurs - Backend

## ✅ Implémentation Complète

Ce document décrit l'implémentation du système de suppression soft delete (suppression logique) des vendeurs dans le backend PrintAlma.

---

## 📊 Modifications de la Base de Données

### Colonnes ajoutées au modèle `User` (Prisma Schema)

```prisma
model User {
  // ... autres champs existants ...

  is_deleted    Boolean   @default(false)
  deleted_at    DateTime?
  deleted_by    Int?

  // Relations pour le soft delete
  deletedByUser User?    @relation("DeletedByUser", fields: [deleted_by], references: [id], onDelete: SetNull)
  deletedUsers  User[]   @relation("DeletedByUser")

  // Index pour optimiser les performances
  @@index([is_deleted])
  @@index([deleted_at])
}
```

### Synchronisation avec la base de données

La synchronisation a été effectuée via `npx prisma db push` pour mettre à jour la base de données PostgreSQL sur Neon.

---

## 🔧 Endpoints Implémentés

### 1. **Soft Delete d'un vendeur**

**Route** : `PUT /auth/admin/vendors/:id/soft-delete`
**Authentification** : JWT + AdminGuard
**Description** : Marque un vendeur comme supprimé (soft delete)

**Paramètres** :
- `id` (path parameter) : ID du vendeur à supprimer

**Réponse Success (200)** :
```json
{
  "success": true,
  "message": "Vendeur supprimé avec succès",
  "vendor": {
    "id": 123,
    "email": "vendeur@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "is_deleted": true,
    "deleted_at": "2025-10-02T10:30:00Z",
    "deleted_by": 1,
    "status": false
  }
}
```

**Protections** :
- ✅ Vérification que l'utilisateur est bien un vendeur
- ✅ Impossible de supprimer un vendeur déjà supprimé
- ✅ Impossible de supprimer un SUPERADMIN
- ✅ Le compte est désactivé automatiquement (status=false)

---

### 2. **Restaurer un vendeur supprimé**

**Route** : `PUT /auth/admin/vendors/:id/restore`
**Authentification** : JWT + AdminGuard
**Description** : Restaure un vendeur précédemment supprimé

**Paramètres** :
- `id` (path parameter) : ID du vendeur à restaurer

**Réponse Success (200)** :
```json
{
  "success": true,
  "message": "Vendeur restauré avec succès",
  "vendor": {
    "id": 123,
    "email": "vendeur@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "is_deleted": false,
    "deleted_at": null,
    "deleted_by": null,
    "status": true
  }
}
```

**Comportement** :
- ✅ Réinitialise les champs `is_deleted`, `deleted_at`, `deleted_by`
- ✅ Réactive automatiquement le compte (status=true)

---

### 3. **Liste de la corbeille (vendeurs supprimés)**

**Route** : `GET /auth/admin/vendors/trash`
**Authentification** : JWT + AdminGuard
**Description** : Récupère la liste paginée des vendeurs supprimés

**Query Parameters** :
- `page` (optionnel, défaut: 1) : Numéro de page
- `limit` (optionnel, défaut: 10) : Nombre d'éléments par page
- `search` (optionnel) : Recherche par nom, email, shop_name
- `vendeur_type` (optionnel) : Filtrer par type (DESIGNER, INFLUENCEUR, ARTISTE)

**Réponse Success (200)** :
```json
{
  "vendors": [
    {
      "id": 123,
      "email": "vendeur@example.com",
      "firstName": "Jean",
      "lastName": "Dupont",
      "vendeur_type": "DESIGNER",
      "phone": "+33612345678",
      "country": "France",
      "address": "123 Rue Example",
      "shop_name": "Boutique Jean",
      "profile_photo_url": "https://...",
      "is_deleted": true,
      "deleted_at": "2025-10-02T10:30:00Z",
      "deleted_by": 1,
      "created_at": "2025-01-15T08:00:00Z",
      "deletedByUser": {
        "id": 1,
        "firstName": "Admin",
        "lastName": "Principal",
        "email": "admin@printalma.com"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  },
  "message": "5 vendeur(s) supprimé(s) trouvé(s)"
}
```

**Fonctionnalités** :
- ✅ Pagination complète
- ✅ Filtres par type de vendeur
- ✅ Recherche par nom, email, shop_name
- ✅ Tri par date de suppression (plus récents en premier)
- ✅ Affiche l'admin qui a effectué la suppression

---

## 📝 Modifications des Requêtes Existantes

Toutes les requêtes de listing des vendeurs ont été modifiées pour **exclure automatiquement les vendeurs supprimés** :

### Méthodes modifiées :

1. **`listClients()`** - [auth.service.ts:476](src/auth/auth.service.ts#L476)
   - Ajout du filtre `is_deleted: false`

2. **`listAllVendors()`** - [auth.service.ts:1580](src/auth/auth.service.ts#L1580)
   - Ajout du filtre `is_deleted: false`

3. **`getVendorStatsByCountry()`** - [auth.service.ts:1285](src/auth/auth.service.ts#L1285)
   - Ajout du filtre `is_deleted: false` dans les statistiques

4. **`getExtendedVendorProfile()`** - [auth.service.ts:1121](src/auth/auth.service.ts#L1121)
   - Utilisation de `findFirst` avec `is_deleted: false` au lieu de `findUnique`

---

## 🔒 Sécurité et Permissions

### Règles de sécurité implémentées :

1. **Soft Delete** : Accessible uniquement aux ADMIN et SUPERADMIN
2. **Restauration** : Accessible uniquement aux ADMIN et SUPERADMIN
3. **Corbeille** : Accessible uniquement aux ADMIN et SUPERADMIN
4. **Protection SUPERADMIN** : Impossible de supprimer un compte SUPERADMIN

### Guards utilisés :
- `JwtAuthGuard` : Authentification requise
- `AdminGuard` : Rôle ADMIN ou SUPERADMIN requis

---

## 🧪 Tests Recommandés

### Tests à effectuer :

1. **Test de soft delete** :
   ```bash
   PUT /auth/admin/vendors/123/soft-delete
   # Vérifier que is_deleted=true, status=false, deleted_at et deleted_by sont définis
   ```

2. **Test de restauration** :
   ```bash
   PUT /auth/admin/vendors/123/restore
   # Vérifier que is_deleted=false, status=true, deleted_at et deleted_by sont null
   ```

3. **Test de la corbeille** :
   ```bash
   GET /auth/admin/vendors/trash?page=1&limit=10
   # Vérifier que seuls les vendeurs supprimés sont retournés
   ```

4. **Test d'exclusion automatique** :
   ```bash
   GET /auth/admin/vendors
   # Vérifier que les vendeurs supprimés n'apparaissent pas dans la liste
   ```

5. **Test de protection SUPERADMIN** :
   ```bash
   PUT /auth/admin/vendors/1/soft-delete  # Où 1 est un SUPERADMIN
   # Doit retourner une erreur 400
   ```

---

## 📦 Résumé des Fichiers Modifiés

| Fichier | Modifications |
|---------|---------------|
| [prisma/schema.prisma](prisma/schema.prisma) | Ajout des colonnes `is_deleted`, `deleted_at`, `deleted_by` + relations et index |
| [src/auth/auth.service.ts](src/auth/auth.service.ts) | Ajout des méthodes `softDeleteVendor()`, `restoreVendor()`, `getDeletedVendors()` + modification des requêtes existantes |
| [src/auth/auth.controller.ts](src/auth/auth.controller.ts) | Ajout des routes `/soft-delete`, `/restore`, `/trash` |

---

## 🚀 Prochaines Étapes

### Intégration Frontend :

1. Ajouter un bouton "Supprimer" dans la liste des vendeurs
2. Créer une section "Corbeille" dans le menu admin
3. Ajouter des modales de confirmation pour chaque action
4. Afficher des notifications de succès/erreur

### Exemple d'appel API frontend :

```typescript
// Service Auth (frontend)
async softDeleteVendor(vendorId: number) {
  return this.http.put(`/auth/admin/vendors/${vendorId}/soft-delete`, {});
}

async restoreVendor(vendorId: number) {
  return this.http.put(`/auth/admin/vendors/${vendorId}/restore`, {});
}

async getTrash(page = 1, limit = 10) {
  return this.http.get('/auth/admin/vendors/trash', {
    params: { page, limit }
  });
}
```

---

## 📋 Checklist d'Implémentation

- [x] Créer la migration pour ajouter `is_deleted`, `deleted_at`, `deleted_by`
- [x] Modifier l'entité User pour inclure les nouveaux champs
- [x] Implémenter l'endpoint soft delete
- [x] Implémenter l'endpoint de restauration
- [x] Implémenter l'endpoint de la corbeille
- [x] Modifier toutes les requêtes existantes pour exclure `is_deleted = true`
- [x] Ajouter les guards de sécurité appropriés
- [x] Documenter l'implémentation
- [ ] Créer les tests unitaires et e2e
- [ ] Tester en local
- [ ] Intégrer le frontend
- [ ] Déployer et tester en production

---

## 🎉 Conclusion

L'implémentation du soft delete des vendeurs est **complète côté backend**. Les vendeurs peuvent maintenant être supprimés logiquement, restaurés, et une corbeille permet de gérer les vendeurs supprimés. Toutes les requêtes existantes ont été mises à jour pour exclure automatiquement les vendeurs supprimés.

**Bon développement ! 🚀**
