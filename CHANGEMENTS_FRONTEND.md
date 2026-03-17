# 🔄 Changements Requis pour le Frontend

## 📝 Résumé

Le backend retourne maintenant un nouveau champ `roleDisplay` pour afficher le vrai nom du rôle.

---

## ✅ Ce que le backend retourne maintenant

### Réponse du login

```json
{
  "access_token": "...",
  "user": {
    "id": 3,
    "email": "lazou@gmail.com",
    "firstName": "Lamine",
    "lastName": "Mbodji",
    "role": "SUPERADMIN",  // ⚙️ Pour la logique backend (enum)
    "roleDisplay": "Super Administrateur",  // 🆕 Pour l'affichage frontend
    "customRole": {  // 🆕 Objet rôle complet avec permissions
      "id": 1,
      "name": "Super Administrateur",
      "slug": "superadmin",
      "description": "Accès complet",
      "permissions": [
        {
          "id": 1,
          "slug": "users.view",
          "name": "Voir les utilisateurs",
          "module": "users",
          "description": "..."
        },
        ...
      ]
    },
    "vendeur_type": null,
    "status": true,
    ...
  }
}
```

---

## 🔧 Modifications Minimales Requises

### 1. Ajouter `roleDisplay` dans l'interface User

```typescript
// src/types/auth.types.ts (ou équivalent)

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;                    // ⚙️ ADMIN, VENDEUR, SUPERADMIN
  roleDisplay?: string;            // 🆕 Nom affiché
  customRole?: CustomRole | null;  // 🆕 Objet rôle RBAC
  vendeur_type?: string | null;
  status: boolean;
  // ... autres champs
}

export interface CustomRole {
  id: number;
  name: string;
  slug: string;
  description?: string;
  permissions: Permission[];
}

export interface Permission {
  id: number;
  slug: string;   // Ex: "users.view"
  name: string;   // Ex: "Voir les utilisateurs"
  module: string; // Ex: "users"
  description?: string;
}
```

---

### 2. Capturer `roleDisplay` dans le service auth

```typescript
// src/services/auth.service.ts

// Lors du traitement de la réponse login
const user = {
  ...data.user,
  roleDisplay: data.user.roleDisplay,  // 🆕 Capturer le champ
  customRole: data.user.customRole,    // 🆕 Capturer l'objet complet
};
```

---

### 3. Afficher le bon rôle dans l'interface

**Avant** ❌ :
```tsx
<div>{user.role}</div>
// Affichait toujours "ADMIN" pour les rôles custom
```

**Après** ✅ :
```tsx
<div>
  {user.roleDisplay || user.customRole?.name || user.role}
</div>
// Affiche le vrai nom du rôle
```

---

## 🎯 Résultats

| Utilisateur | `role` | `roleDisplay` | Affichage |
|-------------|--------|---------------|-----------|
| Super Admin | `SUPERADMIN` | `Super Administrateur` | Super Administrateur |
| Finances | `ADMIN` | `Gestionnaire Financier` | Gestionnaire Financier ✅ |
| Production | `ADMIN` | `Gestionnaire Production` | Gestionnaire Production ✅ |
| Service Client (custom) | `ADMIN` | `Service Client` | Service Client ✅ |
| Admin classique | `ADMIN` | `ADMIN` ou `null` | ADMIN |

---

## 📱 Composants à Mettre à Jour

### Profil Utilisateur
```tsx
const UserProfile = () => {
  const { user } = useAuth();

  return (
    <div>
      <h2>{user.firstName} {user.lastName}</h2>
      <p>Rôle: {user.roleDisplay || user.customRole?.name || user.role}</p>

      {/* Afficher les permissions si customRole existe */}
      {user.customRole && (
        <div>
          <h3>Permissions ({user.customRole.permissions.length})</h3>
          <ul>
            {user.customRole.permissions.slice(0, 5).map(p => (
              <li key={p.id}>{p.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

### Badge de Rôle
```tsx
const RoleBadge = ({ user }) => {
  const displayRole = user.roleDisplay || user.customRole?.name || user.role;

  return (
    <span className="badge">
      {displayRole}
    </span>
  );
};
```

### Header/Sidebar
```tsx
const Header = () => {
  const { user } = useAuth();

  return (
    <header>
      <div className="user-info">
        <span>{user.firstName} {user.lastName}</span>
        <span className="role">
          {user.roleDisplay || user.role}
        </span>
      </div>
    </header>
  );
};
```

---

## 🔐 Vérification des Permissions

### Hook usePermissions (mettre à jour)

```typescript
// src/hooks/usePermissions.ts

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // SUPERADMIN bypass (ancien + nouveau système)
    if (user.role === 'SUPERADMIN' || user.customRole?.slug === 'superadmin') {
      return true;
    }

    // Vérifier dans les permissions du customRole
    if (user.customRole?.permissions) {
      return user.customRole.permissions.some(p => p.slug === permission);
    }

    // Ancien système (ADMIN, VENDEUR)
    if (user.role === 'ADMIN') {
      // Les anciens ADMIN gardent tous les accès pour compatibilité
      return true;
    }

    return false;
  };

  return { hasPermission };
};
```

### Utilisation
```tsx
import { usePermissions } from '@/hooks/usePermissions';

const Dashboard = () => {
  const { hasPermission } = usePermissions();

  return (
    <div>
      {/* Afficher seulement si a la permission */}
      {hasPermission('users.view') && (
        <UsersWidget />
      )}

      {hasPermission('products.view') && (
        <ProductsWidget />
      )}

      {hasPermission('orders.view') && (
        <OrdersWidget />
      )}
    </div>
  );
};
```

---

## 🧪 Test Rapide

### Dans la console du navigateur

```javascript
// 1. Récupérer l'utilisateur du localStorage
const session = JSON.parse(localStorage.getItem('auth_session'));
console.log('User:', session.user);

// 2. Vérifier les nouveaux champs
console.log('Role:', session.user.role);
console.log('RoleDisplay:', session.user.roleDisplay);
console.log('CustomRole:', session.user.customRole);

// 3. Vérifier les permissions
if (session.user.customRole) {
  console.log('Permissions:', session.user.customRole.permissions.map(p => p.slug));
}

// 4. Test d'affichage
const displayRole = session.user.roleDisplay || session.user.customRole?.name || session.user.role;
console.log('Rôle affiché:', displayRole);
```

---

## ⚠️ Points d'Attention

### 1. Compatibilité Ascendante

Les anciens utilisateurs sans `customRole` continuent de fonctionner :
```typescript
{
  role: "ADMIN",
  roleDisplay: "ADMIN",  // ou null
  customRole: null
}
```

### 2. Hiérarchie d'Affichage

Utiliser toujours cette cascade :
```typescript
user.roleDisplay || user.customRole?.name || user.role || 'Utilisateur'
```

### 3. Permissions Check

Pour les nouveaux utilisateurs RBAC, toujours vérifier `customRole.permissions`.

---

## 📋 Checklist Frontend

- [ ] Ajouter `roleDisplay?: string` dans interface `User`
- [ ] Ajouter interface `CustomRole`
- [ ] Ajouter interface `Permission`
- [ ] Mettre à jour service auth pour capturer `roleDisplay` et `customRole`
- [ ] Remplacer tous les `{user.role}` par `{user.roleDisplay || user.customRole?.name || user.role}`
- [ ] Mettre à jour hook `usePermissions` pour vérifier `customRole.permissions`
- [ ] Tester avec différents types d'utilisateurs :
  - [ ] SUPERADMIN
  - [ ] Ancien ADMIN (sans customRole)
  - [ ] Nouveau ADMIN (avec customRole)
  - [ ] Rôle custom (ex: Finances, Production)
- [ ] Vérifier que le localStorage contient les nouvelles données
- [ ] Vérifier que l'affichage est correct partout

---

## 🎉 Résultat Final

Après ces modifications :
- ✅ Chaque utilisateur voit son vrai nom de rôle
- ✅ Les permissions sont vérifiées correctement
- ✅ Le système est rétro-compatible
- ✅ Le SUPERADMIN peut gérer les rôles

**Le frontend affichera maintenant "Gestionnaire Financier" au lieu de "ADMIN" !** 🚀
