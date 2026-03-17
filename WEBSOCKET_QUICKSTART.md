# 🚀 Guide Rapide - WebSocket Notifications Temps Réel

## ✅ Ce qui a été implémenté

### Backend NestJS
- ✅ **OrderGateway** : Gestion des connexions WebSocket avec authentification JWT
- ✅ **Notifications automatiques** : Envoyées lors de nouvelles commandes et changements de statut
- ✅ **Séparation des rôles** : Admins et utilisateurs dans des rooms séparées
- ✅ **Reconnexion automatique** et gestion d'erreurs
- ✅ **Endpoints de test** : Pour vérifier l'état des connexions

### Frontend (Documentation)
- ✅ **WebSocketService** : Service complet avec gestion des notifications
- ✅ **NotificationCenter** : Composant React pour afficher les notifications
- ✅ **Persistance locale** : Sauvegarde des notifications
- ✅ **Notifications navigateur** et sons

## 🔧 Démarrage Rapide

### 1. Démarrer le serveur
```bash
npm start
# ou
npm run start:dev
```

### 2. Tester les WebSockets (Backend)
Vérifiez les logs du serveur - vous devriez voir :
```
[WebSocketGateway] WebSocket server initialized
```

### 3. Test Frontend Simple

#### A. Dans votre React App
```jsx
// App.jsx
import NotificationCenter from './components/NotificationCenter';
import WebSocketService from './services/WebSocketService';

function App() {
  const userRole = 'ADMIN'; // ou récupérez depuis votre auth
  const authToken = localStorage.getItem('authToken'); // votre token JWT

  return (
    <div className="App">
      <header>
        <h1>PrintAlma Dashboard</h1>
        {/* Ajoutez le centre de notifications */}
        <NotificationCenter 
          userRole={userRole} 
          authToken={authToken} 
        />
      </header>
      
      {/* Votre contenu existant */}
    </div>
  );
}
```

#### B. Test rapide dans la console
```javascript
// 1. Copiez le WebSocketService dans votre projet
// 2. Dans la console du navigateur :

const token = localStorage.getItem('authToken'); // Votre token
WebSocketService.connect(token);

// Vérifier la connexion
WebSocketService.ping();

// Simuler une notification
WebSocketService.addNotification({
  type: 'NEW_ORDER',
  title: 'Test',
  message: 'Notification test',
  data: { orderId: 123 }
});
```

## 🧪 Test Complet du Système

### Étape 1 : Vérifier l'authentification
```bash
# Dans votre terminal
curl -X GET "http://localhost:3004/orders/test-auth" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json"
```

### Étape 2 : Tester l'accès admin
```bash
curl -X GET "http://localhost:3004/orders/test-admin" \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json"
```

### Étape 3 : Vérifier les stats WebSocket
```bash
curl -X GET "http://localhost:3004/orders/admin/websocket-stats" \
  -H "Authorization: Bearer VOTRE_TOKEN_ADMIN" \
  -H "Content-Type: application/json"
```

### Étape 4 : Créer une commande de test
```bash
curl -X POST "http://localhost:3004/orders" \
  -H "Authorization: Bearer VOTRE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "shippingAddress": "123 Rue de Test, Paris",
    "phoneNumber": "+33123456789",
    "notes": "Test WebSocket",
    "orderItems": [
      {
        "productId": 1,
        "quantity": 1,
        "size": "M",
        "color": "Rouge"
      }
    ]
  }'
```

## 🔍 Vérifications

### ✅ Backend
1. **Serveur démarré** sans erreurs
2. **Logs WebSocket** visibles au démarrage
3. **Endpoints** `/orders/test-auth` et `/orders/test-admin` fonctionnels
4. **Création de commande** déclenche les notifications

### ✅ Frontend
1. **Service WebSocketService** importé
2. **Composant NotificationCenter** affiché
3. **Connexion WebSocket** établie (indicateur vert)
4. **Notifications** reçues et affichées

### ✅ Flux complet
1. **Admin connecté** → Indicateur vert dans NotificationCenter
2. **Client crée commande** → Admin reçoit notification instantanée
3. **Admin change statut** → Client reçoit notification de mise à jour

## 🐛 Dépannage

### Problème : WebSocket ne se connecte pas
```javascript
// Vérifiez les erreurs dans la console
console.log(WebSocketService.getConnectionStatus());

// Vérifiez votre token
const token = localStorage.getItem('authToken');
console.log('Token:', token ? 'Présent' : 'Manquant');
```

### Problème : Pas de notifications
```javascript
// Vérifiez les stats
fetch('/orders/admin/websocket-stats', {
  headers: { 'Authorization': 'Bearer ' + token },
  credentials: 'include'
}).then(r => r.json()).then(console.log);
```

### Problème : Erreur CORS
Ajustez dans `order.gateway.ts` :
```typescript
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000', // Votre domaine frontend
    credentials: true,
  },
  namespace: '/orders',
})
```

## 📱 Fonctionnalités Bonus

### Notifications Navigateur
```javascript
// Demander permission
WebSocketService.requestNotificationPermission();

// Les notifications apparaîtront automatiquement
// même si l'onglet n'est pas actif
```

### Sons de Notification
Ajoutez un fichier `public/notification-sound.mp3` dans votre frontend.

### Notifications Personnalisées
```javascript
// Créer une notification custom
WebSocketService.addNotification({
  type: 'CUSTOM',
  title: 'Message personnalisé',
  message: 'Votre message ici',
  data: { custom: 'data' }
});
```

## 🎯 Résultat Attendu

Une fois tout configuré :

1. **👑 Admin connecté** → Voit l'indicateur "Connecté" 
2. **📦 Nouvelle commande** → Admin reçoit notification instantanée avec son + popup
3. **📝 Changement statut** → Client et admins notifiés en temps réel
4. **🔄 Reconnexion auto** → Si connexion coupée, reconnexion automatique
5. **💾 Persistance** → Notifications sauvegardées même après refresh

**Votre système de notifications temps réel est prêt !** 🚀✨

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs du serveur NestJS
2. Inspectez la console du navigateur
3. Testez les endpoints avec curl/Postman
4. Vérifiez que les tokens JWT sont valides

Le système est **production-ready** et gère automatiquement tous les cas d'usage ! 🎉 