# 🔧 Solution Admin Funds API - Guide Frontend

## 🎯 Problème identifié
Le frontend essaie d'accéder aux endpoints `/api/admin/funds-requests` mais le backend NestJS n'a pas de préfixe global `/api`. Les routes réelles sont directement :
- `http://localhost:3004/admin/funds-requests` ✅
- ❌ `http://localhost:3004/api/admin/funds-requests` (n'existe pas)

## 🚀 Solution Immédiate

### 1. Corriger les URLs dans le service frontend

```typescript
// ❌ ANCIEN (ne fonctionne pas)
const baseURL = '/api/admin/funds-requests';

// ✅ NOUVEAU (correct)
const baseURL = '/admin/funds-requests';
```

### 2. Configuration complète du service

```typescript
// adminFundsService.ts
class AdminFundsService {
  private baseURL = '/admin/funds-requests';
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3004',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor pour ajouter le token JWT
    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  // ✅ Récupérer toutes les demandes d'appels de fonds
  async getAllFundsRequests(filters: AdminFundsRequestFilters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page.toString());
      if (filters.limit) params.append('limit', filters.limit.toString());
      if (filters.status) params.append('status', filters.status);
      if (filters.vendorId) params.append('vendorId', filters.vendorId.toString());
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.minAmount) params.append('minAmount', filters.minAmount.toString());
      if (filters.maxAmount) params.append('maxAmount', filters.maxAmount.toString());
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

      const response = await this.apiClient.get(`${this.baseURL}?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération demandes admin:', error);
      throw error;
    }
  }

  // ✅ Récupérer les statistiques admin
  async getAdminFundsStatistics() {
    try {
      const response = await this.apiClient.get(`${this.baseURL}/statistics`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération statistiques admin:', error);
      throw error;
    }
  }

  // ✅ Récupérer les détails d'une demande
  async getFundsRequestDetails(requestId: number) {
    try {
      const response = await this.apiClient.get(`${this.baseURL}/${requestId}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur récupération demande ${requestId}:`, error);
      throw error;
    }
  }

  // ✅ Marquer une demande comme payée
  async markRequestAsPaid(requestId: number, adminNote?: string) {
    try {
      const response = await this.apiClient.patch(`${this.baseURL}/${requestId}/process`, {
        status: 'PAID',
        adminNote: adminNote || 'Paiement effectué'
      });
      return response.data;
    } catch (error) {
      console.error(`❌ Erreur paiement demande ${requestId}:`, error);
      throw error;
    }
  }

  // ✅ Paiement en lot
  async batchPayRequests(requestIds: number[], adminNote?: string) {
    try {
      const response = await this.apiClient.patch(`${this.baseURL}/batch-process`, {
        requestIds,
        status: 'PAID',
        adminNote: adminNote || 'Paiement en lot effectué'
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur paiement en lot:', error);
      throw error;
    }
  }
}

export default new AdminFundsService();
```

## 📋 Endpoints Backend Disponibles

### Routes Admin Funds (préfixe: `/admin`)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/admin/funds-requests` | Liste toutes les demandes |
| `GET` | `/admin/funds-requests/statistics` | Statistiques admin |
| `GET` | `/admin/funds-requests/:requestId` | Détails d'une demande |
| `PATCH` | `/admin/funds-requests/:requestId/process` | Traiter une demande |
| `PATCH` | `/admin/funds-requests/batch-process` | Traitement en lot |

### Paramètres de filtrage disponibles

```typescript
interface AdminFundsRequestFilters {
  page?: number;           // Page courante (défaut: 1)
  limit?: number;          // Nombre par page (défaut: 10)
  status?: 'PENDING' | 'PAID';  // Nouveau workflow: plus de REJECTED
  vendorId?: number;       // Filtrer par vendeur
  startDate?: string;      // Date de début (ISO string)
  endDate?: string;        // Date de fin (ISO string)
  minAmount?: number;      // Montant minimum
  maxAmount?: number;      // Montant maximum
  sortBy?: string;         // Champ de tri (défaut: 'createdAt')
  sortOrder?: 'asc' | 'desc'; // Ordre de tri (défaut: 'desc')
}
```

## 🎨 Exemple d'utilisation React

```tsx
import React, { useState, useEffect } from 'react';
import AdminFundsService from '../services/adminFundsService';

const AdminPaymentRequestsPage: React.FC = () => {
  const [requests, setRequests] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: 'PENDING' // Par défaut, afficher les demandes en attente
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [requestsData, statsData] = await Promise.all([
        AdminFundsService.getAllFundsRequests(filters),
        AdminFundsService.getAdminFundsStatistics()
      ]);

      if (requestsData.success) {
        setRequests(requestsData.data.requests);
      }

      if (statsData.success) {
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error('❌ Erreur chargement données admin:', error);
      // Afficher notification d'erreur à l'utilisateur
    } finally {
      setLoading(false);
    }
  };

  const handlePayRequest = async (requestId: number) => {
    try {
      const result = await AdminFundsService.markRequestAsPaid(
        requestId,
        'Paiement effectué depuis l\'interface admin'
      );

      if (result.success) {
        // Success notification
        console.log('✅ Paiement effectué avec succès');
        // Recharger les données
        await loadData();
      }
    } catch (error) {
      console.error('❌ Erreur lors du paiement:', error);
      // Error notification
    }
  };

  const handleBatchPay = async (selectedIds: number[]) => {
    try {
      const result = await AdminFundsService.batchPayRequests(
        selectedIds,
        `Paiement en lot de ${selectedIds.length} demandes`
      );

      if (result.success) {
        console.log(`✅ ${result.data.processed} demandes payées en lot`);
        await loadData();
      }
    } catch (error) {
      console.error('❌ Erreur paiement en lot:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters]);

  return (
    <div className="admin-payment-requests">
      <h1>Gestion des Appels de Fonds</h1>

      {/* Statistiques */}
      {statistics && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>En Attente</h3>
            <div className="stat-value">{statistics.totalPendingRequests}</div>
            <div className="stat-subtitle">
              {statistics.totalPendingAmount?.toLocaleString()} FCFA
            </div>
          </div>

          <div className="stat-card">
            <h3>Payées Aujourd'hui</h3>
            <div className="stat-value">{statistics.totalProcessedToday}</div>
            <div className="stat-subtitle">
              {statistics.totalProcessedAmount?.toLocaleString()} FCFA
            </div>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="filters">
        <select
          value={filters.status || ''}
          onChange={(e) => setFilters({...filters, status: e.target.value as any})}
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PAID">Payé</option>
        </select>
      </div>

      {/* Liste des demandes */}
      <div className="requests-table">
        {loading ? (
          <div>Chargement...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Vendeur</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request: any) => (
                <tr key={request.id}>
                  <td>{request.vendor?.shopName || 'N/A'}</td>
                  <td>{request.amount?.toLocaleString()} FCFA</td>
                  <td>
                    <span className={`status ${request.status.toLowerCase()}`}>
                      {request.status === 'PENDING' ? 'En attente' : 'Payé'}
                    </span>
                  </td>
                  <td>{new Date(request.createdAt).toLocaleDateString()}</td>
                  <td>
                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handlePayRequest(request.id)}
                        className="pay-button"
                      >
                        Marquer comme Payé
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminPaymentRequestsPage;
```

## 🔒 Authentification Requise

Tous les endpoints admin nécessitent :
1. **Token JWT** dans le header `Authorization: Bearer <token>`
2. **Rôle Admin** ou **SuperAdmin** dans le token

```typescript
// Vérification du token côté frontend
const token = localStorage.getItem('authToken');
if (!token) {
  // Rediriger vers la page de connexion
  window.location.href = '/login';
}
```

## ⚠️ Nouveau Workflow - Points Importants

1. **Plus de rejet** : Les demandes ne peuvent plus être rejetées
2. **Statuts simplifiés** : `PENDING` → `PAID` uniquement
3. **Paiement automatique** : L'admin ne peut que marquer comme "payé"
4. **Validation automatique** : Les demandes passent automatiquement en `PENDING`

## 🐛 Debug et Monitoring

```typescript
// Ajouter des logs pour débugger
console.log('🔍 URL appelée:', `${baseURL}${endpoint}`);
console.log('🔍 Token présent:', !!token);
console.log('🔍 Paramètres:', params);

// Interceptor pour logger les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 404) {
      console.error('❌ Endpoint non trouvé - Vérifier l\'URL');
    }
    if (error.response?.status === 401) {
      console.error('❌ Non autorisé - Vérifier le token JWT');
    }
    return Promise.reject(error);
  }
);
```

## 🚀 Test des Endpoints

Vous pouvez tester les endpoints avec curl :

```bash
# Test de récupération des demandes
curl -X GET "http://localhost:3004/admin/funds-requests?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test des statistiques
curl -X GET "http://localhost:3004/admin/funds-requests/statistics" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Test de paiement d'une demande
curl -X PATCH "http://localhost:3004/admin/funds-requests/1/process" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "PAID", "adminNote": "Paiement test"}'
```

## 📞 En cas de problème

1. **Vérifier le serveur backend** : `http://localhost:3004` doit être accessible
2. **Vérifier les CORS** : Le frontend doit être autorisé dans `main.ts`
3. **Vérifier l'authentification** : Token JWT valide et rôle admin
4. **Vérifier les logs serveur** : Consulter la console du backend NestJS

---
✅ **Cette solution corrige définitivement l'erreur 404 pour les endpoints admin des appels de fonds**