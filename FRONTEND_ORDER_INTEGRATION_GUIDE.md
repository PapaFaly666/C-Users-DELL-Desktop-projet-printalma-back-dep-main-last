# 📋 GUIDE COMPLET : INTÉGRATION COMMANDES PAYTECH FRONTEND-BACKEND

## 🎯 **Problème identifié**

Le frontend n'enregistre pas les commandes dans la table `orders`. Actuellement, seul le backend crée des transactions Paytech pour les tests, mais le processus complet paiement → commande n'est pas connecté.

## 🔄 **Processus actuel vs Processus cible**

### **❌ Processus actuel (problématique)**
```
Frontend → Paytech → Backend IPN → ???
❌ Aucune création de commande
❌ Pas de liaison paiement-commande
❌ Données perdues
```

### **✅ Processus cible (à implémenter)**
```
Frontend → Créer commande → Paytech → Mise à jour statut paiement
✅ Commande créée immédiatement
✅ Liaison paiement-commande automatique
✅ Statuts synchronisés
```

---

## 🏗️ **ARCHITECTURE DE LA SOLUTION**

### **1. Backend - Endpoints nécessaires**

#### **Endpoint principal de création de commande**
```http
POST /orders
Authorization: Bearer <token_jwt>
Content-Type: application/json

{
  "shippingDetails": {
    "shippingName": "Papa Diagne",
    "shippingStreet": "123 Rue Test",
    "shippingCity": "Dakar",
    "shippingRegion": "Dakar",
    "shippingPostalCode": "12345",
    "shippingCountry": "Sénégal"
  },
  "phoneNumber": "775588834",
  "notes": "Livraison rapide SVP",
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "size": "XL",
      "color": "Blanc",
      "colorId": 5
    }
  ],
  "paymentMethod": "PAYTECH",
  "initiatePayment": true
}
```

#### **Réponse attendue**
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "ORD-2025-123",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "totalAmount": 156000,
    "paymentData": {
      "token": "eey3kpmh9b91zo",
      "redirect_url": "https://paytech.sn/payment/checkout/eey3kpmh9b91zo"
    }
  }
}
```

### **2. Flow d'intégration Paytech-Commandes**

#### **Étape A : Création de la commande avec paiement**
```typescript
// src/order/order.service.ts - Méthode à modifier/ajouter
async createOrderWithPayment(userId: number, createOrderDto: CreateOrderDto) {
  // 1. Créer la commande avec statut PENDING
  const order = await this.createOrder(userId, {
    ...createOrderDto,
    paymentMethod: PaymentMethod.PAYTECH
  });

  // 2. Préparer les données Paytech
  const paymentData = {
    item_name: `Commande ${order.orderNumber}`,
    item_price: Math.round(order.totalAmount),
    ref_command: order.orderNumber,
    command_name: `Achat de ${order.orderItems.length} produit(s)`,
    ipn_url: `${process.env.FRONTEND_URL}/api/paytech/ipn-callback`,
    success_url: `${process.env.FRONTEND_URL}/payment/success`,
    cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
    env: 'prod',
    currency: 'XOF'
  };

  // 3. Initialiser le paiement Paytech
  const paymentResponse = await this.paytechService.initializePayment(paymentData);

  // 4. Mettre à jour la commande avec les infos de paiement
  await this.prisma.order.update({
    where: { id: order.id },
    data: {
      transactionId: paymentResponse.data.token,
      paymentStatus: 'PENDING'
    }
  });

  return {
    ...order,
    paymentData: paymentResponse.data
  };
}
```

#### **Étape B : Endpoint IPN pour mise à jour automatique**
```typescript
// src/paytech/paytech.controller.ts - Endpoint à implémenter
@Post('ipn-callback')
async handleIPNCallback(@Body() ipnData: any) {
  try {
    const { payment_method, payment_status, transaction_id, ref_command } = ipnData;

    // Mettre à jour la commande correspondante
    const order = await this.prisma.order.update({
      where: { orderNumber: ref_command },
      data: {
        paymentStatus: payment_status,
        transactionId: transaction_id,
        status: payment_status === 'PAID' ? 'CONFIRMED' : 'PENDING',
        confirmedAt: payment_status === 'PAID' ? new Date() : null
      }
    });

    //Notifier l'utilisateur (WebSocket, Email, etc.)
    this.orderGateway.notifyOrderUpdate(order);

    return { success: true };
  } catch (error) {
    console.error('IPN Error:', error);
    return { success: false, error: error.message };
  }
}
```

---

## 🛠️ **IMPLÉMENTATION FRONTEND**

### **1. Service de commande complet**

```javascript
// src/services/order-service.js
class OrderService {
  constructor(baseUrl = 'http://localhost:3004') {
    this.baseUrl = baseUrl;
  }

  // Créer une commande avec paiement Paytech
  async createOrderWithPayment(orderData, userToken) {
    try {
      const response = await fetch(`${this.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la création de la commande');
      }

      return result;
    } catch (error) {
      console.error('OrderService Error:', error);
      throw error;
    }
  }

  // Méthode simplifiée pour commande rapide
  async createQuickOrder(product, quantity = 1, userToken) {
    const orderData = {
      shippingDetails: {
        shippingName: "Nom complet",
        shippingStreet: "Adresse complète",
        shippingCity: "Ville",
        shippingRegion: "Région",
        shippingPostalCode: "12345",
        shippingCountry: "Sénégal"
      },
      phoneNumber: "775588834",
      orderItems: [{
        productId: product.id,
        quantity: quantity,
        size: product.selectedSize || "M",
        color: product.selectedColor || "Blanc",
        colorId: product.selectedColorId || null
      }],
      paymentMethod: "PAYTECH",
      initiatePayment: true
    };

    return this.createOrderWithPayment(orderData, userToken);
  }

  // Obtenir les commandes de l'utilisateur
  async getUserOrders(userToken) {
    try {
      const response = await fetch(`${this.baseUrl}/orders/my-orders`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Get orders error:', error);
      throw error;
    }
  }

  // Obtenir le statut d'une commande
  async getOrderStatus(orderId, userToken) {
    try {
      const response = await fetch(`${this.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Get order status error:', error);
      throw error;
    }
  }
}

export { OrderService };
```

### **2. Hook React pour les commandes**

```javascript
// src/hooks/useOrder.js
import { useState, useCallback } from 'react';
import { OrderService } from '../services/order-service';

export const useOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentOrder, setCurrentOrder] = useState(null);

  const createOrder = useCallback(async (orderData, userToken, onSuccess, onError) => {
    setLoading(true);
    setError(null);

    try {
      const service = new OrderService();
      const response = await service.createOrderWithPayment(orderData, userToken);

      setCurrentOrder(response.data);

      // Rediriger vers Paytech si paiement requis
      if (response.data.paymentData?.redirect_url) {
        window.location.href = response.data.paymentData.redirect_url;
      }

      if (onSuccess) onSuccess(response.data);

    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la création de la commande';
      setError(errorMessage);
      setLoading(false);

      if (onError) onError(errorMessage);
    }
  }, []);

  const createQuickOrder = useCallback(async (product, quantity, userToken) => {
    return createOrder({
      shippingDetails: getUserShippingDetails(),
      phoneNumber: getUserPhoneNumber(),
      orderItems: [{
        productId: product.id,
        quantity: quantity,
        size: product.selectedSize || "M",
        color: product.selectedColor || "Blanc"
      }],
      paymentMethod: "PAYTECH",
      initiatePayment: true
    }, userToken);
  }, [createOrder]);

  const getUserOrders = useCallback(async (userToken) => {
    setLoading(true);
    setError(null);

    try {
      const service = new OrderService();
      const response = await service.getUserOrders(userToken);
      setLoading(false);
      return response.data;
    } catch (err) {
      const errorMessage = err.message || 'Erreur lors de la récupération des commandes';
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setCurrentOrder(null);
  }, []);

  return {
    loading,
    error,
    currentOrder,
    createOrder,
    createQuickOrder,
    getUserOrders,
    reset
  };
};
```

### **3. Composant de bouton d'achat complet**

```jsx
// src/components/ProductPurchaseButton.jsx
import React, { useState, useEffect } from 'react';
import { useOrder } from '../hooks/useOrder';

const ProductPurchaseButton = ({
  product,
  className = '',
  showShippingForm = false,
  onSuccess
}) => {
  const { createQuickOrder, loading, error, currentOrder } = useOrder();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedColor, setSelectedColor] = useState('Blanc');
  const [showForm, setShowForm] = useState(showShippingForm);
  const [userToken, setUserToken] = useState(null);

  // Récupérer le token utilisateur
  useEffect(() => {
    const token = localStorage.getItem('userToken');
    setUserToken(token);
  }, []);

  const handlePurchase = async () => {
    if (!userToken) {
      alert('Veuillez vous connecter pour effectuer un achat');
      return;
    }

    // Préparer le produit avec les sélections
    const productWithOptions = {
      ...product,
      selectedSize,
      selectedColor
    };

    try {
      await createQuickOrder(productWithOptions, quantity, userToken);

      if (onSuccess) {
        onSuccess(currentOrder);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  if (!userToken) {
    return (
      <div className="text-center">
        <p className="text-gray-600 mb-4">Connectez-vous pour acheter</p>
        <button
          onClick={() => window.location.href = '/login'}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
        >
          Se connecter
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Options du produit */}
      <div className="flex items-center space-x-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Quantité</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            className="mt-1 block w-20 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {product.sizes && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Taille</label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md"
            >
              {product.sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}

        {product.colors && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Couleur</label>
            <select
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="mt-1 block px-3 py-2 border border-gray-300 rounded-md"
            >
              {product.colors.map(color => (
                <option key={color} value={color}>{color}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bouton d'achat */}
      <button
        onClick={handlePurchase}
        disabled={loading}
        className={`w-full bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 ${className}`}
      >
        {loading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="ml-2">Traitement...</span>
          </>
        ) : (
          `Acheter ${quantity} × ${(product.price * quantity).toFixed(0)} XOF`
        )}
      </button>

      {/* Erreur */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Informations de commande actuelle */}
      {currentOrder && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
          <p>Commande créée : #{currentOrder.orderNumber}</p>
          <p>Montant : {currentOrder.totalAmount} XOF</p>
          {currentOrder.paymentData && (
            <p>Redirection vers Paytech en cours...</p>
          )}
        </div>
      )}

      {/* Options supplémentaires */}
      <div className="flex space-x-4">
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          {showForm ? 'Masquer' : 'Afficher'} les détails de livraison
        </button>
      </div>

      {/* Formulaire de livraison (optionnel) */}
      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Détails de livraison</h3>
          <p className="text-sm text-gray-600">
            Ces informations seront utilisées pour la livraison de votre commande.
          </p>
        </div>
      )}
    </div>
  );
};

export default ProductPurchaseButton;
```

---

## 🔄 **FLOW COMPLET D'ACHAT**

### **Étape 1 : Utilisateur clique sur "Acheter"**
```
1. Frontend : ProductPurchaseButton.handleClick()
2. Vérification token utilisateur
3. Création données commande
4. Appel API POST /orders
```

### **Étape 2 : Backend traite la commande**
```
1. OrderController.createOrder()
2. OrderService.createOrderWithPayment()
3. Création commande en base (statut PENDING)
4. Initialisation paiement Paytech
5. Mise à jour commande avec transaction ID
6. Retour réponse avec URL de redirection
```

### **Étape 3 : Redirection vers Paytech**
```
1. Frontend reçoit la réponse
2. Redirection automatique vers Paytech
3. Utilisateur effectue le paiement
```

### **Étape 4 : IPN Callback (automatique)**
```
1. Paytech envoie les données à l'IPN URL
2. Backend met à jour le statut de la commande
3. Notification en temps réel à l'utilisateur
```

### **Étape 5 : Retour utilisateur**
```
1. Utilisateur est redirigé vers success_url ou cancel_url
2. Frontend vérifie le statut final
3. Affichage confirmation ou gestion de l'échec
```

---

## 🧪 **TESTS ET VALIDATION**

### **1. Test de création de commande**
```javascript
// test-order-creation.js
const testOrderCreation = async () => {
  const orderData = {
    shippingDetails: {
      shippingName: "Test User",
      shippingStreet: "123 Test Street",
      shippingCity: "Dakar",
      shippingRegion: "Dakar",
      shippingPostalCode: "12345",
      shippingCountry: "Sénégal"
    },
    phoneNumber: "775588834",
    orderItems: [{
      productId: 1,
      quantity: 1,
      size: "M",
      color: "Blanc"
    }],
    paymentMethod: "PAYTECH",
    initiatePayment: true
  };

  const response = await fetch('http://localhost:3004/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer <votre_token_jwt>'
    },
    body: JSON.stringify(orderData)
  });

  const result = await response.json();
  console.log('Order creation result:', result);
};
```

### **2. Test de l'IPN**
```javascript
// test-ipn-endpoint.js
const testIPN = async () => {
  const ipnData = {
    payment_method: "PAYTECH",
    payment_status: "PAID",
    transaction_id: "test_transaction_123",
    ref_command: "ORD-2025-123",
    amount: 156000
  };

  const response = await fetch('http://localhost:3004/paytech/ipn-callback', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(ipnData)
  });

  const result = await response.json();
  console.log('IPN result:', result);
};
```

---

## 📋 **CHECKLIST D'INTÉGRATION**

### **Backend ✅**
- [ ] Modifier `OrderController.createOrder()` pour supporter `initiatePayment`
- [ ] Ajouter `OrderService.createOrderWithPayment()`
- [ ] Implémenter endpoint IPN `/paytech/ipn-callback`
- [ ] Configurer URLs IPN dans variables d'environnement
- [ ] Tester la création de commande avec paiement

### **Frontend ✅**
- [ ] Intégrer `OrderService`
- [ ] Utiliser le hook `useOrder`
- [ ] Implémenter `ProductPurchaseButton`
- [ ] Gérer le token JWT utilisateur
- [ ] Configurer les URLs de redirection

### **Tests ✅**
- [ ] Test création commande
- [ ] Test redirection Paytech
- [ ] Test IPN callback
- [ ] Test mise à jour statut
- [ ] Test expérience utilisateur complète

---

## 🚀 **DÉPLOIEMENT**

### **Variables d'environnement requises**
```env
# Backend (.env)
FRONTEND_URL=https://printalma-website-dep.onrender.com
PAYTECH_IPN_URL=https://printalma-website-dep.onrender.com/api/paytech/ipn-callback

# Frontend (.env.local)
REACT_APP_API_URL=http://localhost:3004
REACT_APP_SITE_URL=https://printalma-website-dep.onrender.com
```

### **Ordre de déploiement**
1. **Déployer le backend** avec les nouveaux endpoints
2. **Mettre à jour le frontend** avec le nouveau service
3. **Tester l'intégration complète**
4. **Monitorer les logs IPN** pour validation

---

## 🔧 **DÉBOGAGE**

### **Erreurs courantes et solutions**

| Erreur | Cause | Solution |
|--------|-------|----------|
| `401 Unauthorized` | Token JWT invalide | Vérifier l'authentification |
| `400 Bad Request` | Données manquantes | Valider le DTO CreateOrderDto |
| `IPN timeout` | URL IPN incorrecte | Vérifier la configuration HTTPS |
| `Order not found` | Commande non créée | Logger la création de commande |
| `Payment failed` | Erreur Paytech | Vérifier les clés API |

### **Logs à surveiller**
```bash
# Backend logs
tail -f logs/application.log | grep -E "(Order|Paytech|IPN)"

# Commandes créées
curl -H "Authorization: Bearer <token>" http://localhost:3004/orders/my-orders

# Statut commande spécifique
curl -H "Authorization: Bearer <token>" http://localhost:3004/orders/123
```

---

## 🎉 **RÉSULTAT FINAL**

Une fois l'intégration terminée :

1. **✅** Les utilisateurs pourront acheter des produits
2. **✅** Les commandes seront créées immédiatement en base
3. **✅** Les paiements Paytech seront synchronisés
4. **✅** Les statuts seront mis à jour automatiquement
5. **✅** L'expérience utilisateur sera fluide et complète

Le système passera de **transactions de test** à **commandes réelles** avec un processus d'achat complet et fonctionnel !