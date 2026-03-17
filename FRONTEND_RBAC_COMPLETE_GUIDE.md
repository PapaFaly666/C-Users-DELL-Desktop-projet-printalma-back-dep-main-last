# 🔐 Guide Frontend - Système RBAC Complet avec Gestion des Rôles

## 📋 Vue d'Ensemble du Système

Le système RBAC (Role-Based Access Control) permet au **SUPERADMIN** de :
1. ✅ Créer des rôles personnalisés
2. ✅ Attribuer des permissions CRUD aux rôles
3. ✅ Créer des utilisateurs avec des rôles spécifiques
4. ✅ Gérer 13 modules différents avec permissions granulaires

---

## 🎯 Modules Disponibles

Le backend dispose de **13 modules** avec permissions CRUD :

| Module | Description | Permissions |
|--------|-------------|-------------|
| `users` | Gestion des utilisateurs | view, create, update, delete, manage-roles, manage-status |
| `roles` | Gestion des rôles et permissions | view, create, update, delete, manage-permissions |
| `products` | Produits et mockups | view, create, update, delete, manage-images, manage-variants |
| `categories` | Catégories de produits | view, create, update, delete, manage-hierarchy |
| `themes` | Thèmes de designs | view, create, update, delete |
| `designs` | Designs vendeurs | view, view-own, create, update, delete, validate, auto-validate |
| `vendors` | Gestion vendeurs | view, create, update, delete, manage-products, validate-products, manage-types |
| `stocks` | Stocks et inventaire | view, update, view-history, manage-alerts |
| `funds` | Demandes de fonds | view, view-own, create, process, view-stats |
| `commissions` | Commissions vendeurs | view, create, update, delete, view-earnings |
| `orders` | Commandes clients | view, view-own, update-status, validate, cancel, view-stats |
| `notifications` | Notifications système | view, create, delete |
| `system` | Configuration système | view-settings, update-settings, view-logs, manage-cloudinary |

---

## 🚀 Étape 1 : Exécuter le Seed

```bash
# Backend
cd c:\Users\HP\Desktop\printalma-perso\printalma-back-dep
npx ts-node prisma/seed-complete-rbac.ts
```

Cela créera :
- ✅ **80+ permissions** organisées par module
- ✅ **6 rôles prédéfinis** :
  - Super Administrateur (toutes permissions)
  - Administrateur (gestion complète sauf système)
  - Gestionnaire Financier (finances + commissions)
  - Gestionnaire Production (produits + stocks)
  - Validateur de Designs (validation designs)
  - Vendeur (gestion limitée)

---

## 📡 API Endpoints Disponibles

### 🔐 Gestion des Rôles

#### 1. Liste des rôles
```http
GET /admin/roles
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Super Administrateur",
      "slug": "superadmin",
      "description": "Accès complet",
      "isSystem": true,
      "permissions": [
        {
          "id": 1,
          "key": "users.view",
          "name": "Voir les utilisateurs",
          "module": "users",
          "description": "Consulter la liste des utilisateurs"
        },
        ...
      ],
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

#### 2. Détails d'un rôle
```http
GET /admin/roles/:id
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Gestionnaire Financier",
    "slug": "finance",
    "description": "Gestion des finances",
    "isSystem": true,
    "permissions": [...],
    "users": [
      {
        "id": 5,
        "firstName": "Marie",
        "lastName": "Dupont",
        "email": "marie@example.com"
      }
    ],
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

#### 3. Créer un rôle personnalisé
```http
POST /admin/roles
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Service Client",
  "slug": "customer-service",
  "description": "Gérer les commandes et notifications",
  "permissionIds": [1, 2, 5, 10, 15, 20]
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Rôle créé avec succès",
  "data": {
    "id": 7,
    "name": "Service Client",
    "slug": "customer-service",
    "description": "Gérer les commandes et notifications",
    "permissions": [...]
  }
}
```

#### 4. Mettre à jour un rôle
```http
PATCH /admin/roles/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Service Client Premium",
  "description": "Version étendue du service client",
  "permissionIds": [1, 2, 5, 10, 15, 20, 25, 30]
}
```

#### 5. Supprimer un rôle
```http
DELETE /admin/roles/:id
Authorization: Bearer {token}
```

**Note** : Ne peut pas supprimer un rôle système ou un rôle utilisé par des utilisateurs.

---

### 🔑 Gestion des Permissions

#### 1. Liste complète des permissions
```http
GET /admin/permissions
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "users.view",
      "name": "Voir les utilisateurs",
      "module": "users",
      "description": "Consulter la liste des utilisateurs"
    },
    ...
  ]
}
```

#### 2. Permissions groupées par module
```http
GET /admin/permissions/by-module
Authorization: Bearer {token}
```

**Réponse** :
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 1,
        "key": "users.view",
        "name": "Voir les utilisateurs",
        "module": "users",
        "description": "..."
      },
      ...
    ],
    "products": [...],
    "orders": [...],
    ...
  }
}
```

---

### 👥 Gestion des Utilisateurs avec Rôles

#### 1. Créer un utilisateur avec un rôle
```http
POST /admin/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Martin",
  "email": "jean.martin@example.com",
  "roleId": 2,  // ID du rôle "Gestionnaire Financier"
  "phone": "+221775551234",
  "country": "Sénégal"
}
```

**Réponse** :
```json
{
  "success": true,
  "message": "Utilisateur créé avec succès",
  "data": {
    "id": 10,
    "firstName": "Jean",
    "lastName": "Martin",
    "email": "jean.martin@example.com",
    "role": "ADMIN",  // Pour la logique backend
    "roleDisplay": "Gestionnaire Financier",  // Pour l'affichage
    "customRole": {
      "id": 2,
      "name": "Gestionnaire Financier",
      "slug": "finance",
      "permissions": [...]
    },
    "activationCode": "ABC123"
  }
}
```

---

## 💻 Intégration Frontend

### 1️⃣ Interfaces TypeScript

```typescript
// src/types/rbac.types.ts

export interface Permission {
  id: number;
  key: string;           // Ex: "users.view", "products.create"
  name: string;          // Ex: "Voir les utilisateurs"
  module: string;        // Ex: "users", "products"
  description?: string;
}

export interface CustomRole {
  id: number;
  name: string;          // Ex: "Gestionnaire Financier"
  slug: string;          // Ex: "finance"
  description?: string;
  isSystem: boolean;     // true si rôle système (non modifiable)
  permissions: Permission[];
  users?: User[];        // Utilisateurs ayant ce rôle
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateRoleDto {
  name: string;
  slug: string;
  description?: string;
  permissionIds: number[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

export interface PermissionsByModule {
  [module: string]: Permission[];
}
```

---

### 2️⃣ Service API

```typescript
// src/services/rbac.service.ts

import api from './api';
import {
  CustomRole,
  Permission,
  PermissionsByModule,
  CreateRoleDto,
  UpdateRoleDto
} from '@/types/rbac.types';

class RBACService {
  // ========== RÔLES ==========

  async getAllRoles(): Promise<CustomRole[]> {
    const response = await api.get('/admin/roles');
    return response.data.data;
  }

  async getRoleById(id: number): Promise<CustomRole> {
    const response = await api.get(`/admin/roles/${id}`);
    return response.data.data;
  }

  async createRole(data: CreateRoleDto): Promise<CustomRole> {
    const response = await api.post('/admin/roles', data);
    return response.data.data;
  }

  async updateRole(id: number, data: UpdateRoleDto): Promise<CustomRole> {
    const response = await api.patch(`/admin/roles/${id}`, data);
    return response.data.data;
  }

  async deleteRole(id: number): Promise<void> {
    await api.delete(`/admin/roles/${id}`);
  }

  // ========== PERMISSIONS ==========

  async getAllPermissions(): Promise<Permission[]> {
    const response = await api.get('/admin/permissions');
    return response.data.data;
  }

  async getPermissionsByModule(): Promise<PermissionsByModule> {
    const response = await api.get('/admin/permissions/by-module');
    return response.data.data;
  }

  async getAvailableRolesForUsers(): Promise<CustomRole[]> {
    const response = await api.get('/admin/roles/available-for-users');
    return response.data.data;
  }
}

export default new RBACService();
```

---

### 3️⃣ Composants Frontend

#### 🎯 Page de Gestion des Rôles

```tsx
// src/pages/admin/RolesManagementPage.tsx

import React, { useState, useEffect } from 'react';
import rbacService from '@/services/rbac.service';
import { CustomRole, PermissionsByModule } from '@/types/rbac.types';

const RolesManagementPage = () => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [permissions, setPermissions] = useState<PermissionsByModule>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rolesData, permissionsData] = await Promise.all([
        rbacService.getAllRoles(),
        rbacService.getPermissionsByModule(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="roles-management">
      <h1>Gestion des Rôles et Permissions</h1>

      {/* Liste des rôles */}
      <RolesList roles={roles} onRefresh={loadData} />

      {/* Bouton créer un rôle */}
      <CreateRoleButton permissions={permissions} onSuccess={loadData} />
    </div>
  );
};
```

#### 📝 Formulaire de Création de Rôle

```tsx
// src/components/roles/CreateRoleForm.tsx

import React, { useState } from 'react';
import rbacService from '@/services/rbac.service';
import { PermissionsByModule } from '@/types/rbac.types';

interface Props {
  permissions: PermissionsByModule;
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateRoleForm = ({ permissions, onSuccess, onCancel }: Props) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    permissionIds: [] as number[],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await rbacService.createRole(formData);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur création rôle');
    }
  };

  const togglePermission = (permId: number) => {
    setFormData(prev => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(permId)
        ? prev.permissionIds.filter(id => id !== permId)
        : [...prev.permissionIds, permId]
    }));
  };

  const selectAllInModule = (moduleName: string) => {
    const modulePerms = permissions[moduleName] || [];
    const allSelected = modulePerms.every(p =>
      formData.permissionIds.includes(p.id)
    );

    if (allSelected) {
      // Tout désélectionner
      setFormData(prev => ({
        ...prev,
        permissionIds: prev.permissionIds.filter(
          id => !modulePerms.some(p => p.id === id)
        )
      }));
    } else {
      // Tout sélectionner
      setFormData(prev => ({
        ...prev,
        permissionIds: [
          ...prev.permissionIds,
          ...modulePerms.filter(p => !prev.permissionIds.includes(p.id)).map(p => p.id)
        ]
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-role-form">
      <h2>Créer un Nouveau Rôle</h2>

      {/* Informations de base */}
      <div className="form-group">
        <label>Nom du rôle *</label>
        <input
          type="text"
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="Ex: Service Client"
          required
        />
      </div>

      <div className="form-group">
        <label>Slug *</label>
        <input
          type="text"
          value={formData.slug}
          onChange={e => setFormData({...formData, slug: e.target.value})}
          placeholder="Ex: customer-service"
          required
        />
        <small>Identifiant unique (minuscules, tirets uniquement)</small>
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={e => setFormData({...formData, description: e.target.value})}
          placeholder="Courte description du rôle"
        />
      </div>

      {/* Sélection des permissions */}
      <div className="permissions-section">
        <h3>Permissions ({formData.permissionIds.length} sélectionnées)</h3>

        {Object.entries(permissions).map(([moduleName, perms]) => (
          <div key={moduleName} className="module-permissions">
            <div className="module-header">
              <h4>{moduleName}</h4>
              <button
                type="button"
                onClick={() => selectAllInModule(moduleName)}
                className="btn-select-all"
              >
                {perms.every(p => formData.permissionIds.includes(p.id))
                  ? 'Tout désélectionner'
                  : 'Tout sélectionner'}
              </button>
            </div>

            <div className="permissions-grid">
              {perms.map(perm => (
                <label key={perm.id} className="permission-checkbox">
                  <input
                    type="checkbox"
                    checked={formData.permissionIds.includes(perm.id)}
                    onChange={() => togglePermission(perm.id)}
                  />
                  <div>
                    <strong>{perm.name}</strong>
                    <small>{perm.description}</small>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button type="button" onClick={onCancel} className="btn-cancel">
          Annuler
        </button>
        <button type="submit" className="btn-submit">
          Créer le Rôle
        </button>
      </div>
    </form>
  );
};

export default CreateRoleForm;
```

#### 📊 Liste des Rôles avec Actions

```tsx
// src/components/roles/RolesList.tsx

import React from 'react';
import { CustomRole } from '@/types/rbac.types';
import rbacService from '@/services/rbac.service';

interface Props {
  roles: CustomRole[];
  onRefresh: () => void;
}

const RolesList = ({ roles, onRefresh }: Props) => {
  const handleDelete = async (role: CustomRole) => {
    if (role.isSystem) {
      alert('Les rôles système ne peuvent pas être supprimés');
      return;
    }

    if (!confirm(`Supprimer le rôle "${role.name}" ?`)) return;

    try {
      await rbacService.deleteRole(role.id);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur suppression');
    }
  };

  return (
    <div className="roles-list">
      {roles.map(role => (
        <div key={role.id} className="role-card">
          <div className="role-header">
            <h3>{role.name}</h3>
            {role.isSystem && <span className="badge-system">Système</span>}
          </div>

          <p className="role-description">{role.description}</p>

          <div className="role-stats">
            <span>{role.permissions.length} permissions</span>
            {role.users && <span>{role.users.length} utilisateurs</span>}
          </div>

          <div className="role-actions">
            <button className="btn-view">Voir détails</button>
            {!role.isSystem && (
              <>
                <button className="btn-edit">Modifier</button>
                <button
                  className="btn-delete"
                  onClick={() => handleDelete(role)}
                >
                  Supprimer
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default RolesList;
```

---

### 4️⃣ Création d'Utilisateur avec Sélection de Rôle

```tsx
// src/components/users/CreateUserForm.tsx

import React, { useState, useEffect } from 'react';
import rbacService from '@/services/rbac.service';
import userService from '@/services/user.service';
import { CustomRole } from '@/types/rbac.types';

const CreateUserForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    roleId: 0,
    phone: '',
    country: '',
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    const data = await rbacService.getAvailableRolesForUsers();
    setRoles(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userService.createUser(formData);
      onSuccess();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur création utilisateur');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Créer un Utilisateur</h2>

      <input
        type="text"
        placeholder="Prénom"
        value={formData.firstName}
        onChange={e => setFormData({...formData, firstName: e.target.value})}
        required
      />

      <input
        type="text"
        placeholder="Nom"
        value={formData.lastName}
        onChange={e => setFormData({...formData, lastName: e.target.value})}
        required
      />

      <input
        type="email"
        placeholder="Email"
        value={formData.email}
        onChange={e => setFormData({...formData, email: e.target.value})}
        required
      />

      {/* Sélection du rôle */}
      <div className="form-group">
        <label>Rôle *</label>
        <select
          value={formData.roleId}
          onChange={e => setFormData({...formData, roleId: parseInt(e.target.value)})}
          required
        >
          <option value={0}>-- Sélectionner un rôle --</option>
          {roles.map(role => (
            <option key={role.id} value={role.id}>
              {role.name} ({role.permissions.length} permissions)
            </option>
          ))}
        </select>

        {/* Aperçu des permissions du rôle sélectionné */}
        {formData.roleId > 0 && (
          <div className="role-preview">
            <h4>Permissions de ce rôle :</h4>
            <ul>
              {roles
                .find(r => r.id === formData.roleId)
                ?.permissions.slice(0, 5)
                .map(p => <li key={p.id}>{p.name}</li>)
              }
              {roles.find(r => r.id === formData.roleId)!.permissions.length > 5 && (
                <li>... et {roles.find(r => r.id === formData.roleId)!.permissions.length - 5} autres</li>
              )}
            </ul>
          </div>
        )}
      </div>

      <input
        type="tel"
        placeholder="Téléphone"
        value={formData.phone}
        onChange={e => setFormData({...formData, phone: e.target.value})}
      />

      <input
        type="text"
        placeholder="Pays"
        value={formData.country}
        onChange={e => setFormData({...formData, country: e.target.value})}
      />

      <button type="submit">Créer l'Utilisateur</button>
    </form>
  );
};
```

---

## 🎨 CSS (Exemple)

```css
/* Styles pour la gestion des rôles */

.roles-management {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.roles-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.role-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.5rem;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.badge-system {
  background: #ff9800;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.role-stats {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  font-size: 0.875rem;
  color: #666;
}

.role-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.role-actions button {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}

.btn-view {
  background: #2196f3;
  color: white;
}

.btn-edit {
  background: #4caf50;
  color: white;
}

.btn-delete {
  background: #f44336;
  color: white;
}

/* Formulaire de création */

.create-role-form {
  max-width: 900px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1);
}

.permissions-section {
  margin-top: 2rem;
}

.module-permissions {
  margin-bottom: 2rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1rem;
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #2196f3;
}

.permissions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 0.75rem;
}

.permission-checkbox {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.permission-checkbox:hover {
  background: #f5f5f5;
}

.permission-checkbox input {
  margin-top: 0.25rem;
}

.permission-checkbox strong {
  display: block;
  font-size: 0.875rem;
}

.permission-checkbox small {
  display: block;
  color: #666;
  font-size: 0.75rem;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.btn-cancel {
  padding: 0.75rem 1.5rem;
  background: #9e9e9e;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-submit {
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
```

---

## 🔒 Sécurité et Bonnes Pratiques

### 1️⃣ Vérification des Permissions (Hook)

```typescript
// src/hooks/useRBACPermission.ts

import { useAuth } from '@/contexts/AuthContext';

export const useRBACPermission = () => {
  const { user } = useAuth();

  /**
   * Vérifie si l'utilisateur a une permission spécifique
   */
  const hasPermission = (permissionKey: string): boolean => {
    if (!user) return false;

    // SUPERADMIN bypass
    if (user.role === 'SUPERADMIN' || user.customRole?.slug === 'superadmin') {
      return true;
    }

    // Vérifier dans les permissions custom
    return user.customRole?.permissions?.some(p => p.slug === permissionKey) || false;
  };

  /**
   * Vérifie si l'utilisateur a AU MOINS UNE des permissions
   */
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(perm => hasPermission(perm));
  };

  /**
   * Vérifie si l'utilisateur a TOUTES les permissions
   */
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(perm => hasPermission(perm));
  };

  /**
   * Vérifie si l'utilisateur peut gérer les rôles
   */
  const canManageRoles = (): boolean => {
    return hasPermission('roles.create') &&
           hasPermission('roles.update') &&
           hasPermission('roles.delete');
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canManageRoles,
  };
};
```

### 2️⃣ Composant de Protection

```tsx
// src/components/PermissionGuard.tsx

import React from 'react';
import { useRBACPermission } from '@/hooks/useRBACPermission';

interface Props {
  permission: string | string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const PermissionGuard = ({
  permission,
  requireAll = false,
  fallback = <div>Accès refusé</div>,
  children
}: Props) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useRBACPermission();

  const hasAccess = Array.isArray(permission)
    ? (requireAll ? hasAllPermissions(permission) : hasAnyPermission(permission))
    : hasPermission(permission);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default PermissionGuard;
```

### 3️⃣ Utilisation dans les Composants

```tsx
import PermissionGuard from '@/components/PermissionGuard';

const Dashboard = () => {
  return (
    <div>
      <h1>Tableau de Bord</h1>

      {/* Afficher uniquement si a la permission */}
      <PermissionGuard permission="users.view">
        <UsersWidget />
      </PermissionGuard>

      {/* Afficher si a AU MOINS une permission */}
      <PermissionGuard permission={['products.view', 'orders.view']}>
        <SalesWidget />
      </PermissionGuard>

      {/* Afficher si a TOUTES les permissions */}
      <PermissionGuard
        permission={['funds.process', 'commissions.view']}
        requireAll
      >
        <FinanceWidget />
      </PermissionGuard>
    </div>
  );
};
```

---

## ✅ Checklist Complète

### Backend
- [x] Seed RBAC complet exécuté
- [x] 80+ permissions créées
- [x] 6 rôles prédéfinis créés
- [x] Endpoints `/admin/roles` fonctionnels
- [x] Endpoints `/admin/permissions` fonctionnels
- [x] Guards de permissions appliqués

### Frontend
- [ ] Interfaces TypeScript créées (`rbac.types.ts`)
- [ ] Service RBAC créé (`rbac.service.ts`)
- [ ] Hook `useRBACPermission` créé
- [ ] Composant `PermissionGuard` créé
- [ ] Page de gestion des rôles créée
- [ ] Formulaire de création de rôle créé
- [ ] Formulaire de création d'utilisateur avec sélection rôle mis à jour
- [ ] Styles CSS appliqués
- [ ] Tests avec différents rôles effectués

---

## 🎯 Workflow Complet

### Scénario : Le SUPERADMIN crée un nouveau rôle "Service Client"

1. **SUPERADMIN se connecte**
   - Reçoit toutes les permissions
   - Peut accéder à `/admin/roles`

2. **SUPERADMIN clique sur "Créer un rôle"**
   - Modal s'ouvre avec le formulaire
   - Liste de toutes les permissions groupées par module

3. **SUPERADMIN configure le rôle**
   ```
   Nom: Service Client
   Slug: customer-service
   Description: Gestion des commandes et support client

   Permissions sélectionnées:
   ✅ orders.view (Voir les commandes)
   ✅ orders.update-status (Modifier le statut)
   ✅ notifications.view (Voir les notifications)
   ✅ notifications.create (Créer des notifications)
   ✅ users.view (Voir les utilisateurs)
   ```

4. **SUPERADMIN clique sur "Créer le Rôle"**
   - Requête POST vers `/admin/roles`
   - Rôle créé avec 5 permissions
   - Liste des rôles se rafraîchit

5. **SUPERADMIN crée un utilisateur avec ce rôle**
   ```
   Prénom: Sophie
   Nom: Leblanc
   Email: sophie@example.com
   Rôle: Service Client
   ```

6. **Sophie Leblanc reçoit un email d'activation**
   - Active son compte
   - Se connecte

7. **Sophie voit uniquement ce qu'elle a le droit de voir**
   - ✅ Dashboard avec widget commandes
   - ✅ Page liste des commandes
   - ✅ Bouton "Changer statut" sur les commandes
   - ✅ Page notifications
   - ❌ Pas d'accès à la gestion produits
   - ❌ Pas d'accès à la gestion stocks
   - ❌ Pas d'accès aux demandes de fonds

---

## 📞 Support et Questions

**Q : Que se passe-t-il si je supprime une permission ?**
R : Les rôles utilisant cette permission la perdent automatiquement (cascade delete)

**Q : Puis-je modifier un rôle système ?**
R : Non, les rôles système (isSystem: true) sont protégés

**Q : Combien de rôles personnalisés puis-je créer ?**
R : Illimité (dans la limite raisonnable de votre DB)

**Q : Comment tester les permissions sans créer d'utilisateur ?**
R : Utilisez le localStorage pour modifier temporairement vos permissions côté frontend

---

🎉 **Vous avez maintenant un système RBAC complet et professionnel !**
