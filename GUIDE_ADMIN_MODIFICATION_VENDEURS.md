# 📝 Guide Simple - Modification des Vendeurs par l'Admin

## 🎯 Résumé Rapide

L'admin peut maintenant modifier toutes les informations des vendeurs via 3 nouveaux endpoints sécurisés.

---

## 🔗 Endpoints Disponibles

### 1. **Liste des vendeurs**
```
GET /auth/admin/vendors
```
**Filtres optionnels :**
- `?page=1&limit=10` - Pagination
- `?status=true` - Vendeurs actifs seulement  
- `?vendeur_type=DESIGNER` - Par type
- `?search=jean` - Recherche par nom/email/boutique

### 2. **Récupérer un vendeur**
```
GET /auth/admin/vendors/123
```

### 3. **Modifier un vendeur**
```
PUT /auth/admin/vendors/123
Content-Type: multipart/form-data
```

---

## 🔑 Authentification

**Obligatoire dans tous les appels :**
```javascript
headers: {
  'Authorization': 'Bearer YOUR_ADMIN_JWT_TOKEN'
}
```

---

## 📄 Champs Modifiables

**Tous les champs sont optionnels :**

| Champ | Type | Exemple |
|-------|------|---------|
| `firstName` | string | "Jean" |
| `lastName` | string | "Dupont" |
| `email` | string | "jean@example.com" |
| `vendeur_type` | enum | "DESIGNER", "INFLUENCEUR", "ARTISTE" |
| `phone` | string | "+33 6 12 34 56 78" |
| `country` | string | "France" |
| `address` | string | "123 Rue de la Paix" |
| `shop_name` | string | "Boutique Jean" |
| `status` | boolean | true/false |
| `profilePhoto` | File | Fichier image (PNG/JPG) |

**⚠️ Note importante :** Le champ `must_change_password` est automatiquement défini à `false` lors de toute modification par l'admin.

---

## 💻 Code JavaScript Simple

```javascript
// Service de base
class VendorAdminService {
  constructor(adminToken) {
    this.token = adminToken;
    this.baseUrl = '/auth/admin/vendors';
  }

  // Récupérer la liste
  async getList(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({ page, limit, ...filters });
    const response = await fetch(`${this.baseUrl}?${params}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  // Récupérer un vendeur
  async getOne(vendorId) {
    const response = await fetch(`${this.baseUrl}/${vendorId}`, {
      headers: { 'Authorization': `Bearer ${this.token}` }
    });
    return response.json();
  }

  // Modifier un vendeur
  async update(vendorId, data, photo = null) {
    const formData = new FormData();
    
    // Ajouter les données texte
    Object.keys(data).forEach(key => {
      if (data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });

    // Ajouter la photo si présente
    if (photo) {
      formData.append('profilePhoto', photo);
    }

    const response = await fetch(`${this.baseUrl}/${vendorId}`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${this.token}` },
      body: formData
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur de modification');
    }
    
    return response.json();
  }
}
```

---

## ⚛️ Exemple React

```jsx
import { useState, useEffect } from 'react';

function EditVendor({ vendorId, onSave }) {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const service = new VendorAdminService(localStorage.getItem('admin_token'));

  // Charger le vendeur
  useEffect(() => {
    service.getOne(vendorId)
      .then(setVendor)
      .catch(err => setMessage(`Erreur: ${err.message}`));
  }, [vendorId]);

  // Sauvegarder les modifications
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.target);
      const photo = formData.get('profilePhoto');
      
      // Convertir FormData en objet
      const data = {};
      for (let [key, value] of formData.entries()) {
        if (key !== 'profilePhoto' && value) {
          data[key] = value === 'true' ? true : value === 'false' ? false : value;
        }
      }

      await service.update(vendorId, data, photo.size > 0 ? photo : null);
      setMessage('✅ Vendeur modifié avec succès');
      onSave && onSave();
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) return <div>Chargement...</div>;

  return (
    <form onSubmit={handleSubmit}>
      <h2>Modifier {vendor.firstName} {vendor.lastName}</h2>

      <div>
        <label>Prénom:
          <input name="firstName" defaultValue={vendor.firstName} />
        </label>
      </div>

      <div>
        <label>Nom:
          <input name="lastName" defaultValue={vendor.lastName} />
        </label>
      </div>

      <div>
        <label>Email:
          <input name="email" type="email" defaultValue={vendor.email} />
        </label>
      </div>

      <div>
        <label>Type:
          <select name="vendeur_type" defaultValue={vendor.vendeur_type}>
            <option value="DESIGNER">Designer</option>
            <option value="INFLUENCEUR">Influenceur</option>
            <option value="ARTISTE">Artiste</option>
          </select>
        </label>
      </div>

      <div>
        <label>Téléphone:
          <input name="phone" defaultValue={vendor.phone} />
        </label>
      </div>

      <div>
        <label>Pays:
          <input name="country" defaultValue={vendor.country} />
        </label>
      </div>

      <div>
        <label>Nom de boutique:
          <input name="shop_name" defaultValue={vendor.shop_name} />
        </label>
      </div>

      <div>
        <label>Statut:
          <select name="status" defaultValue={vendor.status}>
            <option value="true">Actif</option>
            <option value="false">Inactif</option>
          </select>
        </label>
      </div>

      <div>
        <label>Nouvelle photo:
          <input name="profilePhoto" type="file" accept="image/*" />
        </label>
      </div>

      {/* must_change_password est automatiquement défini à false côté backend */}

      <button type="submit" disabled={loading}>
        {loading ? 'Sauvegarde...' : 'Sauvegarder'}
      </button>

      {message && <div className="message">{message}</div>}
    </form>
  );
}
```

---

## 📊 Réponses API

### ✅ Succès
```json
{
  "id": 123,
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "vendeur_type": "DESIGNER",
  "status": true,
  "profile_photo_url": "https://cloudinary.../photo.png",
  "updated_at": "2024-01-15T10:30:00Z"
}
```

### ❌ Erreurs Courantes
```json
// 404 - Vendeur introuvable
{"message": "Vendeur non trouvé"}

// 409 - Email déjà utilisé  
{"message": "Cette adresse email est déjà utilisée"}

// 409 - Nom de boutique déjà utilisé
{"message": "Ce nom de boutique est déjà utilisé"}

// 400 - Tentative de modifier un SUPERADMIN
{"message": "Impossible de modifier un compte SUPERADMIN"}
```

---

## ⚡ Points Importants

1. **MultiPart/FormData obligatoire** pour l'upload de photos
2. **Email et shop_name** doivent être uniques
3. **Les SUPERADMIN** ne peuvent pas être modifiés
4. **Photos automatiquement** redimensionnées en 300x300px
5. **Token Admin** requis pour tous les appels
6. **must_change_password automatiquement défini à false** lors de toute modification admin

---

## 🚀 Test Rapide

```bash
# Récupérer un vendeur
curl -H "Authorization: Bearer TOKEN" \
     https://api.example.com/auth/admin/vendors/123

# Modifier un vendeur
curl -X PUT \
     -H "Authorization: Bearer TOKEN" \
     -F "firstName=Jean" \
     -F "email=jean.nouveau@example.com" \
     -F "status=true" \
     https://api.example.com/auth/admin/vendors/123
```

---

**🎯 C'est tout ! Les endpoints sont prêts à utiliser.**