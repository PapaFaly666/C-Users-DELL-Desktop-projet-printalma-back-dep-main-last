# 🔔 Guide WebSocket Notifications - Frontend PrintAlma

## 🎯 Vue d'Ensemble

Guide complet pour intégrer les notifications en temps réel via WebSocket dans votre application frontend PrintAlma. Ce système complète l'API REST des notifications en ajoutant des mises à jour instantanées.

**URL WebSocket:** `ws://localhost:3004/notifications`

**Authentification:** Token JWT via cookies (automatique) ou headers

---

## 📚 Table des Matières

1. [Configuration de base](#1-configuration-de-base)
2. [Service WebSocket](#2-service-websocket)
3. [Événements disponibles](#3-événements-disponibles)
4. [Hook React intégré](#4-hook-react-intégré)
5. [Composant d'exemple](#5-composant-dexemple)
6. [Gestion d'erreurs](#6-gestion-derreurs)
7. [Authentification](#7-authentification)
8. [Tests et debug](#8-tests-et-debug)

---

## 1. Configuration de Base

### Installation des dépendances
```bash
npm install socket.io-client
```

### Variables d'environnement
```javascript
// .env.local
REACT_APP_API_URL=http://localhost:3004
REACT_APP_WS_URL=ws://localhost:3004
```

---

## 2. Service WebSocket

### NotificationWebSocketService.js
```javascript
// services/NotificationWebSocketService.js
import { io } from 'socket.io-client';

class NotificationWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isConnected = false;
  }

  /**
   * 🔌 Connexion au WebSocket des notifications
   */
  connect() {
    if (this.socket?.connected) {
      console.log('🔔 WebSocket notifications déjà connecté');
      return this.socket;
    }

    console.log('🔔 Connexion au WebSocket notifications...');

    this.socket = io(process.env.REACT_APP_WS_URL + '/notifications', {
      withCredentials: true, // Important pour les cookies
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupEventListeners();
    return this.socket;
  }

  /**
   * 🔧 Configuration des écouteurs d'événements
   */
  setupEventListeners() {
    // Connexion établie
    this.socket.on('connect', () => {
      console.log('✅ WebSocket notifications connecté:', this.socket.id);
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.notifyListeners('connection', { status: 'connected', id: this.socket.id });
    });

    // Confirmation de connexion du serveur
    this.socket.on('connected', (data) => {
      console.log('🔔 Connecté aux notifications:', data);
      this.notifyListeners('authenticated', data);
    });

    // Déconnexion
    this.socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket notifications déconnecté:', reason);
      this.isConnected = false;
      this.notifyListeners('disconnection', { reason });
    });

    // Erreurs de connexion
    this.socket.on('connect_error', (error) => {
      console.error('🚫 Erreur connexion WebSocket notifications:', error);
      this.reconnectAttempts++;
      this.notifyListeners('error', { error, attempts: this.reconnectAttempts });
    });

    // 🆕 NOUVELLE COMMANDE (pour admins)
    this.socket.on('newOrderNotification', (data) => {
      console.log('🆕 Nouvelle commande reçue:', data);
      this.notifyListeners('newOrder', data);
    });

    // 📝 MISE À JOUR COMMANDE
    this.socket.on('orderUpdateNotification', (data) => {
      console.log('📝 Commande mise à jour:', data);
      this.notifyListeners('orderUpdate', data);
    });

    // ⚙️ NOTIFICATION SYSTÈME
    this.socket.on('systemNotification', (data) => {
      console.log('⚙️ Notification système:', data);
      this.notifyListeners('system', data);
    });

    // 📢 NOTIFICATION GÉNÉRALE
    this.socket.on('notification', (data) => {
      console.log('📢 Notification générale:', data);
      this.notifyListeners('general', data);
    });

    // 🏓 Pong (test de connexion)
    this.socket.on('pong', (data) => {
      console.log('🏓 Pong reçu:', data);
      this.notifyListeners('pong', data);
    });

    // 📊 Statistiques
    this.socket.on('stats', (data) => {
      console.log('📊 Stats WebSocket:', data);
      this.notifyListeners('stats', data);
    });
  }

  /**
   * 👂 Ajouter un écouteur d'événement
   */
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Retourner une fonction de nettoyage
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * 🔔 Notifier tous les écouteurs d'un événement
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Erreur dans le callback ${event}:`, error);
        }
      });
    }
  }

  /**
   * 🏓 Test de connexion
   */
  ping() {
    if (this.socket?.connected) {
      this.socket.emit('ping', { timestamp: Date.now() });
    }
  }

  /**
   * 📊 Demander les statistiques
   */
  getStats() {
    if (this.socket?.connected) {
      this.socket.emit('getStats');
    }
  }

  /**
   * 🔌 Déconnexion
   */
  disconnect() {
    if (this.socket) {
      console.log('🔔 Déconnexion WebSocket notifications...');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  /**
   * 📊 Statut de connexion
   */
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      socketId: this.socket?.id,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

export default new NotificationWebSocketService();
```

---

## 3. Événements Disponibles

### Événements reçus du serveur

| Événement | Description | Données |
|-----------|-------------|---------|
| `connected` | Confirmation de connexion authentifiée | `{ userId, role, timestamp }` |
| `newOrderNotification` | Nouvelle commande (admins) | `{ notification, orderData }` |
| `orderUpdateNotification` | Mise à jour commande | `{ notification, orderData }` |
| `systemNotification` | Notification système | `{ notification }` |
| `notification` | Notification générale | `{ notification }` |
| `pong` | Réponse au ping | `{ message, timestamp }` |
| `stats` | Statistiques de connexion | `{ connectedAdmins, connectedUsers }` |

### Structure des données de notification

```javascript
// Exemple de newOrderNotification
{
  "type": "NEW_ORDER_NOTIFICATION",
  "notification": {
    "id": 15,
    "title": "Nouvelle commande reçue",
    "message": "Jean Dupont a passé une commande de 2 articles : T-shirt, Hoodie",
    "type": "ORDER_NEW",
    "isRead": false,
    "metadata": {
      "orderId": 123,
      "orderNumber": "CMD20241127001",
      "amount": 89.99,
      "customer": "Jean Dupont",
      "itemsCount": 2
    },
    "createdAt": "2024-11-27T14:30:00.000Z"
  },
  "orderData": {
    "orderId": 123,
    "orderNumber": "CMD20241127001",
    "totalAmount": 89.99,
    "customer": "Jean Dupont",
    "itemsCount": 2
  },
  "timestamp": "2024-11-27T14:30:05.000Z"
}
```

---

## 4. Hook React Intégré

### useNotificationsWebSocket.js
```javascript
// hooks/useNotificationsWebSocket.js
import { useState, useEffect, useCallback } from 'react';
import NotificationWebSocketService from '../services/NotificationWebSocketService';

export const useNotificationsWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [newNotifications, setNewNotifications] = useState([]);
  const [lastNotification, setLastNotification] = useState(null);
  const [stats, setStats] = useState({ connectedAdmins: 0, connectedUsers: 0 });

  // Gestionnaires d'événements
  const handleConnection = useCallback((data) => {
    setConnectionStatus('connected');
  }, []);

  const handleDisconnection = useCallback((data) => {
    setConnectionStatus('disconnected');
  }, []);

  const handleError = useCallback((data) => {
    setConnectionStatus('error');
    console.error('Erreur WebSocket:', data);
  }, []);

  const handleAuthenticated = useCallback((data) => {
    setConnectionStatus('authenticated');
    console.log('Authentifié:', data);
  }, []);

  const handleNewOrder = useCallback((data) => {
    console.log('🆕 Nouvelle commande reçue:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]); // Garder les 50 dernières

    // Afficher une notification système (optionnel)
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(data.notification.title, {
        body: data.notification.message,
        icon: '/favicon.ico',
        tag: `order-${data.orderData.orderId}`,
      });
    }
  }, []);

  const handleOrderUpdate = useCallback((data) => {
    console.log('📝 Commande mise à jour:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]);

    // Notification système pour mise à jour
    if (window.Notification && Notification.permission === 'granted') {
      new Notification(data.notification.title, {
        body: data.notification.message,
        icon: '/favicon.ico',
        tag: `order-update-${data.orderData.orderId}`,
      });
    }
  }, []);

  const handleSystemNotification = useCallback((data) => {
    console.log('⚙️ Notification système:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]);
  }, []);

  const handleGeneralNotification = useCallback((data) => {
    console.log('📢 Notification générale:', data);
    setLastNotification(data);
    setNewNotifications(prev => [data, ...prev.slice(0, 49)]);
  }, []);

  const handleStats = useCallback((data) => {
    setStats(data);
  }, []);

  // Connexion et nettoyage
  useEffect(() => {
    // Demander la permission pour les notifications
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Connexion WebSocket
    NotificationWebSocketService.connect();

    // Ajout des écouteurs
    const removeListeners = [
      NotificationWebSocketService.addEventListener('connection', handleConnection),
      NotificationWebSocketService.addEventListener('disconnection', handleDisconnection),
      NotificationWebSocketService.addEventListener('error', handleError),
      NotificationWebSocketService.addEventListener('authenticated', handleAuthenticated),
      NotificationWebSocketService.addEventListener('newOrder', handleNewOrder),
      NotificationWebSocketService.addEventListener('orderUpdate', handleOrderUpdate),
      NotificationWebSocketService.addEventListener('system', handleSystemNotification),
      NotificationWebSocketService.addEventListener('general', handleGeneralNotification),
      NotificationWebSocketService.addEventListener('stats', handleStats),
    ];

    return () => {
      // Nettoyage des écouteurs
      removeListeners.forEach(removeListener => removeListener());
    };
  }, [
    handleConnection, handleDisconnection, handleError, handleAuthenticated,
    handleNewOrder, handleOrderUpdate, handleSystemNotification, 
    handleGeneralNotification, handleStats
  ]);

  // Fonctions utilitaires
  const ping = useCallback(() => {
    NotificationWebSocketService.ping();
  }, []);

  const getStats = useCallback(() => {
    NotificationWebSocketService.getStats();
  }, []);

  const clearNotifications = useCallback(() => {
    setNewNotifications([]);
    setLastNotification(null);
  }, []);

  const disconnect = useCallback(() => {
    NotificationWebSocketService.disconnect();
    setConnectionStatus('disconnected');
  }, []);

  return {
    connectionStatus,
    newNotifications,
    lastNotification,
    stats,
    clearNotifications,
    ping,
    getStats,
    disconnect,
    isConnected: connectionStatus === 'authenticated',
  };
};
```

---

## 5. Composant d'Exemple

### WebSocketNotificationCenter.jsx
```jsx
// components/WebSocketNotificationCenter.jsx
import React, { useState } from 'react';
import { useNotificationsWebSocket } from '../hooks/useNotificationsWebSocket';

const WebSocketNotificationCenter = () => {
  const [showPanel, setShowPanel] = useState(false);
  const { 
    connectionStatus, 
    newNotifications, 
    lastNotification, 
    stats,
    clearNotifications,
    ping,
    getStats,
    isConnected 
  } = useNotificationsWebSocket();

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'authenticated': return '#10b981'; // vert
      case 'connected': return '#f59e0b'; // orange
      case 'error': return '#ef4444'; // rouge
      default: return '#6b7280'; // gris
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'authenticated': return 'Connecté';
      case 'connected': return 'Connexion...';
      case 'error': return 'Erreur';
      default: return 'Déconnecté';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'NEW_ORDER_NOTIFICATION': '🆕',
      'ORDER_UPDATE_NOTIFICATION': '📝',
      'SYSTEM_NOTIFICATION': '⚙️',
      'GENERAL_NOTIFICATION': '📢',
    };
    return icons[type] || '🔔';
  };

  const handleNotificationClick = (notification) => {
    // Navigation vers la commande si disponible
    if (notification.orderData?.orderId) {
      window.location.href = `/admin/orders/${notification.orderData.orderId}`;
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Indicateur de statut */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        style={{
          background: 'none',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '4px',
          backgroundColor: showPanel ? '#f3f4f6' : 'transparent',
        }}
      >
        {/* Indicateur WebSocket */}
        <div
          style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            backgroundColor: getStatusColor(),
            border: '2px solid white',
            boxShadow: '0 0 4px rgba(0,0,0,0.2)',
          }}
          title={`WebSocket: ${getStatusText()}`}
        />
        
        {/* Icône notifications */}
        <span style={{ fontSize: '1.2rem' }}>🔔</span>
        
        {/* Badge compteur */}
        {newNotifications.length > 0 && (
          <span style={{
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '0.7rem',
            minWidth: '18px',
            textAlign: 'center',
          }}>
            {newNotifications.length > 99 ? '99+' : newNotifications.length}
          </span>
        )}
      </button>

      {/* Panel de notifications */}
      {showPanel && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: '400px',
          maxWidth: '90vw',
          background: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '500px',
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            background: '#f8f9fa',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔔 Notifications WebSocket
              <span style={{
                fontSize: '0.7rem',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: getStatusColor(),
                color: 'white',
              }}>
                {getStatusText()}
              </span>
            </h3>
            
            <div style={{ display: 'flex', gap: '4px' }}>
              <button 
                onClick={ping}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
                title="Test connexion"
              >
                🏓
              </button>
              
              <button 
                onClick={getStats}
                style={{
                  background: '#6f42c1',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  cursor: 'pointer',
                }}
                title="Statistiques"
              >
                📊
              </button>
              
              {newNotifications.length > 0 && (
                <button 
                  onClick={clearNotifications}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.7rem',
                    cursor: 'pointer',
                  }}
                  title="Effacer"
                >
                  🗑️
                </button>
              )}
              
              <button 
                onClick={() => setShowPanel(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  cursor: 'pointer',
                }}
              >
                ✖️
              </button>
            </div>
          </div>

          {/* Statistiques */}
          {isConnected && (
            <div style={{
              padding: '8px 16px',
              backgroundColor: '#e7f3ff',
              fontSize: '0.8rem',
              color: '#0066cc',
            }}>
              👑 {stats.connectedAdmins} admin(s) • 👤 {stats.connectedUsers} utilisateur(s)
            </div>
          )}

          {/* Liste des notifications */}
          <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
            {!isConnected && (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: '#666',
              }}>
                ⚠️ WebSocket déconnecté
                <br />
                <small>Reconnexion automatique en cours...</small>
              </div>
            )}

            {isConnected && newNotifications.length === 0 && (
              <div style={{
                padding: '32px',
                textAlign: 'center',
                color: '#666',
              }}>
                ✅ En attente de notifications...
              </div>
            )}

            {newNotifications.map((notification, index) => (
              <div
                key={`${notification.notification?.id || index}-${notification.timestamp}`}
                onClick={() => handleNotificationClick(notification)}
                style={{
                  display: 'flex',
                  padding: '12px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: notification.orderData ? 'pointer' : 'default',
                  backgroundColor: index === 0 ? '#e7f3ff' : 'white',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = index === 0 ? '#e7f3ff' : 'white'}
              >
                <div style={{
                  fontSize: '1.2rem',
                  marginRight: '12px',
                  marginTop: '2px',
                }}>
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontWeight: 600,
                    marginBottom: '4px',
                    fontSize: '0.9rem',
                  }}>
                    {notification.notification?.title}
                  </div>
                  
                  <div style={{
                    color: '#666',
                    fontSize: '0.85rem',
                    marginBottom: '4px',
                  }}>
                    {notification.notification?.message}
                  </div>
                  
                  <div style={{
                    color: '#999',
                    fontSize: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>{formatTime(notification.timestamp)}</span>
                    {notification.orderData && (
                      <span style={{ color: '#007bff' }}>
                        #{notification.orderData.orderNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WebSocketNotificationCenter;
```

---

## 6. Gestion d'Erreurs

### Reconnexion automatique
```javascript
// Le service gère automatiquement la reconnexion
const maxReconnectAttempts = 5;
const reconnectionDelay = 1000; // 1 seconde

// Reconnexion exponentielle
const reconnectWithBackoff = (attempt) => {
  const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
  setTimeout(() => connect(), delay);
};
```

### Gestion des erreurs de token
```javascript
// Vérification de l'authentification
socket.on('connect_error', (error) => {
  if (error.message.includes('Authentication')) {
    // Rediriger vers login
    window.location.href = '/login';
  }
});
```

---

## 7. Authentification

### Méthodes d'authentification supportées

1. **Cookies (recommandé)** - Automatique
2. **Query params** - `?token=your_jwt_token`
3. **Headers** - `Authorization: Bearer your_jwt_token`
4. **Auth object** - Via la configuration socket

```javascript
// Exemple avec token manuel
const socket = io('ws://localhost:3004/notifications', {
  auth: {
    token: 'your_jwt_token'
  }
});
```

---

## 8. Tests et Debug

### Tests de connexion
```javascript
// Dans la console du navigateur
NotificationWebSocketService.ping();
NotificationWebSocketService.getStats();

// Vérifier le statut
console.log(NotificationWebSocketService.getConnectionStatus());
```

### Debug avancé
```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'socket.io-client:*');

// Écouter tous les événements
socket.onAny((event, data) => {
  console.log(`📡 Événement WebSocket: ${event}`, data);
});
```

### Test de notification depuis le serveur
```bash
# Créer une commande pour tester les notifications
curl -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -H "Cookie: auth_token=YOUR_TOKEN" \
  -d '{"orderItems":[{"productId":1,"quantity":1}],"shippingAddress":"Test","phoneNumber":"123456789"}'
```

---

## 🎯 Points Importants

1. **Double système** : WebSocket + API REST pour maximum de fiabilité
2. **Authentification automatique** : Via cookies existants
3. **Reconnexion automatique** : Jusqu'à 5 tentatives avec backoff
4. **Notifications système** : Intégration avec l'API Notification du navigateur
5. **Performance** : Limitation à 50 notifications en mémoire
6. **Responsive** : Compatible mobile et desktop

## 🚀 Intégration Rapide

```jsx
// App.js - Ajoutez simplement ce composant
import WebSocketNotificationCenter from './components/WebSocketNotificationCenter';

function App() {
  return (
    <div className="app">
      <header>
        <nav>
          {/* Votre navigation */}
          <WebSocketNotificationCenter /> {/* 🔔 Ajoutez ça ici */}
        </nav>
      </header>
      {/* Reste de votre app */}
    </div>
  );
}
```

Maintenant vos admins recevront les notifications de commandes instantanément ! ⚡🔔 