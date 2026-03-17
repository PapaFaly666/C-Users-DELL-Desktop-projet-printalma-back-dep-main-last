# 🐛 GUIDE DEBUG AFFICHAGE IMAGES - ARCHITECTURE V2

## 🚨 PROBLÈME IDENTIFIÉ

Le frontend récupère des données qui ne sont **PAS** conformes à l'architecture v2 :

```javascript
// ❌ DONNÉES REÇUES (Incorrect - Produits Admin)
{
  id: 320,
  name: "Casquette", 
  status: "PENDING",
  isValidated: false,
  readyToPublish: false,
  pendingAutoPublish: true,
  workflow: "AUTO-PUBLISH"  // ← Ceci n'existe pas en v2 !
}
```

```javascript
// ✅ DONNÉES ATTENDUES (Architecture v2 - Produits Vendeur)
{
  id: 123,
  vendorName: "T-shirt Dragon Rouge Premium",
  originalAdminName: "T-shirt Basique", 
  price: 25000,
  status: "DRAFT",
  images: {
    primaryImageUrl: "https://cloudinary.com/...",
    adminReferences: [...],
    validation: { isHealthy: true }
  },
  designApplication: {
    hasDesign: true,
    positioning: "CENTER",
    scale: 0.6
  },
  adminProduct: { ... },
  architecture: "v2_preserved_admin"
}
```

---

## 🔍 DIAGNOSTIC ET SOLUTIONS

### 1. Vérifier l'endpoint appelé

**Problème** : Le frontend appelle probablement un mauvais endpoint

```javascript
// ❌ MAUVAIS ENDPOINT (Produits Admin)
fetch('/api/products')  // Retourne les produits admin

// ✅ BON ENDPOINT (Produits Vendeur v2)  
fetch('/api/vendor/products')  // Retourne les produits vendeur v2
```

### 2. Vérifier la structure de réponse

Ajoutez ce debug dans votre composant React :

```javascript
// Debug à ajouter dans ProductListModern.tsx
useEffect(() => {
  console.log('🔍 DEBUG: URL appelée:', apiUrl);
  console.log('🔍 DEBUG: Headers:', headers);
}, []);

// Après réception des données
useEffect(() => {
  if (products) {
    console.log('🔍 DEBUG: Structure complète reçue:', products);
    console.log('🔍 DEBUG: Premier produit:', products[0]);
    console.log('🔍 DEBUG: A-t-il designApplication?', products[0]?.designApplication);
    console.log('🔍 DEBUG: A-t-il images.primaryImageUrl?', products[0]?.images?.primaryImageUrl);
    console.log('🔍 DEBUG: Architecture:', products[0]?.architecture || 'NON DÉFINIE');
  }
}, [products]);
```

### 3. Correction de l'appel API

**Si vous appelez `/api/products` :**

```javascript
// ❌ AVANT (Produits Admin)
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    setProducts(data.products || data);
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

```javascript
// ✅ APRÈS (Produits Vendeur v2)
const fetchVendorProducts = async () => {
  try {
    const response = await fetch('/api/vendor/products', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    // Vérifier la structure v2
    if (result.architecture === 'v2_preserved_admin') {
      console.log('✅ Architecture v2 détectée');
      setProducts(result.data.products);
    } else {
      console.error('❌ Architecture v2 non détectée:', result);
    }
  } catch (error) {
    console.error('Erreur:', error);
  }
};
```

### 4. Adapter le composant pour l'architecture v2

**Mise à jour du composant ProductListModern.tsx :**

```javascript
// Fonction pour détecter le type de données
const detectDataType = (product) => {
  if (product.architecture === 'v2_preserved_admin' || 
      product.designApplication || 
      product.originalAdminName) {
    return 'v2';
  }
  if (product.workflow === 'AUTO-PUBLISH' || 
      product.pendingAutoPublish !== undefined) {
    return 'admin';
  }
  return 'unknown';
};

// Composant ProductCard adaptatif
const ProductCard = ({ product }) => {
  const dataType = detectDataType(product);
  
  if (dataType === 'v2') {
    // ✅ Rendu pour architecture v2
    return (
      <div className="product-card" onClick={() => viewProduct(product.id)}>
        <div className="image-container">
          {product.images?.primaryImageUrl ? (
            <img 
              src={product.images.primaryImageUrl} 
              alt={product.vendorName}
              className="product-image"
              onError={(e) => {
                console.error('Erreur chargement image:', e);
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          ) : (
            <div className="no-image-placeholder">
              📦 Aucune image
            </div>
          )}
          
          {product.designApplication?.hasDesign && (
            <div className="design-badge">
              🎨 Design personnalisé
            </div>
          )}
        </div>
        
        <div className="product-info">
          <h3>{product.vendorName}</h3>
          <p className="original-name">{product.originalAdminName}</p>
          <div className="price">{product.price?.toLocaleString()} FCFA</div>
          <div className="status">{product.status}</div>
          
          {product.selectedColors?.length > 0 && (
            <div className="colors">
              {product.selectedColors.map(color => (
                <span 
                  key={color.id}
                  className="color-dot" 
                  style={{ backgroundColor: color.colorCode }}
                  title={color.name}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  } else if (dataType === 'admin') {
    // ⚠️ Données admin détectées - Affichage d'erreur
    return (
      <div className="product-card error">
        <div className="error-content">
          <h3>⚠️ Données Admin Détectées</h3>
          <p>Ce composant attend des produits vendeur (Architecture v2)</p>
          <p><strong>Produit:</strong> {product.name}</p>
          <p><strong>Type détecté:</strong> Produit Admin</p>
          <button onClick={() => console.log('Données complètes:', product)}>
            🔍 Debug dans console
          </button>
        </div>
      </div>
    );
  } else {
    // ❌ Type inconnu
    return (
      <div className="product-card error">
        <div className="error-content">
          <h3>❌ Structure Inconnue</h3>
          <p>Structure de données non reconnue</p>
          <button onClick={() => console.log('Données:', product)}>
            🔍 Debug dans console
          </button>
        </div>
      </div>
    );
  }
};
```

### 5. CSS pour les messages d'erreur

```css
.product-card.error {
  border: 2px solid #ff4444;
  background: #fff5f5;
}

.error-content {
  padding: 1rem;
  text-align: center;
}

.error-content h3 {
  color: #cc0000;
  margin-bottom: 0.5rem;
}

.error-content p {
  margin: 0.25rem 0;
  font-size: 0.9rem;
  color: #666;
}

.error-content button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.no-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background: #f8f9fa;
  color: #6c757d;
  font-size: 2rem;
}
```

---

## 🛠️ SCRIPT DE DIAGNOSTIC COMPLET

Créez ce script pour diagnostiquer le problème :

```javascript
// diagnostic-v2.js - À exécuter dans la console du navigateur
const diagnosePrintAlmaV2 = async () => {
  console.log('🔍 DIAGNOSTIC PRINTALMA ARCHITECTURE V2');
  console.log('=' .repeat(50));
  
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  
  if (!token) {
    console.error('❌ Aucun token trouvé');
    return;
  }
  
  console.log('✅ Token trouvé');
  
  // Test endpoint produits admin
  try {
    console.log('\n🧪 Test endpoint produits admin...');
    const adminResponse = await fetch('/api/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const adminData = await adminResponse.json();
    console.log('📊 Réponse produits admin:', {
      status: adminResponse.status,
      count: adminData.products?.length || 0,
      structure: adminData.products?.[0] ? Object.keys(adminData.products[0]) : [],
      sample: adminData.products?.[0]
    });
  } catch (error) {
    console.error('❌ Erreur produits admin:', error);
  }
  
  // Test endpoint produits vendeur v2
  try {
    console.log('\n🧪 Test endpoint produits vendeur v2...');
    const vendorResponse = await fetch('/api/vendor/products', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const vendorData = await vendorResponse.json();
    console.log('📊 Réponse produits vendeur:', {
      status: vendorResponse.status,
      success: vendorData.success,
      architecture: vendorData.architecture,
      count: vendorData.data?.products?.length || 0,
      structure: vendorData.data?.products?.[0] ? Object.keys(vendorData.data.products[0]) : [],
      sample: vendorData.data?.products?.[0]
    });
    
    if (vendorData.architecture === 'v2_preserved_admin') {
      console.log('✅ Architecture v2 confirmée !');
      
      const firstProduct = vendorData.data?.products?.[0];
      if (firstProduct) {
        console.log('\n🖼️ Test images premier produit:');
        console.log('- Primary Image URL:', firstProduct.images?.primaryImageUrl);
        console.log('- Design Application:', firstProduct.designApplication);
        console.log('- Admin References:', firstProduct.images?.adminReferences?.length || 0);
      }
    } else {
      console.warn('⚠️ Architecture v2 non détectée');
    }
  } catch (error) {
    console.error('❌ Erreur produits vendeur:', error);
  }
  
  // Test health check
  try {
    console.log('\n🏥 Test health check...');
    const healthResponse = await fetch('/api/vendor/health', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const healthData = await healthResponse.json();
    console.log('💚 Health check:', healthData);
  } catch (error) {
    console.error('❌ Erreur health check:', error);
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🎯 CONCLUSION:');
  console.log('- Si les produits admin s\'affichent → Le frontend appelle le mauvais endpoint');
  console.log('- Si les produits vendeur sont vides → Créer des produits vendeur d\'abord');
  console.log('- Si architecture v2 non détectée → Problème serveur backend');
};

// Exécuter le diagnostic
diagnosePrintAlmaV2();
```

---

## ✅ ACTIONS IMMÉDIATES

### 1. Exécutez le script de diagnostic
Copiez le script ci-dessus dans la console de votre navigateur pour identifier le problème exact.

### 2. Vérifiez l'endpoint
Assurez-vous que votre frontend appelle `/api/vendor/products` et non `/api/products`.

### 3. Créez des produits vendeur de test
Si vous n'avez pas de produits vendeur, utilisez le script de test :

```bash
node test-new-architecture-simple.js
```

### 4. Adaptez votre composant
Utilisez le composant ProductCard adaptatif ci-dessus qui détecte automatiquement le type de données.

---

## 🎯 RÉSUMÉ DU PROBLÈME

Le frontend reçoit des **produits admin** au lieu des **produits vendeur v2** :

- ❌ **Données reçues** : `{id, name, status, workflow: "AUTO-PUBLISH"}`
- ✅ **Données attendues** : `{vendorName, images: {primaryImageUrl}, designApplication}`

**Solution** : Appeler `/api/vendor/products` au lieu de `/api/products` et adapter le composant pour la structure v2.

Exécutez le diagnostic pour confirmer le problème exact ! 🚀 