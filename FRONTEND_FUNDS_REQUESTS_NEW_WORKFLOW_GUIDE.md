# Guide d'implémentation Frontend - Nouveau Workflow des Appels de Fonds

## 🎯 Objectif
Ce guide aide le développeur frontend à implémenter le nouveau workflow simplifié des appels de fonds :
- **Statut automatique en "ATTENTE" dès la demande du vendeur**
- **Suppression complète du rejet par l'admin**
- **Workflow : ATTENTE → PAYÉ**

## 🔄 Nouveau Workflow

### États des demandes
```typescript
enum FundsRequestStatus {
  PENDING = 'PENDING',    // Attente (défaut après création)
  PAID = 'PAID'          // Payé par l'admin
  // REJECTED supprimé définitivement
}
```

### Flux simplifié
1. **Vendeur** → Crée une demande → **STATUT: PENDING**
2. **Admin** → Paie la demande → **STATUT: PAID**

## 🎨 Modifications Interface Admin

### 1. Suppression des boutons/options de rejet
```typescript
// ❌ SUPPRIMER CES ÉLÉMENTS
<Button color="danger" onClick={() => rejectRequest(id)}>
  Rejeter
</Button>

<Select>
  <Option value="REJECTED">Rejeter</Option>  // ❌ À supprimer
</Select>

// ❌ Supprime les champs de raison de rejet
<TextArea placeholder="Raison du rejet..." />
```

### 2. Interface admin simplifiée
```typescript
// ✅ NOUVELLE INTERFACE
const AdminFundsRequestActions = ({ request }) => {
  return (
    <div className="funds-actions">
      {request.status === 'PENDING' && (
        <Button
          color="success"
          onClick={() => markAsPaid(request.id)}
        >
          Marquer comme Payé
        </Button>
      )}

      {request.status === 'PAID' && (
        <Tag color="green">Payé</Tag>
      )}
    </div>
  );
};
```

### 3. Filtres et statistiques
```typescript
// ✅ Mise à jour des filtres
const statusFilters = [
  { value: 'PENDING', label: 'En attente', color: 'orange' },
  { value: 'PAID', label: 'Payé', color: 'green' }
  // Supprimer REJECTED
];

// ✅ Statistiques mises à jour
interface AdminStats {
  totalPendingRequests: number;
  totalPendingAmount: number;
  totalPaidToday: number;
  totalPaidAmount: number;
  // Supprimer les stats de rejet
}
```

## 📋 Modifications Interface Vendeur

### 1. Statuts visibles pour le vendeur
```typescript
const VendorRequestStatus = ({ status }) => {
  const statusConfig = {
    PENDING: {
      label: 'En attente de paiement',
      color: 'orange',
      icon: 'clock-circle',
      description: 'Votre demande est en cours de traitement par l\'admin'
    },
    PAID: {
      label: 'Payé',
      color: 'green',
      icon: 'check-circle',
      description: 'Le paiement a été effectué'
    }
  };

  const config = statusConfig[status];

  return (
    <Tag color={config.color} icon={<Icon type={config.icon} />}>
      {config.label}
    </Tag>
  );
};
```

### 2. Suppression de l'annulation
```typescript
// ❌ SUPPRIMER la possibilité d'annuler
// Les demandes passent automatiquement en PENDING et ne peuvent plus être annulées
```

## 🚀 API Endpoints Modifiés

### Créer une demande (Vendeur)
```typescript
// POST /vendor/funds-requests
const createFundsRequest = async (data: CreateFundsRequestDto) => {
  const response = await api.post('/vendor/funds-requests', data);
  // Retourne automatiquement status: 'PENDING'
  return response.data;
};
```

### Traiter une demande (Admin)
```typescript
// PATCH /admin/funds-requests/:id/process
const processFundsRequest = async (requestId: number) => {
  // ✅ Seule action possible : marquer comme payé
  const response = await api.patch(`/admin/funds-requests/${requestId}/process`, {
    status: 'PAID',
    adminNote: 'Paiement effectué' // optionnel
  });
  return response.data;
};

// ❌ REJETER N'EST PLUS POSSIBLE
// Cette requête retournera une erreur 400
```

### Traitement en lot (Admin)
```typescript
// PATCH /admin/funds-requests/batch-process
const batchPayRequests = async (requestIds: number[]) => {
  const response = await api.patch('/admin/funds-requests/batch-process', {
    requestIds,
    status: 'PAID', // Seule valeur autorisée
    adminNote: 'Paiement en lot effectué'
  });
  return response.data;
};
```

## 🎯 Composants React à Modifier

### 1. Composant de liste des demandes
```typescript
const FundsRequestsList = () => {
  const columns = [
    {
      title: 'Vendeur',
      dataIndex: ['vendor', 'shopName'],
      key: 'vendor'
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `${amount.toLocaleString()} FCFA`
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <FundsRequestStatus status={status} />
    },
    {
      title: 'Date de demande',
      dataIndex: 'createdAt',
      key: 'createdAt'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <FundsRequestActions request={record} />
      )
    }
  ];

  return <Table columns={columns} dataSource={requests} />;
};
```

### 2. Composant de création de demande
```typescript
const CreateFundsRequestForm = () => {
  const onSubmit = async (values) => {
    try {
      const request = await createFundsRequest(values);
      message.success('Demande créée avec succès. Statut: En attente de paiement');
      // Redirection ou refresh de la liste
    } catch (error) {
      message.error('Erreur lors de la création de la demande');
    }
  };

  return (
    <Form onFinish={onSubmit}>
      <Form.Item name="amount" label="Montant" required>
        <InputNumber
          min={0}
          formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
          parser={value => value.replace(/\$\s?|(,*)/g, '')}
          addonAfter="FCFA"
        />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <TextArea rows={3} />
      </Form.Item>

      <Form.Item name="paymentMethod" label="Méthode de paiement" required>
        <Select>
          <Option value="WAVE">Wave</Option>
          <Option value="ORANGE_MONEY">Orange Money</Option>
          <Option value="BANK_TRANSFER">Virement bancaire</Option>
        </Select>
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Créer la demande
      </Button>
    </Form>
  );
};
```

## 📊 Dashboard et Statistiques

### Mise à jour du dashboard admin
```typescript
const AdminFundsDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchAdminFundsStatistics().then(setStats);
  }, []);

  return (
    <Row gutter={16}>
      <Col span={6}>
        <StatCard
          title="En attente"
          value={stats?.totalPendingRequests || 0}
          color="orange"
          subtitle={`${(stats?.totalPendingAmount || 0).toLocaleString()} FCFA`}
        />
      </Col>

      <Col span={6}>
        <StatCard
          title="Payées aujourd'hui"
          value={stats?.totalProcessedToday || 0}
          color="green"
          subtitle={`${(stats?.totalProcessedAmount || 0).toLocaleString()} FCFA`}
        />
      </Col>

      <Col span={12}>
        <Card title="Actions rapides">
          <Button
            type="primary"
            onClick={() => showBatchPayModal()}
          >
            Paiement en lot
          </Button>
        </Card>
      </Col>
    </Row>
  );
};
```

## ⚠️ Points d'attention

1. **Supprimer toute référence à REJECTED** dans le code frontend
2. **Mettre à jour les types TypeScript** pour exclure REJECTED
3. **Modifier les tests** pour le nouveau workflow
4. **Mettre à jour la documentation utilisateur**
5. **Former les admins** au nouveau processus simplifié

## 🔧 Migration des données existantes

Si des demandes avec statut REJECTED existent, prévoir une migration ou les ignorer dans l'interface :

```typescript
const filterValidStatuses = (requests) => {
  return requests.filter(req => ['PENDING', 'PAID'].includes(req.status));
};
```

## 📝 Résumé des changements

- ✅ **PENDING** : Statut par défaut à la création
- ✅ **PAID** : Seule action possible pour l'admin
- ❌ **REJECTED** : Complètement supprimé
- ✅ **Workflow simplifié** : Attente → Payé
- ✅ **Pas de rejet possible** par l'admin