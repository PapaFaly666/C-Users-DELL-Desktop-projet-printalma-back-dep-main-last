# 🚨 Correction des Endpoints Frontend - PrintAlma API

## ⚡ **Problèmes Urgents Résolus**

### **1. ERREUR 404 :** `POST http://localhost:3004/auth/admin/clients/38/reset-password`
**SOLUTION :** ✅ Utiliser `POST /auth/admin/reset-vendor-password` avec l'email

### **2. ERREUR 401 :** `PUT http://localhost:3004/auth/change-password` (Unauthorized)
**CAUSE :** Utilisateur doit changer son mot de passe mais n'a pas de cookie d'authentification
**SOLUTION :** ✅ Utiliser `POST /auth/force-change-password` pour changement obligatoire

---

## 🔧 **Corrections Immédiates Requises**

### 1. ❌ **Endpoint Reset Password Incorrect**

```typescript
// ❌ INCORRECT - N'existe pas dans le backend
POST /auth/admin/clients/{id}/reset-password

// ✅ CORRECT - Endpoint réel du backend  
POST /auth/admin/reset-vendor-password
```

### 2. 🚨 **NOUVEAU : Endpoint pour Changement de Mot de Passe Obligatoire**

```typescript
// ❌ PROBLÈME - Utilisateur non authentifié ne peut pas accéder à:
PUT /auth/change-password  // Requires authentication

// ✅ SOLUTION - Nouvel endpoint public pour changement obligatoire:
POST /auth/force-change-password  // { userId, currentPassword, newPassword, confirmPassword }
```

### 3. 🔄 **Correction du Service Frontend**

```typescript
// auth.service.ts - CORRECTIONS REQUISES

class AuthService {
  // ❌ SUPPRIMEZ cette méthode si elle existe
  // async resetClientPassword(clientId: number) {
  //   return this.request(`/admin/clients/${clientId}/reset-password`, {
  //     method: 'POST'
  //   });
  // }

  // ✅ UTILISEZ cette méthode à la place
  async resetVendorPassword(email: string) {
    return this.request('/admin/reset-vendor-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  // 🆕 NOUVELLE MÉTHODE pour changement de mot de passe obligatoire
  async forceChangePassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.request('/force-change-password', {
      method: 'POST',
      body: JSON.stringify({ 
        userId, 
        currentPassword, 
        newPassword, 
        confirmPassword 
      })
    });
  }

  // ✅ MÉTHODE EXISTANTE pour utilisateurs connectés
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.request('/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
  }
}
```

### 4. 🔄 **Correction des Composants**

```typescript
// ChangePasswordForm.tsx - CORRECTION REQUISE

const ChangePasswordForm = ({ mustChangePassword, userId }: { 
  mustChangePassword: boolean, 
  userId?: number 
}) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (mustChangePassword && userId) {
        // 🆕 Utiliser le nouvel endpoint pour changement obligatoire
        await authService.forceChangePassword(
          userId,
          formData.currentPassword,
          formData.newPassword,
          formData.confirmPassword
        );
      } else {
        // ✅ Utiliser l'endpoint normal pour utilisateurs connectés
        await authService.changePassword(
          formData.currentPassword,
          formData.newPassword,
          formData.confirmPassword
        );
      }
      
      // Rediriger vers le dashboard après succès
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>
        {mustChangePassword ? 'Changement de mot de passe obligatoire' : 'Changer le mot de passe'}
      </h2>
      
      <div className="form-group">
        <label>Mot de passe actuel</label>
        <input
          type="password"
          value={formData.currentPassword}
          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
          required
        />
      </div>
      
      <div className="form-group">
        <label>Nouveau mot de passe</label>
        <input
          type="password"
          value={formData.newPassword}
          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
          required
          minLength="8"
        />
      </div>
      
      <div className="form-group">
        <label>Confirmer le nouveau mot de passe</label>
        <input
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          required
          minLength="8"
        />
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Changement...' : 'Changer le mot de passe'}
      </button>
    </form>
  );
};
```

### 5. 🔄 **Correction du Flow d'Authentification**

```typescript
// AuthContext.jsx - CORRECTION DU FLOW

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempUserId, setTempUserId] = useState(null);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);
      
      if (response.mustChangePassword) {
        // Utilisateur doit changer son mot de passe
        setMustChangePassword(true);
        setTempUserId(response.userId);
        setIsAuthenticated(false);
        return { 
          mustChangePassword: true, 
          userId: response.userId,
          message: response.message 
        };
      }
      
      // Connexion normale réussie
      setUser(response.user);
      setIsAuthenticated(true);
      setMustChangePassword(false);
      setTempUserId(null);
      return { success: true, user: response.user };
    } catch (error) {
      throw error;
    }
  };

  const handlePasswordChanged = () => {
    // Appelé après changement de mot de passe réussi
    setMustChangePassword(false);
    setTempUserId(null);
    // Vérifier l'authentification pour récupérer les données utilisateur
    checkAuthStatus();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      mustChangePassword,
      tempUserId,
      login,
      handlePasswordChanged,
      // ... autres méthodes
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 📋 **Tous les Endpoints Corrects**

### 🔓 **Endpoints Publics**
```typescript
POST /auth/login                      // { email, password }
POST /auth/force-change-password      // { userId, currentPassword, newPassword, confirmPassword } 🆕
POST /auth/forgot-password            // { email }
POST /auth/verify-reset-token         // { token }
POST /auth/reset-password             // { token, newPassword, confirmPassword }
```

### 🔒 **Endpoints Authentifiés**
```typescript
POST /auth/logout                     // Aucun body
GET  /auth/check                      // Aucun body
GET  /auth/profile                    // Aucun body
PUT  /auth/change-password            // { currentPassword, newPassword, confirmPassword }
GET  /auth/vendors                    // Aucun body - Liste communauté
GET  /auth/vendors/stats              // Aucun body - Statistiques
```

### 👑 **Endpoints Admin UNIQUEMENT**
```typescript
POST /auth/admin/create-client        // { firstName, lastName, email, vendeur_type }
GET  /auth/admin/clients              // Query: ?page=1&limit=10&status=true&search=...
PUT  /auth/admin/clients/:id/toggle-status  // Aucun body
POST /auth/admin/reset-vendor-password       // { email } ⭐ CORRECT
POST /auth/admin/cleanup-reset-tokens        // Aucun body
```

---

## 🛠️ **Service Frontend Complet et Corrigé**

```typescript
// auth.service.ts - VERSION CORRIGÉE
class AuthService {
  private baseUrl = 'http://localhost:3004/auth';

  async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: 'include', // ⭐ OBLIGATOIRE
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (response.status === 401) {
      window.location.href = '/login';
      return;
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ 
        message: 'Erreur de connexion' 
      }));
      throw new Error(error.message || 'Erreur inconnue');
    }

    return response.json();
  }

  // === AUTHENTIFICATION ===
  async login(email: string, password: string) {
    return this.request('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async logout() {
    return this.request('/logout', { method: 'POST' });
  }

  async checkAuth() {
    return this.request('/check');
  }

  async getProfile() {
    return this.request('/profile');
  }

  // 🆕 NOUVEAU - Changement de mot de passe forcé (pour utilisateurs non authentifiés)
  async forceChangePassword(userId: number, currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.request('/force-change-password', {
      method: 'POST',
      body: JSON.stringify({ userId, currentPassword, newPassword, confirmPassword }),
    });
  }

  // ✅ Changement de mot de passe normal (pour utilisateurs authentifiés)
  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    return this.request('/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
    });
  }

  // === RÉINITIALISATION MOT DE PASSE ===
  async forgotPassword(email: string) {
    return this.request('/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request('/verify-reset-token', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resetPassword(token: string, newPassword: string, confirmPassword: string) {
    return this.request('/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword, confirmPassword }),
    });
  }

  // === VENDEURS ===
  async listVendors() {
    return this.request('/vendors');
  }

  async getVendorsStats() {
    return this.request('/vendors/stats');
  }

  // === ADMIN - CLIENTS ===
  async createClient(clientData: CreateClientDto) {
    return this.request('/admin/create-client', {
      method: 'POST',
      body: JSON.stringify(clientData),
    });
  }

  async listClients(filters: ListClientsFilters = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.append(key, String(value));
      }
    });
    
    const queryString = params.toString();
    const url = queryString ? `/admin/clients?${queryString}` : '/admin/clients';
    
    return this.request(url);
  }

  async toggleClientStatus(clientId: number) {
    return this.request(`/admin/clients/${clientId}/toggle-status`, {
      method: 'PUT',
    });
  }

  // ⭐ ENDPOINT CORRECT POUR RESET PASSWORD ADMIN
  async resetVendorPassword(email: string) {
    return this.request('/admin/reset-vendor-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async cleanupResetTokens() {
    return this.request('/admin/cleanup-reset-tokens', {
      method: 'POST',
    });
  }
}

export default new AuthService();
```

---

## 🔄 **Types TypeScript Corrects**

```typescript
// types/auth.types.ts
export interface CreateClientDto {
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
}

export interface ListClientsFilters {
  page?: number;
  limit?: number;
  status?: boolean;
  vendeur_type?: string;
  search?: string;
}

export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'VENDEUR';
  vendeur_type: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE';
  status: boolean;
  must_change_password: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until?: string;
}

export interface ClientsListResponse {
  clients: Client[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  filters: ListClientsFilters;
}

// ⭐ INTERFACE POUR RESET PASSWORD
export interface ResetVendorPasswordDto {
  email: string;
}

export interface ResetVendorPasswordResponse {
  message: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    vendeur_type: string;
    resetDate: string;
  };
}

// 🆕 NOUVELLE INTERFACE POUR CHANGEMENT FORCÉ
export interface ForceChangePasswordDto {
  userId: number;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginResponse {
  user?: User;
  mustChangePassword?: boolean;
  userId?: number;
  message?: string;
}
```

---

## 🎯 **Flow d'Authentification Complet**

```typescript
// App.tsx - EXEMPLE COMPLET DU FLOW

const App: React.FC = () => {
  const { 
    isAuthenticated, 
    mustChangePassword, 
    tempUserId, 
    user, 
    loading 
  } = useAuth();

  if (loading) return <div>Chargement...</div>;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        {/* Route pour changement obligatoire */}
        <Route 
          path="/change-password" 
          element={
            mustChangePassword ? (
              <ChangePasswordForm 
                mustChangePassword={true} 
                userId={tempUserId} 
              />
            ) : (
              <Navigate to="/dashboard" />
            )
          } 
        />
        
        {/* Routes protégées */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />
        
        {/* Route par défaut */}
        <Route path="/" element={
          isAuthenticated ? (
            <Navigate to="/dashboard" />
          ) : mustChangePassword ? (
            <Navigate to="/change-password" />
          ) : (
            <Navigate to="/login" />
          )
        } />
      </Routes>
    </Router>
  );
};
```

---

## 🚨 **Checklist de Correction**

### ✅ **Actions Immédiates**

1. **[ ] Remplacer** `resetClientPassword(id)` par `resetVendorPassword(email)`
2. **[ ] Ajouter** la méthode `forceChangePassword` dans le service
3. **[ ] Modifier** le composant de changement de mot de passe pour gérer les deux cas
4. **[ ] Corriger** le flow d'authentification dans AuthContext
5. **[ ] Tester** les deux scenarios : changement normal et changement obligatoire

### ✅ **Tests à Effectuer**

1. **[ ] Connexion normale** d'un utilisateur existant
2. **[ ] Connexion avec must_change_password = true**
3. **[ ] Changement de mot de passe obligatoire**
4. **[ ] Changement de mot de passe normal (utilisateur connecté)**
5. **[ ] Reset password admin** avec l'email

---

## 🎯 **Résumé des Corrections**

| ❌ **Problème** | ✅ **Solution** |
|----------------|----------------|
| `POST /admin/clients/38/reset-password` (404) | `POST /admin/reset-vendor-password` avec email |
| `PUT /change-password` (401) pour must_change_password | `POST /force-change-password` avec userId |
| `resetClientPassword(clientId)` | `resetVendorPassword(email)` |
| Pas de gestion du changement obligatoire | Nouveau flow avec deux endpoints différents |

---

## 📞 **Support**

Si vous avez encore des erreurs après ces corrections :

1. **Vérifiez** que le backend est démarré sur le port 3004
2. **Confirmez** que `credentials: 'include'` est dans toutes les requêtes
3. **Testez** les endpoints avec Postman/curl d'abord
4. **Consultez** les logs du backend pour plus de détails

**🎯 Ces corrections élimineront les erreurs 404 et 401, et rendront le système complet fonctionnel !** ✨ 