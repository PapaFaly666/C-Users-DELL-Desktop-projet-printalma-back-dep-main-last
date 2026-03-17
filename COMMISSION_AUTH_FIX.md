# 🔧 Fix Authentification Commission Frontend

> **Solution au problème "Token d'authentification requis"**
> 
> Erreur identifiée dans pro.md - Frontend ne peut pas accéder aux endpoints commission

---

## 🚨 Problème Identifié

Le frontend affiche l'erreur :
```
❌ Erreur updateVendorCommission: Error: Token d'authentification requis
```

**Cause:** Le service frontend n'arrive pas à récupérer ou envoyer le token d'authentification admin pour accéder aux endpoints commission sécurisés.

---

## 🔍 Diagnostic

### Backend ✅ Correct
- CORS configuré avec `credentials: true`
- Guards d'authentification `JwtAuthGuard` actifs
- Endpoints sécurisés pour ADMIN/SUPERADMIN uniquement

### Frontend ❌ Problème
- Service commission essaie d'appeler l'API sans token valide
- Méthode `getAuthToken()` retourne une erreur

---

## 🛠️ Solutions

### Solution 1: Vérification du Token dans le Service Frontend

Modifiez votre service commission frontend pour mieux gérer l'authentification :

```javascript
// services/commissionService.js - VERSION CORRIGÉE

import axios from 'axios';

class CommissionService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true, // IMPORTANT: pour les cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getAuthToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur pour gérer les erreurs d'auth
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          this.handleAuthError();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Méthode CORRIGÉE pour récupérer le token
   */
  getAuthToken() {
    // Option 1: Token dans localStorage
    let token = localStorage.getItem('adminToken') || localStorage.getItem('authToken');
    
    // Option 2: Token dans sessionStorage  
    if (!token) {
      token = sessionStorage.getItem('adminToken') || sessionStorage.getItem('authToken');
    }

    // Option 3: Token dans un cookie (si vous utilisez des cookies)
    if (!token) {
      token = this.getCookieValue('adminToken') || this.getCookieValue('authToken');
    }

    // Option 4: Token depuis un store global (Redux/Zustand/etc.)
    if (!token && window.store) {
      token = window.store.getState()?.auth?.token;
    }

    if (!token) {
      console.warn('🚨 Aucun token d\'authentification trouvé');
      throw new Error('Token d\'authentification requis');
    }

    return token;
  }

  /**
   * Utilitaire pour lire les cookies
   */
  getCookieValue(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
      return parts.pop().split(';').shift();
    }
    return null;
  }

  /**
   * Gestion des erreurs d'authentification
   */
  handleAuthError() {
    console.warn('🚨 Erreur d\'authentification - redirection vers login');
    
    // Nettoyer les tokens expirés
    localStorage.removeItem('adminToken');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('adminToken');
    sessionStorage.removeItem('authToken');
    
    // Rediriger vers la page de login
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  /**
   * Mettre à jour la commission d'un vendeur - VERSION SÉCURISÉE
   */
  async updateVendorCommission(vendorId, commissionRate) {
    try {
      // Vérification préalable du token
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Token d\'authentification requis');
      }

      console.log('📡 Mise à jour commission:', { vendorId, commissionRate });

      const response = await this.api.put(`/admin/vendors/${vendorId}/commission`, {
        commissionRate: parseFloat(commissionRate)
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };

    } catch (error) {
      console.error('❌ Erreur updateVendorCommission:', error);
      
      if (error.message === 'Token d\'authentification requis') {
        return {
          success: false,
          error: 'AUTH_REQUIRED',
          message: 'Vous devez être connecté en tant qu\'administrateur'
        };
      }

      return {
        success: false,
        error: error.response?.data?.error || 'NETWORK_ERROR',
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  }

  // ... autres méthodes similaires
}

export default new CommissionService();
```

### Solution 2: Middleware d'Authentification

Créez un middleware pour vérifier l'authentification avant d'utiliser le service :

```javascript
// middleware/authMiddleware.js

export const checkAdminAuth = () => {
  const token = localStorage.getItem('adminToken') || 
                sessionStorage.getItem('adminToken') || 
                getCookieValue('adminToken');
  
  if (!token) {
    throw new Error('Vous devez être connecté en tant qu\'administrateur');
  }

  // Vérifier si le token n'est pas expiré (optionnel)
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      throw new Error('Session expirée');
    }
  } catch (e) {
    throw new Error('Token invalide');
  }

  return token;
};

// Utilisation dans vos composants
import { checkAdminAuth } from '../middleware/authMiddleware';

const handleUpdateCommission = async (vendorId, rate) => {
  try {
    // Vérifier l'auth AVANT d'appeler le service
    checkAdminAuth();
    
    const result = await commissionService.updateVendorCommission(vendorId, rate);
    // ... traiter le résultat
  } catch (error) {
    if (error.message.includes('connecté') || error.message.includes('expiré')) {
      // Rediriger vers login
      window.location.href = '/login';
    } else {
      console.error('Erreur:', error.message);
    }
  }
};
```

### Solution 3: Composant d'Authentification Requis

Enveloppez vos composants de gestion de commission :

```jsx
// components/RequireAuth.jsx

import { useEffect, useState } from 'react';
import { checkAdminAuth } from '../middleware/authMiddleware';

const RequireAuth = ({ children, redirectTo = '/login' }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      checkAdminAuth();
      setIsAuthenticated(true);
    } catch (error) {
      console.warn('Auth required:', error.message);
      window.location.href = redirectTo;
    } finally {
      setIsLoading(false);
    }
  }, [redirectTo]);

  if (isLoading) {
    return <div>Vérification des permissions...</div>;
  }

  if (!isAuthenticated) {
    return null; // Redirection en cours
  }

  return children;
};

// Utilisation
<RequireAuth>
  <VendorManagementTable />
</RequireAuth>
```

---

## 🧪 Tests de Vérification

### Test 1: Vérifier le Token

Ajoutez ce code dans votre console développeur :

```javascript
// Test dans la console du navigateur
console.log('Token localStorage:', localStorage.getItem('adminToken'));
console.log('Token sessionStorage:', sessionStorage.getItem('adminToken'));
console.log('Tous les cookies:', document.cookie);
```

### Test 2: Test Direct de l'API

```javascript
// Test direct dans la console
fetch('http://localhost:3000/admin/vendors/commissions', {
  method: 'GET',
  credentials: 'include',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => console.log('Résultat:', data))
.catch(err => console.error('Erreur:', err));
```

---

## 🔧 Actions Immédiates

### 1. Vérifiez où est stocké votre token admin

```javascript
// Dans la console du navigateur
Object.keys(localStorage).filter(key => key.includes('token') || key.includes('auth'))
Object.keys(sessionStorage).filter(key => key.includes('token') || key.includes('auth'))
```

### 2. Vérifiez le rôle utilisateur

```javascript
// Décoder le token JWT pour voir le rôle
const token = localStorage.getItem('adminToken');
if (token) {
  const payload = JSON.parse(atob(token.split('.')[1]));
  console.log('Rôle utilisateur:', payload.role);
  console.log('Payload complet:', payload);
}
```

### 3. Test de connexion admin

Si vous n'avez pas de token admin valide, vous devez d'abord vous connecter en tant qu'admin via votre endpoint de login.

---

## 📋 Checklist de Résolution

- [ ] Vérifier la présence du token dans le storage
- [ ] Vérifier que le token n'est pas expiré
- [ ] Vérifier que l'utilisateur a le rôle ADMIN ou SUPERADMIN
- [ ] Corriger la méthode `getAuthToken()` du service
- [ ] Ajouter la gestion d'erreur d'authentification
- [ ] Tester les endpoints avec un token valide
- [ ] Redirection automatique vers login si non authentifié

---

**Une fois ces corrections appliquées, le système de commission devrait fonctionner correctement !**