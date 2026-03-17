# 🔧 Guide de Dépannage - Accès Refusé Frontend

## 🚨 Problème : "Forbidden resource" (403) malgré une connexion SUPERADMIN

Ce guide vous aide à diagnostiquer et résoudre les problèmes d'accès refusé dans le frontend.

## 🔍 Diagnostic Rapide

### Étape 1 : Vérifier l'authentification
```javascript
// Test d'authentification de base
const testAuth = async () => {
  try {
    const response = await fetch('/api/orders/test-auth', {
      credentials: 'include'
    });
    const result = await response.json();
    
    console.log('=== DIAGNOSTIC AUTHENTIFICATION ===');
    console.log('Status:', response.status);
    console.log('Réponse complète:', result);
    console.log('Utilisateur:', result.data?.user);
    console.log('Rôle utilisateur:', result.data?.userRole);
    console.log('ID utilisateur:', result.data?.userId);
    console.log('===================================');
    
    return result;
  } catch (error) {
    console.error('Erreur test auth:', error);
  }
};

// Exécuter le test
testAuth();
```

### Étape 2 : Vérifier l'accès admin
```javascript
// Test d'accès admin
const testAdmin = async () => {
  try {
    const response = await fetch('/api/orders/test-admin', {
      credentials: 'include'
    });
    const result = await response.json();
    
    console.log('=== DIAGNOSTIC ACCÈS ADMIN ===');
    console.log('Status:', response.status);
    console.log('Succès:', result.success);
    console.log('Message:', result.message);
    console.log('Données:', result.data);
    console.log('==============================');
    
    return result;
  } catch (error) {
    console.error('Erreur test admin:', error);
  }
};

// Exécuter le test
testAdmin();
```

## 🔧 Solutions par Problème

### Problème 1 : Token JWT non envoyé

**Symptômes :**
- Erreur 401 (Unauthorized)
- `req.user` est undefined

**Solutions :**

#### Solution A : Vérifier les cookies
```javascript
// Vérifier si le cookie auth_token existe
const checkCookie = () => {
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
  
  console.log('=== VÉRIFICATION COOKIE ===');
  console.log('Tous les cookies:', document.cookie);
  console.log('Cookie auth_token:', authCookie);
  console.log('===========================');
  
  return authCookie;
};

checkCookie();
```

#### Solution B : Forcer l'inclusion des cookies
```javascript
// Toujours inclure credentials: 'include'
const apiCall = async (url, options = {}) => {
  return fetch(url, {
    ...options,
    credentials: 'include', // OBLIGATOIRE
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

#### Solution C : Utiliser le header Authorization
```javascript
// Si les cookies ne marchent pas, utiliser le header
const getTokenFromStorage = () => {
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
};

const apiCallWithHeader = async (url, options = {}) => {
  const token = getTokenFromStorage();
  
  return fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
};
```

### Problème 2 : Structure JWT incorrecte

**Symptômes :**
- `req.user.role` est undefined
- `req.user.sub` est undefined

**Solution : Vérifier la structure du token**
```javascript
// Décoder le token JWT pour vérifier sa structure
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const payload = JSON.parse(jsonPayload);
    
    console.log('=== STRUCTURE TOKEN JWT ===');
    console.log('Payload complet:', payload);
    console.log('ID utilisateur (sub):', payload.sub);
    console.log('Rôle (role):', payload.role);
    console.log('Email:', payload.email);
    console.log('Expiration:', new Date(payload.exp * 1000));
    console.log('===========================');
    
    return payload;
  } catch (error) {
    console.error('Erreur décodage JWT:', error);
  }
};

// Utiliser avec le token depuis le cookie ou localStorage
const token = getTokenFromStorage();
if (token) {
  decodeJWT(token);
}
```

### Problème 3 : Problème de CORS

**Symptômes :**
- Erreurs CORS dans la console
- Cookies non envoyés

**Solutions :**

#### Solution A : Vérifier la configuration CORS backend
```javascript
// Le backend doit avoir cette configuration
/*
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Vos domaines frontend
  credentials: true, // OBLIGATOIRE pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
*/
```

#### Solution B : Vérifier l'URL de l'API
```javascript
// Configuration des URLs
const API_CONFIG = {
  // En développement
  development: 'http://localhost:3000',
  // En production
  production: 'https://votre-api.com'
};

const API_BASE_URL = API_CONFIG[process.env.NODE_ENV] || API_CONFIG.development;

console.log('URL API utilisée:', API_BASE_URL);
```

### Problème 4 : Token expiré

**Symptômes :**
- Erreur 401 après un certain temps
- Fonctionnait avant, plus maintenant

**Solution : Vérifier l'expiration et renouveler**
```javascript
const checkTokenExpiration = () => {
  const token = getTokenFromStorage();
  if (!token) {
    console.log('Aucun token trouvé');
    return false;
  }
  
  const payload = decodeJWT(token);
  if (!payload) return false;
  
  const now = Date.now() / 1000;
  const isExpired = payload.exp < now;
  
  console.log('=== VÉRIFICATION EXPIRATION ===');
  console.log('Token expire le:', new Date(payload.exp * 1000));
  console.log('Maintenant:', new Date());
  console.log('Token expiré:', isExpired);
  console.log('===============================');
  
  if (isExpired) {
    // Rediriger vers la page de connexion
    window.location.href = '/login';
  }
  
  return !isExpired;
};

// Vérifier avant chaque appel API
checkTokenExpiration();
```

## 🛠️ Outils de Diagnostic Complets

### Outil de diagnostic complet
```javascript
const fullDiagnostic = async () => {
  console.log('🔍 DÉBUT DU DIAGNOSTIC COMPLET');
  console.log('================================');
  
  // 1. Vérifier les cookies
  console.log('1. COOKIES:');
  checkCookie();
  
  // 2. Vérifier le localStorage
  console.log('2. LOCAL STORAGE:');
  const token = getTokenFromStorage();
  console.log('Token en storage:', token ? 'Présent' : 'Absent');
  
  // 3. Décoder le token si présent
  if (token) {
    console.log('3. STRUCTURE TOKEN:');
    decodeJWT(token);
    
    // 4. Vérifier l'expiration
    console.log('4. EXPIRATION:');
    checkTokenExpiration();
  }
  
  // 5. Test d'authentification
  console.log('5. TEST AUTHENTIFICATION:');
  await testAuth();
  
  // 6. Test d'accès admin
  console.log('6. TEST ACCÈS ADMIN:');
  await testAdmin();
  
  // 7. Test d'un endpoint protégé
  console.log('7. TEST ENDPOINT PROTÉGÉ:');
  try {
    const response = await fetch('/api/orders/admin/all?page=1&limit=1', {
      credentials: 'include'
    });
    console.log('Status endpoint protégé:', response.status);
    const result = await response.json();
    console.log('Réponse:', result);
  } catch (error) {
    console.error('Erreur endpoint protégé:', error);
  }
  
  console.log('================================');
  console.log('🏁 FIN DU DIAGNOSTIC');
};

// Exécuter le diagnostic complet
fullDiagnostic();
```

### Fonction de reconnexion automatique
```javascript
const autoReconnect = async () => {
  try {
    // Essayer de se reconnecter avec les identifiants stockés
    const email = localStorage.getItem('user_email');
    const password = localStorage.getItem('user_password'); // ⚠️ Pas recommandé en production
    
    if (!email || !password) {
      console.log('Identifiants non trouvés, redirection vers login');
      window.location.href = '/login';
      return;
    }
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      console.log('Reconnexion réussie');
      window.location.reload();
    } else {
      console.log('Échec de la reconnexion');
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Erreur reconnexion:', error);
    window.location.href = '/login';
  }
};
```

## 🔄 Wrapper API avec Gestion d'Erreurs

```javascript
// Wrapper API robuste avec gestion d'erreurs
const apiWrapper = {
  async call(url, options = {}) {
    try {
      // Vérifier l'expiration du token avant l'appel
      if (!checkTokenExpiration()) {
        throw new Error('Token expiré');
      }
      
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        ...options
      });
      
      // Gestion des erreurs HTTP
      if (response.status === 401) {
        console.log('Token invalide ou expiré');
        localStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_token');
        window.location.href = '/login';
        return;
      }
      
      if (response.status === 403) {
        console.error('Accès refusé - Vérifiez vos permissions');
        // Lancer le diagnostic
        await fullDiagnostic();
        throw new Error('Accès refusé');
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Erreur HTTP ${response.status}`);
      }
      
      return await response.json();
      
    } catch (error) {
      console.error('Erreur API:', error);
      
      // Si c'est une erreur réseau, proposer de relancer
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        if (confirm('Erreur de connexion. Voulez-vous réessayer ?')) {
          return this.call(url, options);
        }
      }
      
      throw error;
    }
  },
  
  // Méthodes spécifiques
  async get(url) {
    return this.call(url, { method: 'GET' });
  },
  
  async post(url, data) {
    return this.call(url, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },
  
  async patch(url, data) {
    return this.call(url, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  },
  
  async delete(url) {
    return this.call(url, { method: 'DELETE' });
  }
};

// Utilisation
const getOrders = async () => {
  try {
    const result = await apiWrapper.get('/api/orders/admin/all');
    console.log('Commandes:', result.data);
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
  }
};
```

## 🚀 Script de Test Rapide

```javascript
// Script à copier-coller dans la console du navigateur
(async function quickTest() {
  console.log('🚀 TEST RAPIDE D\'ACCÈS');
  console.log('======================');
  
  // Test 1: Authentification
  try {
    const authResponse = await fetch('/api/orders/test-auth', { credentials: 'include' });
    const authResult = await authResponse.json();
    console.log('✅ Auth Status:', authResponse.status);
    console.log('✅ Auth Data:', authResult.data);
  } catch (e) {
    console.log('❌ Auth Error:', e.message);
  }
  
  // Test 2: Accès admin
  try {
    const adminResponse = await fetch('/api/orders/test-admin', { credentials: 'include' });
    const adminResult = await adminResponse.json();
    console.log('✅ Admin Status:', adminResponse.status);
    console.log('✅ Admin Success:', adminResult.success);
  } catch (e) {
    console.log('❌ Admin Error:', e.message);
  }
  
  // Test 3: Endpoint réel
  try {
    const ordersResponse = await fetch('/api/orders/admin/all?page=1&limit=1', { credentials: 'include' });
    console.log('✅ Orders Status:', ordersResponse.status);
    if (ordersResponse.ok) {
      const ordersResult = await ordersResponse.json();
      console.log('✅ Orders Success:', ordersResult.success);
    }
  } catch (e) {
    console.log('❌ Orders Error:', e.message);
  }
  
  console.log('======================');
  console.log('🏁 FIN DU TEST RAPIDE');
})();
```

## 📋 Checklist de Vérification

### ✅ Avant de contacter le support :

1. **Cookies** : Le cookie `auth_token` est-il présent ?
2. **Token** : Le token JWT contient-il `sub` et `role` ?
3. **Expiration** : Le token n'est-il pas expiré ?
4. **CORS** : Les appels API incluent-ils `credentials: 'include'` ?
5. **URL** : L'URL de l'API est-elle correcte ?
6. **Rôle** : L'utilisateur a-t-il bien le rôle SUPERADMIN ?
7. **Tests** : Les endpoints de test fonctionnent-ils ?

### 🔧 Actions correctives :

1. **Vider le cache** du navigateur
2. **Se déconnecter/reconnecter**
3. **Vérifier la console** pour les erreurs
4. **Tester avec un autre navigateur**
5. **Vérifier la configuration CORS** du backend

## 📞 Informations à fournir au support

Si le problème persiste, fournissez ces informations :

```javascript
// Informations de debug à copier
const debugInfo = {
  userAgent: navigator.userAgent,
  url: window.location.href,
  cookies: document.cookie,
  localStorage: { ...localStorage },
  sessionStorage: { ...sessionStorage },
  timestamp: new Date().toISOString()
};

console.log('=== INFORMATIONS DEBUG ===');
console.log(JSON.stringify(debugInfo, null, 2));
console.log('==========================');
```

Ce guide devrait résoudre 99% des problèmes d'accès refusé ! 🎯 