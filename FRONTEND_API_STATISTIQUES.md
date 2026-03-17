# 📊 API Statistiques Frontend - PrintAlma

## 🎯 Vue d'Ensemble

Documentation complète des endpoints de statistiques pour l'équipe frontend. Tous les exemples incluent les formats exacts de données à envoyer et recevoir pour créer des dashboards et rapports.

## 🔐 Authentification

**Important :** Toutes les requêtes nécessitent une authentification par cookie `auth_token` et des droits admin.

```javascript
// Configuration fetch avec cookies
const fetchConfig = {
  credentials: 'include', // ⭐ ESSENTIEL pour envoyer les cookies
  headers: {
    'Content-Type': 'application/json'
  }
};
```

## 📈 1. Statistiques Générales (Dashboard Principal)

### 🔗 Endpoint
```
GET http://localhost:3004/orders/admin/statistics
```

### 📝 Paramètres Optionnels

```javascript
const params = {
  period: '30d',        // '7d', '30d', '90d', '365d', 'custom'
  dateFrom: '2024-01-01', // Format YYYY-MM-DD (si period='custom')
  dateTo: '2024-12-31',   // Format YYYY-MM-DD (si period='custom')
  timezone: 'Europe/Paris' // Optionnel, défaut: Europe/Paris
};

// Construction de l'URL avec paramètres
const url = new URL('http://localhost:3004/orders/admin/statistics');
Object.entries(params).forEach(([key, value]) => {
  if (value) url.searchParams.append(key, value);
});

const response = await fetch(url, {
  credentials: 'include'
});
```

### ✅ Réponse Complète (200)

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalOrders": 1547,
      "totalRevenue": 45892.50,
      "averageOrderValue": 29.67,
      "ordersToday": 23,
      "revenueToday": 685.40,
      "ordersThisMonth": 456,
      "revenueThisMonth": 13547.80,
      "growthRate": {
        "orders": 15.3,      // % croissance vs période précédente
        "revenue": 18.7      // % croissance vs période précédente
      }
    },
    "statusBreakdown": {
      "PENDING": 45,
      "CONFIRMED": 123,
      "PROCESSING": 89,
      "SHIPPED": 234,
      "DELIVERED": 987,
      "CANCELLED": 52,
      "REJECTED": 17
    },
    "revenueChart": [
      {
        "date": "2024-11-01",
        "revenue": 1234.50,
        "orders": 42,
        "averageOrderValue": 29.39
      },
      {
        "date": "2024-11-02", 
        "revenue": 1567.80,
        "orders": 51,
        "averageOrderValue": 30.74
      }
      // ... données pour chaque jour de la période
    ],
    "topProducts": [
      {
        "productId": 1,
        "productName": "T-shirt Design Unique",
        "categoryName": "Vêtements",
        "totalOrders": 156,
        "totalQuantity": 289,
        "totalRevenue": 4678.44,
        "averagePrice": 29.99,
        "growthRate": 12.5
      },
      {
        "productId": 3,
        "productName": "Hoodie Premium",
        "categoryName": "Vêtements", 
        "totalOrders": 98,
        "totalQuantity": 143,
        "totalRevenue": 4285.57,
        "averagePrice": 29.97,
        "growthRate": -2.1
      }
    ],
    "topCustomers": [
      {
        "userId": 15,
        "firstName": "Marie",
        "lastName": "Dubois",
        "email": "marie.dubois@example.com",
        "totalOrders": 12,
        "totalSpent": 356.88,
        "averageOrderValue": 29.74,
        "lastOrderDate": "2024-11-25T14:30:00.000Z"
      }
    ],
    "recentActivity": [
      {
        "id": 1,
        "type": "ORDER_CREATED",
        "orderId": 1547,
        "orderNumber": "CMD20241127015",
        "customerName": "Jean Dupont",
        "amount": 59.98,
        "timestamp": "2024-11-27T16:45:00.000Z"
      },
      {
        "id": 2,
        "type": "ORDER_STATUS_CHANGED",
        "orderId": 1546,
        "orderNumber": "CMD20241127014",
        "customerName": "Marie Martin",
        "previousStatus": "CONFIRMED",
        "newStatus": "SHIPPED",
        "timestamp": "2024-11-27T16:30:00.000Z"
      }
    ],
    "categoryStats": [
      {
        "categoryId": 1,
        "categoryName": "Vêtements",
        "totalOrders": 1234,
        "totalRevenue": 36890.45,
        "percentage": 80.4,
        "growthRate": 15.2
      },
      {
        "categoryId": 2,
        "categoryName": "Accessoires",
        "totalOrders": 313,
        "totalRevenue": 9002.05,
        "percentage": 19.6,
        "growthRate": 8.7
      }
    ],
    "hourlyStats": [
      {
        "hour": 9,
        "orders": 12,
        "revenue": 356.88
      },
      {
        "hour": 10,
        "orders": 18,
        "revenue": 534.22
      }
      // ... données pour chaque heure (0-23)
    ],
    "weeklyStats": [
      {
        "dayOfWeek": 1, // Lundi = 1, Dimanche = 7
        "dayName": "Lundi",
        "orders": 145,
        "revenue": 4312.67
      }
      // ... données pour chaque jour de la semaine
    ],
    "monthlyTrends": [
      {
        "month": "2024-01",
        "orders": 456,
        "revenue": 13547.80,
        "customers": 289
      }
      // ... données pour chaque mois
    ]
  },
  "metadata": {
    "period": "30d",
    "dateFrom": "2024-10-28",
    "dateTo": "2024-11-27",
    "timezone": "Europe/Paris",
    "generatedAt": "2024-11-27T16:45:00.000Z",
    "dataFreshness": "real-time"
  }
}
```

## 💰 2. Statistiques de Revenus Détaillées

### 🔗 Endpoint
```
GET http://localhost:3004/orders/admin/revenue-stats
```

### 📝 Paramètres de Requête

```javascript
const revenueParams = {
  period: '30d',           // '7d', '30d', '90d', '365d', 'custom'
  groupBy: 'day',          // 'day', 'week', 'month', 'hour'
  dateFrom: '2024-11-01',  // Si period='custom'
  dateTo: '2024-11-30',    // Si period='custom'
  categoryId: 1,           // Optionnel: filtrer par catégorie
  includeRefunds: false    // Inclure les remboursements
};
```

### ✅ Réponse Revenus (200)

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 45892.50,
      "totalOrders": 1547,
      "averageOrderValue": 29.67,
      "refunds": 456.78,
      "netRevenue": 45435.72,
      "tax": 7572.62,
      "revenueExcludingTax": 37863.10
    },
    "revenueByPeriod": [
      {
        "period": "2024-11-01",
        "revenue": 1234.50,
        "orders": 42,
        "refunds": 0,
        "netRevenue": 1234.50
      }
      // ... données pour chaque période selon groupBy
    ],
    "revenueByCategory": [
      {
        "categoryId": 1,
        "categoryName": "Vêtements",
        "revenue": 36890.45,
        "percentage": 80.4,
        "orders": 1234
      }
    ],
    "revenueByPaymentMethod": [
      {
        "method": "card",
        "methodName": "Carte bancaire",
        "revenue": 41303.25,
        "percentage": 90.0,
        "orders": 1392
      },
      {
        "method": "paypal",
        "methodName": "PayPal",
        "revenue": 4589.25,
        "percentage": 10.0,
        "orders": 155
      }
    ],
    "projections": {
      "nextMonth": {
        "expectedRevenue": 52000.00,
        "confidence": 85,
        "basedOnTrend": true
      },
      "endOfYear": {
        "expectedRevenue": 550000.00,
        "confidence": 78,
        "basedOnTrend": true
      }
    }
  }
}
```

## 👥 3. Statistiques Clients

### 🔗 Endpoint
```
GET http://localhost:3004/orders/admin/customer-stats
```

### ✅ Réponse Clients (200)

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalCustomers": 789,
      "newCustomersThisMonth": 45,
      "returningCustomers": 456,
      "customerRetentionRate": 57.8,
      "averageLifetimeValue": 127.65
    },
    "customerSegments": [
      {
        "segment": "VIP",
        "description": "Plus de 10 commandes",
        "customerCount": 23,
        "totalRevenue": 8945.67,
        "averageOrderValue": 38.92
      },
      {
        "segment": "Fidèle",
        "description": "3-10 commandes",
        "customerCount": 156,
        "totalRevenue": 18456.78,
        "averageOrderValue": 29.45
      },
      {
        "segment": "Occasionnel",
        "description": "1-2 commandes",
        "customerCount": 610,
        "totalRevenue": 18489.05,
        "averageOrderValue": 26.83
      }
    ],
    "newCustomersByMonth": [
      {
        "month": "2024-01",
        "newCustomers": 67,
        "firstOrderRevenue": 1987.45
      }
      // ... données mensuelles
    ],
    "customerGeography": [
      {
        "region": "Île-de-France",
        "customerCount": 234,
        "percentage": 29.7,
        "totalRevenue": 13567.89
      },
      {
        "region": "Auvergne-Rhône-Alpes",
        "customerCount": 123,
        "percentage": 15.6,
        "totalRevenue": 7234.56
      }
      // ... autres régions
    ]
  }
}
```

## 📦 4. Statistiques Produits

### 🔗 Endpoint
```
GET http://localhost:3004/orders/admin/product-stats
```

### 📝 Paramètres de Requête

```javascript
const productParams = {
  period: '30d',
  categoryId: 1,        // Optionnel: filtrer par catégorie
  sortBy: 'revenue',    // 'revenue', 'orders', 'quantity'
  limit: 50             // Nombre de produits à retourner
};
```

### ✅ Réponse Produits (200)

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalProducts": 156,
      "productsWithOrders": 134,
      "topSellingProductId": 1,
      "mostProfitableProductId": 3,
      "averageProductRevenue": 294.18
    },
    "productPerformance": [
      {
        "productId": 1,
        "productName": "T-shirt Design Unique",
        "categoryName": "Vêtements",
        "sku": "TSH001",
        "totalOrders": 156,
        "totalQuantity": 289,
        "totalRevenue": 4678.44,
        "averagePrice": 29.99,
        "profit": 2339.22,
        "profitMargin": 50.0,
        "conversionRate": 12.3,
        "returnRate": 2.1,
        "stockLevel": 45,
        "reorderLevel": 20,
        "trendDirection": "up",
        "growthRate": 15.3
      }
    ],
    "categoryPerformance": [
      {
        "categoryId": 1,
        "categoryName": "Vêtements",
        "productCount": 89,
        "totalRevenue": 36890.45,
        "totalOrders": 1234,
        "averagePrice": 29.89,
        "growthRate": 12.7
      }
    ],
    "stockAlerts": [
      {
        "productId": 15,
        "productName": "Sweat à capuche Classic",
        "currentStock": 3,
        "reorderLevel": 15,
        "status": "critical",
        "lastSold": "2024-11-27T12:00:00.000Z"
      }
    ],
    "productTrends": [
      {
        "productId": 1,
        "trend": "seasonal_peak",
        "description": "Pic saisonnier détecté",
        "confidence": 89,
        "recommendation": "Augmenter le stock"
      }
    ]
  }
}
```

## 🕐 5. Statistiques Temps Réel

### 🔗 Endpoint WebSocket
```
ws://localhost:3004/analytics
```

### 📝 Connexion WebSocket

```javascript
// Service de statistiques temps réel
class RealTimeAnalytics {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    this.socket = io('http://localhost:3004/analytics', {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    this.setupListeners();
  }

  setupListeners() {
    // Nouvelles commandes en temps réel
    this.socket.on('orderCreated', (data) => {
      console.log('🆕 Nouvelle commande:', data);
      this.updateRealtimeStats(data);
    });

    // Changements de revenus
    this.socket.on('revenueUpdate', (data) => {
      console.log('💰 Revenus mis à jour:', data);
      this.updateRevenueDisplay(data);
    });

    // Visiteurs en ligne
    this.socket.on('visitorsUpdate', (data) => {
      console.log('👥 Visiteurs:', data);
      this.updateVisitorCount(data);
    });
  }

  updateRealtimeStats(orderData) {
    // Mettre à jour l'interface en temps réel
    if (this.listeners.onNewOrder) {
      this.listeners.onNewOrder(orderData);
    }
  }

  onNewOrder(callback) {
    this.listeners.onNewOrder = callback;
  }
}
```

### ✅ Événements Temps Réel

```javascript
// Nouvelle commande
{
  "type": "orderCreated",
  "data": {
    "orderId": 1548,
    "amount": 59.98,
    "customerName": "Jean Dupont",
    "timestamp": "2024-11-27T17:00:00.000Z"
  }
}

// Mise à jour revenus
{
  "type": "revenueUpdate",
  "data": {
    "todayRevenue": 1245.67,
    "todayOrders": 42,
    "currentHourRevenue": 234.56
  }
}

// Visiteurs en ligne
{
  "type": "visitorsUpdate", 
  "data": {
    "currentVisitors": 23,
    "activePages": {
      "/products": 12,
      "/orders": 5,
      "/": 6
    }
  }
}
```

## 📊 6. Rapports Personnalisés

### 🔗 Endpoint
```
POST http://localhost:3004/orders/admin/custom-report
```

### 📝 Requête Rapport Personnalisé

```javascript
const reportConfig = {
  name: "Rapport Mensuel Novembre 2024",
  dateFrom: "2024-11-01",
  dateTo: "2024-11-30",
  metrics: [
    "revenue",
    "orders",
    "customers",
    "products",
    "categories"
  ],
  groupBy: "day",
  filters: {
    categoryIds: [1, 2],
    minOrderValue: 25.00,
    customerSegment: "returning"
  },
  format: "json" // "json", "csv", "pdf"
};

const response = await fetch('http://localhost:3004/orders/admin/custom-report', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(reportConfig)
});
```

### ✅ Réponse Rapport (200)

```json
{
  "success": true,
  "data": {
    "reportId": "RPT20241127001",
    "name": "Rapport Mensuel Novembre 2024",
    "generatedAt": "2024-11-27T17:00:00.000Z",
    "period": {
      "from": "2024-11-01",
      "to": "2024-11-30"
    },
    "summary": {
      "totalRevenue": 13547.80,
      "totalOrders": 456,
      "uniqueCustomers": 234,
      "averageOrderValue": 29.71
    },
    "data": [
      {
        "date": "2024-11-01",
        "revenue": 567.89,
        "orders": 19,
        "customers": 16,
        "newCustomers": 3
      }
      // ... données détaillées
    ],
    "downloadUrl": "/downloads/reports/RPT20241127001.pdf",
    "expiresAt": "2024-12-27T17:00:00.000Z"
  }
}
```

## 🎨 7. Composants d'Affichage Frontend

### 📊 Graphique de Revenus

```jsx
// components/RevenueChart.jsx
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data, period }) => {
  const formatXAxis = (tickItem) => {
    const date = new Date(tickItem);
    switch(period) {
      case '7d':
        return date.toLocaleDateString('fr-FR', { weekday: 'short' });
      case '30d':
        return date.getDate();
      case '90d':
      case '365d':
        return date.toLocaleDateString('fr-FR', { month: 'short' });
      default:
        return date.toLocaleDateString('fr-FR');
    }
  };

  const formatTooltip = (value, name, props) => {
    if (name === 'revenue') {
      return [`${value.toFixed(2)} €`, 'Revenus'];
    }
    return [value, name];
  };

  return (
    <div className="revenue-chart">
      <h3>📈 Évolution des Revenus</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={formatXAxis}
          />
          <YAxis tickFormatter={(value) => `${value}€`} />
          <Tooltip formatter={formatTooltip} />
          <Line 
            type="monotone" 
            dataKey="revenue" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={{ fill: '#8884d8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
```

### 🏆 Top Produits

```jsx
// components/TopProducts.jsx
const TopProducts = ({ products }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getTrendIcon = (growthRate) => {
    if (growthRate > 0) return '📈';
    if (growthRate < 0) return '📉';
    return '➡️';
  };

  return (
    <div className="top-products">
      <h3>🏆 Top Produits</h3>
      <div className="products-list">
        {products.map((product, index) => (
          <div key={product.productId} className="product-item">
            <div className="product-rank">#{index + 1}</div>
            <div className="product-info">
              <h4>{product.productName}</h4>
              <span className="category">{product.categoryName}</span>
            </div>
            <div className="product-stats">
              <div className="revenue">{formatPrice(product.totalRevenue)}</div>
              <div className="orders">{product.totalOrders} commandes</div>
              <div className={`trend ${product.growthRate >= 0 ? 'positive' : 'negative'}`}>
                {getTrendIcon(product.growthRate)} {product.growthRate.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TopProducts;
```

### 📊 KPI Cards

```jsx
// components/KPICards.jsx
const KPICards = ({ overview }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const kpis = [
    {
      title: 'Revenus Total',
      value: formatCurrency(overview.totalRevenue),
      change: overview.growthRate.revenue,
      icon: '💰',
      color: 'green'
    },
    {
      title: 'Commandes',
      value: overview.totalOrders.toLocaleString('fr-FR'),
      change: overview.growthRate.orders,
      icon: '📦',
      color: 'blue'
    },
    {
      title: 'Panier Moyen',
      value: formatCurrency(overview.averageOrderValue),
      icon: '🛒',
      color: 'purple'
    },
    {
      title: 'Aujourd\'hui',
      value: formatCurrency(overview.revenueToday),
      subValue: `${overview.ordersToday} commandes`,
      icon: '📅',
      color: 'orange'
    }
  ];

  return (
    <div className="kpi-cards">
      {kpis.map((kpi, index) => (
        <div key={index} className={`kpi-card ${kpi.color}`}>
          <div className="kpi-icon">{kpi.icon}</div>
          <div className="kpi-content">
            <h3 className="kpi-title">{kpi.title}</h3>
            <div className="kpi-value">{kpi.value}</div>
            {kpi.subValue && (
              <div className="kpi-sub-value">{kpi.subValue}</div>
            )}
            {kpi.change && (
              <div className={`kpi-change ${kpi.change >= 0 ? 'positive' : 'negative'}`}>
                {kpi.change >= 0 ? '↗' : '↘'} {Math.abs(kpi.change).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KPICards;
```

## 🎨 CSS pour Dashboard

```css
/* Dashboard Statistics Styles */
.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-card.green { border-left: 4px solid #28a745; }
.kpi-card.blue { border-left: 4px solid #007bff; }
.kpi-card.purple { border-left: 4px solid #6f42c1; }
.kpi-card.orange { border-left: 4px solid #fd7e14; }

.kpi-icon {
  font-size: 2.5rem;
  opacity: 0.8;
}

.kpi-title {
  font-size: 0.9rem;
  color: #6c757d;
  margin: 0 0 5px 0;
  font-weight: 500;
}

.kpi-value {
  font-size: 1.8rem;
  font-weight: bold;
  color: #212529;
  margin: 0;
}

.kpi-sub-value {
  font-size: 0.8rem;
  color: #6c757d;
  margin-top: 2px;
}

.kpi-change {
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 5px;
}

.kpi-change.positive { color: #28a745; }
.kpi-change.negative { color: #dc3545; }

.revenue-chart {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 30px;
}

.top-products {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.products-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.product-item {
  display: flex;
  align-items: center;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  gap: 15px;
}

.product-rank {
  font-size: 1.2rem;
  font-weight: bold;
  color: #007bff;
  min-width: 40px;
}

.product-info {
  flex: 1;
}

.product-info h4 {
  margin: 0 0 5px 0;
  color: #212529;
}

.product-info .category {
  font-size: 0.85rem;
  color: #6c757d;
}

.product-stats {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.product-stats .revenue {
  font-weight: bold;
  color: #28a745;
}

.product-stats .orders {
  font-size: 0.85rem;
  color: #6c757d;
}

.trend.positive { color: #28a745; }
.trend.negative { color: #dc3545; }

@media (max-width: 768px) {
  .kpi-cards {
    grid-template-columns: 1fr;
  }
  
  .product-item {
    flex-direction: column;
    text-align: center;
  }
  
  .product-stats {
    text-align: center;
  }
}
```

## 🔧 Service Statistiques Complet

```javascript
// services/AnalyticsService.js
class AnalyticsService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3004';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getStatistics(period = '30d', options = {}) {
    const cacheKey = `stats-${period}-${JSON.stringify(options)}`;
    
    // Vérifier le cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const params = new URLSearchParams({ period, ...options });
    const response = await fetch(`${this.baseURL}/orders/admin/statistics?${params}`, {
      credentials: 'include'
    });

    const data = await this.handleResponse(response);
    
    // Mettre en cache
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }

  async getRevenueStats(options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseURL}/orders/admin/revenue-stats?${params}`, {
      credentials: 'include'
    });

    return this.handleResponse(response);
  }

  async getCustomerStats(options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseURL}/orders/admin/customer-stats?${params}`, {
      credentials: 'include'
    });

    return this.handleResponse(response);
  }

  async getProductStats(options = {}) {
    const params = new URLSearchParams(options);
    const response = await fetch(`${this.baseURL}/orders/admin/product-stats?${params}`, {
      credentials: 'include'
    });

    return this.handleResponse(response);
  }

  async generateCustomReport(config) {
    const response = await fetch(`${this.baseURL}/orders/admin/custom-report`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });

    return this.handleResponse(response);
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Erreur ${response.status}`);
    }
    return response.json();
  }

  clearCache() {
    this.cache.clear();
  }

  // WebSocket pour temps réel
  connectRealTime() {
    const socket = io(`${this.baseURL}/analytics`, {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    return socket;
  }
}

export default new AnalyticsService();
```

## 📞 Support et Debugging

### 🐛 Points de Vérification

1. **Droits Admin** : L'utilisateur doit avoir le rôle ADMIN
2. **Cookies** : `auth_token` requis pour toutes les requêtes
3. **Cache** : Les données sont mises en cache côté frontend (5 min)
4. **Performance** : Utiliser la pagination pour les gros datasets
5. **Temps Réel** : WebSocket optionnel pour les mises à jour live

### 🔍 Debug Console

```javascript
// Test rapide des statistiques
AnalyticsService.getStatistics('7d')
  .then(data => console.log('📊 Stats 7 jours:', data))
  .catch(err => console.error('❌ Erreur stats:', err));

// Vérifier les droits admin
fetch('http://localhost:3004/orders/admin/statistics', { credentials: 'include' })
  .then(res => console.log('Status:', res.status))
  .catch(err => console.error('Erreur:', err));
```

## ✅ Checklist d'Intégration

- [ ] ✅ Service AnalyticsService créé
- [ ] ✅ Composants KPI Cards intégrés
- [ ] ✅ Graphiques Revenue Chart configurés
- [ ] ✅ Top Products component ajouté
- [ ] ✅ CSS Dashboard appliqué
- [ ] ✅ Cache frontend implémenté
- [ ] ✅ WebSocket temps réel connecté
- [ ] ✅ Gestion d'erreurs admin testée

**Votre dashboard de statistiques est prêt ! 📊🚀** 