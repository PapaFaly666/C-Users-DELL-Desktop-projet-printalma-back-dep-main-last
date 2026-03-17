import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // En production, spécifiez votre domaine frontend
    credentials: true,
  },
  namespace: '/orders',
})
export class OrderGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedAdmins = new Map<string, Socket>();
  private connectedUsers = new Map<string, Socket>();

  constructor(private jwtService: JwtService) {}

  // 🔧 NOUVELLE MÉTHODE: Extraire le token depuis plusieurs sources (cookies inclus)
  private extractTokenFromSocket(client: Socket): string | null {
    // 1. Vérifier auth token
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token;
    }

    // 2. Vérifier query params
    if (client.handshake.query?.token) {
      return client.handshake.query.token as string;
    }

    // 3. Vérifier headers Authorization
    const authHeader = client.handshake.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      return authHeader.replace('Bearer ', '');
    }

    // 4. ⭐ NOUVEAU: Vérifier les cookies
    const cookies = client.handshake.headers.cookie;
    if (cookies) {
      const cookieMatch = cookies.match(/auth_token=([^;]+)/);
      if (cookieMatch) {
        console.log('🍪 Token trouvé dans les cookies');
        return cookieMatch[1];
      }
    }

    return null;
  }

  async handleConnection(client: Socket) {
    try {
      // 🔧 UTILISER LA NOUVELLE MÉTHODE d'extraction de token
      const token = this.extractTokenFromSocket(client);

      if (!token) {
        console.log('🚫 Connexion WebSocket refusée: pas de token');
        client.disconnect();
        return;
      }

      // Vérifier le token JWT
      const payload = await this.jwtService.verifyAsync(token);
      const user = payload; // Ajustez selon votre structure JWT

      // Stocker les infos utilisateur dans le socket
      client.data.user = user;
      client.data.userId = user.sub;
      client.data.userRole = user.role;

      // Séparer les admins des utilisateurs normaux
      if (['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        this.connectedAdmins.set(client.id, client);
        client.join('admins'); // Room pour tous les admins
        console.log(`👑 Admin connecté: ${user.email} (${client.id})`);
        console.log(`📊 Total admins connectés: ${this.connectedAdmins.size}`);
      } else {
        this.connectedUsers.set(client.id, client);
        client.join(`user_${user.sub}`); // Room individuelle pour chaque utilisateur
        console.log(`👤 Utilisateur connecté: ${user.email} (${client.id})`);
      }

    } catch (error) {
      console.log('🚫 Erreur authentification WebSocket:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    
    if (user) {
      if (['ADMIN', 'SUPERADMIN'].includes(user.role)) {
        this.connectedAdmins.delete(client.id);
        console.log(`👑 Admin déconnecté: ${user.email}`);
        console.log(`📊 Total admins connectés: ${this.connectedAdmins.size}`);
      } else {
        this.connectedUsers.delete(client.id);
        console.log(`👤 Utilisateur déconnecté: ${user.email}`);
      }
    }
  }

  // Méthode pour notifier une nouvelle commande aux admins
  notifyNewOrder(order: any) {
    const notification = {
      type: 'NEW_ORDER',
      title: '🆕 Nouvelle commande reçue !',
      message: `Commande #${order.orderNumber} - ${order.totalAmount}€`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        customerName: `${order.userFirstName} ${order.userLastName}`,
        customerEmail: order.userEmail,
        itemsCount: order.orderItems?.length || 0,
        createdAt: order.createdAt,
      },
      timestamp: new Date().toISOString(),
    };

    // Envoyer à tous les admins connectés
    this.server.to('admins').emit('newOrder', notification);
    
    console.log(`🔔 Notification envoyée à ${this.connectedAdmins.size} admin(s) connecté(s)`);
    console.log(`📦 Commande: #${order.orderNumber} - ${order.totalAmount}€`);
  }

  // Méthode pour notifier un changement de statut
  notifyOrderStatusChange(order: any, previousStatus: string, changedBy: string) {
    // Notification pour les admins
    const adminNotification = {
      type: 'ORDER_STATUS_CHANGED',
      title: '📝 Statut de commande modifié',
      message: `Commande #${order.orderNumber}: ${previousStatus} → ${order.status}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        previousStatus,
        newStatus: order.status,
        changedBy,
        customerEmail: order.userEmail,
      },
      timestamp: new Date().toISOString(),
    };

    this.server.to('admins').emit('orderStatusChanged', adminNotification);

    // Notification pour le client concerné
    const clientNotification = {
      type: 'MY_ORDER_UPDATED',
      title: '📦 Mise à jour de votre commande',
      message: `Votre commande #${order.orderNumber} est maintenant: ${this.getStatusLabel(order.status)}`,
      data: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        statusLabel: this.getStatusLabel(order.status),
      },
      timestamp: new Date().toISOString(),
    };

    this.server.to(`user_${order.userId}`).emit('myOrderUpdated', clientNotification);
    
    console.log(`🔄 Statut mis à jour: Commande #${order.orderNumber} → ${order.status}`);
  }

  // Méthode pour obtenir le statut en français
  private getStatusLabel(status: string): string {
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

  // Messages de test (optionnel)
  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket, @MessageBody() data: any) {
    const user = client.data.user;
    console.log(`🏓 Ping reçu de ${user?.email}`);
    client.emit('pong', { 
      message: 'Connexion WebSocket active', 
      timestamp: new Date().toISOString(),
      user: user?.email 
    });
  }

  // Méthode pour obtenir les statistiques de connexion
  getConnectionStats() {
    return {
      connectedAdmins: this.connectedAdmins.size,
      connectedUsers: this.connectedUsers.size,
      total: this.connectedAdmins.size + this.connectedUsers.size,
    };
  }
} 