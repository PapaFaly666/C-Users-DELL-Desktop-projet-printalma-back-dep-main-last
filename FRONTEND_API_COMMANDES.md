# 📋 API Commandes Frontend - PrintAlma

## 🎯 Vue d'Ensemble

Documentation complète des endpoints de commandes pour l'équipe frontend. Tous les exemples incluent les formats exacts de données à envoyer et recevoir.

## 🔐 Authentification

**Important :** Toutes les requêtes nécessitent une authentification par cookie `auth_token`.

```javascript
// Configuration fetch avec cookies
const fetchConfig = {
  credentials: 'include', // ⭐ ESSENTIEL pour envoyer les cookies
  headers: {
    'Content-Type': 'application/json'
  }
};
```

## 📦 1. Créer une Commande (POST)

### 🔗 Endpoint
```
POST http://localhost:3004/orders
```

### 📝 Format de Requête

```javascript
const orderData = {
  shippingAddress: "123 Rue de la Paix, 75001 Paris, France",
  phoneNumber: "+33123456789",
  notes: "Livraison en point relais préférée", // Optionnel
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      size: "M",
      color: "Rouge"
    },
    {
      productId: 3,
      quantity: 1,
      size: "L", 
      color: "Bleu"
    }
  ]
};

// Envoi de la requête
const response = await fetch('http://localhost:3004/orders', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(orderData)
});
```

### ✅ Réponse de Succès (201)

```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 15,
    "orderNumber": "CMD20241127001",
    "status": "PENDING",
    "totalAmount": 89.99,
    "shippingAddress": "123 Rue de la Paix, 75001 Paris, France",
    "phoneNumber": "+33123456789",
    "notes": "Livraison en point relais préférée",
    "userId": 5,
    "userEmail": "client@example.com",
    "userFirstName": "Jean",
    "userLastName": "Dupont",
    "createdAt": "2024-11-27T14:30:00.000Z",
    "updatedAt": "2024-11-27T14:30:00.000Z",
    "orderItems": [
      {
        "id": 25,
        "orderId": 15,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 29.99,
        "totalPrice": 59.98,
        "size": "M",
        "color": "Rouge",
        "product": {
          "id": 1,
          "name": "T-shirt Design Unique",
          "description": "T-shirt avec design personnalisé",
          "price": 29.99,
          "imageUrl": "https://res.cloudinary.com/example/image/upload/v123/tshirt.jpg",
          "category": {
            "id": 1,
            "name": "Vêtements"
          }
        }
      },
      {
        "id": 26,
        "orderId": 15,
        "productId": 3,
        "quantity": 1,
        "unitPrice": 29.99,
        "totalPrice": 29.99,
        "size": "L",
        "color": "Bleu",
        "product": {
          "id": 3,
          "name": "Hoodie Premium",
          "description": "Sweat à capuche de qualité",
          "price": 29.99,
          "imageUrl": "https://res.cloudinary.com/example/image/upload/v124/hoodie.jpg",
          "category": {
            "id": 1,
            "name": "Vêtements"
          }
        }
      }
    ]
  }
}
```

### ❌ Erreurs Possibles

#### Données invalides (400)
```json
{
  "success": false,
  "message": "Données de commande invalides",
  "errors": [
    "L'adresse de livraison est requise",
    "Le numéro de téléphone est invalide",
    "Au moins un article est requis"
  ]
}
```

#### Produit non disponible (400)
```json
{
  "success": false,
  "message": "Produit non disponible",
  "error": "Le produit avec l'ID 1 n'est pas disponible"
}
```

#### Non authentifié (401)
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

## 📋 2. Lister Mes Commandes (GET)

### 🔗 Endpoint
```
GET http://localhost:3004/orders/my-orders?page=1&limit=10
```

### 📝 Paramètres de Requête

```javascript
const params = {
  page: 1,        // Numéro de page (défaut: 1)
  limit: 10,      // Nombre d'éléments par page (défaut: 10, max: 100)
  status: 'PENDING' // Optionnel: filtrer par statut
};

// Construction de l'URL
const url = new URL('http://localhost:3004/orders/my-orders');
Object.entries(params).forEach(([key, value]) => {
  if (value) url.searchParams.append(key, value);
});

const response = await fetch(url, {
  credentials: 'include'
});
```

### ✅ Réponse de Succès (200)

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 15,
        "orderNumber": "CMD20241127001",
        "status": "PENDING",
        "totalAmount": 89.99,
        "shippingAddress": "123 Rue de la Paix, 75001 Paris, France",
        "phoneNumber": "+33123456789",
        "notes": "Livraison en point relais préférée",
        "createdAt": "2024-11-27T14:30:00.000Z",
        "updatedAt": "2024-11-27T14:30:00.000Z",
        "orderItems": [
          {
            "id": 25,
            "quantity": 2,
            "unitPrice": 29.99,
            "totalPrice": 59.98,
            "size": "M",
            "color": "Rouge",
            "product": {
              "id": 1,
              "name": "T-shirt Design Unique",
              "imageUrl": "https://res.cloudinary.com/example/image/upload/v123/tshirt.jpg"
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "totalPages": 3,
      "hasNext": true,
      "hasPrevious": false
    }
  }
}
```

### 🎭 Statuts de Commande Possibles

```javascript
const ORDER_STATUSES = {
  'PENDING': 'En attente',
  'CONFIRMED': 'Confirmée',
  'PROCESSING': 'En traitement',
  'SHIPPED': 'Expédiée',
  'DELIVERED': 'Livrée',
  'CANCELLED': 'Annulée',
  'REJECTED': 'Rejetée'
};
```

## 👑 3. Lister Toutes les Commandes (Admin)

### 🔗 Endpoint
```
GET http://localhost:3004/orders/admin/all?page=1&limit=10&status=PENDING
```

### 📝 Paramètres de Requête

```javascript
const adminParams = {
  page: 1,
  limit: 10,
  status: 'PENDING',    // Optionnel: filtrer par statut
  userId: 5,            // Optionnel: filtrer par utilisateur
  search: 'CMD20241127' // Optionnel: recherche par numéro de commande
};
```

### ✅ Réponse Admin (200)

```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": 15,
        "orderNumber": "CMD20241127001",
        "status": "PENDING",
        "totalAmount": 89.99,
        "shippingAddress": "123 Rue de la Paix, 75001 Paris, France",
        "phoneNumber": "+33123456789",
        "notes": "Livraison en point relais préférée",
        "userId": 5,
        "userEmail": "client@example.com",
        "userFirstName": "Jean",
        "userLastName": "Dupont",
        "createdAt": "2024-11-27T14:30:00.000Z",
        "updatedAt": "2024-11-27T14:30:00.000Z",
        "orderItems": [
          {
            "id": 25,
            "quantity": 2,
            "unitPrice": 29.99,
            "totalPrice": 59.98,
            "size": "M",
            "color": "Rouge",
            "product": {
              "id": 1,
              "name": "T-shirt Design Unique",
              "imageUrl": "https://res.cloudinary.com/example/image/upload/v123/tshirt.jpg",
              "category": {
                "id": 1,
                "name": "Vêtements"
              }
            }
          }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 156,
      "totalPages": 16,
      "hasNext": true,
      "hasPrevious": false
    },
    "filters": {
      "status": "PENDING",
      "search": null,
      "userId": null
    }
  }
}
```

## 📊 4. Détails d'une Commande

### 🔗 Endpoint
```
GET http://localhost:3004/orders/:id
```

### 📝 Exemple de Requête

```javascript
const orderId = 15;
const response = await fetch(`http://localhost:3004/orders/${orderId}`, {
  credentials: 'include'
});
```

### ✅ Réponse Détaillée (200)

```json
{
  "success": true,
  "data": {
    "id": 15,
    "orderNumber": "CMD20241127001",
    "status": "PENDING",
    "totalAmount": 89.99,
    "shippingAddress": "123 Rue de la Paix, 75001 Paris, France",
    "phoneNumber": "+33123456789",
    "notes": "Livraison en point relais préférée",
    "userId": 5,
    "userEmail": "client@example.com",
    "userFirstName": "Jean",
    "userLastName": "Dupont",
    "createdAt": "2024-11-27T14:30:00.000Z",
    "updatedAt": "2024-11-27T14:30:00.000Z",
    "orderItems": [
      {
        "id": 25,
        "quantity": 2,
        "unitPrice": 29.99,
        "totalPrice": 59.98,
        "size": "M",
        "color": "Rouge",
        "product": {
          "id": 1,
          "name": "T-shirt Design Unique",
          "description": "T-shirt avec design personnalisé de haute qualité",
          "price": 29.99,
          "imageUrl": "https://res.cloudinary.com/example/image/upload/v123/tshirt.jpg",
          "category": {
            "id": 1,
            "name": "Vêtements",
            "description": "Vêtements et accessoires"
          }
        }
      }
    ]
  }
}
```

### ❌ Commande Non Trouvée (404)

```json
{
  "success": false,
  "message": "Commande non trouvée",
  "statusCode": 404
}
```

## 🔄 5. Modifier le Statut (Admin)

### 🔗 Endpoint
```
PUT http://localhost:3004/orders/:id/status
```

### 📝 Format de Requête

```javascript
const statusUpdate = {
  status: "CONFIRMED", // Nouveau statut
  notes: "Commande confirmée et prête pour traitement" // Optionnel
};

const response = await fetch(`http://localhost:3004/orders/${orderId}/status`, {
  method: 'PUT',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(statusUpdate)
});
```

### ✅ Réponse de Succès (200)

```json
{
  "success": true,
  "message": "Statut de commande mis à jour avec succès",
  "data": {
    "id": 15,
    "orderNumber": "CMD20241127001",
    "previousStatus": "PENDING",
    "newStatus": "CONFIRMED",
    "totalAmount": 89.99,
    "updatedAt": "2024-11-27T15:45:00.000Z",
    "updatedBy": "admin@printalma.com"
  }
}
```

## 📈 6. Statistiques des Commandes (Admin)

### 🔗 Endpoint
```
GET http://localhost:3004/orders/admin/statistics
```

### ✅ Réponse Statistiques (200)

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOrders": 156,
      "totalRevenue": 15847.50,
      "averageOrderValue": 101.58,
      "ordersToday": 8,
      "revenueToday": 456.80
    },
    "statusBreakdown": {
      "PENDING": 12,
      "CONFIRMED": 25,
      "PROCESSING": 18,
      "SHIPPED": 45,
      "DELIVERED": 89,
      "CANCELLED": 5,
      "REJECTED": 2
    },
    "recentActivity": [
      {
        "orderId": 15,
        "orderNumber": "CMD20241127001",
        "action": "Commande créée",
        "timestamp": "2024-11-27T14:30:00.000Z",
        "customer": "Jean Dupont"
      }
    ],
    "topProducts": [
      {
        "productId": 1,
        "productName": "T-shirt Design Unique",
        "totalOrders": 45,
        "totalRevenue": 1349.55
      }
    ]
  }
}
```

## 🔍 7. Recherche de Commandes (Admin)

### 🔗 Endpoint
```
GET http://localhost:3004/orders/admin/search?q=CMD20241127
```

### 📝 Paramètres de Recherche

```javascript
const searchParams = {
  q: 'CMD20241127',        // Recherche générale
  customerEmail: 'jean@',  // Recherche par email client
  customerName: 'Dupont',  // Recherche par nom client
  phone: '+33123',         // Recherche par téléphone
  dateFrom: '2024-11-01',  // Date de début
  dateTo: '2024-11-30'     // Date de fin
};
```

## 🎨 8. Formats d'Affichage Frontend

### 💰 Formatage Prix

```javascript
const formatPrice = (price) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  }).format(price);
};

// Exemples
formatPrice(29.99); // "29,99 €"
formatPrice(89.99); // "89,99 €"
```

### 📅 Formatage Dates

```javascript
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Exemple
formatDate("2024-11-27T14:30:00.000Z"); // "27 novembre 2024 à 15:30"
```

### 🎯 Badges de Statut

```jsx
const StatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    const configs = {
      'PENDING': { label: 'En attente', color: 'orange', icon: '⏳' },
      'CONFIRMED': { label: 'Confirmée', color: 'blue', icon: '✅' },
      'PROCESSING': { label: 'En traitement', color: 'purple', icon: '⚙️' },
      'SHIPPED': { label: 'Expédiée', color: 'cyan', icon: '🚚' },
      'DELIVERED': { label: 'Livrée', color: 'green', icon: '📦' },
      'CANCELLED': { label: 'Annulée', color: 'red', icon: '❌' },
      'REJECTED': { label: 'Rejetée', color: 'gray', icon: '🚫' }
    };
    return configs[status] || { label: status, color: 'gray', icon: '❓' };
  };

  const config = getStatusConfig(status);
  
  return (
    <span className={`status-badge status-${config.color}`}>
      {config.icon} {config.label}
    </span>
  );
};
```

## 🚨 Gestion d'Erreurs

### 🔧 Fonction Utilitaire

```javascript
const handleApiResponse = async (response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    
    switch (response.status) {
      case 400:
        throw new Error(errorData.message || 'Données invalides');
      case 401:
        // Rediriger vers login
        window.location.href = '/login';
        throw new Error('Non authentifié');
      case 403:
        throw new Error('Accès refusé');
      case 404:
        throw new Error('Ressource non trouvée');
      case 500:
        throw new Error('Erreur serveur');
      default:
        throw new Error(`Erreur ${response.status}`);
    }
  }
  
  return response.json();
};

// Utilisation
try {
  const data = await handleApiResponse(response);
  console.log('Succès:', data);
} catch (error) {
  console.error('Erreur:', error.message);
  // Afficher message d'erreur à l'utilisateur
}
```

## 🎯 Exemple Complet d'Intégration

### 📝 Service de Commandes

```javascript
// services/OrderService.js
class OrderService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
  }

  async createOrder(orderData) {
    const response = await fetch(`${this.baseURL}/orders`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(orderData)
    });

    return handleApiResponse(response);
  }

  async getMyOrders(page = 1, limit = 10, status = null) {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append('status', status);

    const response = await fetch(`${this.baseURL}/orders/my-orders?${params}`, {
      credentials: 'include'
    });

    return handleApiResponse(response);
  }

  async getOrderDetails(orderId) {
    const response = await fetch(`${this.baseURL}/orders/${orderId}`, {
      credentials: 'include'
    });

    return handleApiResponse(response);
  }

  // Méthodes admin
  async getAllOrders(page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({ page, limit });
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    const response = await fetch(`${this.baseURL}/orders/admin/all?${params}`, {
      credentials: 'include'
    });

    return handleApiResponse(response);
  }

  async updateOrderStatus(orderId, status, notes = '') {
    const response = await fetch(`${this.baseURL}/orders/${orderId}/status`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status, notes })
    });

    return handleApiResponse(response);
  }

  async getStatistics() {
    const response = await fetch(`${this.baseURL}/orders/admin/statistics`, {
      credentials: 'include'
    });

    return handleApiResponse(response);
  }
}

export default new OrderService();
```

## 📞 Support et Debugging

### 🐛 Points de Vérification

1. **Cookies** : `document.cookie` doit contenir `auth_token`
2. **CORS** : `credentials: 'include'` dans toutes les requêtes
3. **Headers** : `Content-Type: application/json` pour POST/PUT
4. **URL** : Vérifier que le port 3004 est correct
5. **Erreurs** : Toujours gérer les codes d'erreur 400, 401, 403, 404, 500

### 🔍 Debug Console

```javascript
// Dans la console du navigateur
console.log('Cookies:', document.cookie);
console.log('Base URL:', process.env.REACT_APP_API_URL);

// Test rapide d'API
fetch('http://localhost:3004/orders/my-orders', { credentials: 'include' })
  .then(res => res.json())
  .then(data => console.log('Test API:', data))
  .catch(err => console.error('Erreur API:', err));
```

## ✅ Checklist d'Intégration

- [ ] ✅ Service OrderService créé
- [ ] ✅ Gestion d'erreurs implémentée
- [ ] ✅ Formatage prix/dates configuré
- [ ] ✅ Composants StatusBadge créés
- [ ] ✅ Tests avec cookies fonctionnels
- [ ] ✅ Pagination gérée
- [ ] ✅ WebSocket intégré pour notifications temps réel

**Votre intégration API commandes est prête ! 🚀** 