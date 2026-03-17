# Guide Frontend - Gestion des Erreurs d'Autorisation

## Problème identifié
```
Error 400: "Seuls les administrateurs peuvent modifier les produits."
```

L'utilisateur connecté en tant que SUPERADMIN ne peut pas modifier les produits, indiquant un problème d'autorisation côté backend.

## Solutions Frontend

### 1. Endpoint de Debug - Vérifier le Rôle Utilisateur

#### Appel API pour diagnostiquer
```javascript
// Vérifier le rôle de l'utilisateur connecté
const debugUserRole = async () => {
  try {
    const response = await fetch('https://printalma-back-dep.onrender.com/products/debug/user-role', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    console.log('🔍 Debug User Role:', result);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur debug role:', error);
  }
};
```

#### Intégration dans ProductFormMain.tsx
```javascript
// À ajouter dans ProductFormMain.tsx
const handleDebugRole = async () => {
  console.log('🔍 [DEBUG] Vérification du rôle utilisateur...');
  
  try {
    const response = await fetch('https://printalma-back-dep.onrender.com/products/debug/user-role', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const result = await response.json();
    
    console.log('📋 Informations utilisateur:', {
      id: result.user.id,
      email: result.user.email,
      role: result.user.role,
      roleType: result.user.roleType,
      name: `${result.user.firstName} ${result.user.lastName}`
    });
    
    console.log('🔍 Tests d\'autorisation:', {
      isAdmin: result.debug.isAdmin,
      isSuperAdmin: result.debug.isSuperAdmin,
      passesCheck: result.debug.includesAdminCheck
    });
    
    // Afficher dans l'UI
    alert(`Rôle: ${result.user.role}\nAutorisé: ${result.debug.includesAdminCheck ? 'OUI' : 'NON'}`);
    
    return result;
  } catch (error) {
    console.error('❌ Erreur debug:', error);
    alert('Erreur lors de la vérification du rôle');
  }
};

// Bouton de debug à ajouter temporairement
<button 
  type="button" 
  onClick={handleDebugRole}
  style={{ 
    background: '#ff9800', 
    color: 'white', 
    padding: '8px 16px', 
    border: 'none', 
    borderRadius: '4px',
    margin: '10px 0'
  }}
>
  🔍 Debug Rôle Utilisateur
</button>
```

### 2. Gestion Améliorée des Erreurs d'Authorization

#### Service d'authentification amélioré
```javascript
// authService.js
class AuthService {
  constructor() {
    this.baseUrl = 'https://printalma-back-dep.onrender.com';
  }

  // Vérifier le token et le rôle
  async validateToken() {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Aucun token trouvé');
      }

      const response = await fetch(`${this.baseUrl}/products/debug/user-role`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Token invalide ou expiré');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Validation token échouée:', error);
      throw error;
    }
  }

  // Vérifier les permissions admin
  async checkAdminPermissions() {
    try {
      const userInfo = await this.validateToken();
      
      const hasAdminRights = ['ADMIN', 'SUPERADMIN'].includes(userInfo.user.role);
      
      return {
        hasRights: hasAdminRights,
        userRole: userInfo.user.role,
        userId: userInfo.user.id,
        userEmail: userInfo.user.email,
        debugInfo: userInfo.debug
      };
    } catch (error) {
      return {
        hasRights: false,
        error: error.message
      };
    }
  }

  // Forcer une nouvelle connexion
  forceReauth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}

const authService = new AuthService();
export default authService;
```

### 3. Composant d'Erreur Intelligente

```jsx
// ErrorBoundary.jsx
import React, { useState, useEffect } from 'react';
import authService from './authService';

const AuthErrorHandler = ({ error, onRetry, onReauth }) => {
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleDebugCheck = async () => {
    setLoading(true);
    try {
      const result = await authService.checkAdminPermissions();
      setDebugInfo(result);
    } catch (err) {
      console.error('Debug check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (error?.message?.includes('administrateurs')) {
      handleDebugCheck();
    }
  }, [error]);

  if (!error?.message?.includes('administrateurs')) {
    return null;
  }

  return (
    <div style={{
      background: '#fff3cd',
      border: '1px solid #ffeeba',
      borderRadius: '8px',
      padding: '20px',
      margin: '20px 0',
      color: '#856404'
    }}>
      <h3>🚫 Erreur d'Autorisation</h3>
      <p><strong>Message:</strong> {error.message}</p>
      
      {debugInfo && (
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '4px',
          marginTop: '10px',
          fontFamily: 'monospace'
        }}>
          <h4>🔍 Informations de Debug:</h4>
          <p><strong>Votre rôle:</strong> {debugInfo.userRole || 'Non défini'}</p>
          <p><strong>Droits admin:</strong> {debugInfo.hasRights ? '✅ OUI' : '❌ NON'}</p>
          <p><strong>Email:</strong> {debugInfo.userEmail}</p>
          {debugInfo.error && <p><strong>Erreur:</strong> {debugInfo.error}</p>}
        </div>
      )}

      <div style={{ marginTop: '15px' }}>
        <button
          onClick={onRetry}
          style={{
            background: '#007bff',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          🔄 Réessayer
        </button>
        
        <button
          onClick={onReauth}
          style={{
            background: '#dc3545',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            marginRight: '10px',
            cursor: 'pointer'
          }}
        >
          🔑 Se Reconnecter
        </button>

        <button
          onClick={handleDebugCheck}
          disabled={loading}
          style={{
            background: '#ffc107',
            color: '#212529',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? '⏳ Analyse...' : '🔍 Debug Détaillé'}
        </button>
      </div>

      <div style={{
        marginTop: '15px',
        fontSize: '0.9em',
        color: '#6c757d'
      }}>
        <strong>Solutions possibles:</strong>
        <ul>
          <li>Votre session a peut-être expiré → Se reconnecter</li>
          <li>Votre rôle n'est pas correctement défini → Contacter l'admin</li>
          <li>Problème de token JWT → Vider le cache et se reconnecter</li>
        </ul>
      </div>
    </div>
  );
};

export default AuthErrorHandler;
```

### 4. Integration dans ProductFormMain.tsx

```jsx
// Dans ProductFormMain.tsx
import AuthErrorHandler from './AuthErrorHandler';
import authService from './authService';

// État pour les erreurs d'auth
const [authError, setAuthError] = useState(null);

// Fonction de soumission modifiée
const handleSubmit = async (formData) => {
  try {
    setAuthError(null);
    
    // Vérifier les permissions avant l'envoi
    const permissionCheck = await authService.checkAdminPermissions();
    
    if (!permissionCheck.hasRights) {
      setAuthError({
        message: `Droits insuffisants. Votre rôle: ${permissionCheck.userRole}`,
        details: permissionCheck
      });
      return;
    }

    // Envoyer la requête normale
    const response = await fetch(`https://printalma-back-dep.onrender.com/products/${productId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (errorData.message?.includes('administrateurs')) {
        setAuthError({
          message: errorData.message,
          statusCode: response.status
        });
        return;
      }
      
      throw new Error(errorData.message || 'Erreur de soumission');
    }

    const result = await response.json();
    console.log('✅ Produit mis à jour:', result);
    
  } catch (error) {
    console.error('❌ Erreur soumission:', error);
    
    if (error.message?.includes('administrateurs')) {
      setAuthError({
        message: error.message
      });
    } else {
      // Gestion d'autres erreurs
      setError(error.message);
    }
  }
};

// Dans le JSX, ajouter le composant d'erreur
return (
  <div>
    {/* Autres composants */}
    
    {authError && (
      <AuthErrorHandler
        error={authError}
        onRetry={() => {
          setAuthError(null);
          handleSubmit(formData); // Réessayer avec les mêmes données
        }}
        onReauth={() => {
          authService.forceReauth();
        }}
      />
    )}
    
    {/* Formulaire */}
  </div>
);
```

### 5. Script de Debug Rapide

Ajoutez ce script dans la console du navigateur pour un debug immédiat :

```javascript
// À exécuter dans la console du navigateur
(async () => {
  console.log('🔍 Debug session utilisateur...');
  
  const token = localStorage.getItem('authToken');
  console.log('Token présent:', !!token);
  
  if (!token) {
    console.log('❌ Aucun token trouvé');
    return;
  }
  
  try {
    const response = await fetch('https://printalma-back-dep.onrender.com/products/debug/user-role', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      console.log('❌ Token invalide ou endpoint inaccessible');
      return;
    }
    
    const result = await response.json();
    console.log('📋 Informations utilisateur:', result);
    
    // Test direct sur l'endpoint qui échoue
    const testResponse = await fetch('https://printalma-back-dep.onrender.com/products/1', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Test' })
    });
    
    console.log('🧪 Test modification produit:', {
      status: testResponse.status,
      ok: testResponse.ok
    });
    
    if (!testResponse.ok) {
      const errorData = await testResponse.json();
      console.log('❌ Erreur modification:', errorData);
    }
    
  } catch (error) {
    console.log('❌ Erreur debug:', error);
  }
})();
```

## Actions Immédiates Recommandées

1. **Exécuter le script de debug** dans la console
2. **Ajouter l'endpoint de debug** dans votre interface admin
3. **Implémenter la gestion d'erreur** avec le composant `AuthErrorHandler`
4. **Vérifier en base de données** que votre utilisateur a bien le rôle `SUPERADMIN`

## Vérification Base de Données

Si le problème persiste, vérifiez en base :

```sql
-- Vérifier le rôle de votre utilisateur
SELECT id, email, role, firstName, lastName 
FROM "User" 
WHERE email = 'votre-email@example.com';

-- Si le rôle n'est pas SUPERADMIN, le corriger
UPDATE "User" 
SET role = 'SUPERADMIN' 
WHERE email = 'votre-email@example.com';
```

Ce guide vous permettra de diagnostiquer et résoudre le problème d'autorisation de manière systématique.