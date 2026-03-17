# 📘 Guide Frontend - Système de Permissions (Version Simple)

## 🎯 Objectif

Ce guide vous explique **exactement** comment intégrer le système de permissions dans votre frontend **sans vous tromper**.

## ⚡ Prérequis Backend

### 1. Exécuter le seed des permissions

```bash
npx ts-node prisma/seed-permissions.ts
```

Cela crée :
- ✅ 67 permissions
- ✅ 4 rôles : superadmin, admin, manager, vendor

### 2. Créer un compte superadmin (si besoin)

Utilisez Prisma Studio ou SQL pour attribuer le rôle `superadmin` à votre utilisateur test.

## 📋 Format des données

### Utilisateur connecté (retourné par `/auth/login` et `/auth/me`)

```typescript
{
  "access_token": "eyJhbGci...",
  "user": {
    "id": 1,
    "email": "admin@test.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "SUPERADMIN",  // Pour compatibilité
    "customRole": {  // ⭐ IMPORTANT: C'est ici que sont les permissions
      "id": 1,
      "name": "Super Administrateur",
      "slug": "superadmin",
      "permissions": [
        {
          "id": 1,
          "slug": "users.view",    // ⭐ C'est cette valeur qu'on vérifie
          "name": "Voir les utilisateurs",
          "module": "users"
        },
        {
          "id": 2,
          "slug": "users.create",
          "name": "Créer des utilisateurs",
          "module": "users"
        }
        // ... toutes les autres permissions
      ]
    }
  }
}
```

## 🔧 Intégration Frontend (3 étapes)

### Étape 1 : Mettre à jour votre Context d'authentification

```typescript
// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface Permission {
  id: number;
  slug: string;  // Ex: "users.view"
  name: string;
  module: string;
}

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  customRole: {
    id: number;
    name: string;
    slug: string;
    permissions: Permission[];
  } | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // ⭐ IMPORTANT: Utiliser /auth/me qui retourne les permissions
      const response = await axios.get('http://localhost:3004/auth/me');

      // ⭐ La réponse est directement l'objet user avec customRole
      setUser(response.data);
    } catch (error) {
      console.error('Erreur chargement utilisateur:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await axios.post('http://localhost:3004/auth/login', {
      email,
      password
    });

    const { access_token, user: userData } = response.data;

    localStorage.setItem('token', access_token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;

    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Étape 2 : Créer le hook usePermissions

```typescript
// hooks/usePermissions.ts
import { useAuth } from '@/contexts/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  /**
   * Vérifie si l'utilisateur a UNE permission parmi celles spécifiées
   */
  const hasPermission = (requiredPermission: string | string[]): boolean => {
    // Si pas connecté, pas de permission
    if (!user || !user.customRole) return false;

    // ⭐ SUPERADMIN a toutes les permissions
    if (user.customRole.slug === 'superadmin') return true;

    // Récupérer les slugs des permissions de l'utilisateur
    const userPermissionSlugs = user.customRole.permissions.map(p => p.slug);

    // Si c'est un string, le convertir en array
    const permissions = Array.isArray(requiredPermission)
      ? requiredPermission
      : [requiredPermission];

    // Vérifier si l'utilisateur a AU MOINS UNE des permissions requises
    return permissions.some(perm => userPermissionSlugs.includes(perm));
  };

  /**
   * Vérifie si l'utilisateur est superadmin
   */
  const isSuperAdmin = (): boolean => {
    return user?.customRole?.slug === 'superadmin';
  };

  return {
    hasPermission,
    isSuperAdmin,
    permissions: user?.customRole?.permissions || [],
    role: user?.customRole
  };
}
```

### Étape 3 : Créer le composant PermissionGuard

```typescript
// components/PermissionGuard.tsx
import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface Props {
  permission: string | string[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Composant pour masquer/afficher des éléments selon les permissions
 */
export function PermissionGuard({ permission, fallback = null, children }: Props) {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

## 💡 Exemples d'utilisation

### Exemple 1 : Masquer un bouton

```tsx
import { PermissionGuard } from '@/components/PermissionGuard';

function UserListPage() {
  return (
    <div>
      <h1>Liste des utilisateurs</h1>

      {/* ⭐ Ce bouton n'apparaît QUE si l'utilisateur a la permission users.create */}
      <PermissionGuard permission="users.create">
        <button onClick={handleCreate}>
          Créer un utilisateur
        </button>
      </PermissionGuard>
    </div>
  );
}
```

### Exemple 2 : Afficher un message si pas de permission

```tsx
<PermissionGuard
  permission="users.delete"
  fallback={<p>Vous n'avez pas la permission de supprimer</p>}
>
  <button onClick={handleDelete}>Supprimer</button>
</PermissionGuard>
```

### Exemple 3 : Vérifier plusieurs permissions (OR)

```tsx
{/* L'utilisateur doit avoir AU MOINS UNE de ces permissions */}
<PermissionGuard permission={['users.create', 'users.update']}>
  <button>Gérer les utilisateurs</button>
</PermissionGuard>
```

### Exemple 4 : Utiliser le hook directement dans la logique

```tsx
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { hasPermission, isSuperAdmin } = usePermissions();

  const handleAction = () => {
    if (!hasPermission('products.update')) {
      alert('Vous n\'avez pas la permission');
      return;
    }
    // Faire l'action
  };

  return (
    <div>
      {isSuperAdmin() && <div>Panneau Super Admin</div>}
      <button onClick={handleAction}>Modifier produit</button>
    </div>
  );
}
```

### Exemple 5 : Protéger une page entière

```tsx
// pages/admin/users.tsx
import { PermissionGuard } from '@/components/PermissionGuard';
import { useRouter } from 'next/router';

export default function AdminUsersPage() {
  const router = useRouter();

  return (
    <PermissionGuard
      permission="users.view"
      fallback={
        <div className="p-8 text-center">
          <h2>Accès refusé</h2>
          <p>Vous n'avez pas la permission d'accéder à cette page</p>
          <button onClick={() => router.push('/dashboard')}>
            Retour
          </button>
        </div>
      }
    >
      <div>
        <h1>Gestion des utilisateurs</h1>
        {/* Contenu de la page */}
      </div>
    </PermissionGuard>
  );
}
```

## 🔒 Gérer les erreurs 403

```typescript
// services/axios.ts
import axios from 'axios';

// Intercepteur pour gérer les erreurs 403
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 403) {
      // Afficher un message d'erreur à l'utilisateur
      alert(error.response.data.message || 'Accès refusé');
    }
    return Promise.reject(error);
  }
);
```

## 📊 Liste complète des permissions

### Module: users
- `users.view` - Voir les utilisateurs
- `users.create` - Créer des utilisateurs
- `users.update` - Modifier des utilisateurs
- `users.delete` - Supprimer des utilisateurs
- `users.reset_password` - Réinitialiser les mots de passe
- `users.update_status` - Changer le statut des utilisateurs
- `users.manage_permissions` - Gérer les permissions des utilisateurs

### Module: roles
- `roles.view` - Voir les rôles
- `roles.create` - Créer des rôles
- `roles.update` - Modifier des rôles
- `roles.delete` - Supprimer des rôles
- `permissions.view` - Voir les permissions

### Module: products
- `products.view` - Voir les produits
- `products.create` - Créer des produits
- `products.update` - Modifier des produits
- `products.delete` - Supprimer des produits
- `products.validate` - Valider des produits
- `products.manage_stock` - Gérer les stocks

### Module: categories
- `categories.view` - Voir les catégories
- `categories.create` - Créer des catégories
- `categories.update` - Modifier des catégories
- `categories.delete` - Supprimer des catégories

### Module: designs
- `designs.view` - Voir les designs
- `designs.create` - Créer des designs
- `designs.update` - Modifier des designs
- `designs.delete` - Supprimer des designs
- `designs.validate` - Valider des designs
- `designs.auto_validate` - Validation automatique des designs

### Module: orders
- `orders.view` - Voir les commandes
- `orders.update` - Modifier des commandes
- `orders.validate` - Valider des commandes
- `orders.cancel` - Annuler des commandes

### Module: vendors
- `vendors.view` - Voir les vendeurs
- `vendors.products.view` - Voir les produits des vendeurs
- `vendors.products.validate` - Valider les produits des vendeurs
- `vendors.commissions.view` - Voir les commissions
- `vendors.commissions.update` - Modifier les commissions
- `vendors.funds.view` - Voir les appels de fonds
- `vendors.funds.process` - Traiter les appels de fonds

### Module: themes
- `themes.view` - Voir les thèmes
- `themes.create` - Créer des thèmes
- `themes.update` - Modifier des thèmes
- `themes.delete` - Supprimer des thèmes

### Module: notifications
- `notifications.view` - Voir les notifications
- `notifications.send` - Envoyer des notifications

### Module: vendor_types
- `vendor_types.view` - Voir les types de vendeurs
- `vendor_types.create` - Créer des types de vendeurs
- `vendor_types.update` - Modifier des types de vendeurs
- `vendor_types.delete` - Supprimer des types de vendeurs

## ✅ Checklist d'intégration

- [ ] ✅ Exécuter le seed: `npx ts-node prisma/seed-permissions.ts`
- [ ] ✅ Mettre à jour AuthContext pour charger `customRole` et `permissions`
- [ ] ✅ Créer le hook `usePermissions`
- [ ] ✅ Créer le composant `PermissionGuard`
- [ ] ✅ Ajouter l'intercepteur axios pour gérer les 403
- [ ] ✅ Protéger les pages sensibles
- [ ] ✅ Masquer les boutons selon les permissions
- [ ] ✅ Tester avec un utilisateur superadmin
- [ ] ✅ Tester avec un utilisateur admin
- [ ] ✅ Tester avec un utilisateur sans permissions

## 🚨 Points IMPORTANTS

### 1. Le superadmin bypass TOUT
```typescript
if (user.customRole.slug === 'superadmin') {
  // Accès à TOUT automatiquement
}
```

### 2. Vérifier le slug, pas l'ID
```typescript
// ✅ BON
const userPermissionSlugs = user.customRole.permissions.map(p => p.slug);

// ❌ MAUVAIS
const userPermissionIds = user.customRole.permissions.map(p => p.id);
```

### 3. Les vérifications frontend sont pour l'UX
**La vraie sécurité est côté backend !**
- Frontend : Masquer les boutons
- Backend : Vérifier avec le guard

### 4. Toujours tester les cas d'erreur
```typescript
// Que se passe-t-il si :
- L'utilisateur n'a pas de customRole ?
- L'utilisateur n'a aucune permission ?
- Le token expire pendant l'utilisation ?
```

## 🔍 Debug

### Voir les permissions de l'utilisateur connecté

```typescript
import { useAuth } from '@/contexts/AuthContext';

function DebugPermissions() {
  const { user } = useAuth();

  console.log('Rôle:', user?.customRole?.slug);
  console.log('Permissions:', user?.customRole?.permissions);

  return (
    <div>
      <h3>Debug Permissions</h3>
      <pre>{JSON.stringify(user?.customRole, null, 2)}</pre>
    </div>
  );
}
```

### Tester une permission

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function TestPermission() {
  const { hasPermission } = usePermissions();

  return (
    <div>
      <p>users.view: {hasPermission('users.view') ? '✅' : '❌'}</p>
      <p>users.create: {hasPermission('users.create') ? '✅' : '❌'}</p>
      <p>users.delete: {hasPermission('users.delete') ? '✅' : '❌'}</p>
    </div>
  );
}
```

## 📞 FAQ

**Q: L'utilisateur a le statut 403 sur tous les endpoints**
- R: Vérifier que l'utilisateur a bien un `customRole` assigné
- R: Exécuter le seed des permissions
- R: Vérifier que le rôle a bien des permissions

**Q: Le superadmin ne peut rien faire**
- R: Vérifier que `user.customRole.slug === 'superadmin'`
- R: Le guard vérifie le slug, pas le nom

**Q: Comment attribuer un rôle à un utilisateur ?**
- R: Depuis la table `users`, mettre `roleId = 1` (ID du rôle superadmin)
- R: Ou utiliser l'endpoint `POST /admin/users` en spécifiant le `roleId`

**Q: Comment attribuer des permissions personnalisées ?**
- R: Utiliser `POST /admin/users/:id/permissions` avec la liste des `permissionIds`

## 🎯 Résumé en 3 points

1. **Backend déjà prêt** - Le guard vérifie automatiquement les permissions
2. **Frontend simple** - Context + Hook + Composant PermissionGuard
3. **Superadmin = Dieu** - Il bypass toutes les vérifications de permissions

C'est tout ! Vous avez maintenant un système de permissions complet et professionnel. 🎉
