# 📖 Guide Complet d'Intégration Frontend - PrintAlma

## 🎯 Vue d'Ensemble

Ce guide complet vous permet d'intégrer parfaitement votre frontend avec le backend NestJS de PrintAlma, incluant le système de commandes et les notifications WebSocket temps réel.

## 🔗 Configuration de Base

### URL du Backend
```javascript
const API_BASE_URL = 'http://localhost:3004'; // Ajustez selon votre configuration
```

### Headers par Défaut
```javascript
const defaultHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Token JWT
};
```

## 📋 Endpoints des Commandes

### 1. **Créer une Commande** - `POST /orders`

#### Requête
```javascript
const orderData = {
  shippingAddress: "123 Rue de la Paix, 75001 Paris",
  phoneNumber: "+33123456789",
  notes: "Livraison rapide si possible", // Optionnel
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      size: "M",
      color: "Rouge"
    },
    {
      productId: 5,
      quantity: 1,
      size: "L", 
      color: "Bleu"
    }
  ]
};

const response = await fetch('/orders', {
  method: 'POST',
  headers: defaultHeaders,
  body: JSON.stringify(orderData)
});
```

#### Réponse de Succès (201)
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 42,
    "orderNumber": "CMD20241127001",
    "userId": 15,
    "userFirstName": "Jean",
    "userLastName": "Dupont",
    "userEmail": "jean.dupont@email.com",
    "status": "PENDING",
    "totalAmount": 89.99,
    "shippingAddress": "123 Rue de la Paix, 75001 Paris",
    "phoneNumber": "+33123456789",
    "notes": "Livraison rapide si possible",
    "createdAt": "2024-11-27T10:30:00.000Z",
    "updatedAt": "2024-11-27T10:30:00.000Z",
    "validatedAt": null,
    "validatedBy": null,
    "validatorName": null,
    "orderItems": [
      {
        "id": 85,
        "productId": 1,
        "productName": "T-shirt Premium",
        "quantity": 2,
        "unitPrice": 29.99,
        "size": "M",
        "color": "Rouge",
        "totalPrice": 59.98
      },
      {
        "id": 86,
        "productId": 5,
        "productName": "Polo Classique",
        "quantity": 1,
        "unitPrice": 30.01,
        "size": "L",
        "color": "Bleu",
        "totalPrice": 30.01
      }
    ]
  }
}
```

#### Erreurs Possibles
```json
// Stock insuffisant (400)
{
  "success": false,
  "message": "Stock insuffisant pour le produit T-shirt Premium",
  "statusCode": 400
}

// Produit non trouvé (400)
{
  "success": false,
  "message": "Un ou plusieurs produits ne sont pas disponibles",
  "statusCode": 400
}

// Non authentifié (401)
{
  "success": false,
  "message": "Non autorisé",
  "statusCode": 401
}
```

### 2. **Mes Commandes** - `GET /orders/my-orders`

#### Requête
```javascript
const response = await fetch('/orders/my-orders', {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Vos commandes récupérées avec succès",
  "data": [
    {
      "id": 42,
      "orderNumber": "CMD20241127001",
      "userId": 15,
      "userFirstName": "Jean",
      "userLastName": "Dupont", 
      "userEmail": "jean.dupont@email.com",
      "status": "CONFIRMED",
      "totalAmount": 89.99,
      "shippingAddress": "123 Rue de la Paix, 75001 Paris",
      "phoneNumber": "+33123456789",
      "notes": "Livraison rapide si possible",
      "createdAt": "2024-11-27T10:30:00.000Z",
      "updatedAt": "2024-11-27T11:15:00.000Z",
      "validatedAt": "2024-11-27T11:15:00.000Z",
      "validatedBy": 3,
      "validatorName": "Marie Admin",
      "orderItems": [...]
    }
  ]
}
```

### 3. **Détails d'une Commande** - `GET /orders/:id`

#### Requête
```javascript
const orderId = 42;
const response = await fetch(`/orders/${orderId}`, {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Commande récupérée avec succès",
  "data": {
    "id": 42,
    "orderNumber": "CMD20241127001",
    "userId": 15,
    "userFirstName": "Jean",
    "userLastName": "Dupont",
    "userEmail": "jean.dupont@email.com",
    "status": "PROCESSING",
    "totalAmount": 89.99,
    "shippingAddress": "123 Rue de la Paix, 75001 Paris",
    "phoneNumber": "+33123456789",
    "notes": "Livraison rapide si possible",
    "createdAt": "2024-11-27T10:30:00.000Z",
    "updatedAt": "2024-11-27T12:00:00.000Z",
    "validatedAt": "2024-11-27T11:15:00.000Z",
    "validatedBy": 3,
    "validatorName": "Marie Admin",
    "orderItems": [
      {
        "id": 85,
        "productId": 1,
        "productName": "T-shirt Premium",
        "quantity": 2,
        "unitPrice": 29.99,
        "size": "M",
        "color": "Rouge",
        "totalPrice": 59.98
      }
    ]
  }
}
```

### 4. **Annuler une Commande** - `DELETE /orders/:id/cancel`

#### Requête
```javascript
const orderId = 42;
const response = await fetch(`/orders/${orderId}/cancel`, {
  method: 'DELETE',
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Commande annulée avec succès",
  "data": {
    "id": 42,
    "orderNumber": "CMD20241127001",
    "status": "CANCELLED",
    "totalAmount": 89.99
  }
}
```

#### Erreurs Possibles
```json
// Commande non annulable (400)
{
  "success": false,
  "message": "Seules les commandes en attente peuvent être annulées",
  "statusCode": 400
}

// Pas le propriétaire (403)
{
  "success": false,
  "message": "Vous ne pouvez pas annuler cette commande",
  "statusCode": 403
}
```

## 👑 Endpoints Admin

### 5. **Toutes les Commandes** - `GET /orders/admin/all`

#### Requête
```javascript
const page = 1;
const limit = 20;
const status = 'PENDING'; // Optionnel

const response = await fetch(`/orders/admin/all?page=${page}&limit=${limit}&status=${status}`, {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Commandes récupérées avec succès",
  "data": {
    "orders": [
      {
        "id": 42,
        "orderNumber": "CMD20241127001",
        "userId": 15,
        "userFirstName": "Jean",
        "userLastName": "Dupont",
        "userEmail": "jean.dupont@email.com",
        "status": "PENDING",
        "totalAmount": 89.99,
        "createdAt": "2024-11-27T10:30:00.000Z",
        "orderItems": [...]
      }
    ],
    "total": 156,
    "page": 1,
    "totalPages": 8
  }
}
```

### 6. **Changer le Statut** - `PATCH /orders/:id/status`

#### Requête
```javascript
const orderId = 42;
const statusData = {
  status: "CONFIRMED",
  notes: "Commande validée par l'équipe" // Optionnel
};

const response = await fetch(`/orders/${orderId}/status`, {
  method: 'PATCH',
  headers: defaultHeaders,
  body: JSON.stringify(statusData)
});
```

#### Statuts Disponibles
```javascript
const orderStatuses = {
  'PENDING': 'En attente',
  'CONFIRMED': 'Confirmée', 
  'PROCESSING': 'En traitement',
  'SHIPPED': 'Expédiée',
  'DELIVERED': 'Livrée',
  'CANCELLED': 'Annulée',
  'REJECTED': 'Rejetée'
};
```

#### Transitions Autorisées
```javascript
const allowedTransitions = {
  'PENDING': ['CONFIRMED', 'REJECTED', 'CANCELLED'],
  'CONFIRMED': ['PROCESSING', 'CANCELLED'],
  'PROCESSING': ['SHIPPED', 'CANCELLED'],
  'SHIPPED': ['DELIVERED'],
  'DELIVERED': [], // Statut final
  'CANCELLED': [], // Statut final
  'REJECTED': []   // Statut final
};
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Statut de la commande mis à jour avec succès",
  "data": {
    "id": 42,
    "orderNumber": "CMD20241127001",
    "status": "CONFIRMED",
    "validatedAt": "2024-11-27T13:45:00.000Z",
    "validatedBy": 3,
    "validatorName": "Marie Admin"
  }
}
```

### 7. **Statistiques Complètes** - `GET /orders/admin/statistics`

#### Requête
```javascript
const response = await fetch('/orders/admin/statistics', {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Statistiques des commandes récupérées avec succès",
  "data": {
    "totalOrders": 156,
    "pendingOrders": 12,
    "confirmedOrders": 25,
    "processingOrders": 18,
    "shippedOrders": 35,
    "deliveredOrders": 45,
    "cancelledOrders": 15,
    "rejectedOrders": 6,
    "totalRevenue": 12450.75,
    "averageOrderValue": 79.85,
    "ordersToday": 8,
    "ordersThisWeek": 23,
    "ordersThisMonth": 87,
    "revenueToday": 456.50,
    "revenueThisWeek": 1890.25,
    "revenueThisMonth": 7850.00,
    "topProducts": [
      {
        "productId": 1,
        "productName": "T-shirt Premium",
        "totalQuantity": 45,
        "totalRevenue": 1349.55
      },
      {
        "productId": 5,
        "productName": "Polo Classique", 
        "totalQuantity": 32,
        "totalRevenue": 960.32
      }
    ]
  }
}
```

### 8. **Statistiques Frontend** - `GET /orders/admin/frontend-statistics`

#### Requête
```javascript
const response = await fetch('/orders/admin/frontend-statistics', {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Statistiques frontend récupérées avec succès",
  "data": {
    "totalOrders": 156,
    "revenue": {
      "total": 12450.75,
      "monthly": 7850.00
    },
    "ordersCount": {
      "today": 8,
      "week": 23,
      "month": 87
    },
    "ordersByStatus": {
      "pending": 12,
      "confirmed": 25,
      "processing": 18,
      "shipped": 35,
      "delivered": 45,
      "cancelled": 15
    }
  }
}
```

### 9. **Statistiques WebSocket** - `GET /orders/admin/websocket-stats`

#### Requête
```javascript
const response = await fetch('/orders/admin/websocket-stats', {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Statistiques WebSocket récupérées",
  "data": {
    "connectedAdmins": 3,
    "connectedUsers": 12,
    "total": 15
  }
}
```

## 🧪 Endpoints de Test

### 10. **Test Authentification** - `GET /orders/test-auth`

#### Requête
```javascript
const response = await fetch('/orders/test-auth', {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Authentification testée",
  "data": {
    "user": {
      "sub": 15,
      "email": "jean.dupont@email.com",
      "role": "USER",
      "firstName": "Jean",
      "lastName": "Dupont"
    },
    "hasUser": true,
    "userRole": "USER",
    "userId": 15
  }
}
```

### 11. **Test Admin** - `GET /orders/test-admin`

#### Requête
```javascript
const response = await fetch('/orders/test-admin', {
  headers: defaultHeaders
});
```

#### Réponse de Succès (200)
```json
{
  "success": true,
  "message": "Accès admin confirmé",
  "data": {
    "user": {
      "sub": 3,
      "email": "admin@printalma.com",
      "role": "ADMIN",
      "firstName": "Marie",
      "lastName": "Admin"
    },
    "role": "ADMIN"
  }
}
```

## 🔥 WebSocket - Notifications Temps Réel

### Configuration de Base

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3004/orders', {
  auth: {
    token: localStorage.getItem('authToken')
  },
  transports: ['websocket', 'polling'],
  autoConnect: true,
});
```

### Événements WebSocket

#### 1. **Connexion Établie**
```javascript
socket.on('connect', () => {
  console.log('✅ WebSocket connecté:', socket.id);
});
```

#### 2. **Nouvelle Commande** (Pour les Admins)
```javascript
socket.on('newOrder', (notification) => {
  /*
  notification = {
    type: 'NEW_ORDER',
    title: '🆕 Nouvelle commande reçue !',
    message: 'Commande #CMD20241127001 - 89.99€',
    data: {
      orderId: 42,
      orderNumber: 'CMD20241127001',
      totalAmount: 89.99,
      customerName: 'Jean Dupont',
      customerEmail: 'jean.dupont@email.com',
      itemsCount: 2,
      createdAt: '2024-11-27T10:30:00.000Z'
    },
    timestamp: '2024-11-27T10:30:00.000Z'
  }
  */
  
  // Afficher notification
  showNotification(notification);
  // Jouer son
  playNotificationSound();
  // Mettre à jour l'interface
  refreshOrdersList();
});
```

#### 3. **Changement de Statut** (Pour les Admins)
```javascript
socket.on('orderStatusChanged', (notification) => {
  /*
  notification = {
    type: 'ORDER_STATUS_CHANGED',
    title: '📝 Statut de commande modifié',
    message: 'Commande #CMD20241127001: PENDING → CONFIRMED',
    data: {
      orderId: 42,
      orderNumber: 'CMD20241127001',
      previousStatus: 'PENDING',
      newStatus: 'CONFIRMED',
      changedBy: 'Marie Admin',
      customerEmail: 'jean.dupont@email.com'
    },
    timestamp: '2024-11-27T11:15:00.000Z'
  }
  */
  
  updateOrderInList(notification.data.orderId, notification.data.newStatus);
});
```

#### 4. **Mise à Jour Commande** (Pour le Client)
```javascript
socket.on('myOrderUpdated', (notification) => {
  /*
  notification = {
    type: 'MY_ORDER_UPDATED',
    title: '📦 Mise à jour de votre commande',
    message: 'Votre commande #CMD20241127001 est maintenant: Confirmée',
    data: {
      orderId: 42,
      orderNumber: 'CMD20241127001',
      status: 'CONFIRMED',
      statusLabel: 'Confirmée'
    },
    timestamp: '2024-11-27T11:15:00.000Z'
  }
  */
  
  showUserNotification(notification);
  updateMyOrderStatus(notification.data.orderId, notification.data.status);
});
```

#### 5. **Test de Connexion**
```javascript
// Envoyer ping
socket.emit('ping', { timestamp: new Date().toISOString() });

// Recevoir pong
socket.on('pong', (data) => {
  /*
  data = {
    message: 'Connexion WebSocket active',
    timestamp: '2024-11-27T10:30:00.000Z',
    user: 'jean.dupont@email.com'
  }
  */
  console.log('🏓 Connexion active:', data);
});
```

## 🛠️ Service Complet JavaScript

```javascript
// services/OrderService.js
class OrderService {
  constructor() {
    this.baseURL = 'http://localhost:3004';
    this.socket = null;
  }

  // Méthode utilitaire pour les appels API
  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          ...options.headers
        },
        ...options
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || `Erreur HTTP ${response.status}`);
      }

      return result;
    } catch (error) {
      console.error(`Erreur API ${endpoint}:`, error);
      throw error;
    }
  }

  // ==========================================
  // MÉTHODES PRINCIPALES
  // ==========================================

  // Créer une commande
  async createOrder(orderData) {
    return await this.apiCall('/orders', {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  }

  // Mes commandes
  async getMyOrders() {
    return await this.apiCall('/orders/my-orders');
  }

  // Détails d'une commande
  async getOrderById(orderId) {
    return await this.apiCall(`/orders/${orderId}`);
  }

  // Annuler commande
  async cancelOrder(orderId) {
    return await this.apiCall(`/orders/${orderId}/cancel`, {
      method: 'DELETE'
    });
  }

  // ==========================================
  // MÉTHODES ADMIN
  // ==========================================

  // Toutes les commandes
  async getAllOrders(page = 1, limit = 10, status = null) {
    let url = `/orders/admin/all?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    return await this.apiCall(url);
  }

  // Changer statut
  async updateOrderStatus(orderId, status, notes = null) {
    return await this.apiCall(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes })
    });
  }

  // Statistiques complètes
  async getStatistics() {
    return await this.apiCall('/orders/admin/statistics');
  }

  // Statistiques frontend
  async getFrontendStatistics() {
    return await this.apiCall('/orders/admin/frontend-statistics');
  }

  // Stats WebSocket
  async getWebSocketStats() {
    return await this.apiCall('/orders/admin/websocket-stats');
  }

  // ==========================================
  // TESTS
  // ==========================================

  async testAuth() {
    return await this.apiCall('/orders/test-auth');
  }

  async testAdmin() {
    return await this.apiCall('/orders/test-admin');
  }

  // ==========================================
  // WEBSOCKET
  // ==========================================

  connectWebSocket(token) {
    if (this.socket) return;

    this.socket = io(`${this.baseURL}/orders`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    this.setupWebSocketListeners();
  }

  setupWebSocketListeners() {
    this.socket.on('connect', () => {
      console.log('✅ WebSocket connecté');
    });

    this.socket.on('newOrder', (notification) => {
      this.onNewOrder?.(notification);
    });

    this.socket.on('orderStatusChanged', (notification) => {
      this.onOrderStatusChanged?.(notification);
    });

    this.socket.on('myOrderUpdated', (notification) => {
      this.onMyOrderUpdated?.(notification);
    });
  }

  ping() {
    this.socket?.emit('ping', { timestamp: new Date().toISOString() });
  }

  // ==========================================
  // UTILITAIRES
  // ==========================================

  getStatusLabel(status) {
    const labels = {
      'PENDING': 'En attente',
      'CONFIRMED': 'Confirmée',
      'PROCESSING': 'En traitement',
      'SHIPPED': 'Expédiée',
      'DELIVERED': 'Livrée',
      'CANCELLED': 'Annulée',
      'REJECTED': 'Rejetée'
    };
    return labels[status] || status;
  }

  getStatusColor(status) {
    const colors = {
      'PENDING': '#ffc107',
      'CONFIRMED': '#28a745',
      'PROCESSING': '#007bff',
      'SHIPPED': '#6f42c1',
      'DELIVERED': '#28a745',
      'CANCELLED': '#dc3545',
      'REJECTED': '#6c757d'
    };
    return colors[status] || '#6c757d';
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount || 0);
  }

  formatDate(date) {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  }
}

// Export du service
const orderService = new OrderService();
export default orderService;
```

## 🎯 Exemples d'Utilisation React

### Composant Création de Commande

```jsx
// components/CreateOrder.jsx
import React, { useState } from 'react';
import OrderService from '../services/OrderService';

const CreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    shippingAddress: '',
    phoneNumber: '',
    notes: '',
    orderItems: []
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await OrderService.createOrder(formData);
      
      if (result.success) {
        alert(`✅ Commande créée: ${result.data.orderNumber}`);
        // Rediriger vers la page de confirmation
        window.location.href = `/orders/${result.data.id}`;
      }
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Adresse de livraison"
        value={formData.shippingAddress}
        onChange={(e) => setFormData({...formData, shippingAddress: e.target.value})}
        required
      />
      
      <input
        type="tel"
        placeholder="Numéro de téléphone"
        value={formData.phoneNumber}
        onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
        required
      />
      
      <textarea
        placeholder="Notes (optionnel)"
        value={formData.notes}
        onChange={(e) => setFormData({...formData, notes: e.target.value})}
      />
      
      {/* Ajoutez ici la sélection des produits */}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Création...' : 'Créer la commande'}
      </button>
    </form>
  );
};

export default CreateOrder;
```

### Dashboard Admin avec WebSocket

```jsx
// components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import OrderService from '../services/OrderService';

const AdminDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [wsStats, setWsStats] = useState(null);

  useEffect(() => {
    loadData();
    setupWebSocket();
  }, []);

  const loadData = async () => {
    try {
      const [ordersResult, statsResult, wsStatsResult] = await Promise.all([
        OrderService.getAllOrders(1, 20),
        OrderService.getFrontendStatistics(),
        OrderService.getWebSocketStats()
      ]);

      if (ordersResult.success) setOrders(ordersResult.data.orders);
      if (statsResult.success) setStats(statsResult.data);
      if (wsStatsResult.success) setWsStats(wsStatsResult.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    }
  };

  const setupWebSocket = () => {
    const token = localStorage.getItem('authToken');
    OrderService.connectWebSocket(token);
    
    // Callbacks WebSocket
    OrderService.onNewOrder = (notification) => {
      console.log('🆕 Nouvelle commande:', notification);
      loadData(); // Recharger les données
      showNotification(notification);
    };

    OrderService.onOrderStatusChanged = (notification) => {
      console.log('📝 Statut modifié:', notification);
      loadData();
    };
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const result = await OrderService.updateOrderStatus(orderId, newStatus);
      if (result.success) {
        alert(`✅ Statut mis à jour vers: ${OrderService.getStatusLabel(newStatus)}`);
        loadData();
      }
    } catch (error) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const showNotification = (notification) => {
    // Utiliser votre système de notifications préféré
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }
  };

  return (
    <div className="admin-dashboard">
      {/* Statistiques */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Commandes</h3>
            <p>{stats.totalOrders}</p>
          </div>
          <div className="stat-card">
            <h3>CA Total</h3>
            <p>{OrderService.formatCurrency(stats.revenue.total)}</p>
          </div>
          <div className="stat-card">
            <h3>En Attente</h3>
            <p>{stats.ordersByStatus.pending}</p>
          </div>
          <div className="stat-card">
            <h3>Connexions WS</h3>
            <p>{wsStats?.total || 0}</p>
          </div>
        </div>
      )}

      {/* Liste des commandes */}
      <div className="orders-list">
        <h2>📋 Commandes Récentes</h2>
        {orders.map(order => (
          <div key={order.id} className="order-card">
            <div className="order-header">
              <h3>#{order.orderNumber}</h3>
              <span style={{color: OrderService.getStatusColor(order.status)}}>
                {OrderService.getStatusLabel(order.status)}
              </span>
            </div>
            
            <div className="order-details">
              <p>Client: {order.userFirstName} {order.userLastName}</p>
              <p>Email: {order.userEmail}</p>
              <p>Montant: {OrderService.formatCurrency(order.totalAmount)}</p>
              <p>Date: {OrderService.formatDate(order.createdAt)}</p>
            </div>

            <div className="order-actions">
              <select 
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
              >
                <option value="PENDING">En attente</option>
                <option value="CONFIRMED">Confirmée</option>
                <option value="PROCESSING">En traitement</option>
                <option value="SHIPPED">Expédiée</option>
                <option value="DELIVERED">Livrée</option>
                <option value="CANCELLED">Annulée</option>
                <option value="REJECTED">Rejetée</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
```

## 🔒 Gestion des Erreurs

### Types d'Erreurs Communes

```javascript
// Gestion centralisée des erreurs
const handleApiError = (error, context = '') => {
  console.error(`Erreur ${context}:`, error);
  
  if (error.message.includes('401') || error.message.includes('Non autorisé')) {
    // Token expiré - rediriger vers login
    localStorage.removeItem('authToken');
    window.location.href = '/login';
  } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
    // Pas les permissions
    alert('❌ Vous n\'avez pas les permissions pour cette action');
  } else if (error.message.includes('404')) {
    // Ressource non trouvée
    alert('❌ Élément non trouvé');
  } else if (error.message.includes('400')) {
    // Erreur de validation
    alert(`❌ ${error.message}`);
  } else {
    // Erreur générique
    alert('❌ Une erreur est survenue. Veuillez réessayer.');
  }
};

// Utilisation
try {
  const result = await OrderService.createOrder(orderData);
} catch (error) {
  handleApiError(error, 'création de commande');
}
```

## 🎯 Points Clés

### ✅ Authentification
- Tous les endpoints nécessitent un token JWT valide
- Le token doit être inclus dans le header `Authorization: Bearer TOKEN`

### ✅ Permissions
- Les endpoints `/admin/*` nécessitent le rôle `ADMIN` ou `SUPERADMIN`
- Les utilisateurs normaux ne peuvent voir que leurs propres commandes

### ✅ WebSocket
- Authentification obligatoire avec le même token JWT
- Les admins reçoivent toutes les notifications
- Les utilisateurs ne reçoivent que les notifications de leurs commandes

### ✅ Statuts des Commandes
- Workflow défini avec transitions autorisées
- Impossible de revenir en arrière (sauf annulation)
- Validation côté serveur des changements de statut

**Votre intégration frontend est maintenant complète !** 🚀✨

Tous les endpoints sont documentés avec leurs réponses exactes, exemples d'utilisation et gestion d'erreurs. Le système WebSocket vous donne des notifications temps réel parfaites. 