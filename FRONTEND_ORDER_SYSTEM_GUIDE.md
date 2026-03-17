# Guide Frontend - Système de Commandes

## 🚀 Vue d'ensemble

Ce guide vous aide à intégrer le système de commandes dans votre frontend. Il inclut tous les endpoints, exemples de code, et gestion des erreurs.

## 🔐 Authentification

Tous les endpoints nécessitent une authentification JWT. Deux méthodes sont supportées :

### Méthode 1 : Cookie (Recommandée pour les navigateurs)
```javascript
// Le token est automatiquement envoyé via le cookie auth_token
fetch('/api/orders/my-orders', {
  method: 'GET',
  credentials: 'include' // Important pour inclure les cookies
});
```

### Méthode 2 : Header Authorization
```javascript
fetch('/api/orders/my-orders', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 📋 Endpoints Disponibles

### 🔍 Tests et Diagnostics

#### Test d'authentification
```javascript
// GET /orders/test-auth
const testAuth = async () => {
  try {
    const response = await fetch('/api/orders/test-auth', {
      credentials: 'include'
    });
    const result = await response.json();
    console.log('Données utilisateur:', result.data);
    return result;
  } catch (error) {
    console.error('Erreur auth:', error);
  }
};
```

#### Test d'accès admin
```javascript
// GET /orders/test-admin
const testAdmin = async () => {
  try {
    const response = await fetch('/api/orders/test-admin', {
      credentials: 'include'
    });
    const result = await response.json();
    console.log('Accès admin:', result.success);
    return result;
  } catch (error) {
    console.error('Erreur admin:', error);
  }
};
```

### 👤 Endpoints Utilisateurs

#### 1. Créer une commande
```javascript
// POST /orders
const createOrder = async (orderData) => {
  try {
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(orderData)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Commande créée:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur création commande:', error);
    throw error;
  }
};

// Exemple d'utilisation
const orderData = {
  shippingAddress: "123 Rue de la Paix, 75001 Paris",
  phoneNumber: "+33123456789",
  notes: "Livraison en matinée de préférence",
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      size: "M",
      color: "Bleu"
    },
    {
      productId: 2,
      quantity: 1,
      size: "L",
      color: "Rouge"
    }
  ]
};

createOrder(orderData);
```

#### 2. Voir mes commandes
```javascript
// GET /orders/my-orders
const getMyOrders = async () => {
  try {
    const response = await fetch('/api/orders/my-orders', {
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Mes commandes:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    throw error;
  }
};
```

#### 3. Voir une commande spécifique
```javascript
// GET /orders/:id
const getOrderById = async (orderId) => {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Détail commande:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    throw error;
  }
};
```

#### 4. Annuler une commande
```javascript
// DELETE /orders/:id/cancel
const cancelOrder = async (orderId) => {
  try {
    const response = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Commande annulée:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur annulation commande:', error);
    throw error;
  }
};
```

### 👨‍💼 Endpoints Administrateurs

#### 1. Voir toutes les commandes
```javascript
// GET /orders/admin/all
const getAllOrders = async (page = 1, limit = 10, status = null) => {
  try {
    let url = `/api/orders/admin/all?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }

    const response = await fetch(url, {
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Toutes les commandes:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur récupération toutes commandes:', error);
    throw error;
  }
};

// Exemples d'utilisation
getAllOrders(1, 10); // Page 1, 10 commandes
getAllOrders(1, 10, 'PENDING'); // Seulement les commandes en attente
```

#### 2. Mettre à jour le statut d'une commande
```javascript
// PATCH /orders/:id/status
const updateOrderStatus = async (orderId, status, notes = '') => {
  try {
    const response = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        status: status,
        notes: notes
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Statut mis à jour:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    throw error;
  }
};

// Exemples d'utilisation
updateOrderStatus(123, 'CONFIRMED', 'Commande validée et en préparation');
updateOrderStatus(124, 'SHIPPED', 'Commande expédiée via Colissimo');
updateOrderStatus(125, 'REJECTED', 'Stock insuffisant');
```

#### 3. Statistiques des commandes
```javascript
// GET /orders/admin/statistics
const getOrderStatistics = async () => {
  try {
    const response = await fetch('/api/orders/admin/statistics', {
      credentials: 'include'
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Statistiques:', result.data);
      return result.data;
    } else {
      throw new Error(result.message);
    }
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    throw error;
  }
};
```

## 📊 Statuts de Commande

```javascript
const ORDER_STATUS = {
  PENDING: 'PENDING',       // En attente de validation
  CONFIRMED: 'CONFIRMED',   // Confirmée par l'admin
  PROCESSING: 'PROCESSING', // En cours de traitement
  SHIPPED: 'SHIPPED',       // Expédiée
  DELIVERED: 'DELIVERED',   // Livrée
  CANCELLED: 'CANCELLED',   // Annulée par l'utilisateur
  REJECTED: 'REJECTED'      // Rejetée par l'admin
};

// Fonction utilitaire pour les libellés
const getStatusLabel = (status) => {
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
};

// Fonction utilitaire pour les couleurs
const getStatusColor = (status) => {
  const colors = {
    'PENDING': '#fbbf24',     // Jaune
    'CONFIRMED': '#3b82f6',   // Bleu
    'PROCESSING': '#8b5cf6',  // Violet
    'SHIPPED': '#06b6d4',     // Cyan
    'DELIVERED': '#10b981',   // Vert
    'CANCELLED': '#6b7280',   // Gris
    'REJECTED': '#ef4444'     // Rouge
  };
  return colors[status] || '#6b7280';
};
```

## 🎨 Composants React Exemples

### Composant Liste des Commandes Utilisateur
```jsx
import React, { useState, useEffect } from 'react';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders/my-orders', {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur de chargement des commandes');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ?')) {
      return;
    }

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'DELETE',
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        alert('Commande annulée avec succès');
        loadOrders(); // Recharger la liste
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (err) {
      alert('Erreur lors de l\'annulation');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div className="orders-list">
      <h2>Mes Commandes</h2>
      {orders.length === 0 ? (
        <p>Aucune commande trouvée</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="order-card">
            <h3>Commande {order.orderNumber}</h3>
            <p>Statut: <span className={`status-${order.status.toLowerCase()}`}>
              {getStatusLabel(order.status)}
            </span></p>
            <p>Total: {order.totalAmount}€</p>
            <p>Date: {new Date(order.createdAt).toLocaleDateString()}</p>
            
            {order.status === 'PENDING' && (
              <button 
                onClick={() => handleCancelOrder(order.id)}
                className="btn-cancel"
              >
                Annuler
              </button>
            )}
            
            <div className="order-items">
              <h4>Articles:</h4>
              {order.orderItems.map(item => (
                <div key={item.id} className="order-item">
                  <span>{item.productName}</span>
                  <span>Qté: {item.quantity}</span>
                  <span>{item.totalPrice}€</span>
                  {item.size && <span>Taille: {item.size}</span>}
                  {item.color && <span>Couleur: {item.color}</span>}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default MyOrders;
```

### Composant Gestion Admin des Commandes
```jsx
import React, { useState, useEffect } from 'react';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let url = `/api/orders/admin/all?page=${currentPage}&limit=10`;
      if (statusFilter) {
        url += `&status=${statusFilter}`;
      }

      const response = await fetch(url, {
        credentials: 'include'
      });
      const result = await response.json();
      
      if (result.success) {
        setOrders(result.data.orders);
        setTotalPages(result.data.totalPages);
      }
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, newStatus, notes = '') => {
    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          status: newStatus,
          notes: notes
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('Statut mis à jour avec succès');
        loadOrders(); // Recharger la liste
      } else {
        alert('Erreur: ' + result.message);
      }
    } catch (err) {
      alert('Erreur lors de la mise à jour');
    }
  };

  return (
    <div className="admin-orders">
      <h2>Gestion des Commandes</h2>
      
      {/* Filtre par statut */}
      <div className="filters">
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="CONFIRMED">Confirmées</option>
          <option value="PROCESSING">En traitement</option>
          <option value="SHIPPED">Expédiées</option>
          <option value="DELIVERED">Livrées</option>
        </select>
      </div>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <>
          <div className="orders-table">
            {orders.map(order => (
              <div key={order.id} className="admin-order-card">
                <div className="order-header">
                  <h3>{order.orderNumber}</h3>
                  <span className={`status-badge status-${order.status.toLowerCase()}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                
                <div className="order-info">
                  <p><strong>Client:</strong> {order.userFirstName} {order.userLastName}</p>
                  <p><strong>Email:</strong> {order.userEmail}</p>
                  <p><strong>Total:</strong> {order.totalAmount}€</p>
                  <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleDateString()}</p>
                  <p><strong>Adresse:</strong> {order.shippingAddress}</p>
                  <p><strong>Téléphone:</strong> {order.phoneNumber}</p>
                  {order.notes && <p><strong>Notes:</strong> {order.notes}</p>}
                </div>

                <div className="order-actions">
                  {order.status === 'PENDING' && (
                    <>
                      <button 
                        onClick={() => updateStatus(order.id, 'CONFIRMED', 'Commande validée')}
                        className="btn-confirm"
                      >
                        Confirmer
                      </button>
                      <button 
                        onClick={() => updateStatus(order.id, 'REJECTED', 'Commande rejetée')}
                        className="btn-reject"
                      >
                        Rejeter
                      </button>
                    </>
                  )}
                  
                  {order.status === 'CONFIRMED' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'PROCESSING', 'Commande en préparation')}
                      className="btn-process"
                    >
                      Mettre en traitement
                    </button>
                  )}
                  
                  {order.status === 'PROCESSING' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'SHIPPED', 'Commande expédiée')}
                      className="btn-ship"
                    >
                      Marquer comme expédiée
                    </button>
                  )}
                  
                  {order.status === 'SHIPPED' && (
                    <button 
                      onClick={() => updateStatus(order.id, 'DELIVERED', 'Commande livrée')}
                      className="btn-deliver"
                    >
                      Marquer comme livrée
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Précédent
            </button>
            <span>Page {currentPage} sur {totalPages}</span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Suivant
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminOrders;
```

## 🎨 CSS Exemple

```css
/* Styles pour les commandes */
.orders-list, .admin-orders {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.order-card, .admin-order-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.status-pending { background: #fef3c7; color: #92400e; }
.status-confirmed { background: #dbeafe; color: #1e40af; }
.status-processing { background: #e0e7ff; color: #5b21b6; }
.status-shipped { background: #cffafe; color: #0e7490; }
.status-delivered { background: #d1fae5; color: #065f46; }
.status-cancelled { background: #f3f4f6; color: #374151; }
.status-rejected { background: #fee2e2; color: #991b1b; }

.btn-confirm { background: #10b981; color: white; }
.btn-reject { background: #ef4444; color: white; }
.btn-process { background: #8b5cf6; color: white; }
.btn-ship { background: #06b6d4; color: white; }
.btn-deliver { background: #10b981; color: white; }
.btn-cancel { background: #6b7280; color: white; }

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  margin-bottom: 8px;
}

button:hover {
  opacity: 0.9;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
}

.filters {
  margin-bottom: 20px;
}

.filters select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}
```

## ⚠️ Gestion des Erreurs

```javascript
// Fonction utilitaire pour gérer les erreurs API
const handleApiError = (error, response) => {
  if (response?.status === 401) {
    // Token expiré ou invalide
    window.location.href = '/login';
    return;
  }
  
  if (response?.status === 403) {
    // Accès refusé
    alert('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
    return;
  }
  
  if (response?.status === 404) {
    // Ressource non trouvée
    alert('Ressource non trouvée.');
    return;
  }
  
  // Autres erreurs
  console.error('Erreur API:', error);
  alert('Une erreur est survenue. Veuillez réessayer.');
};

// Wrapper pour les appels API avec gestion d'erreur
const apiCall = async (url, options = {}) => {
  try {
    const response = await fetch(url, {
      credentials: 'include',
      ...options
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      handleApiError(result, response);
      throw new Error(result.message || 'Erreur API');
    }
    
    return result;
  } catch (error) {
    handleApiError(error);
    throw error;
  }
};
```

## 🔧 Configuration Base URL

```javascript
// config/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

export const apiEndpoints = {
  // Commandes utilisateur
  createOrder: `${API_BASE_URL}/orders`,
  myOrders: `${API_BASE_URL}/orders/my-orders`,
  getOrder: (id) => `${API_BASE_URL}/orders/${id}`,
  cancelOrder: (id) => `${API_BASE_URL}/orders/${id}/cancel`,
  
  // Commandes admin
  allOrders: `${API_BASE_URL}/orders/admin/all`,
  updateOrderStatus: (id) => `${API_BASE_URL}/orders/${id}/status`,
  orderStatistics: `${API_BASE_URL}/orders/admin/statistics`,
  
  // Tests
  testAuth: `${API_BASE_URL}/orders/test-auth`,
  testAdmin: `${API_BASE_URL}/orders/test-admin`
};
```

## 📱 Exemple d'Intégration Complète

```javascript
// services/orderService.js
import { apiEndpoints } from '../config/api';

class OrderService {
  async createOrder(orderData) {
    const response = await fetch(apiEndpoints.createOrder, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(orderData)
    });
    return response.json();
  }

  async getMyOrders() {
    const response = await fetch(apiEndpoints.myOrders, {
      credentials: 'include'
    });
    return response.json();
  }

  async getAllOrders(page = 1, limit = 10, status = null) {
    let url = `${apiEndpoints.allOrders}?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    
    const response = await fetch(url, {
      credentials: 'include'
    });
    return response.json();
  }

  async updateOrderStatus(orderId, status, notes = '') {
    const response = await fetch(apiEndpoints.updateOrderStatus(orderId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, notes })
    });
    return response.json();
  }

  async cancelOrder(orderId) {
    const response = await fetch(apiEndpoints.cancelOrder(orderId), {
      method: 'DELETE',
      credentials: 'include'
    });
    return response.json();
  }
}

export default new OrderService();
```

Ce guide vous donne tout ce dont vous avez besoin pour intégrer le système de commandes dans votre frontend ! 🚀 