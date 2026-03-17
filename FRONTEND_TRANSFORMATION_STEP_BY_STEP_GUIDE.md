# 📑 Guide localStorage - Positionnement Design sans Création Produit

> **NOUVELLE APPROCHE** : Tout le positionnement se fait en localStorage.  
> Aucun produit n'est créé tant que l'utilisateur n'a pas validé.

---

## 🔰 Pré-requis
- Avoir un **token de session** (cookies) après le `login` vendeur
- Connaître le `baseProductId` du produit admin (ex : `1`)
- Avoir au moins **un design** déjà créé

---

## Étape 1 : Structure localStorage ✅

### 1.1 Clé localStorage
```ts
const DESIGN_POSITION_KEY = `design_position_${vendorId}_${baseProductId}_${designId}`;
```

### 1.2 Structure des données
```ts
interface DesignPositionData {
  designId: number;
  baseProductId: number;
  position: {
    x: number;
    y: number;
    scale: number;
    rotation: number;
  };
  timestamp: number;
  vendorId: number;
  // Optionnel : aperçu des sélections
  previewSelections?: {
    colors: any[];
    sizes: any[];
    price: number;
    stock: number;
  };
}
```

---

## Étape 2 : Sauvegarde automatique position ✅

### 2.1 Lors du drag/scale/rotate
```ts
function saveDesignPosition(position: { x: number, y: number, scale: number, rotation: number }) {
  const data: DesignPositionData = {
    designId: currentDesignId,
    baseProductId: currentBaseProductId,
    position,
    timestamp: Date.now(),
    vendorId: currentVendorId,
    previewSelections: {
      colors: selectedColors,
      sizes: selectedSizes,
      price: previewPrice,
      stock: previewStock
    }
  };
  
  localStorage.setItem(DESIGN_POSITION_KEY, JSON.stringify(data));
  console.log('💾 Position sauvegardée en localStorage');
}

// Debounce pour éviter trop d'écritures
const debouncedSave = debounce(saveDesignPosition, 300);

// Événements
onDragStop={(e, data) => debouncedSave({ x: data.x, y: data.y, scale: currentScale, rotation: currentRotation })}
onScaleChange={(scale) => debouncedSave({ x: currentX, y: currentY, scale, rotation: currentRotation })}
```

### 2.2 Restauration au chargement
```ts
function loadDesignPosition(): DesignPositionData | null {
  const saved = localStorage.getItem(DESIGN_POSITION_KEY);
  if (!saved) return null;
  
  try {
    const data = JSON.parse(saved);
    console.log('📂 Position restaurée depuis localStorage');
    return data;
  } catch (error) {
    console.error('❌ Erreur parsing localStorage:', error);
    return null;
  }
}

// Au chargement de l'éditeur
useEffect(() => {
  const savedPosition = loadDesignPosition();
  if (savedPosition) {
    setPosition(savedPosition.position);
    setPreviewSelections(savedPosition.previewSelections || {});
  }
}, [designId, baseProductId]);
```

---

## Étape 3 : Validation et création produit final ✅

### 3.1 Formulaire de validation
```tsx
function ProductCreationModal() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 35000,
    stock: 50,
    selectedColors: [],
    selectedSizes: []
  });
  
  const handleSubmit = async () => {
    // Récupérer la position depuis localStorage
    const savedPosition = loadDesignPosition();
    if (!savedPosition) {
      alert('Aucune position sauvegardée trouvée');
      return;
    }
    
    // Créer le produit final
    const payload = {
      baseProductId: savedPosition.baseProductId,
      designId: savedPosition.designId,
      vendorName: formData.name,
      vendorDescription: formData.description,
      vendorPrice: formData.price,
      vendorStock: formData.stock,
      selectedColors: formData.selectedColors,
      selectedSizes: formData.selectedSizes,
      productStructure: {
        adminProduct: adminProductData, // Données du produit admin
        designApplication: { positioning: "CENTER", scale: 0.6 }
      },
      designPosition: savedPosition.position // 📍 Position depuis localStorage
    };
    
    try {
      const response = await fetch('/vendor/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Produit créé:', result);
        
        // Nettoyer le localStorage
        localStorage.removeItem(DESIGN_POSITION_KEY);
        
        // Rediriger vers la liste des produits
        navigate('/vendor/products');
      } else {
        const error = await response.json();
        alert(`Erreur: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Erreur création produit:', error);
    }
  };
  
  return (
    <Modal>
      <form onSubmit={handleSubmit}>
        <input 
          placeholder="Nom du produit" 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <textarea 
          placeholder="Description" 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          required
        />
        <input 
          type="number" 
          placeholder="Prix (FCFA)" 
          value={formData.price}
          onChange={(e) => setFormData({...formData, price: parseInt(e.target.value)})}
          required
        />
        {/* Sélection couleurs et tailles */}
        <ColorSelector 
          selected={formData.selectedColors}
          onChange={(colors) => setFormData({...formData, selectedColors: colors})}
        />
        <SizeSelector 
          selected={formData.selectedSizes}
          onChange={(sizes) => setFormData({...formData, selectedSizes: sizes})}
        />
        
        <button type="submit">Créer le produit</button>
      </form>
    </Modal>
  );
}
```

---

## Étape 4 : Gestion de la liste des "brouillons" ✅

### 4.1 Afficher les designs en cours
```ts
function getDraftDesigns(): DesignPositionData[] {
  const drafts: DesignPositionData[] = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('design_position_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        drafts.push(data);
      } catch (error) {
        console.error('❌ Erreur parsing draft:', error);
      }
    }
  }
  
  return drafts.sort((a, b) => b.timestamp - a.timestamp);
}

function DraftsList() {
  const [drafts, setDrafts] = useState<DesignPositionData[]>([]);
  
  useEffect(() => {
    setDrafts(getDraftDesigns());
  }, []);
  
  return (
    <div>
      <h3>Designs en cours de positionnement</h3>
      {drafts.map((draft) => (
        <div key={`${draft.designId}_${draft.baseProductId}`} className="draft-card">
          <img src={getDesignUrl(draft.designId)} alt="Design" />
          <p>Position: x={draft.position.x}, y={draft.position.y}</p>
          <p>Modifié: {new Date(draft.timestamp).toLocaleString()}</p>
          <button onClick={() => editDraft(draft)}>Continuer l'édition</button>
          <button onClick={() => createProductFromDraft(draft)}>Créer le produit</button>
          <button onClick={() => deleteDraft(draft)}>Supprimer</button>
        </div>
      ))}
    </div>
  );
}
```

### 4.2 Nettoyage localStorage
```ts
function cleanupOldDrafts(maxAgeHours = 24) {
  const now = Date.now();
  const maxAge = maxAgeHours * 60 * 60 * 1000;
  
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('design_position_')) {
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}');
        if (now - data.timestamp > maxAge) {
          localStorage.removeItem(key);
          console.log(`🗑️ Draft expiré supprimé: ${key}`);
        }
      } catch (error) {
        localStorage.removeItem(key); // Supprimer les données corrompues
      }
    }
  }
}

// Appeler au démarrage de l'app
useEffect(() => {
  cleanupOldDrafts();
}, []);
```

---

## Étape 5 : Interface utilisateur ✅

### 5.1 Indicateur de sauvegarde
```tsx
function SaveIndicator() {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const saved = loadDesignPosition();
      if (saved) {
        setLastSaved(new Date(saved.timestamp));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="save-indicator">
      {lastSaved ? (
        <span>💾 Sauvegardé à {lastSaved.toLocaleTimeString()}</span>
      ) : (
        <span>⏳ Aucune sauvegarde</span>
      )}
    </div>
  );
}
```

### 5.2 Bouton de validation
```tsx
function ValidateButton() {
  const [hasPosition, setHasPosition] = useState(false);
  
  useEffect(() => {
    const saved = loadDesignPosition();
    setHasPosition(!!saved);
  }, []);
  
  return (
    <button 
      disabled={!hasPosition}
      onClick={() => setShowModal(true)}
      className="validate-btn"
    >
      {hasPosition ? 'Créer le produit' : 'Positionnez d\'abord le design'}
    </button>
  );
}
```

---

## 🏁 Résumé des avantages

✅ **Pas de pollution DB** : Aucun produit temporaire créé  
✅ **Réactivité** : Sauvegarde instantanée en localStorage  
✅ **Persistance** : Position conservée entre sessions  
✅ **Validation stricte** : Seuls les vrais produits sont créés  
✅ **Nettoyage auto** : Suppression des brouillons expirés  
✅ **UX fluide** : Indication claire de l'état de sauvegarde

---

## 📋 Check-list finale

- [ ] Structure localStorage implémentée
- [ ] Sauvegarde automatique du positionnement
- [ ] Modal de création produit fonctionnelle
- [ ] Validation backend stricte (pas de noms auto-générés)
- [ ] Nettoyage localStorage des brouillons
- [ ] Interface utilisateur avec indicateurs

