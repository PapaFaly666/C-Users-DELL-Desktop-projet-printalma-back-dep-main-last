# Documentation API Frontend - PrintAlma (Authentification par Cookies) 🍪

## 📋 Vue d'ensemble

Cette documentation est destinée à l'équipe **frontend** pour intégrer l'API PrintAlma avec un système d'authentification par **cookies httpOnly sécurisés**. Fini les problèmes de localStorage !

**Base URL**: `http://localhost:3000`

---

## 🍪 Authentification par Cookies

### ✅ Avantages de cette approche
- **Sécurité renforcée** : Cookies httpOnly inaccessibles au JavaScript
- **Simplicité** : Plus de gestion manuelle de tokens
- **Automatique** : Les cookies sont envoyés automatiquement avec chaque requête
- **UX améliorée** : Reconnexion automatique après fermeture du navigateur

### ⚙️ Configuration requise
Toutes vos requêtes fetch doivent inclure `credentials: 'include'` :

```typescript
fetch('/api/endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // ⭐ OBLIGATOIRE
  body: JSON.stringify(data)
});
```

---

## 🎨 Types de Vendeurs

### Enum VendeurType
```typescript
enum VendeurType {
  DESIGNER = 'DESIGNER',
  INFLUENCEUR = 'INFLUENCEUR', 
  ARTISTE = 'ARTISTE'
}
```

### Caractéristiques par type

| Type | Icône | Description | Fonctionnalités spécialisées |
|------|-------|-------------|-------------------------------|
| **DESIGNER** | 🎨 | Création de designs graphiques et visuels | Outils de design, templates, galerie |
| **INFLUENCEUR** | 📱 | Promotion via réseaux sociaux et influence | Analytics, codes promo, marketing |
| **ARTISTE** | 🎭 | Création artistique et œuvres originales | Portfolio, galerie d'œuvres, ventes d'art |

---

## 🔐 Authentification

### 1. Connexion utilisateur

**Endpoint**: `POST /auth/login`

```typescript
// Interface de la requête
interface LoginRequest {
  email: string;
  password: string;
}

// Interface de la réponse (succès normal)
interface LoginSuccessResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'VENDEUR';
    vendeur_type: VendeurType | null;
    status: boolean;
  };
}

// Interface de la réponse (changement de mot de passe requis)
interface LoginPasswordChangeRequiredResponse {
  mustChangePassword: true;
  userId: number;
  message: string;
}
```

**Exemple de requête**:
```javascript
const loginResponse = await fetch('/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // ⭐ Les cookies sont définis automatiquement
  body: JSON.stringify({
    email: 'jean.dupont@example.com',
    password: 'motDePasse123'
  })
});

const data = await loginResponse.json();

if (data.mustChangePassword) {
  // Rediriger vers la page de changement de mot de passe
  redirectToPasswordChange(data.userId);
} else {
  // Connexion réussie - les cookies sont automatiquement définis !
  // Plus besoin de stocker quoi que ce soit manuellement
  console.log('Utilisateur connecté:', data.user);
  window.location.href = '/dashboard';
}
```

### 2. Déconnexion

**Endpoint**: `POST /auth/logout`

```typescript
interface LogoutResponse {
  message: string;
}
```

**Exemple d'implémentation**:
```javascript
const logout = async () => {
  const response = await fetch('/auth/logout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // ⭐ Les cookies sont supprimés automatiquement
  });
  
  if (response.ok) {
    // Déconnexion réussie - cookies supprimés automatiquement
    window.location.href = '/login';
  }
};
```

### 3. Vérification d'authentification

**Endpoint**: `GET /auth/check`

```typescript
interface AuthCheckResponse {
  isAuthenticated: boolean;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'VENDEUR';
    vendeur_type: VendeurType | null;
  };
}
```

**Utilisation** (au chargement de l'app) :
```javascript
const checkAuth = async () => {
  const response = await fetch('/auth/check', {
    method: 'GET',
    credentials: 'include' // ⭐ Vérifie automatiquement les cookies
  });
  
  if (response.ok) {
    const authData = await response.json();
    if (authData.isAuthenticated) {
      setUser(authData.user);
    }
  }
};
```

### 4. Changement de mot de passe

**Endpoint**: `PUT /auth/change-password`

```typescript
interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ChangePasswordResponse {
  message: string;
}
```

**Exemple d'implémentation**:
```javascript
const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  const response = await fetch('/auth/change-password', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ⭐ Authentification automatique
    body: JSON.stringify({
      currentPassword,
      newPassword,
      confirmPassword
    })
  });
  
  if (response.ok) {
    // Mot de passe changé avec succès
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.message);
  }
};
```

### 5. Profil utilisateur

**Endpoint**: `GET /auth/profile`

```typescript
interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'VENDEUR';
  vendeur_type: VendeurType | null;
  status: boolean;
  must_change_password: boolean;
  last_login_at: string;
  created_at: string;
  updated_at: string;
}
```

---

## 👥 Gestion des Clients (Admin uniquement)

### 1. Créer un client avec type de vendeur

**Endpoint**: `POST /auth/admin/create-client`  
**Permissions**: Admins uniquement (`ADMIN` ou `SUPERADMIN`)

```typescript
interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType; // OBLIGATOIRE
}

interface CreateClientResponse {
  message: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: 'VENDEUR';
    vendeur_type: VendeurType;
    status: boolean;
    created_at: string;
  };
}
```

**Exemple d'implémentation**:
```javascript
const createClient = async (clientData) => {
  const response = await fetch('/auth/admin/create-client', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // ⭐ Authentification admin automatique
    body: JSON.stringify({
      firstName: clientData.firstName,
      lastName: clientData.lastName,
      email: clientData.email,
      vendeur_type: clientData.vendeurType // 'DESIGNER', 'INFLUENCEUR', ou 'ARTISTE'
    })
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.message);
  }
};
```

### 2. Lister les clients avec pagination et filtres

**Endpoint**: `GET /auth/admin/clients`  
**Permissions**: Admins uniquement (`ADMIN` ou `SUPERADMIN`)

```typescript
interface ListClientsQuery {
  page?: number;        // Page courante (défaut: 1)
  limit?: number;       // Nombre d'éléments par page (défaut: 10, max: 100)
  status?: boolean;     // Filtrer par statut (true=actif, false=inactif)
  vendeur_type?: VendeurType; // Filtrer par type de vendeur
  search?: string;      // Recherche par nom ou email
}

interface ClientInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'VENDEUR';
  vendeur_type: VendeurType;
  status: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until: string | null;
}

interface ListClientsResponse {
  clients: ClientInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: {
    status?: boolean;
    vendeur_type?: VendeurType;
    search?: string;
  };
}
```

**Exemple d'implémentation**:
```javascript
const listClients = async (filters = {}) => {
  // Construire les paramètres de requête
  const params = new URLSearchParams();
  
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.status !== undefined) params.append('status', filters.status.toString());
  if (filters.vendeur_type) params.append('vendeur_type', filters.vendeur_type);
  if (filters.search) params.append('search', filters.search);
  
  const response = await fetch(`/auth/admin/clients?${params}`, {
    method: 'GET',
    credentials: 'include' // ⭐ Authentification admin automatique
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.message);
  }
};

// Exemples d'utilisation
const allClients = await listClients(); // Tous les clients (page 1, 10 par page)
const activeClients = await listClients({ status: true }); // Clients actifs uniquement
const designers = await listClients({ vendeur_type: 'DESIGNER' }); // Designers uniquement
const searchResults = await listClients({ search: 'jean' }); // Recherche "jean"
const page2 = await listClients({ page: 2, limit: 20 }); // Page 2, 20 par page
```

### 3. Activer/Désactiver un client

**Endpoint**: `PUT /auth/admin/clients/:id/toggle-status`  
**Permissions**: Admins uniquement (`ADMIN` ou `SUPERADMIN`)

```typescript
interface ToggleClientStatusResponse {
  message: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: boolean;
    updated_at: string;
  };
}
```

**Exemple d'implémentation**:
```javascript
const toggleClientStatus = async (clientId) => {
  const response = await fetch(`/auth/admin/clients/${clientId}/toggle-status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include' // ⭐ Authentification admin automatique
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    const error = await response.json();
    throw new Error(error.message);
  }
};

// Utilisation
const result = await toggleClientStatus(123);
console.log(result.message); // "Client activé avec succès" ou "Client désactivé avec succès"
```

---

## 📊 Composants Frontend pour la Gestion des Clients

### 1. Service API pour la gestion des clients

```typescript
// services/clientService.ts
class ClientService {
  private baseUrl = '/auth/admin';

  async listClients(filters: ListClientsQuery = {}): Promise<ListClientsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/clients?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async toggleClientStatus(clientId: number): Promise<ToggleClientStatusResponse> {
    const response = await fetch(`${this.baseUrl}/clients/${clientId}/toggle-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }

  async createClient(clientData: CreateClientRequest): Promise<CreateClientResponse> {
    const response = await fetch(`${this.baseUrl}/create-client`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(clientData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    return response.json();
  }
}

export const clientService = new ClientService();
```

### 2. Hook React pour la gestion des clients

```typescript
// hooks/useClients.ts
import { useState, useEffect } from 'react';
import { clientService } from '../services/clientService';
import { ListClientsQuery, ListClientsResponse, ClientInfo } from '../types/frontend-types';

export const useClients = (initialFilters: ListClientsQuery = {}) => {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ListClientsQuery>(initialFilters);

  const loadClients = async (newFilters?: ListClientsQuery) => {
    setLoading(true);
    setError(null);
    
    try {
      const filtersToUse = newFilters || filters;
      const response = await clientService.listClients(filtersToUse);
      
      setClients(response.clients);
      setPagination(response.pagination);
      setFilters(filtersToUse);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleClientStatus = async (clientId: number) => {
    try {
      await clientService.toggleClientStatus(clientId);
      // Recharger la liste après modification
      await loadClients();
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const updateFilters = (newFilters: Partial<ListClientsQuery>) => {
    const updatedFilters = { ...filters, ...newFilters, page: 1 }; // Reset à la page 1
    loadClients(updatedFilters);
  };

  const goToPage = (page: number) => {
    loadClients({ ...filters, page });
  };

  useEffect(() => {
    loadClients();
  }, []);

  return {
    clients,
    pagination,
    loading,
    error,
    filters,
    loadClients,
    toggleClientStatus,
    updateFilters,
    goToPage
  };
};
```

### 3. Composant de liste des clients

```typescript
// components/ClientsList.tsx
import React from 'react';
import { useClients } from '../hooks/useClients';
import { getSellerTypeIcon, getSellerTypeLabel, formatLastLoginDate } from '../types/frontend-types';

export const ClientsList: React.FC = () => {
  const {
    clients,
    pagination,
    loading,
    error,
    filters,
    toggleClientStatus,
    updateFilters,
    goToPage
  } = useClients();

  const handleStatusToggle = async (clientId: number, currentStatus: boolean) => {
    const action = currentStatus ? 'désactiver' : 'activer';
    if (window.confirm(`Êtes-vous sûr de vouloir ${action} ce client ?`)) {
      await toggleClientStatus(clientId);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="clients-list">
      <h2>Gestion des Clients</h2>
      
      {/* Filtres */}
      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={filters.search || ''}
          onChange={(e) => updateFilters({ search: e.target.value })}
        />
        
        <select
          value={filters.status === undefined ? 'all' : filters.status.toString()}
          onChange={(e) => {
            const value = e.target.value;
            updateFilters({ 
              status: value === 'all' ? undefined : value === 'true' 
            });
          }}
        >
          <option value="all">Tous les statuts</option>
          <option value="true">Actifs</option>
          <option value="false">Inactifs</option>
        </select>
        
        <select
          value={filters.vendeur_type || 'all'}
          onChange={(e) => {
            const value = e.target.value;
            updateFilters({ 
              vendeur_type: value === 'all' ? undefined : value as VendeurType 
            });
          }}
        >
          <option value="all">Tous les types</option>
          <option value="DESIGNER">🎨 Designer</option>
          <option value="INFLUENCEUR">📱 Influenceur</option>
          <option value="ARTISTE">🎭 Artiste</option>
        </select>
      </div>

      {/* Liste des clients */}
      <div className="clients-table">
        <table>
          <thead>
            <tr>
              <th>Client</th>
              <th>Type</th>
              <th>Email</th>
              <th>Statut</th>
              <th>Dernière connexion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(client => (
              <tr key={client.id}>
                <td>
                  <div>
                    <strong>{client.firstName} {client.lastName}</strong>
                    {client.must_change_password && (
                      <span className="badge warning">Doit changer son mot de passe</span>
                    )}
                    {client.locked_until && new Date(client.locked_until) > new Date() && (
                      <span className="badge danger">Compte verrouillé</span>
                    )}
                  </div>
                </td>
                <td>
                  <span className="type-badge">
                    {getSellerTypeIcon(client.vendeur_type)} {getSellerTypeLabel(client.vendeur_type)}
                  </span>
                </td>
                <td>{client.email}</td>
                <td>
                  <span className={`status-badge ${client.status ? 'active' : 'inactive'}`}>
                    {client.status ? '✅ Actif' : '❌ Inactif'}
                  </span>
                </td>
                <td>{formatLastLoginDate(client.last_login_at)}</td>
                <td>
                  <button
                    onClick={() => handleStatusToggle(client.id, client.status)}
                    className={`btn ${client.status ? 'btn-danger' : 'btn-success'}`}
                  >
                    {client.status ? 'Désactiver' : 'Activer'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="pagination">
          <button
            disabled={!pagination.hasPrevious}
            onClick={() => goToPage(pagination.page - 1)}
          >
            Précédent
          </button>
          
          <span>
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} clients)
          </span>
          
          <button
            disabled={!pagination.hasNext}
            onClick={() => goToPage(pagination.page + 1)}
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
};
```

---

## 🔄 Flux d'Authentification Frontend (Simplifié !)

### Diagramme de flux

```
1. Page de connexion
   ↓
2. POST /auth/login (cookies définis automatiquement)
   ↓
3a. Si mustChangePassword: true
   → Page changement mot de passe → PUT /auth/change-password
   ↓
3b. Si connexion normale
   → Redirection dashboard (authentification automatique)
   ↓
4. Toutes les requêtes incluent automatiquement les cookies
   ↓
5. Au chargement de l'app : GET /auth/check
   ↓
6. Déconnexion : POST /auth/logout (cookies supprimés automatiquement)
```

### État de l'utilisateur (State Management Simplifié)

```typescript
// État initial (plus de token à gérer !)
interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  mustChangePassword: boolean;
  loading: boolean;
  error: string | null;
}

// Service d'authentification simplifié
class AuthService {
  async login(credentials) {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ⭐ Gestion automatique des cookies
      body: JSON.stringify(credentials)
    });
    
    return response.json();
  }
  
  async checkAuth() {
    const response = await fetch('/auth/check', {
      credentials: 'include' // ⭐ Vérification automatique
    });
    
    return response.ok ? response.json() : { isAuthenticated: false };
  }
  
  async logout() {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include' // ⭐ Suppression automatique des cookies
    });
  }
}
```

---

## 🛡️ Gestion des Erreurs

### Codes d'erreur courants

```typescript
interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// Gestionnaire d'erreurs global (simplifié)
const handleApiError = (error: ApiError) => {
  switch (error.statusCode) {
    case 401:
      // Token expiré ou invalide - plus de nettoyage manuel !
      window.location.href = '/login';
      break;
      
    case 403:
      // Permissions insuffisantes
      showNotification('Accès refusé', 'error');
      break;
      
    case 409:
      // Email déjà existant
      showNotification('Un utilisateur avec cet email existe déjà', 'error');
      break;
      
    case 422:
      // Données de validation invalides
      showNotification(error.message, 'error');
      break;
      
    default:
      showNotification('Une erreur est survenue', 'error');
  }
};

// Intercepteur fetch global
const fetchWithErrorHandling = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include' // ⭐ Toujours inclure les cookies
  });
  
  if (!response.ok) {
    const error = await response.json();
    handleApiError(error);
    throw error;
  }
  
  return response.json();
};
```

---

## 🔧 Utilitaires Frontend

### Service API Simplifié

```typescript
class ApiService {
  private baseUrl = 'http://localhost:3000';
  
  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      credentials: 'include', // ⭐ Toujours inclure les cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw error;
    }
    
    return response.json();
  }
  
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }
  
  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }
  
  async checkAuth() {
    return this.request('/auth/check');
  }
  
  async createClient(clientData: CreateClientRequest) {
    return this.request('/auth/admin/create-client', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  }

  async listClients(filters: ListClientsQuery = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });
    
    return this.request(`/auth/admin/clients?${params}`);
  }

  async toggleClientStatus(clientId: number) {
    return this.request(`/auth/admin/clients/${clientId}/toggle-status`, {
      method: 'PUT'
    });
  }
  
  async getProfile() {
    return this.request('/auth/profile');
  }
}

export const apiService = new ApiService();
```

### Hook React personnalisé (Ultra-simplifié)

```typescript
// Hook pour la gestion de l'authentification
const useAuth = () => {
  const [authState, setAuthState] = useState({
    isAuthenticated: false,
    user: null,
    loading: true
  });

  useEffect(() => {
    // Vérifier l'authentification au chargement
    apiService.checkAuth()
      .then(response => {
        if (response.isAuthenticated) {
          setAuthState({
            isAuthenticated: true,
            user: response.user,
            loading: false
          });
        } else {
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false
          });
        }
      })
      .catch(() => {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false
        });
      });
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    
    if (response.mustChangePassword) {
      return { mustChangePassword: true, userId: response.userId };
    }
    
    setAuthState({
      isAuthenticated: true,
      user: response.user,
      loading: false
    });
    
    return response;
  };

  const logout = async () => {
    await apiService.logout();
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false
    });
  };

  return { ...authState, login, logout };
};
```

---

## 🎯 Points Clés pour le Frontend

### ✅ À faire
1. **Inclure `credentials: 'include'`** dans TOUTES les requêtes
2. **Supprimer tout code localStorage/sessionStorage** lié aux tokens
3. **Vérifier l'authentification** au chargement de l'app avec `/auth/check`
4. **Gérer les erreurs 401** avec redirection automatique
5. **Adapter l'UI selon `vendeur_type`**
6. **Valider les formulaires côté client** avant envoi
7. **Protéger les routes admin** avec les permissions
8. **Implémenter la pagination** pour la liste des clients
9. **Gérer les filtres** de recherche et de statut

### ❌ À éviter
1. **Ne plus gérer de tokens manuellement**
2. **Ne pas oublier `credentials: 'include'`**
3. **Ne pas stocker d'informations sensibles** côté client
4. **Ne pas ignorer les erreurs d'API**

---

## 🚀 Comparaison : Avant vs Après

### Avant (localStorage) 😰
```javascript
// Connexion
const response = await login(credentials);
localStorage.setItem('token', response.access_token); // Gestion manuelle

// Requêtes
const token = localStorage.getItem('token');
fetch('/api/endpoint', {
  headers: { 'Authorization': `Bearer ${token}` } // Headers manuels
});

// Déconnexion
localStorage.removeItem('token'); // Nettoyage manuel
```

### Après (cookies) 😊
```javascript
// Connexion
const response = await login(credentials); // C'est tout !

// Requêtes
fetch('/api/endpoint', {
  credentials: 'include' // Authentification automatique
});

// Déconnexion
await logout(); // Nettoyage automatique
```

---

## 📱 Exemple d'Intégration Complète

### Application React avec authentification par cookies

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';

const App = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Vérification automatique de l'authentification
    fetch('/auth/check', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data.isAuthenticated) {
          setUser(data.user);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = async (credentials) => {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ⭐ Cookies définis automatiquement
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (data.user) {
      setUser(data.user); // Connexion réussie
    }
    
    return data;
  };

  const handleLogout = async () => {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include' // ⭐ Cookies supprimés automatiquement
    });
    setUser(null);
  };

  if (loading) return <div>Chargement...</div>;

  return user ? (
    <Dashboard user={user} onLogout={handleLogout} />
  ) : (
    <LoginForm onLogin={handleLogin} />
  );
};
```

---

**Cette approche par cookies simplifie drastiquement l'intégration frontend tout en améliorant la sécurité ! 🚀🍪** 