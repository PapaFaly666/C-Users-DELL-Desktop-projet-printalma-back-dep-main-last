# 🎯 Explication Frontend - Champ Genre dans les Mockups

## 📋 Qu'est-ce que le champ Genre ?

Le champ `genre` permet de catégoriser les mockups selon leur public cible. C'est un champ **optionnel** qui prend une valeur par défaut si non spécifiée.

## 🎯 Les 4 Genres Disponibles

```javascript
const GENRES = {
  HOMME: 'HOMME',    // Mockups pour hommes
  FEMME: 'FEMME',    // Mockups pour femmes  
  BEBE: 'BEBE',      // Mockups pour bébés/enfants
  UNISEXE: 'UNISEXE' // Mockups pour tous (valeur par défaut)
};
```

## 🔧 Comment l'Utiliser dans le Frontend

### 1. **Dans un Formulaire de Création**

```javascript
const CreateMockupForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    genre: 'UNISEXE', // ← Valeur par défaut
    // ... autres champs
  });

  return (
    <form>
      {/* ... autres champs ... */}
      
      {/* ← NOUVEAU: Sélecteur de genre */}
      <select
        value={formData.genre}
        onChange={(e) => setFormData({...formData, genre: e.target.value})}
      >
        <option value="UNISEXE">Unisexe (pour tous)</option>
        <option value="HOMME">Homme</option>
        <option value="FEMME">Femme</option>
        <option value="BEBE">Bébé</option>
      </select>
      
      <button type="submit">Créer Mockup</button>
    </form>
  );
};
```

### 2. **Dans une Liste de Mockups**

```javascript
const MockupList = () => {
  const [mockups, setMockups] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  return (
    <div>
      {/* Filtre par genre */}
      <select onChange={(e) => setSelectedGenre(e.target.value)}>
        <option value="ALL">Tous les genres</option>
        <option value="HOMME">Homme</option>
        <option value="FEMME">Femme</option>
        <option value="BEBE">Bébé</option>
        <option value="UNISEXE">Unisexe</option>
      </select>

      {/* Affichage des mockups */}
      <div className="mockup-grid">
        {mockups.map(mockup => (
          <div key={mockup.id} className="mockup-card">
            <h3>{mockup.name}</h3>
            <p>{mockup.description}</p>
            <p>Prix: {mockup.price} FCFA</p>
            
            {/* ← NOUVEAU: Badge de genre */}
            <span className={`genre-badge genre-${mockup.genre.toLowerCase()}`}>
              {mockup.genre}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 3. **CSS pour les Badges de Genre**

```css
.genre-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.genre-homme {
  background-color: #3b82f6; /* Bleu */
  color: white;
}

.genre-femme {
  background-color: #ec4899; /* Rose */
  color: white;
}

.genre-bebe {
  background-color: #f59e0b; /* Orange */
  color: white;
}

.genre-unisexe {
  background-color: #6b7280; /* Gris */
  color: white;
}
```

## 🔗 API Endpoints à Utiliser

### 1. **Créer un Mockup avec Genre**

```javascript
const createMockup = async (mockupData) => {
  const response = await fetch('http://localhost:3004/mockups', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'T-shirt Homme Classic',
      description: 'T-shirt basique pour homme',
      price: 5000,
      genre: 'HOMME', // ← NOUVEAU CHAMP
      // ... autres champs
    })
  });
  
  return await response.json();
};
```

### 2. **Récupérer les Mockups par Genre**

```javascript
const getMockupsByGenre = async (genre) => {
  const response = await fetch(`http://localhost:3004/mockups/by-genre/${genre}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  return await response.json();
};

// Exemples d'utilisation
const hommeMockups = await getMockupsByGenre('HOMME');
const femmeMockups = await getMockupsByGenre('FEMME');
const bebeMockups = await getMockupsByGenre('BEBE');
const unisexeMockups = await getMockupsByGenre('UNISEXE');
```

### 3. **Récupérer Tous les Genres Disponibles**

```javascript
const getAvailableGenres = async () => {
  const response = await fetch('http://localhost:3004/mockups/genres', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  
  return await response.json();
};

const genres = await getAvailableGenres();
// Retourne: ['HOMME', 'FEMME', 'BEBE', 'UNISEXE']
```

## 📊 Exemple de Réponse API

```json
{
  "id": 123,
  "name": "T-shirt Homme Classic",
  "description": "T-shirt basique pour homme",
  "price": 5000,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "HOMME", // ← NOUVEAU CHAMP
  "categories": [...],
  "colorVariations": [...],
  "sizes": [...],
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:30:00Z"
}
```

## ⚠️ Points Importants

### 1. **Valeur par Défaut**
- Si vous ne spécifiez pas de `genre`, il prend automatiquement `'UNISEXE'`
- Vous pouvez donc créer des mockups sans spécifier le genre

### 2. **Validation**
- Seules les valeurs `'HOMME'`, `'FEMME'`, `'BEBE'`, `'UNISEXE'` sont acceptées
- Les valeurs en minuscules (`'homme'`, `'femme'`, etc.) sont rejetées

### 3. **Authentification**
- Tous les endpoints nécessitent un token admin
- Ajoutez `Authorization: Bearer <admin-token>` dans les headers

## 🎨 Exemple d'Intégration Complète

```javascript
// Hook personnalisé pour gérer les mockups
const useMockups = () => {
  const [mockups, setMockups] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMockups = async (genre = null) => {
    setLoading(true);
    try {
      const url = genre 
        ? `http://localhost:3004/mockups/by-genre/${genre}`
        : 'http://localhost:3004/mockups';
        
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      
      const data = await response.json();
      setMockups(data);
    } catch (error) {
      console.error('Erreur récupération mockups:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMockup = async (mockupData) => {
    try {
      const response = await fetch('http://localhost:3004/mockups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          ...mockupData,
          genre: mockupData.genre || 'UNISEXE' // Valeur par défaut
        })
      });
      
      const newMockup = await response.json();
      setMockups(prev => [newMockup, ...prev]);
      return newMockup;
    } catch (error) {
      console.error('Erreur création mockup:', error);
      throw error;
    }
  };

  return { mockups, loading, fetchMockups, createMockup };
};

// Utilisation dans un composant
const MockupManager = () => {
  const { mockups, loading, fetchMockups, createMockup } = useMockups();
  const [selectedGenre, setSelectedGenre] = useState('ALL');

  useEffect(() => {
    if (selectedGenre === 'ALL') {
      fetchMockups();
    } else {
      fetchMockups(selectedGenre);
    }
  }, [selectedGenre]);

  return (
    <div>
      <select value={selectedGenre} onChange={(e) => setSelectedGenre(e.target.value)}>
        <option value="ALL">Tous les genres</option>
        <option value="HOMME">Homme</option>
        <option value="FEMME">Femme</option>
        <option value="BEBE">Bébé</option>
        <option value="UNISEXE">Unisexe</option>
      </select>

      {loading ? (
        <p>Chargement...</p>
      ) : (
        <div className="mockup-grid">
          {mockups.map(mockup => (
            <div key={mockup.id} className="mockup-card">
              <h3>{mockup.name}</h3>
              <p>{mockup.description}</p>
              <p>Prix: {mockup.price} FCFA</p>
              <span className={`genre-badge genre-${mockup.genre.toLowerCase()}`}>
                {mockup.genre}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## ✅ Checklist d'Intégration

- [ ] Ajouter le champ `genre` dans les formulaires de création
- [ ] Ajouter le champ `genre` dans les formulaires de mise à jour
- [ ] Afficher le genre dans les listes de mockups
- [ ] Implémenter le filtrage par genre
- [ ] Ajouter les badges de genre avec CSS
- [ ] Gérer les erreurs de validation
- [ ] Tester tous les endpoints

---

**Note** : Le champ `genre` est **optionnel** et prend la valeur `'UNISEXE'` par défaut. Vous pouvez donc l'intégrer progressivement sans casser l'existant. 