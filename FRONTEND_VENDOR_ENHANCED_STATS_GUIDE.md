# Guide Frontend - Statistiques Vendeur Enrichies

Ce guide explique comment utiliser le nouveau endpoint `/vendor/stats` enrichi avec toutes les données financières et statistiques du vendeur.

---

## 🎯 Endpoint Principal

**URL:** `GET /vendor/stats`
**Auth:** JWT Cookie (rôle vendeur requis)
**Description:** Récupère toutes les statistiques complètes du vendeur incluant les données financières cohérentes avec les appels de fonds.

### Exemple d'appel
```typescript
const response = await fetch(`${API_BASE}/vendor/stats`, {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const { success, data } = await response.json();
```

---

## 📊 Structure de la réponse

### Réponse complète (200 OK)
```json
{
  "success": true,
  "data": {
    // 📦 STATISTIQUES PRODUITS
    "totalProducts": 15,
    "publishedProducts": 12,
    "draftProducts": 2,
    "pendingProducts": 1,
    "totalValue": 450000,
    "averagePrice": 30000,

    // 🎨 STATISTIQUES DESIGNS
    "totalDesigns": 8,
    "publishedDesigns": 6,
    "draftDesigns": 1,
    "pendingDesigns": 0,
    "validatedDesigns": 7,

    // 💰 DONNÉES FINANCIÈRES (NOUVELLES)
    "yearlyRevenue": 2850000,      // CA annuel en FCFA
    "monthlyRevenue": 320000,      // CA mensuel en FCFA
    "availableBalance": 486000,    // Solde disponible pour retrait
    "pendingAmount": 75000,        // Montant en attente (appels de fonds)
    "totalEarnings": 3250000,      // Total des gains depuis l'inscription

    // 📊 STATISTIQUES D'ACTIVITÉ (NOUVELLES)
    "shopViews": 1847,             // Nombre de vues de la boutique
    "totalOrders": 42,             // Nombre de commandes traitées
    "averageCommissionRate": 8.5,  // Taux de commission moyen (%)

    // 📅 DATES IMPORTANTES
    "memberSince": "2024-05-12T09:31:00.000Z",
    "lastLoginAt": "2025-09-18T14:05:00.000Z",
    "memberSinceFormatted": "2024-05-12 09:31",
    "lastLoginAtFormatted": "2025-09-18 14:05",

    "architecture": "v2_preserved_admin"
  }
}
```

---

## 💰 Section Financière - Cohérence Garantie

### ✅ Cohérence avec les appels de fonds
Les données financières sont **parfaitement cohérentes** avec l'endpoint des appels de fonds (`/vendor/funds-requests`).

**Relation des montants :**
```
totalEarnings = availableBalance + pendingAmount + montantsDéjàPayés
```

### 💡 Interprétation des montants

| Champ | Description | Usage Frontend |
|-------|-------------|----------------|
| `availableBalance` | **Montant retirable maintenant** | Bouton "Demander retrait" (si > 0) |
| `pendingAmount` | **Montant en attente** (demandes en cours) | Afficher "X FCFA en attente" |
| `yearlyRevenue` | **CA annuel après commission** | Graphique annuel |
| `monthlyRevenue` | **CA mensuel après commission** | Graphique mensuel |
| `totalEarnings` | **Gains totaux historiques** | Statistique globale |

### 🎨 Exemples d'affichage recommandés

#### Carte financière principale
```tsx
<Card>
  <CardHeader>
    <Title>💰 Finances</Title>
  </CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label>Disponible pour retrait</Label>
        <Value className="text-green-600">
          {formatMoney(data.availableBalance)} FCFA
        </Value>
        {data.availableBalance > 0 && (
          <Button>Demander retrait</Button>
        )}
      </div>
      <div>
        <Label>En attente</Label>
        <Value className="text-orange-500">
          {formatMoney(data.pendingAmount)} FCFA
        </Value>
      </div>
    </div>
  </CardContent>
</Card>
```

#### Graphique revenus
```tsx
<Card>
  <CardHeader>
    <Title>📈 Chiffre d'affaires</Title>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Ce mois</span>
        <span className="font-bold">
          {formatMoney(data.monthlyRevenue)} FCFA
        </span>
      </div>
      <div className="flex justify-between">
        <span>Cette année</span>
        <span className="font-bold">
          {formatMoney(data.yearlyRevenue)} FCFA
        </span>
      </div>
      <div className="text-sm text-gray-500">
        Commission moyenne: {data.averageCommissionRate}%
      </div>
    </div>
  </CardContent>
</Card>
```

---

## 📊 Statistiques d'activité

### Nouvelles métriques disponibles

#### 👁️ Vues de la boutique
```tsx
<StatCard
  icon="👁️"
  label="Vues de la boutique"
  value={data.shopViews.toLocaleString()}
  description="Visiteurs uniques"
/>
```

#### 📦 Commandes traitées
```tsx
<StatCard
  icon="📦"
  label="Commandes traitées"
  value={data.totalOrders}
  description="Commandes livrées"
/>
```

#### 💼 Taux de commission
```tsx
<StatCard
  icon="💼"
  label="Commission moyenne"
  value={`${data.averageCommissionRate}%`}
  description="Taux appliqué"
/>
```

---

## 🎨 Composant Dashboard Complet

### Exemple d'implémentation React
```tsx
import React, { useState, useEffect } from 'react';

interface VendorStats {
  // Produits & Designs
  totalProducts: number;
  publishedProducts: number;
  totalDesigns: number;
  validatedDesigns: number;

  // Finances (NOUVELLES)
  yearlyRevenue: number;
  monthlyRevenue: number;
  availableBalance: number;
  pendingAmount: number;
  totalEarnings: number;

  // Activité (NOUVELLES)
  shopViews: number;
  totalOrders: number;
  averageCommissionRate: number;

  // Dates
  memberSinceFormatted?: string;
  lastLoginAtFormatted?: string;
}

const VendorDashboard: React.FC = () => {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/vendor/stats', {
          credentials: 'include'
        });
        const { success, data } = await response.json();

        if (success) {
          setStats(data);
        }
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (!stats) return <div>Erreur chargement</div>;

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat('fr-FR').format(amount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* 💰 FINANCES */}
      <div className="col-span-2 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">💰 Finances</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Disponible</p>
            <p className="text-2xl font-bold text-green-600">
              {formatMoney(stats.availableBalance)} F
            </p>
            {stats.availableBalance > 0 && (
              <button className="mt-2 bg-green-600 text-white px-4 py-2 rounded">
                Demander retrait
              </button>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">En attente</p>
            <p className="text-2xl font-bold text-orange-500">
              {formatMoney(stats.pendingAmount)} F
            </p>
          </div>
        </div>
      </div>

      {/* 📈 CHIFFRE D'AFFAIRES */}
      <div className="col-span-2 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Chiffre d'affaires</h3>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span>Ce mois</span>
            <span className="font-semibold">
              {formatMoney(stats.monthlyRevenue)} F
            </span>
          </div>
          <div className="flex justify-between">
            <span>Cette année</span>
            <span className="font-semibold">
              {formatMoney(stats.yearlyRevenue)} F
            </span>
          </div>
          <div className="text-sm text-gray-500">
            Commission: {stats.averageCommissionRate}%
          </div>
        </div>
      </div>

      {/* 📊 PRODUITS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📦 Produits</h3>
        <div className="text-3xl font-bold">{stats.totalProducts}</div>
        <div className="text-sm text-gray-500">
          {stats.publishedProducts} publiés
        </div>
      </div>

      {/* 🎨 DESIGNS */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">🎨 Designs</h3>
        <div className="text-3xl font-bold">{stats.totalDesigns}</div>
        <div className="text-sm text-gray-500">
          {stats.validatedDesigns} validés
        </div>
      </div>

      {/* 👁️ ACTIVITÉ */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">👁️ Boutique</h3>
        <div className="text-3xl font-bold">{stats.shopViews}</div>
        <div className="text-sm text-gray-500">vues</div>
      </div>

      {/* 📦 COMMANDES */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📦 Commandes</h3>
        <div className="text-3xl font-bold">{stats.totalOrders}</div>
        <div className="text-sm text-gray-500">traitées</div>
      </div>

      {/* 📅 INFORMATIONS COMPTE */}
      <div className="col-span-2 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">📅 Compte</h3>
        <div className="space-y-2">
          <div>
            <span className="text-gray-500">Membre depuis: </span>
            <span>{stats.memberSinceFormatted || '—'}</span>
          </div>
          <div>
            <span className="text-gray-500">Dernière connexion: </span>
            <span>{stats.lastLoginAtFormatted || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
```

---

## 🔄 Mise à jour en temps réel

### Option 1: Polling périodique
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchVendorStats();
  }, 30000); // Actualise toutes les 30 secondes

  return () => clearInterval(interval);
}, []);
```

### Option 2: Actualisation manuelle
```tsx
<button
  onClick={() => refetchStats()}
  className="mb-4 text-blue-600 hover:text-blue-800"
>
  🔄 Actualiser les données
</button>
```

---

## 🚨 Gestion des erreurs

```typescript
const [error, setError] = useState<string | null>(null);

const fetchStats = async () => {
  try {
    const response = await fetch('/vendor/stats', {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur réseau');
    }

    const { success, data, message } = await response.json();

    if (!success) {
      throw new Error(message || 'Erreur serveur');
    }

    setStats(data);
    setError(null);
  } catch (err) {
    setError(err.message);
  }
};

// Dans le JSX
{error && (
  <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
    <p className="text-red-800">❌ {error}</p>
    <button
      onClick={fetchStats}
      className="mt-2 text-red-600 hover:text-red-800"
    >
      Réessayer
    </button>
  </div>
)}
```

---

## ✅ Bonnes pratiques

1. **💰 Cohérence financière**: Les montants sont toujours cohérents avec `/vendor/funds-requests`
2. **🔄 Actualisation**: Actualiser après une demande d'appel de fonds
3. **📱 Responsive**: Design adaptatif mobile/desktop
4. **⚡ Performance**: Mise en cache côté client (5 minutes max)
5. **🎨 UX**: Feedback visuel pendant le chargement
6. **🚨 Erreurs**: Gestion propre des erreurs réseau/serveur

---

## 🔗 Endpoints complémentaires

Pour une expérience complète, combiner avec :

- **`/vendor/funds-requests`** - Détails des appels de fonds
- **`/vendor/products`** - Liste des produits
- **`/vendor/earnings`** - Détails financiers (VendorFunds)

---

## 📝 Notes importantes

- **Architecture v2**: Données garanties cohérentes
- **Temps réel**: Calculs basés sur les vraies commandes livrées
- **Commission**: Taux variable selon le vendeur
- **Vues boutique**: Actuellement simulées (à implémenter avec tracking réel)
- **Sécurité**: Seul le vendeur connecté peut voir ses propres stats

Cette documentation couvre toutes les nouvelles fonctionnalités financières du vendeur ! 🎉