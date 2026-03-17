# 🔧 Guide Frontend : Correction du suggestedPrice

## 🎯 Problème identifié

Le `suggestedPrice` est correctement envoyé par le frontend mais **n'est pas sauvegardé** en base de données. Après analyse, le **backend NestJS fonctionne parfaitement** - le problème est dans la communication frontend → backend.

---

## ✅ Backend : Corrections appliquées

Le backend a été corrigé et **fonctionne maintenant parfaitement** :

- ✅ `suggestedPrice` ajouté dans `CreateProductDto` et `UpdateProductDto`
- ✅ `suggestedPrice` ajouté dans les méthodes `create()` et `updateProduct()`
- ✅ Tests directs confirmés : `suggestedPrice` est bien sauvegardé en base

---

## 🔍 Diagnostic Frontend

### Le frontend envoie bien les données :
```javascript
// ✅ Payload frontend correct (vu dans erro.md)
{
  "name": "Test001",
  "price": 300000,
  "suggestedPrice": 300000,  // ← Présent !
  "genre": "FEMME",
  "status": "published"
  // ...
}
```

### Mais le backend NestJS ne reçoit pas la requête

**Hypothèses probables :**
1. **URL incorrecte** - Le frontend appelle un autre endpoint
2. **Environnement différent** - Le frontend utilise un autre backend
3. **Proxy/redirection** - La requête est redirigée ailleurs

---

## 🔧 Actions à effectuer côté Frontend

### 1. Vérifier l'URL d'appel

Ajoutez ces logs **juste avant l'envoi de la requête** :

```javascript
// Dans votre fonction de création de produit
console.log('🌐 URL de requête backend:', baseURL + '/products');
console.log('📤 Method:', method);
console.log('📊 Headers:', headers);
console.log('🔍 Payload complet:', JSON.stringify(payload, null, 2));
```

### 2. Vérifier les variables d'environnement

```javascript
// Vérifiez que votre frontend pointe vers le bon backend
console.log('🔧 Backend URL configuré:', process.env.REACT_APP_API_URL || 'http://localhost:3004');
```

### 3. Tester la connexion backend

Ajoutez ce test dans votre frontend :

```javascript
async function testBackendConnection() {
  try {
    console.log('🧪 Test de connexion backend...');
    
    // Test simple GET
    const response = await fetch('http://localhost:3004/products/1', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend connecté');
      console.log('📖 Produit test:', {
        id: data.id,
        name: data.name,
        suggestedPrice: data.suggestedPrice
      });
    } else {
      console.log('❌ Erreur backend:', response.status);
    }
  } catch (error) {
    console.log('💥 Erreur de connexion:', error.message);
  }
}

// Appelez cette fonction pour tester
testBackendConnection();
```

### 4. Forcer l'URL backend

Si le problème persiste, forcez l'URL explicitement :

```javascript
// Remplacez votre appel API par :
const BACKEND_URL = 'http://localhost:3004'; // ← URL explicite

async function createProduct(productData) {
  const url = `${BACKEND_URL}/products`;
  
  console.log('🎯 URL forcée:', url);
  console.log('📤 Données envoyées:', productData);
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(productData)
  });
  
  // Vérification de la réponse
  if (!response.ok) {
    console.error('❌ Erreur HTTP:', response.status, response.statusText);
    const errorText = await response.text();
    console.error('📄 Détails erreur:', errorText);
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  const result = await response.json();
  console.log('✅ Produit créé:', result);
  console.log('📊 suggestedPrice dans la réponse:', result.suggestedPrice);
  
  return result;
}
```

---

## 🕵️ Instructions de debug

### 1. Créer un produit depuis le frontend

Utilisez votre interface normale pour créer un produit avec `suggestedPrice`.

### 2. Surveiller les logs backend

Dans le terminal où tourne `npm run start` (backend), vous devriez voir :

```bash
🔍 [BACKEND] create method - DTO reçu: {...}
🔍 [BACKEND] create method - suggestedPrice reçu: 300000
🔍 [BACKEND] create method - productData avant création: {...}
💾 [BACKEND] create method - Produit créé avec suggestedPrice: 300000
```

### 3. Si aucun log backend n'apparaît :

❌ **Le frontend n'appelle pas le bon backend !**

**Actions :**
- Vérifiez votre configuration réseau/proxy
- Vérifiez vos variables d'environnement
- Testez l'URL manuellement dans le navigateur : `http://localhost:3004/products/1`

### 4. Si les logs apparaissent mais suggestedPrice est null :

✅ **Communication OK** - Problème dans le traitement backend

**Actions :**
- Envoyez-moi les logs backend complets
- Vérifiez si une validation échoue

---

## 📋 Checklist de vérification

- [ ] **URL backend** : Votre frontend appelle bien `http://localhost:3004/products`
- [ ] **Logs backend** : Vous voyez les logs de debug dans le terminal backend
- [ ] **Payload complet** : Le `suggestedPrice` est présent dans le JSON envoyé
- [ ] **Authentification** : L'utilisateur est bien connecté en tant qu'admin
- [ ] **CORS/Cookies** : Les cookies d'authentification sont bien envoyés

---

## 🎯 Test final

Pour confirmer que le problème est résolu, créez un produit et vérifiez :

```javascript
// Après création, vérifiez immédiatement
const createdProduct = await fetch(`http://localhost:3004/products/${productId}`);
const productData = await createdProduct.json();

console.log('🎉 Test final:');
console.log('   - suggestedPrice sauvegardé:', productData.suggestedPrice);
console.log('   - genre sauvegardé:', productData.genre);
console.log('   - status sauvegardé:', productData.status);
```

Si `suggestedPrice` est toujours `null` après ces vérifications, le problème est dans une **middleware de validation** ou une **transformation de données**.

---

## 📞 Support

Si le problème persiste après ces vérifications :

1. **Envoyez les logs backend complets**
2. **Confirmez l'URL utilisée par le frontend**
3. **Partagez le code de votre fonction d'appel API**

Le backend fonctionne parfaitement - il faut juste que le frontend communique avec lui correctement ! 🚀