# Guide Frontend : Création vendeur admin avec nom de boutique unique

## 🎯 Objectif
Lorsqu'un admin crée un vendeur, vérifier que le nom de boutique n'existe pas déjà avant la création.

---

## ✅ Ce qui est déjà fait côté backend

1. **Validation dans `createClient`** : Vérifie l'unicité du `shop_name` lors de la création
2. **Validation dans `createVendorWithPhoto`** : Vérifie l'unicité du `shop_name` lors de la création avec photo
3. **Validation dans `adminCreateVendor`** : Vérifie l'unicité du `shop_name` lors de la création admin
4. **Message d'erreur** : "Ce nom de boutique est déjà utilisé par un autre vendeur"

---

## 🚀 Implémentation Frontend

### 1. Gestion d'erreur simple

```jsx
const handleCreateVendor = async (formData) => {
  try {
    const response = await fetch('/auth/admin/create-vendor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      // ✅ Gestion spécifique du nom de boutique
      if (error.message.includes('nom de boutique')) {
        setShopNameError('Ce nom de boutique est déjà utilisé par un autre vendeur');
        return;
      }
      
      // ✅ Gestion de l'email déjà utilisé
      if (error.message.includes('Email déjà utilisé')) {
        setEmailError('Cet email est déjà utilisé par un autre vendeur');
        return;
      }
      
      throw new Error(error.message);
    }

    // ✅ Succès
    alert('Vendeur créé avec succès');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création du vendeur');
  }
};
```

### 2. Validation en temps réel (optionnel)

```jsx
import { useState, useEffect } from 'react';

function CreateVendorForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    vendeur_type: 'DESIGNER',
    phone: '',
    country: '',
    address: '',
    shop_name: ''
  });

  const [errors, setErrors] = useState({});
  const [isCheckingShopName, setIsCheckingShopName] = useState(false);

  // Vérification en temps réel du nom de boutique
  useEffect(() => {
    if (formData.shop_name && formData.shop_name.length > 2) {
      setIsCheckingShopName(true);
      
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/auth/check-shop-name?name=${encodeURIComponent(formData.shop_name)}`);
          if (response.ok) {
            const { available } = await response.json();
            if (!available) {
              setErrors(prev => ({ ...prev, shop_name: 'Ce nom de boutique est déjà utilisé' }));
            } else {
              setErrors(prev => ({ ...prev, shop_name: '' }));
            }
          }
        } catch (error) {
          console.error('Erreur vérification nom boutique:', error);
        } finally {
          setIsCheckingShopName(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setErrors(prev => ({ ...prev, shop_name: '' }));
    }
  }, [formData.shop_name]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Validation basique
    if (field === 'shop_name') {
      if (value.length < 3) {
        setErrors(prev => ({ ...prev, shop_name: 'Le nom doit contenir au moins 3 caractères' }));
      } else if (value.length > 0) {
        setErrors(prev => ({ ...prev, shop_name: '' }));
      }
    }
  };

  return (
    <form onSubmit={handleCreateVendor}>
      <div>
        <label>Prénom *</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
          required
        />
      </div>

      <div>
        <label>Nom *</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
          required
        />
      </div>

      <div>
        <label>Email *</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
          className={errors.email ? 'error' : ''}
          required
        />
        {errors.email && <span className="error">{errors.email}</span>}
      </div>

      <div>
        <label>Mot de passe *</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => handleInputChange('password', e.target.value)}
          minLength={8}
          required
        />
      </div>

      <div>
        <label>Type de vendeur *</label>
        <select
          value={formData.vendeur_type}
          onChange={(e) => handleInputChange('vendeur_type', e.target.value)}
          required
        >
          <option value="DESIGNER">Designer</option>
          <option value="ARTISTE">Artiste</option>
          <option value="INFLUENCEUR">Influenceur</option>
        </select>
      </div>

      <div>
        <label>Nom de la boutique</label>
        <input
          type="text"
          value={formData.shop_name}
          onChange={(e) => handleInputChange('shop_name', e.target.value)}
          className={errors.shop_name ? 'error' : ''}
          placeholder="Nom de la boutique (optionnel)"
        />
        {isCheckingShopName && <span>Vérification...</span>}
        {errors.shop_name && <span className="error">{errors.shop_name}</span>}
      </div>

      <div>
        <label>Téléphone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
          placeholder="+33 6 12 34 56 78"
        />
      </div>

      <div>
        <label>Pays</label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
          placeholder="France"
        />
      </div>

      <div>
        <label>Adresse</label>
        <textarea
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
          placeholder="123 Rue de la Paix, 75001 Paris"
        />
      </div>

      <button type="submit" disabled={Object.keys(errors).some(key => errors[key])}>
        Créer le vendeur
      </button>
    </form>
  );
}
```

### 3. Exemple avec création avec photo

```jsx
const handleCreateVendorWithPhoto = async (formData, photoFile) => {
  try {
    const data = new FormData();
    
    // Ajouter les données du formulaire
    Object.keys(formData).forEach(key => {
      if (formData[key]) {
        data.append(key, formData[key]);
      }
    });
    
    // Ajouter la photo si fournie
    if (photoFile) {
      data.append('profilePhoto', photoFile);
    }

    const response = await fetch('/auth/admin/create-vendor-with-photo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
        // Ne pas mettre Content-Type, il est géré automatiquement par FormData
      },
      body: data
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (error.message.includes('nom de boutique')) {
        setShopNameError('Ce nom de boutique est déjà utilisé par un autre vendeur');
        return;
      }
      
      throw new Error(error.message);
    }

    alert('Vendeur créé avec succès');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la création du vendeur');
  }
};
```

---

## 🎨 CSS pour les erreurs

```css
.error {
  border-color: #dc3545 !important;
  color: #dc3545;
}

.error-message {
  color: #dc3545;
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

input.error {
  border: 2px solid #dc3545;
  background-color: #fff5f5;
}

.checking {
  color: #6c757d;
  font-size: 0.875rem;
  font-style: italic;
}
```

---

## 📋 Checklist d'implémentation

- [ ] Ajouter la gestion d'erreur spécifique pour "nom de boutique"
- [ ] Afficher le message d'erreur sous le champ shop_name
- [ ] Validation basique (longueur minimale)
- [ ] Validation en temps réel (optionnel)
- [ ] Style CSS pour les erreurs
- [ ] Test avec un nom de boutique déjà utilisé
- [ ] Gestion de la création avec photo

---

## 🔧 Endpoints disponibles

1. **`POST /auth/admin/create-vendor`** - Création simple
2. **`POST /auth/admin/create-vendor-with-photo`** - Création avec photo
3. **`GET /auth/check-shop-name?name=...`** - Vérification en temps réel (optionnel)

---

## ✅ Résumé

1. **Backend** : Validation d'unicité dans toutes les méthodes de création admin
2. **Frontend** : Gestion d'erreur spécifique + validation basique
3. **UX** : Messages d'erreur clairs + feedback visuel
4. **Support** : Création simple et avec photo

**Le nom de boutique est maintenant unique lors de la création admin !** 🎉 