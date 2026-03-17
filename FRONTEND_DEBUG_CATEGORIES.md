# 🐛 Debug - Affichage des catégories Frontend

## ⚠️ Problème courant

Le frontend n'affiche pas les catégories/variations correctement après les avoir enregistrées.

---

## ✅ Solution : Utiliser le bon endpoint

### ❌ **Mauvais endpoint** (liste plate)

```javascript
// NE PAS UTILISER POUR L'AFFICHAGE
const categories = await fetch('/api/categories').then(r => r.json());
```

**Problème :** Retourne une liste plate avec TOUTES les catégories (parents, enfants, variations) mélangées.

**Résultat :**
```json
[
  { "id": 1, "name": "Telephone", "level": 0, "parentId": null },
  { "id": 2, "name": "coque", "level": 1, "parentId": 1 },
  { "id": 3, "name": "iphone 11", "level": 2, "parentId": 2 },
  { "id": 4, "name": "teleph", "level": 0, "parentId": null },
  { "id": 5, "name": "grdrgd", "level": 1, "parentId": 4 },
  // ... liste plate difficile à organiser
]
```

---

### ✅ **Bon endpoint** (arbre hiérarchique)

```javascript
// UTILISER CE ENDPOINT POUR L'AFFICHAGE
const categories = await fetch('/api/categories/hierarchy').then(r => r.json());
```

**Avantage :** Retourne un arbre structuré avec `subcategories`.

**Résultat :**
```json
[
  {
    "id": 1,
    "name": "Telephone",
    "level": 0,
    "productCount": 0,
    "subcategories": [
      {
        "id": 2,
        "name": "coque",
        "level": 1,
        "productCount": 0,
        "subcategories": [
          {
            "id": 3,
            "name": "iphone 11",
            "level": 2,
            "productCount": 0,
            "subcategories": []
          }
        ]
      }
    ]
  },
  {
    "id": 4,
    "name": "teleph",
    "level": 0,
    "productCount": 0,
    "subcategories": [
      {
        "id": 5,
        "name": "grdrgd",
        "level": 1,
        "productCount": 0,
        "subcategories": [
          { "id": 6, "name": "rger", "level": 2, "subcategories": [] },
          { "id": 7, "name": "uryur", "level": 2, "subcategories": [] }
        ]
      }
    ]
  }
]
```

---

## 📋 Code Frontend à utiliser

### Option 1 : Affichage simple avec boucles

```typescript
// 1. Charger les catégories
const categories = await fetch('/api/categories/hierarchy').then(r => r.json());

// 2. Parcourir l'arbre
categories.forEach(parent => {
  console.log(`📁 ${parent.name}`); // Level 0

  parent.subcategories?.forEach(child => {
    console.log(`  📂 ${child.name}`); // Level 1

    child.subcategories?.forEach(variation => {
      console.log(`    📄 ${variation.name}`); // Level 2
    });
  });
});
```

**Résultat dans la console :**
```
📁 Telephone
  📂 coque
    📄 iphone 11
📁 teleph
  📂 grdrgd
    📄 rger
    📄 uryur
```

---

### Option 2 : Composant React

```tsx
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  level: number;
  productCount: number;
  subcategories: Category[];
}

export function CategoryList() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les catégories au montage
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await fetch('/api/categories/hierarchy');
      const data = await response.json();
      setCategories(data);
      console.log('✅ Catégories chargées:', data);
    } catch (error) {
      console.error('❌ Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  // Afficher une catégorie avec ses enfants
  const renderCategory = (cat: Category, depth = 0) => {
    const icons = ['📁', '📂', '📄'];
    const icon = icons[depth] || '📄';

    return (
      <div key={cat.id} style={{ marginLeft: depth * 20 }}>
        <div>
          {icon} {cat.name}
          <span style={{ color: '#666' }}> ({cat.productCount} produits)</span>
        </div>

        {/* Afficher les sous-catégories */}
        {cat.subcategories?.map(sub => renderCategory(sub, depth + 1))}
      </div>
    );
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Catégories ({categories.length})</h2>
      <button onClick={loadCategories}>🔄 Rafraîchir</button>
      <div style={{ marginTop: 20 }}>
        {categories.map(cat => renderCategory(cat))}
      </div>
    </div>
  );
}
```

---

### Option 3 : Avec état d'expansion (collapse/expand)

```tsx
import { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
  level: number;
  productCount: number;
  subcategories: Category[];
}

export function CategoryTree() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch('/api/categories/hierarchy')
      .then(r => r.json())
      .then(data => {
        setCategories(data);
        // Expand all by default
        const allIds = new Set<number>();
        const collectIds = (cats: Category[]) => {
          cats.forEach(cat => {
            allIds.add(cat.id);
            if (cat.subcategories) collectIds(cat.subcategories);
          });
        };
        collectIds(data);
        setExpanded(allIds);
      });
  }, []);

  const toggleExpand = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderCategory = (cat: Category, depth = 0) => {
    const hasChildren = cat.subcategories?.length > 0;
    const isExpanded = expanded.has(cat.id);
    const icons = ['📁', '📂', '📄'];
    const icon = icons[depth] || '📄';

    return (
      <div key={cat.id}>
        <div
          style={{
            marginLeft: depth * 20,
            padding: '5px',
            cursor: hasChildren ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onClick={() => hasChildren && toggleExpand(cat.id)}
        >
          {hasChildren && (
            <span style={{ fontWeight: 'bold' }}>
              {isExpanded ? '▼' : '▶'}
            </span>
          )}
          <span>
            {icon} {cat.name}
            <span style={{ color: '#666', fontSize: '12px' }}>
              {' '}({cat.productCount})
            </span>
          </span>
        </div>

        {/* Afficher les enfants si développé */}
        {hasChildren && isExpanded && (
          <div>
            {cat.subcategories.map(sub => renderCategory(sub, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <h2>Catégories hiérarchiques</h2>
      {categories.map(cat => renderCategory(cat))}
    </div>
  );
}
```

---

## 🔄 Rafraîchir après création

Après avoir créé une catégorie, **il faut rafraîchir la liste** :

```typescript
// Fonction de création
async function createCategoryStructure(data) {
  const response = await fetch('/api/categories/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.json();

  if (result.success) {
    console.log(`✅ ${result.createdCount} éléments créés`);

    // ⚠️ IMPORTANT : Recharger les catégories pour afficher les nouvelles
    await loadCategories();
  }
}

// Fonction de chargement
async function loadCategories() {
  const categories = await fetch('/api/categories/hierarchy').then(r => r.json());
  setCategories(categories); // React
  // ou
  updateCategoriesDisplay(categories); // Vanilla JS
}
```

---

## 🧪 Test rapide dans la console

Ouvrez la console du navigateur et testez :

```javascript
// Test 1: Vérifier que l'API répond
fetch('/api/categories/hierarchy')
  .then(r => r.json())
  .then(data => {
    console.log('✅ Données reçues:', data);
    console.log('📊 Nombre de catégories parents:', data.length);
  });

// Test 2: Afficher l'arbre en console
fetch('/api/categories/hierarchy')
  .then(r => r.json())
  .then(categories => {
    categories.forEach(parent => {
      console.log(`📁 ${parent.name} (${parent.productCount})`);
      parent.subcategories?.forEach(child => {
        console.log(`  📂 ${child.name} (${child.productCount})`);
        child.subcategories?.forEach(variation => {
          console.log(`    📄 ${variation.name} (${variation.productCount})`);
        });
      });
    });
  });
```

---

## 🔍 Vérification des données

### Structure attendue de chaque catégorie :

```typescript
interface Category {
  id: number;                    // ID unique
  name: string;                  // Nom de la catégorie
  description: string | null;    // Description
  parentId: number | null;       // ID du parent (null pour level 0)
  level: number;                 // 0, 1 ou 2
  order: number;                 // Ordre d'affichage
  createdAt: string;             // Date de création
  updatedAt: string;             // Date de modification
  productCount: number;          // Nombre de produits
  subcategories: Category[];     // ⚠️ CLÉ IMPORTANTE pour l'arbre
}
```

### Vérifier que `subcategories` existe :

```javascript
const categories = await fetch('/api/categories/hierarchy').then(r => r.json());

// Vérifier la structure
console.log('Premier parent:', categories[0]);
console.log('A des subcategories?', 'subcategories' in categories[0]);
console.log('Nombre de subcategories:', categories[0].subcategories?.length || 0);
```

---

## ❌ Erreurs courantes

### Erreur 1: Liste vide alors que les catégories existent

**Cause :** Vous utilisez `/api/categories` au lieu de `/api/categories/hierarchy`

**Solution :**
```javascript
// ❌ Mauvais
const categories = await fetch('/api/categories').then(r => r.json());

// ✅ Bon
const categories = await fetch('/api/categories/hierarchy').then(r => r.json());
```

---

### Erreur 2: Les variations ne s'affichent pas

**Cause :** Vous ne parcourez pas `subcategories` jusqu'au niveau 2

**Solution :**
```javascript
// ❌ Mauvais - seulement 1 niveau
categories.forEach(parent => {
  console.log(parent.name);
  parent.subcategories?.forEach(child => {
    console.log(child.name);
    // ⚠️ Manque le niveau 2
  });
});

// ✅ Bon - 3 niveaux complets
categories.forEach(parent => {
  console.log(parent.name); // Level 0
  parent.subcategories?.forEach(child => {
    console.log(child.name); // Level 1
    child.subcategories?.forEach(variation => {
      console.log(variation.name); // Level 2 ✅
    });
  });
});
```

---

### Erreur 3: Les catégories ne se mettent pas à jour après création

**Cause :** Oubli de recharger après création

**Solution :**
```javascript
async function createAndRefresh(data) {
  // 1. Créer
  await fetch('/api/categories/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  // 2. ⚠️ IMPORTANT : Recharger
  const updated = await fetch('/api/categories/hierarchy').then(r => r.json());
  setCategories(updated);
}
```

---

## 📊 Exemple de données actuelles (votre DB)

D'après le test, voici ce qui est actuellement dans votre base :

```
📁 Telephone (0 produits)
  📂 coque (0 produits)
    📄 iphone 11 (0 produits)

📁 teleph (0 produits)
  📂 grdrgd (0 produits)
    📄 rger (0 produits)
    📄 uryur (0 produits)
```

**Code pour afficher exactement ça :**

```javascript
fetch('/api/categories/hierarchy')
  .then(r => r.json())
  .then(categories => {
    categories.forEach(parent => {
      console.log(`📁 ${parent.name} (${parent.productCount} produits)`);
      parent.subcategories.forEach(child => {
        console.log(`  📂 ${child.name} (${child.productCount} produits)`);
        child.subcategories.forEach(variation => {
          console.log(`    📄 ${variation.name} (${variation.productCount} produits)`);
        });
      });
    });
  });
```

---

## 🎨 Style CSS pour l'arbre

```css
.category-tree {
  font-family: monospace;
  padding: 20px;
}

.category-item {
  padding: 5px;
  margin: 2px 0;
  border-radius: 4px;
  transition: background 0.2s;
}

.category-item:hover {
  background: #f0f0f0;
}

.category-level-0 {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.category-level-1 {
  margin-left: 20px;
  font-size: 14px;
  color: #555;
}

.category-level-2 {
  margin-left: 40px;
  font-size: 13px;
  color: #777;
}

.product-count {
  color: #999;
  font-size: 12px;
  margin-left: 5px;
}
```

---

## ✅ Checklist de vérification

- [ ] Utilisez `/api/categories/hierarchy` et non `/api/categories`
- [ ] Parcourez `subcategories` jusqu'au niveau 2
- [ ] Rechargez après chaque création/modification/suppression
- [ ] Vérifiez que `subcategories` existe dans la réponse
- [ ] Testez dans la console du navigateur d'abord
- [ ] Utilisez `console.log()` pour déboguer les données reçues

---

## 📞 Besoin d'aide ?

Si le problème persiste, vérifiez :

1. **L'URL est correcte** : `http://localhost:3004/categories/hierarchy`
2. **La réponse contient bien `subcategories`**
3. **Le frontend parcourt tous les niveaux** (0, 1, 2)
4. **Les données sont rechargées après création**

Testez dans la console pour isoler le problème :
```javascript
fetch('/api/categories/hierarchy')
  .then(r => r.json())
  .then(console.log);
```
