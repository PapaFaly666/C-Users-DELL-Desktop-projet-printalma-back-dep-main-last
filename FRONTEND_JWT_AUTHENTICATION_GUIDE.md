# 🔐 Guide d'Authentification JWT - Frontend

## 🔍 **PROBLÈME IDENTIFIÉ**

L'erreur d'authentification JWT dans le frontend vient d'une mauvaise compréhension de l'architecture de sécurité mise en place.

### ❌ **Ce que fait le frontend actuellement**
```javascript
// ❌ INCORRECT - Recherche de tokens JWT inexistants
const tokens = [
    localStorage.getItem('jwt_token'),      // null
    localStorage.getItem('token'),          // null
    localStorage.getItem('authToken'),      // null
    localStorage.getItem('access_token')    // null
];
console.log('⚠️ Aucun token JWT trouvé - utilisation des cookies');
```

### ✅ **Architecture réelle du backend**
- Le backend génère un JWT valide lors du login
- **Le token est stocké dans un cookie `httpOnly` sécurisé**
- **Le token n'est JAMAIS envoyé au frontend** (sécurité)
- Le frontend ne peut pas accéder au token en JavaScript

---

## 🚀 **SOLUTIONS POUR LE FRONTEND**

### **Solution 1 : Supprimer la recherche de tokens JWT (RECOMMANDÉ)**

```typescript
// ❌ SUPPRIMER ce code dans designService.ts
const getAuthToken = () => {
    console.log('🔍 Tokens disponibles:');
    const jwt_token = localStorage.getItem('jwt_token');
    const token = localStorage.getItem('token');
    const authToken = localStorage.getItem('authToken');
    const access_token = localStorage.getItem('access_token');

    if (!jwt_token && !token && !authToken && !access_token) {
        console.log('⚠️ Aucun token JWT trouvé - utilisation des cookies');
        return null;
    }

    return jwt_token || token || authToken || access_token;
};

// ✅ REMPLACER par cette version simplifiée
const getAuthToken = () => {
    // Plus de recherche de tokens - utilisation des cookies uniquement
    return null;
};
```

### **Solution 2 : Simplifier getAuthHeaders**

```typescript
// ❌ ANCIEN CODE complexe
const getAuthHeaders = () => {
    const token = getAuthToken();

    if (token) {
        console.log('🔑 Utilisation du token JWT');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    } else {
        console.log('🍪 Utilisation des cookies pour l\'authentification');
        return {
            'Content-Type': 'application/json'
        };
    }
};

// ✅ NOUVEAU CODE simplifié
const getAuthHeaders = () => {
    console.log('🍪 Utilisation des cookies pour l\'authentification');
    return {
        'Content-Type': 'application/json'
        // Pas de header Authorization - les cookies sont automatiques
    };
};
```

### **Solution 3 : Utiliser credentials: 'include' partout**

```typescript
// ✅ EXEMPLE pour tous les appels API
const apiCall = async (url, options = {}) => {
    return fetch(url, {
        ...options,
        credentials: 'include', // 🔥 OBLIGATOIRE pour les cookies
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    });
};

// ✅ EXEMPLES concrets
const getDesigns = async () => {
    const response = await fetch('/api/designs', {
        credentials: 'include'
    });
    return response.json();
};

const createDesign = async (formData) => {
    const response = await fetch('/api/designs', {
        method: 'POST',
        credentials: 'include',
        body: formData // FormData n'a pas besoin de Content-Type
    });
    return response.json();
};
```

---

## 🔧 **CORRECTION SPÉCIFIQUE - ERREUR "Unexpected field"**

### **Problème identifié**
L'endpoint `/api/designs` rejette les uploads avec "Unexpected field" car le champ FormData n'a pas le bon nom.

### **Solutions**

#### **Option A : Corriger le nom du champ (RECOMMANDÉ)**
```typescript
// ❌ SI le frontend fait actuellement cela
const formData = new FormData();
formData.append('image', file);        // ❌ Nom incorrect
formData.append('design', file);       // ❌ Nom incorrect
formData.append('designFile', file);   // ❌ Nom incorrect

// ✅ CORRECTION - Le backend attend le champ 'file'
const formData = new FormData();
formData.append('file', file);         // ✅ Nom correct
formData.append('name', designName);
formData.append('description', description);
formData.append('price', price);
formData.append('category', category);
```

#### **Option B : Utiliser l'endpoint /vendor/designs (ALTERNATIF)**
```typescript
// ✅ Cet endpoint fonctionne avec JSON + base64
const createDesignViaVendorEndpoint = async (designData) => {
    const response = await fetch('/vendor/designs', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: designData.name,
            description: designData.description,
            category: designData.category,
            imageBase64: designData.imageBase64, // Format: "data:image/png;base64,..."
            price: designData.price
        })
    });

    if (!response.ok) {
        throw new Error(`Erreur ${response.status}: ${await response.text()}`);
    }

    return response.json();
};
```

---

## 📋 **VÉRIFICATION D'AUTHENTIFICATION**

### **Méthode recommandée**
```typescript
// ✅ Utiliser l'endpoint /auth/check pour vérifier l'authentification
const checkAuth = async () => {
    try {
        const response = await fetch('/auth/check', {
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();
            return {
                isAuthenticated: true,
                user: data.user
            };
        }

        return { isAuthenticated: false };
    } catch (error) {
        console.error('Erreur vérification auth:', error);
        return { isAuthenticated: false };
    }
};

// ✅ Utilisation dans les composants React
const useAuth = () => {
    const [auth, setAuth] = useState({ isAuthenticated: false, user: null });

    useEffect(() => {
        checkAuth().then(setAuth);
    }, []);

    return auth;
};
```

---

## 🛠 **CHECKLIST POUR LE FRONTEND**

### ✅ **À FAIRE**
- [ ] Supprimer toute recherche de tokens JWT dans localStorage/sessionStorage
- [ ] Remplacer par l'utilisation exclusive des cookies
- [ ] Ajouter `credentials: 'include'` à TOUS les appels API
- [ ] Corriger le nom du champ FormData pour `/api/designs` (utiliser 'file')
- [ ] Utiliser `/auth/check` pour vérifier l'authentification
- [ ] Tester les uploads de designs avec le bon nom de champ

### ❌ **À ÉVITER**
- [ ] ~~Chercher des tokens JWT en localStorage~~
- [ ] ~~Ajouter des headers Authorization manuellement~~
- [ ] ~~Utiliser des noms de champs incorrects pour les uploads~~
- [ ] ~~Oublier credentials: 'include' dans les appels API~~

---

## 🔬 **ENDPOINTS DE DEBUG**

### **Test de l'authentification**
```bash
# Vérifier si les cookies fonctionnent
curl -b "auth_token=your_cookie_value" http://localhost:3004/auth/debug-cookies

# Vérifier l'authentification
curl -b "auth_token=your_cookie_value" http://localhost:3004/auth/check
```

### **Test de création de design**
```bash
# Test avec le bon nom de champ
curl -X POST \
  -b "auth_token=your_cookie_value" \
  -F "file=@design.png" \
  -F "name=Test Design" \
  -F "price=1000" \
  -F "category=logo" \
  http://localhost:3004/api/designs
```

---

## 🎯 **RÉSUMÉ**

1. **L'authentification JWT fonctionne déjà** via les cookies httpOnly
2. **Le frontend doit arrêter de chercher des tokens JWT** inexistants
3. **Utiliser `credentials: 'include'`** dans tous les appels API
4. **Corriger le nom du champ** pour les uploads (`'file'` au lieu d'autre chose)
5. **L'erreur "Unexpected field" sera résolue** avec le bon nom de champ

Le système de sécurité est **plus robuste** avec les cookies httpOnly qu'avec des tokens JWT exposés en JavaScript !