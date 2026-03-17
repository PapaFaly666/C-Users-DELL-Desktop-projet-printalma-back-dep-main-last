# 📋 API Notifications PrintAlma - Référence Frontend

## 🎯 Vue d'Ensemble

Documentation complète des endpoints du système de notifications persistantes pour l'équipe frontend PrintAlma.

**Base URL:** `http://localhost:3004/notifications`

**Authentification:** Toutes les requêtes nécessitent les cookies d'authentification (`credentials: 'include'`)

---

## 📚 Table des Matières

1. [Récupérer les notifications](#1-récupérer-les-notifications)
2. [Compter les notifications non lues](#2-compter-les-notifications-non-lues)
3. [Marquer une notification comme lue](#3-marquer-une-notification-comme-lue)
4. [Marquer toutes comme lues](#4-marquer-toutes-comme-lues)
5. [Supprimer une notification](#5-supprimer-une-notification)
6. [Nettoyage admin](#6-nettoyage-admin-notifications-expirées)
7. [Types de notifications](#7-types-de-notifications)
8. [Modèle de données](#8-modèle-de-données-notification)
9. [Codes d'erreur](#9-codes-derreur)
10. [Exemples d'intégration](#10-exemples-dintégration)

---

## 1. Récupérer les notifications

### Endpoint
```
GET /notifications
```

### Paramètres de requête (optionnels)
| Paramètre | Type | Défaut | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Nombre maximum de notifications |
| `includeRead` | boolean | true | Inclure les notifications lues |

### Exemples de requêtes

#### Toutes les notifications (par défaut)
```javascript
fetch('http://localhost:3004/notifications', {
  credentials: 'include'
})
```

#### Seulement les non lues (20 max)
```javascript
fetch('http://localhost:3004/notifications?limit=20&includeRead=false', {
  credentials: 'include'
})
```

### Réponse de succès (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "userId": 2,
      "type": "ORDER_NEW",
      "title": "Nouvelle commande reçue",
      "message": "Jean Dupont a passé une commande de 2 articles : T-shirt Design Unique, Hoodie Premium",
      "isRead": false,
      "metadata": {
        "orderId": 123,
        "orderNumber": "CMD20241127001",
        "amount": 89.99,
        "customer": "Jean Dupont",
        "itemsCount": 2
      },
      "createdAt": "2024-11-27T14:30:00.000Z",
      "updatedAt": "2024-11-27T14:30:00.000Z",
      "expiresAt": null,
      "user": {
        "id": 2,
        "firstName": "Admin",
        "lastName": "Principal"
      }
    },
    {
      "id": 14,
      "userId": 2,
      "type": "ORDER_UPDATED",
      "title": "Commande mise à jour",
      "message": "Statut de la commande CMD20241127002 modifié de \"En attente\" vers \"Confirmée\"",
      "isRead": true,
      "metadata": {
        "orderId": 124,
        "orderNumber": "CMD20241127002",
        "amount": 45.50,
        "customer": "Marie Martin",
        "oldStatus": "PENDING",
        "newStatus": "CONFIRMED"
      },
      "createdAt": "2024-11-27T13:15:00.000Z",
      "updatedAt": "2024-11-27T14:00:00.000Z",
      "expiresAt": null,
      "user": {
        "id": 2,
        "firstName": "Admin",
        "lastName": "Principal"
      }
    }
  ],
  "unreadCount": 5,
  "metadata": {
    "limit": 50,
    "includeRead": true,
    "total": 2
  }
}
```

---

## 2. Compter les notifications non lues

### Endpoint
```
GET /notifications/unread-count
```

### Exemple de requête
```javascript
fetch('http://localhost:3004/notifications/unread-count', {
  credentials: 'include'
})
```

### Réponse de succès (200 OK)
```json
{
  "success": true,
  "unreadCount": 3
}
```

---

## 3. Marquer une notification comme lue

### Endpoint
```
POST /notifications/:id/mark-read
```

### Exemple de requête
```javascript
fetch('http://localhost:3004/notifications/15/mark-read', {
  method: 'POST',
  credentials: 'include'
})
```

### Réponse de succès (200 OK)
```json
{
  "success": true,
  "message": "Notification marquée comme lue"
}
```

### Réponse d'erreur (404 Not Found)
```json
{
  "success": false,
  "message": "Notification non trouvée",
  "error": "Not Found",
  "statusCode": 404
}
```

---

## 4. Marquer toutes comme lues

### Endpoint
```
POST /notifications/mark-all-read
```

### Exemple de requête
```javascript
fetch('http://localhost:3004/notifications/mark-all-read', {
  method: 'POST',
  credentials: 'include'
})
```

### Réponse de succès (200 OK)
```json
{
  "success": true,
  "message": "5 notification(s) marquée(s) comme lue(s)",
  "updatedCount": 5
}
```

---

## 5. Supprimer une notification

### Endpoint
```
DELETE /notifications/:id
```

### Exemple de requête
```javascript
fetch('http://localhost:3004/notifications/15', {
  method: 'DELETE',
  credentials: 'include'
})
```

### Réponse de succès (200 OK)
```json
{
  "success": true,
  "message": "Notification supprimée"
}
```

---

## 6. Nettoyage admin (notifications expirées)

### Endpoint
```
POST /notifications/admin/clean-expired
```

**⚠️ Accès réservé aux ADMIN et SUPERADMIN**

### Exemple de requête
```javascript
fetch('http://localhost:3004/notifications/admin/clean-expired', {
  method: 'POST',
  credentials: 'include'
})
```

### Réponse de succès (200 OK)
```json
{
  "success": true,
  "message": "12 notification(s) expirée(s) supprimée(s)",
  "deletedCount": 12
}
```

### Réponse d'erreur (403 Forbidden)
```json
{
  "success": false,
  "message": "Accès refusé - droits admin requis"
}
```

---

## 7. Types de notifications

| Type | Icon | Description | Destinataires |
|------|------|-------------|---------------|
| `ORDER_NEW` | 🆕 | Nouvelle commande reçue | Admins uniquement |
| `ORDER_UPDATED` | 📝 | Statut de commande modifié | Admins + Client concerné |
| `SYSTEM` | ⚙️ | Notification système | Selon contexte |
| `SUCCESS` | ✅ | Confirmation d'action | Selon contexte |
| `WARNING` | ⚠️ | Avertissement | Selon contexte |
| `ERROR` | ❌ | Erreur ou problème | Selon contexte |

---

## 8. Modèle de données Notification

```typescript
interface Notification {
  id: number;                    // ID unique
  userId: number;                // ID de l'utilisateur destinataire
  type: NotificationType;        // Type de notification
  title: string;                 // Titre court
  message: string;               // Message descriptif
  isRead: boolean;               // Lu/non lu
  metadata: object | null;       // Données contextuelles (JSON)
  createdAt: string;             // Date de création (ISO)
  updatedAt: string;             // Date de mise à jour (ISO)
  expiresAt: string | null;      // Date d'expiration (ISO) ou null
  user: {                        // Informations utilisateur
    id: number;
    firstName: string;
    lastName: string;
  };
}
```

### Structure des métadonnées par type

#### ORDER_NEW / ORDER_UPDATED
```json
{
  "orderId": 123,
  "orderNumber": "CMD20241127001",
  "amount": 89.99,
  "customer": "Jean Dupont",
  "itemsCount": 2,
  "oldStatus": "PENDING",      // Seulement pour ORDER_UPDATED
  "newStatus": "CONFIRMED"     // Seulement pour ORDER_UPDATED
}
```

#### SYSTEM / SUCCESS / WARNING / ERROR
```json
{
  "action": "user_registration",
  "resourceId": 456,
  "details": "Description complémentaire"
}
```

---

## 9. Codes d'erreur

| Code | Statut | Description |
|------|--------|-------------|
| 200 | OK | Opération réussie |
| 401 | Unauthorized | Non authentifié (cookie manquant/invalide) |
| 403 | Forbidden | Accès refusé (droits insuffisants) |
| 404 | Not Found | Notification non trouvée |
| 500 | Internal Server Error | Erreur serveur |

### Format des erreurs
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "error": "Nom du type d'erreur",
  "statusCode": 404
}
```

---

## 10. Exemples d'intégration

### Service JavaScript complet
```javascript
class NotificationService {
  constructor() {
    this.baseURL = 'http://localhost:3004';
  }

  async getNotifications(limit = 50, includeRead = true) {
    const params = new URLSearchParams({ 
      limit: limit.toString(),
      includeRead: includeRead.toString()
    });
    
    const response = await fetch(`${this.baseURL}/notifications?${params}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getUnreadCount() {
    const response = await fetch(`${this.baseURL}/notifications/unread-count`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.unreadCount;
  }

  async markAsRead(notificationId) {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}/mark-read`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async markAllAsRead() {
    const response = await fetch(`${this.baseURL}/notifications/mark-all-read`, {
      method: 'POST',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }

  async deleteNotification(notificationId) {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Erreur ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}

export default new NotificationService();
```

### Hook React useNotifications
```javascript
import { useState, useEffect } from 'react';
import NotificationService from '../services/NotificationService';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await NotificationService.getNotifications();
      setNotifications(data.data);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      setError(err.message);
      console.error('Erreur notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Erreur marquer comme lu:', err);
      throw err;
    }
  };

  const markAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Erreur marquer toutes comme lues:', err);
      throw err;
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await NotificationService.deleteNotification(notificationId);
      setNotifications(prev => {
        const notification = prev.find(n => n.id === notificationId);
        if (notification && !notification.isRead) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (err) {
      console.error('Erreur suppression notification:', err);
      throw err;
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Actualisation toutes les 30s
    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: loadNotifications
  };
};
```

### Gestion d'erreurs
```javascript
const handleNotificationError = (error) => {
  if (error.message.includes('401')) {
    // Redirection vers login
    window.location.href = '/login';
  } else if (error.message.includes('403')) {
    console.warn('Accès refusé');
  } else if (error.message.includes('404')) {
    console.warn('Notification non trouvée');
  } else {
    console.error('Erreur notification:', error);
  }
};
```

### Composant de navigation vers commandes
```javascript
const handleNotificationClick = (notification) => {
  // Marquer comme lue si pas encore fait
  if (!notification.isRead) {
    markAsRead(notification.id);
  }
  
  // Navigation automatique vers la commande
  if (notification.metadata?.orderId) {
    if (notification.type === 'ORDER_NEW' || notification.type === 'ORDER_UPDATED') {
      // Redirection vers la page de détail de commande
      window.location.href = `/admin/orders/${notification.metadata.orderId}`;
    }
  }
};
```

---

## 🔧 Tests et Debug

### Test rapide des endpoints
```javascript
// Test authentification
fetch('http://localhost:3004/notifications/unread-count', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);

// Test récupération notifications
fetch('http://localhost:3004/notifications?limit=5', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log);
```

### Debug en console
```javascript
// Vérifier le service
console.log(await NotificationService.getNotifications());

// Tester une action
await NotificationService.markAsRead(15);
console.log('Notification marquée comme lue');

// Vérifier le compteur
console.log('Non lues:', await NotificationService.getUnreadCount());
```

---

## 🎯 Points importants

1. **Authentification obligatoire** : Toujours inclure `credentials: 'include'`
2. **Gestion d'erreurs** : Vérifier `response.ok` avant de traiter les données
3. **Métadonnées** : Utiliser `notification.metadata.orderId` pour la navigation
4. **Temps réel** : Combiner avec WebSocket pour les notifications instantanées
5. **Performance** : Mettre en cache les données pour éviter les requêtes inutiles

Cette documentation couvre tous les aspects nécessaires pour une intégration frontend complète du système de notifications ! 🚀 