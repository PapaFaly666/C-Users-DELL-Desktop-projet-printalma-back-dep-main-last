# 🔧 CORRECTION UPLOAD DESIGNS - 404 RESOLU

## 🚨 **PROBLÈMES IDENTIFIÉS**

Le frontend essaie d'uploader des designs via des endpoints qui n'existent pas :

1. ❌ `POST http://localhost:3004/vendor/design-product/upload-design` - 404
2. ❌ `POST http://localhost:3004/vendor/designs` - 404

## ✅ **ENDPOINTS RÉELS DISPONIBLES**

### **1. Endpoint Principal - Upload Design (Recommandé)**
```http
POST http://localhost:3004/api/designs
```

**Headers requis :**
```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (FormData) :**
```javascript
const formData = new FormData();
formData.append('file', designFile);
formData.append('name', 'Mon Design');
formData.append('description', 'Description du design');
formData.append('price', '2500');
formData.append('category', 'logo');
```

### **2. Endpoint Vendor Publish - Upload Design**
```http
POST http://localhost:3004/vendor/designs
```

**Headers requis :**
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (JSON) :**
```javascript
{
  "name": "Mon Design",
  "description": "Description du design",
  "category": "ILLUSTRATION",
  "imageBase64": "data:image/png;base64,...",
  "tags": ["créatif", "moderne"]
}
```

### **3. Endpoint Upload Design pour Produit Vendeur**
```http
POST http://localhost:3004/vendor/design-product/upload-design
```

**Headers requis :**
```
Content-Type: multipart/form-data
Authorization: Bearer YOUR_JWT_TOKEN
```

**Body (FormData) :**
```javascript
const formData = new FormData();
formData.append('image', designFile);
formData.append('vendorProductId', '123');
formData.append('colorId', '456'); // optionnel
```

## 🔐 **AUTHENTIFICATION REQUISE**

Tous les endpoints d'upload nécessitent :
- ✅ **JWT Token** (authentification)
- ✅ **Rôle Vendeur** (pour créer des designs)

### **Code des endpoints :**
```typescript
// Endpoint principal
@Controller('api/designs')
@UseGuards(JwtAuthGuard)
export class DesignController {
  @Post()
  @UseInterceptors(FileInterceptor('file', multerConfig))
  async createDesign(
    @Request() req,
    @Body() createDesignDto: CreateDesignDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const vendorId = req.user.id;
    // ...
  }
}

// Endpoint vendor publish
@Controller('vendor')
@UseGuards(JwtAuthGuard)
export class VendorPublishController {
  @Post('designs')
  async createDesign(
    @Body() designData: CreateDesignDto,
    @Request() req: any
  ) {
    const vendorId = req.user.sub;
    // ...
  }
}
```

## 🎯 **SOLUTIONS POUR LE FRONTEND**

### **Option 1 : Utiliser l'endpoint principal (Recommandé)**

Dans votre `designService.ts`, ligne 913 :

```typescript
// ❌ ACTUEL (problématique)
const response = await fetch('/vendor/design-product/upload-design', {
  method: 'POST',
  body: formData
});

// ✅ CORRIGER vers l'endpoint principal
const response = await fetch('/api/designs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.getAuthToken()}`
  },
  body: formData
});
```

### **Option 2 : Utiliser l'endpoint vendor publish**

```typescript
// ✅ AVEC JSON ET BASE64
const designData = {
  name: designName,
  description: designDescription,
  category: designCategory,
  imageBase64: base64String,
  tags: designTags
};

const response = await fetch('/vendor/designs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.getAuthToken()}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(designData)
});
```

### **Option 3 : Utiliser l'endpoint design-product**

```typescript
// ✅ POUR UPLOADER UN DESIGN SUR UN PRODUIT SPÉCIFIQUE
const formData = new FormData();
formData.append('image', designFile);
formData.append('vendorProductId', vendorProductId);
formData.append('colorId', colorId);

const response = await fetch('/vendor/design-product/upload-design', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${this.getAuthToken()}`
  },
  body: formData
});
```

## 📋 **GUIDE DE CORRECTION FRONTEND**

### **1. Corriger designService.ts**

```typescript
// Dans designService.ts, ligne 913
async createDesign(designData, file) {
  try {
    console.log('🎨 Upload du design...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', designData.name);
    formData.append('description', designData.description || '');
    formData.append('price', designData.price?.toString() || '2500');
    formData.append('category', designData.category || 'logo');
    
    // ✅ UTILISER L'ENDPOINT PRINCIPAL
    const response = await fetch('/api/designs', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Design créé avec succès:', data.data);
      return data.data;
    } else {
      throw new Error(data.message || 'Erreur création design');
    }
  } catch (error) {
    console.error('❌ Erreur création design:', error);
    throw error;
  }
}
```

### **2. Corriger vendorDesignProductAPI.ts**

```typescript
// Dans vendorDesignProductAPI.ts, ligne 43
async uploadDesign(vendorProductId, colorId, imageFile) {
  try {
    console.log('🎨 Upload design pour produit vendeur...');
    
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('vendorProductId', vendorProductId.toString());
    if (colorId) {
      formData.append('colorId', colorId.toString());
    }
    
    // ✅ UTILISER LE BON ENDPOINT
    const response = await fetch('/vendor/design-product/upload-design', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ Erreur upload design:', error);
    throw error;
  }
}
```

### **3. Adapter SellDesignPage.tsx**

```typescript
// Dans SellDesignPage.tsx, ligne 2971
const handleConfirmDesignPrice = async () => {
  try {
    console.log('🎨 Confirmation du prix du design...');
    
    // ✅ UTILISER LE NOUVEAU SERVICE
    const design = await designService.createDesign({
      name: designName,
      description: designDescription,
      price: designPrice,
      category: designCategory
    }, designFile);
    
    console.log('✅ Design créé:', design);
    setCreatedDesign(design);
    
  } catch (error) {
    console.error('❌ Erreur création design:', error);
    // Gérer l'erreur (afficher message, etc.)
  }
};
```

### **4. Code de correction complet**

```typescript
// Dans designService.ts
class DesignService {
  private getAuthToken(): string {
    return localStorage.getItem('jwt_token') || '';
  }

  async createDesign(designData, file) {
    try {
      console.log('🎨 Création du design...');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', designData.name);
      formData.append('description', designData.description || '');
      formData.append('price', designData.price?.toString() || '2500');
      formData.append('category', designData.category || 'logo');
      
      const response = await fetch('/api/designs', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Design créé avec succès:', data.data);
        return data.data;
      } else {
        throw new Error(data.message || 'Erreur création design');
      }
    } catch (error) {
      console.error('❌ Erreur création design:', error);
      throw error;
    }
  }

  async uploadDesignToProduct(vendorProductId, colorId, imageFile) {
    try {
      console.log('🎨 Upload design sur produit...');
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('vendorProductId', vendorProductId.toString());
      if (colorId) {
        formData.append('colorId', colorId.toString());
      }
      
      const response = await fetch('/vendor/design-product/upload-design', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ Erreur upload design sur produit:', error);
      throw error;
    }
  }
}
```

## 🧪 **TEST DE VALIDATION**

### **Test de l'endpoint principal :**
```bash
# ✅ Test avec token et fichier
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
}
$formData = @{
    file = Get-Item "path/to/design.png"
    name = "Test Design"
    description = "Description test"
    price = "2500"
    category = "logo"
}
Invoke-WebRequest -Uri "http://localhost:3004/api/designs" -Method POST -Headers $headers -Form $formData

# Résultat attendu : 201 Created avec données du design
```

### **Test de l'endpoint vendor :**
```bash
# ✅ Test avec JSON
$headers = @{
    "Authorization" = "Bearer YOUR_JWT_TOKEN"
    "Content-Type" = "application/json"
}
$body = @{
    name = "Test Design"
    description = "Description test"
    category = "ILLUSTRATION"
    imageBase64 = "data:image/png;base64,..."
    tags = @("test", "design")
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3004/vendor/designs" -Method POST -Headers $headers -Body $body

# Résultat attendu : 201 Created avec données du design
```

## 🎯 **RÉSUMÉ DES ACTIONS**

### **✅ Backend (Déjà fonctionnel) :**
1. Endpoint `/api/designs` existe et fonctionne
2. Endpoint `/vendor/designs` existe et fonctionne
3. Endpoint `/vendor/design-product/upload-design` existe
4. Authentification JWT requise
5. Upload de fichiers configuré

### **🔧 Frontend (À faire) :**
1. **Changer les URLs** vers les bons endpoints
2. **Ajouter l'authentification** avec JWT token
3. **Adapter les formats** (FormData vs JSON)
4. **Gérer les erreurs** 401/404
5. **Tester** avec les nouveaux endpoints

## 🚀 **COMMANDES DE TEST**

```bash
# Test endpoint principal (avec fichier)
curl -X POST "http://localhost:3004/api/designs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@design.png" \
  -F "name=Test Design" \
  -F "description=Description test" \
  -F "price=2500" \
  -F "category=logo"

# Test endpoint vendor (avec JSON)
curl -X POST "http://localhost:3004/vendor/designs" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Design",
    "description": "Description test",
    "category": "ILLUSTRATION",
    "imageBase64": "data:image/png;base64,...",
    "tags": ["test", "design"]
  }'
```

## 🔑 **GESTION DE L'AUTHENTIFICATION**

### **Vérifier si l'utilisateur est connecté :**
```typescript
const isAuthenticated = () => {
  const token = localStorage.getItem('jwt_token');
  return !!token;
};

// Dans le service
if (!isAuthenticated()) {
  throw new Error('Utilisateur non authentifié');
}
```

### **Redirection vers login si nécessaire :**
```typescript
if (!isAuthenticated()) {
  // Rediriger vers la page de login
  window.location.href = '/login';
  return;
}
```

**🎉 Les endpoints d'upload designs existent ! Il suffit de corriger les URLs et ajouter l'authentification dans le frontend.** 