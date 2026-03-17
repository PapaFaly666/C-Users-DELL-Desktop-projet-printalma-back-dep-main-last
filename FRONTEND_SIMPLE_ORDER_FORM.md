# 🚀 Formulaire de Commande Simplifié

## Version Minimaliste pour Test Rapide

```jsx
// components/SimpleOrderForm.jsx
import React, { useState } from 'react';

const SimpleOrderForm = () => {
  const [formData, setFormData] = useState({
    shippingAddress: '',
    phoneNumber: '',
    notes: '',
    productId: 1, // ID du produit par défaut
    quantity: 1,
    size: 'M',
    color: 'Rouge'
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const orderData = {
        shippingAddress: formData.shippingAddress,
        phoneNumber: formData.phoneNumber,
        notes: formData.notes,
        orderItems: [
          {
            productId: parseInt(formData.productId),
            quantity: parseInt(formData.quantity),
            size: formData.size,
            color: formData.color
          }
        ]
      };

      const response = await fetch('/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (result.success) {
        setMessage(`✅ Commande créée avec succès ! Numéro: ${result.data.orderNumber}`);
        // Réinitialiser le formulaire
        setFormData({
          shippingAddress: '',
          phoneNumber: '',
          notes: '',
          productId: 1,
          quantity: 1,
          size: 'M',
          color: 'Rouge'
        });
      } else {
        setMessage(`❌ Erreur: ${result.message}`);
      }
    } catch (error) {
      setMessage(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '20px auto', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
      <h2>🛒 Nouvelle Commande</h2>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          borderRadius: '4px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24'
        }}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Adresse de livraison *
          </label>
          <textarea
            name="shippingAddress"
            value={formData.shippingAddress}
            onChange={handleChange}
            required
            rows="3"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Votre adresse complète..."
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Téléphone *
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="+33 1 23 45 67 89"
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Produit ID
          </label>
          <input
            type="number"
            name="productId"
            value={formData.productId}
            onChange={handleChange}
            min="1"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Quantité
            </label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              min="1"
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Taille
            </label>
            <select
              name="size"
              value={formData.size}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
              <option value="XXL">XXL</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Couleur
            </label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              placeholder="Rouge, Bleu..."
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Notes (optionnel)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="2"
            style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            placeholder="Instructions spéciales..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '⏳ Création...' : '✅ Créer la Commande'}
        </button>
      </form>
    </div>
  );
};

export default SimpleOrderForm;
```

## 🧪 Test Direct dans la Console

```javascript
// Copiez-collez dans la console du navigateur pour tester
(async function quickOrderTest() {
  const orderData = {
    shippingAddress: "123 Rue de Test, 75001 Paris",
    phoneNumber: "+33123456789",
    notes: "Test rapide",
    orderItems: [
      {
        productId: 1,
        quantity: 1,
        size: "M",
        color: "Rouge"
      }
    ]
  };

  console.log('📦 Envoi de la commande...', orderData);

  try {
    const response = await fetch('/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Commande créée:', result.data);
      console.log(`📋 Numéro de commande: ${result.data.orderNumber}`);
      console.log(`💰 Montant total: ${result.data.totalAmount}€`);
    } else {
      console.error('❌ Erreur:', result.message);
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
  }
})();
```

## 📱 Version HTML Pure (sans React)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Commande</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, textarea, select { width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; }
        button { width: 100%; padding: 12px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
        button:disabled { background: #6c757d; cursor: not-allowed; }
        .message { padding: 10px; margin: 10px 0; border-radius: 4px; }
        .success { background: #d4edda; color: #155724; }
        .error { background: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h2>🛒 Test Commande</h2>
    
    <div id="message"></div>
    
    <form id="orderForm">
        <div class="form-group">
            <label>Adresse de livraison *</label>
            <textarea id="shippingAddress" required rows="3" placeholder="Votre adresse complète..."></textarea>
        </div>
        
        <div class="form-group">
            <label>Téléphone *</label>
            <input type="tel" id="phoneNumber" required placeholder="+33 1 23 45 67 89">
        </div>
        
        <div class="form-group">
            <label>Produit ID</label>
            <input type="number" id="productId" value="1" min="1">
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
            <div class="form-group">
                <label>Quantité</label>
                <input type="number" id="quantity" value="1" min="1">
            </div>
            <div class="form-group">
                <label>Taille</label>
                <select id="size">
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M" selected>M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                    <option value="XXL">XXL</option>
                </select>
            </div>
            <div class="form-group">
                <label>Couleur</label>
                <input type="text" id="color" value="Rouge" placeholder="Rouge, Bleu...">
            </div>
        </div>
        
        <div class="form-group">
            <label>Notes (optionnel)</label>
            <textarea id="notes" rows="2" placeholder="Instructions spéciales..."></textarea>
        </div>
        
        <button type="submit" id="submitBtn">✅ Créer la Commande</button>
    </form>

    <script>
        document.getElementById('orderForm').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = document.getElementById('submitBtn');
            const messageDiv = document.getElementById('message');
            
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Création...';
            messageDiv.innerHTML = '';
            
            const orderData = {
                shippingAddress: document.getElementById('shippingAddress').value,
                phoneNumber: document.getElementById('phoneNumber').value,
                notes: document.getElementById('notes').value,
                orderItems: [
                    {
                        productId: parseInt(document.getElementById('productId').value),
                        quantity: parseInt(document.getElementById('quantity').value),
                        size: document.getElementById('size').value,
                        color: document.getElementById('color').value
                    }
                ]
            };
            
            try {
                const response = await fetch('/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(orderData)
                });
                
                const result = await response.json();
                
                if (result.success) {
                    messageDiv.innerHTML = `<div class="message success">✅ Commande créée avec succès !<br>Numéro: ${result.data.orderNumber}<br>Montant: ${result.data.totalAmount}€</div>`;
                    document.getElementById('orderForm').reset();
                } else {
                    messageDiv.innerHTML = `<div class="message error">❌ Erreur: ${result.message}</div>`;
                }
            } catch (error) {
                messageDiv.innerHTML = `<div class="message error">❌ Erreur: ${error.message}</div>`;
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '✅ Créer la Commande';
            }
        });
    </script>
</body>
</html>
```

## 🚀 Utilisation

1. **React Component** : Copiez `SimpleOrderForm.jsx` dans votre projet
2. **Test Console** : Copiez le script JavaScript dans la console du navigateur
3. **HTML Pure** : Sauvegardez le HTML dans un fichier et ouvrez-le dans le navigateur

Ces versions simplifiées vous permettent de tester rapidement la création de commandes ! 🛒✨ 