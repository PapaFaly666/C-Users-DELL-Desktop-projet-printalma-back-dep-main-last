# Guide Rapide Frontend : Nom de boutique unique

## 🎯 Objectif
Empêcher deux vendeurs d'utiliser le même nom de boutique.

---

## ✅ Ce qui est déjà fait côté backend

1. **Contrainte base de données** : `shop_name` a `@unique` dans le schéma Prisma
2. **Validation backend** : `AuthService.updateVendorProfile()` vérifie l'unicité
3. **Message d'erreur** : "Ce nom de boutique est déjà utilisé par un autre vendeur."

---

## 🚀 Implémentation Frontend

### 1. Gestion d'erreur simple

```jsx
const handleProfileUpdate = async (formData) => {
  try {
    const response = await fetch('/auth/vendor/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
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
      
      throw new Error(error.message);
    }

    // ✅ Succès
    alert('Profil mis à jour avec succès');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la mise à jour');
  }
};
```

### 2. Validation en temps réel (optionnel)

```jsx
import { useState, useEffect } from 'react';

function ShopNameInput() {
  const [shopName, setShopName] = useState('');
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (shopName.length > 2) {
      setIsChecking(true);
      
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/auth/check-shop-name?name=${encodeURIComponent(shopName)}`);
          const { available } = await response.json();
          
          if (!available) {
            setError('Ce nom de boutique est déjà utilisé');
          } else {
            setError('');
          }
        } catch (error) {
          console.error('Erreur vérification:', error);
        } finally {
          setIsChecking(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setError('');
    }
  }, [shopName]);

  return (
    <div>
      <input
        type="text"
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        placeholder="Nom de votre boutique"
        className={error ? 'error' : ''}
      />
      {isChecking && <span>Vérification...</span>}
      {error && <span className="error">{error}</span>}
    </div>
  );
}
```

### 3. Exemple complet avec React

```jsx
import React, { useState } from 'react';

function VendorProfileForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: '',
    address: '',
    shop_name: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // ✅ Validation basique du nom de boutique
    if (field === 'shop_name') {
      if (value.length < 3) {
        setErrors(prev => ({ ...prev, shop_name: 'Le nom doit contenir au moins 3 caractères' }));
      } else {
        setErrors(prev => ({ ...prev, shop_name: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/auth/vendor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        
        // ✅ Gestion spécifique du nom de boutique
        if (error.message.includes('nom de boutique')) {
          setErrors(prev => ({ 
            ...prev, 
            shop_name: 'Ce nom de boutique est déjà utilisé par un autre vendeur' 
          }));
          return;
        }
        
        throw new Error(error.message);
      }

      // ✅ Succès
      alert('Profil mis à jour avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Prénom</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => handleInputChange('firstName', e.target.value)}
        />
      </div>

      <div>
        <label>Nom</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => handleInputChange('lastName', e.target.value)}
        />
      </div>

      <div>
        <label>Nom de la boutique *</label>
        <input
          type="text"
          value={formData.shop_name}
          onChange={(e) => handleInputChange('shop_name', e.target.value)}
          className={errors.shop_name ? 'error' : ''}
          required
        />
        {errors.shop_name && <span className="error">{errors.shop_name}</span>}
      </div>

      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => handleInputChange('email', e.target.value)}
        />
      </div>

      <div>
        <label>Téléphone</label>
        <input
          type="tel"
          value={formData.phone}
          onChange={(e) => handleInputChange('phone', e.target.value)}
        />
      </div>

      <div>
        <label>Pays</label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => handleInputChange('country', e.target.value)}
        />
      </div>

      <div>
        <label>Adresse</label>
        <textarea
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Mise à jour...' : 'Mettre à jour le profil'}
      </button>
    </form>
  );
}

export default VendorProfileForm;
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
```

---

## 📋 Checklist d'implémentation

- [ ] Ajouter la gestion d'erreur spécifique pour "nom de boutique"
- [ ] Afficher le message d'erreur sous le champ shop_name
- [ ] Validation basique (longueur minimale)
- [ ] Style CSS pour les erreurs
- [ ] Test avec un nom de boutique déjà utilisé

---

## 🔧 Endpoint de vérification (optionnel)

Si tu veux une vérification en temps réel, ajoute cet endpoint dans `AuthController` :

```typescript
@Get('check-shop-name')
@ApiOperation({ summary: 'Vérifier si un nom de boutique est disponible' })
async checkShopName(@Query('name') name: string) {
  const existing = await this.prisma.user.findFirst({
    where: { shop_name: name }
  });
  
  return { available: !existing };
}
```

---

## ✅ Résumé

1. **Backend** : Contrainte `@unique` + validation dans `AuthService`
2. **Frontend** : Gestion d'erreur spécifique + validation basique
3. **UX** : Messages d'erreur clairs + feedback visuel

**Le nom de boutique est maintenant unique !** 🎉 