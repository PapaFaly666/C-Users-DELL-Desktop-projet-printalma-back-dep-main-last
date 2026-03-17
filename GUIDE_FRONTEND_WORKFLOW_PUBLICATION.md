# 📚 Guide Frontend - Les 2 Workflows de Publication

> **Date** : Décembre 2024  
> **Version** : 1.0  
> **Public** : Équipe Frontend

## 🎯 Vue d'ensemble

PrintAlma propose **2 workflows de publication** pour les vendeurs :

1. **📤 Publication Automatique** : Le produit est publié dès validation du design
2. **📝 Publication Manuelle** : Le produit reste en brouillon après validation

---

## 🔄 Workflow 1 : Publication Automatique

### 📋 Caractéristiques
- **Choix vendeur** : "Publier automatiquement"
- **Backend** : `forcedStatus: "PENDING"`
- **Publication** : Automatique après validation admin

### 🎬 Étapes

1. **Création Produit**
   ```typescript
   // Frontend envoie
   {
     forcedStatus: "PENDING",
     // ... autres données
   }
   
   // Backend répond
   {
     status: "DRAFT",
     forcedStatus: "PENDING",
     isValidated: false
   }
   ```

2. **Soumission Design**
   ```typescript
   // Backend met à jour
   {
     status: "PENDING",
     forcedStatus: "PENDING",
     isValidated: false
   }
   ```

3. **Validation Admin**
   ```typescript
   // Backend publie automatiquement
   {
     status: "PUBLISHED",
     forcedStatus: "PENDING",
     isValidated: true,
     publishedAt: "2024-12-01T10:00:00Z"
   }
   ```

### 🎨 Interface

```tsx
// Affichage selon l'état
const AutoPublishDisplay = ({ product }) => {
  if (product.status === 'PUBLISHED') {
    return (
      <div className="product-status">
        <span className="badge success">🚀 Publié</span>
        <span className="workflow-type">Publication automatique</span>
      </div>
    );
  }

  if (product.status === 'PENDING') {
    return (
      <div className="product-status">
        <span className="badge warning">⏳ En attente</span>
        <span className="workflow-type">Publication auto après validation</span>
      </div>
    );
  }

  return (
    <div className="product-status">
      <span className="badge info">📝 En cours</span>
      <span className="workflow-type">Publication auto activée</span>
    </div>
  );
};
```

---

## 🔄 Workflow 2 : Publication Manuelle (Brouillon)

### 📋 Caractéristiques
- **Choix vendeur** : "Mettre en brouillon"
- **Backend** : `forcedStatus: "DRAFT"`
- **Publication** : Manuelle après validation admin

### 🎬 Étapes

1. **Création Produit**
   ```typescript
   // Frontend envoie
   {
     forcedStatus: "DRAFT",
     // ... autres données
   }
   
   // Backend répond
   {
     status: "DRAFT",
     forcedStatus: "DRAFT",
     isValidated: false
   }
   ```

2. **Soumission Design**
   ```typescript
   // Backend garde en brouillon
   {
     status: "DRAFT",
     forcedStatus: "DRAFT",
     isValidated: false
   }
   ```

3. **Validation Admin**
   ```typescript
   // Backend valide mais garde en brouillon
   {
     status: "DRAFT",
     forcedStatus: "DRAFT",
     isValidated: true
   }
   ```

4. **Publication Manuelle**
   ```typescript
   // Endpoint à appeler
   POST /api/vendor-products/{id}/publish
   
   // Backend publie
   {
     status: "PUBLISHED",
     forcedStatus: "DRAFT",
     isValidated: true,
     publishedAt: "2024-12-01T10:00:00Z"
   }
   ```

### 🎨 Interface

```tsx
// Affichage selon l'état
const ManualPublishDisplay = ({ product }) => {
  const canPublish = (
    product.forcedStatus === 'DRAFT' &&
    product.status === 'DRAFT' &&
    product.isValidated === true
  );

  return (
    <div className="product-status">
      {product.status === 'PUBLISHED' ? (
        <>
          <span className="badge success">🚀 Publié</span>
          <span className="workflow-type">Publication manuelle</span>
        </>
      ) : (
        <>
          <span className="badge draft">📝 Brouillon</span>
          <span className="workflow-type">Publication manuelle</span>
          {canPublish && (
            <button 
              className="btn-publish"
              onClick={() => publishProduct(product.id)}
            >
              📤 Publier maintenant
            </button>
          )}
        </>
      )}
    </div>
  );
};
```

---

## 🎨 Composant de Choix Workflow

```tsx
const PublicationWorkflowChoice = ({ onChange }) => {
  const [workflowType, setWorkflowType] = useState('auto-publish');

  const handleChange = (type) => {
    setWorkflowType(type);
    onChange(type === 'auto-publish' ? 'PENDING' : 'DRAFT');
  };

  return (
    <div className="workflow-choice">
      <h3>📤 Choix de publication</h3>
      
      <div className="choice-container">
        <label className="choice-card">
          <input
            type="radio"
            name="workflow"
            value="auto-publish"
            checked={workflowType === 'auto-publish'}
            onChange={() => handleChange('auto-publish')}
          />
          <div className="choice-content">
            <h4>🚀 Publication Automatique</h4>
            <p>Publié dès validation du design par l'admin</p>
            <ul>
              <li>✅ Plus rapide</li>
              <li>✅ Pas d'action supplémentaire</li>
              <li>❌ Moins de contrôle</li>
            </ul>
          </div>
        </label>

        <label className="choice-card">
          <input
            type="radio"
            name="workflow"
            value="manual-publish"
            checked={workflowType === 'manual-publish'}
            onChange={() => handleChange('manual-publish')}
          />
          <div className="choice-content">
            <h4>📝 Brouillon</h4>
            <p>Reste en brouillon après validation</p>
            <ul>
              <li>✅ Plus de contrôle</li>
              <li>✅ Publication quand vous voulez</li>
              <li>❌ Action manuelle requise</li>
            </ul>
          </div>
        </label>
      </div>
    </div>
  );
};
```

---

## 🎯 Logique de Détection

```typescript
interface Product {
  status: 'PUBLISHED' | 'PENDING' | 'DRAFT';
  forcedStatus: 'PENDING' | 'DRAFT';
  isValidated: boolean;
}

function getProductState(product: Product) {
  // 1. Publication Automatique
  if (product.forcedStatus === 'PENDING') {
    if (product.status === 'PUBLISHED') {
      return {
        badge: '🚀 Publié',
        message: 'Publication automatique effectuée',
        canPublish: false
      };
    }
    if (product.status === 'PENDING') {
      return {
        badge: '⏳ En attente',
        message: 'Publication après validation admin',
        canPublish: false
      };
    }
    return {
      badge: '📝 En cours',
      message: 'Publication auto activée',
      canPublish: false
    };
  }

  // 2. Publication Manuelle
  if (product.status === 'PUBLISHED') {
    return {
      badge: '🚀 Publié',
      message: 'Publication manuelle effectuée',
      canPublish: false
    };
  }
  
  const canPublish = (
    product.status === 'DRAFT' &&
    product.isValidated === true
  );

  return {
    badge: '📝 Brouillon',
    message: canPublish 
      ? 'Prêt à publier' 
      : 'En attente de validation',
    canPublish
  };
}
```

---

## 🚨 Points Importants

### 1️⃣ Choix Initial
- Le choix du workflow est **définitif**
- `forcedStatus` ne change **jamais**
- Bien expliquer les différences aux vendeurs

### 2️⃣ États Possibles
```typescript
type WorkflowState = {
  forcedStatus: 'PENDING' | 'DRAFT';    // Intention initiale
  status: 'PUBLISHED' | 'PENDING' | 'DRAFT';  // État actuel
  isValidated: boolean;                 // Validation design
};
```

### 3️⃣ Transitions
- **Auto-Publish** : `DRAFT → PENDING → PUBLISHED`
- **Manual-Publish** : `DRAFT → DRAFT(validé) → PUBLISHED`

### 4️⃣ Bouton "Publier"
- Visible **uniquement** si :
  ```typescript
  product.forcedStatus === 'DRAFT' &&
  product.status === 'DRAFT' &&
  product.isValidated === true
  ```

---

## 🎨 Style Recommandé

```scss
.workflow-choice {
  .choice-container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin: 20px 0;
  }

  .choice-card {
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #007bff;
      background: #f8f9fa;
    }

    input[type="radio"] {
      margin-right: 10px;
    }

    h4 {
      margin: 0 0 10px;
      color: #333;
    }

    p {
      color: #666;
      margin-bottom: 15px;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin: 5px 0;
        font-size: 14px;
      }
    }
  }
}

.product-status {
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: bold;
    margin-right: 10px;

    &.success { 
      background: #d4edda;
      color: #155724;
    }
    
    &.warning {
      background: #fff3cd;
      color: #856404;
    }
    
    &.draft {
      background: #f8f9fa;
      color: #6c757d;
      border: 1px dashed #6c757d;
    }
  }

  .workflow-type {
    font-size: 14px;
    color: #6c757d;
  }

  .btn-publish {
    margin-top: 10px;
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background: #218838;
    }

    &:disabled {
      background: #6c757d;
      cursor: not-allowed;
    }
  }
}
```

---

## 📋 Checklist Implémentation

### ✅ Création Produit
- [ ] Composant choix workflow
- [ ] Validation choix obligatoire
- [ ] Envoi `forcedStatus` correct

### ✅ Liste Produits
- [ ] Affichage état correct
- [ ] Badge dynamique
- [ ] Message explicatif
- [ ] Bouton publication conditionnel

### ✅ Publication
- [ ] Service `publishProduct()`
- [ ] Gestion loading/error
- [ ] Toast notifications
- [ ] Refresh après succès

---

## 🎯 Résultat Final

Les vendeurs doivent avoir :

1. **Choix clair** au moment de la création
2. **Visibilité parfaite** de l'état de leurs produits
3. **Actions évidentes** quand publication possible
4. **Feedback immédiat** à chaque action

**Le backend est prêt - Implémentez une UX parfaite !** 🚀 