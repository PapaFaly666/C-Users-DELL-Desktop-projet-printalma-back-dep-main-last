# 🎯 Guide Frontend - Gestion des Types de Vendeurs par l'Admin

## 📋 Vue d'ensemble

Ce guide documente l'intégration frontend pour la gestion des types de vendeurs personnalisables. L'admin peut créer, modifier, supprimer et lister les types de vendeurs (ex: Photographe, Designer, Influenceur).

## ✨ Fonctionnalités

- ✅ **Créer un type de vendeur** avec label et description
- ✅ **Lister tous les types** avec compteur d'utilisateurs
- ✅ **Modifier un type** (label et/ou description)
- ✅ **Supprimer un type** (si aucun vendeur ne l'utilise)
- ✅ **Contraintes de suppression** automatiques
- ✅ **Validation en temps réel**

---

## 🔧 Structure Backend (Référence)

### Modèle Prisma

```prisma
model VendorType {
  id          Int      @id @default(autoincrement())
  label       String   @unique
  description String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  users       User[]   @relation("UserVendorType")
}

model User {
  vendorTypeId Int?
  vendorType   VendorType? @relation("UserVendorType", fields: [vendorTypeId], references: [id])
  // ... autres champs
}
```

---

## 🚀 API Endpoints Backend

### 1. Créer un Type de Vendeur

**Endpoint** : `POST /vendor-types`

**Headers** :
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Rôles requis** : `ADMIN`, `SUPERADMIN`

**Body** :
```json
{
  "label": "Photographe",
  "description": "Spécialiste de la photographie professionnelle"
}
```

**Validation** :
- `label` : String, 2-50 caractères, unique
- `description` : String, 5-200 caractères

**Response Success (201)** :
```json
{
  "message": "Type de vendeur créé avec succès",
  "vendorType": {
    "id": 4,
    "label": "Photographe",
    "description": "Spécialiste de la photographie professionnelle",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

**Response Error (409)** :
```json
{
  "statusCode": 409,
  "message": "Le type de vendeur \"Photographe\" existe déjà",
  "error": "Conflict"
}
```

---

### 2. Lister Tous les Types de Vendeurs

**Endpoint** : `GET /vendor-types`

**Headers** :
```
Authorization: Bearer {token}
```

**Rôles requis** : Tous les utilisateurs authentifiés

**Response (200)** :
```json
[
  {
    "id": 1,
    "label": "Designer",
    "description": "Créateur de designs graphiques originaux",
    "createdAt": "2025-01-10T08:00:00.000Z",
    "updatedAt": "2025-01-10T08:00:00.000Z",
    "userCount": 12
  },
  {
    "id": 2,
    "label": "Influenceur",
    "description": "Personnalité avec forte présence sur réseaux sociaux",
    "createdAt": "2025-01-11T09:15:00.000Z",
    "updatedAt": "2025-01-11T09:15:00.000Z",
    "userCount": 8
  },
  {
    "id": 3,
    "label": "Photographe",
    "description": "Spécialiste de la photographie professionnelle",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z",
    "userCount": 0
  }
]
```

---

### 3. Récupérer un Type de Vendeur

**Endpoint** : `GET /vendor-types/:id`

**Headers** :
```
Authorization: Bearer {token}
```

**Response (200)** :
```json
{
  "id": 1,
  "label": "Designer",
  "description": "Créateur de designs graphiques originaux",
  "createdAt": "2025-01-10T08:00:00.000Z",
  "updatedAt": "2025-01-10T08:00:00.000Z",
  "userCount": 12
}
```

**Response Error (404)** :
```json
{
  "statusCode": 404,
  "message": "Type de vendeur #999 introuvable",
  "error": "Not Found"
}
```

---

### 4. Modifier un Type de Vendeur

**Endpoint** : `PATCH /vendor-types/:id`

**Headers** :
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Rôles requis** : `ADMIN`, `SUPERADMIN`

**Body** (tous les champs sont optionnels) :
```json
{
  "label": "Photographe Pro",
  "description": "Photographe professionnel certifié"
}
```

**Response Success (200)** :
```json
{
  "message": "Type de vendeur modifié avec succès",
  "vendorType": {
    "id": 3,
    "label": "Photographe Pro",
    "description": "Photographe professionnel certifié",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T11:45:00.000Z"
  }
}
```

**Response Error (409)** :
```json
{
  "statusCode": 409,
  "message": "Le type de vendeur \"Designer\" existe déjà",
  "error": "Conflict"
}
```

---

### 5. Supprimer un Type de Vendeur

**Endpoint** : `DELETE /vendor-types/:id`

**Headers** :
```
Authorization: Bearer {token}
```

**Rôles requis** : `ADMIN`, `SUPERADMIN`

**Scénario 1 - Aucun vendeur utilise ce type** :

**Response Success (200)** :
```json
{
  "message": "Type de vendeur supprimé avec succès"
}
```

**Scénario 2 - Des vendeurs utilisent ce type** :

**Response Error (400)** :
```json
{
  "statusCode": 400,
  "message": "Impossible de supprimer ce type car 12 vendeur(s) l'utilisent actuellement",
  "error": "Bad Request"
}
```

---

## 🎨 Composants React

### 1. Liste des Types de Vendeurs

```typescript
import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface VendorType {
  id: number;
  label: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  userCount: number;
}

const VendorTypeList: React.FC = () => {
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVendorTypes();
  }, []);

  const fetchVendorTypes = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/vendor-types', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setVendorTypes(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Types de Vendeurs</h2>
        <button
          onClick={() => {/* Ouvrir modal de création */}}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          + Créer un type
        </button>
      </div>

      {vendorTypes.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded">
          <p className="text-gray-600">Aucun type de vendeur créé</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {vendorTypes.map(type => (
            <div
              key={type.id}
              className="border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{type.label}</h3>
                  <p className="text-gray-600 text-sm mt-1">{type.description}</p>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span>👥 {type.userCount} vendeur(s)</span>
                    <span>📅 Créé le {new Date(type.createdAt).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => {/* Ouvrir modal d'édition */}}
                    className="px-3 py-1 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
                  >
                    Modifier
                  </button>
                  <button
                    onClick={() => {/* Confirmer suppression */}}
                    disabled={type.userCount > 0}
                    className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={type.userCount > 0 ? 'Impossible de supprimer (vendeurs utilisent ce type)' : 'Supprimer'}
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              {type.userCount > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1 inline-block">
                    ⚠️ Ce type est utilisé par {type.userCount} vendeur(s)
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default VendorTypeList;
```

---

### 2. Formulaire de Création de Type

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface CreateVendorTypeFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const CreateVendorTypeForm: React.FC<CreateVendorTypeFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    label: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ label?: string; description?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { label?: string; description?: string } = {};

    // Validation du label
    if (!formData.label.trim()) {
      newErrors.label = 'Le label est requis';
    } else if (formData.label.trim().length < 2) {
      newErrors.label = 'Le label doit contenir au moins 2 caractères';
    } else if (formData.label.trim().length > 50) {
      newErrors.label = 'Le label ne peut pas dépasser 50 caractères';
    }

    // Validation de la description
    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'La description doit contenir au moins 5 caractères';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3000/vendor-types',
        {
          label: formData.label.trim(),
          description: formData.description.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrors({ general: error.response.data.message });
      } else if (error.response?.status === 400) {
        setErrors({ general: 'Données invalides' });
      } else {
        setErrors({ general: 'Erreur lors de la création' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Créer un Type de Vendeur</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Label <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.label ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: Photographe"
              maxLength={50}
            />
            {errors.label && (
              <p className="text-red-600 text-xs mt-1">{errors.label}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.label.length}/50 caractères
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              placeholder="Ex: Spécialiste de la photographie professionnelle"
              rows={3}
              maxLength={200}
            />
            {errors.description && (
              <p className="text-red-600 text-xs mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/200 caractères
            </p>
          </div>

          {/* Erreur générale */}
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateVendorTypeForm;
```

---

### 3. Formulaire de Modification de Type

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface EditVendorTypeFormProps {
  vendorType: {
    id: number;
    label: string;
    description: string;
  };
  onSuccess: () => void;
  onCancel: () => void;
}

const EditVendorTypeForm: React.FC<EditVendorTypeFormProps> = ({ vendorType, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    label: vendorType.label,
    description: vendorType.description
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ label?: string; description?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { label?: string; description?: string } = {};

    if (formData.label.trim().length < 2) {
      newErrors.label = 'Le label doit contenir au moins 2 caractères';
    } else if (formData.label.trim().length > 50) {
      newErrors.label = 'Le label ne peut pas dépasser 50 caractères';
    }

    if (formData.description.trim().length < 5) {
      newErrors.description = 'La description doit contenir au moins 5 caractères';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `http://localhost:3000/vendor-types/${vendorType.id}`,
        {
          label: formData.label.trim(),
          description: formData.description.trim()
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      onSuccess();
    } catch (error: any) {
      if (error.response?.status === 409) {
        setErrors({ general: error.response.data.message });
      } else if (error.response?.status === 404) {
        setErrors({ general: 'Type de vendeur introuvable' });
      } else {
        setErrors({ general: 'Erreur lors de la modification' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Modifier le Type de Vendeur</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.label ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={50}
            />
            {errors.label && (
              <p className="text-red-600 text-xs mt-1">{errors.label}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              rows={3}
              maxLength={200}
            />
            {errors.description && (
              <p className="text-red-600 text-xs mt-1">{errors.description}</p>
            )}
          </div>

          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Modification...' : 'Modifier'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditVendorTypeForm;
```

---

### 4. Bouton de Suppression avec Confirmation

```typescript
import React, { useState } from 'react';
import axios from 'axios';

interface DeleteVendorTypeButtonProps {
  vendorType: {
    id: number;
    label: string;
    userCount: number;
  };
  onSuccess: () => void;
}

const DeleteVendorTypeButton: React.FC<DeleteVendorTypeButtonProps> = ({ vendorType, onSuccess }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/vendor-types/${vendorType.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  // Si le type est utilisé par des vendeurs, afficher un message bloquant
  if (vendorType.userCount > 0) {
    return (
      <div className="inline-block">
        <button
          disabled
          className="px-3 py-1 text-sm border border-gray-300 text-gray-400 rounded cursor-not-allowed"
          title={`Impossible de supprimer car ${vendorType.userCount} vendeur(s) utilisent ce type`}
        >
          Supprimer
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="px-3 py-1 text-sm border border-red-600 text-red-600 rounded hover:bg-red-50"
      >
        Supprimer
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirmer la suppression</h3>
            <p className="mb-4">
              Êtes-vous sûr de vouloir supprimer le type de vendeur <strong>"{vendorType.label}"</strong> ?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Cette action est irréversible.
            </p>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteVendorTypeButton;
```

---

## 🧪 Scénarios de Test

### Scénario 1 : Création Réussie

1. **Ouvrir le formulaire** de création
2. **Remplir** :
   - Label: "Photographe"
   - Description: "Spécialiste de la photographie professionnelle"
3. **Soumettre** le formulaire
4. **Résultat attendu** : Type créé, message de succès, liste mise à jour

### Scénario 2 : Validation des Champs

1. **Ouvrir le formulaire** de création
2. **Tenter de soumettre** avec :
   - Label: "P" (trop court)
   - Description: "Test" (trop court)
3. **Résultat attendu** : Messages d'erreur de validation
4. **Corriger** les champs et soumettre
5. **Résultat attendu** : Création réussie

### Scénario 3 : Doublon Détecté

1. **Créer** un type "Designer"
2. **Tenter de créer** un autre type "Designer"
3. **Résultat attendu** : Erreur 409 - "Le type de vendeur \"Designer\" existe déjà"

### Scénario 4 : Suppression Bloquée

1. **Créer** un type "Influenceur"
2. **Assigner** ce type à 3 vendeurs
3. **Tenter de supprimer** le type "Influenceur"
4. **Résultat attendu** : Bouton "Supprimer" désactivé avec message d'avertissement

### Scénario 5 : Suppression Réussie

1. **Créer** un type "Test"
2. **Ne l'assigner** à aucun vendeur
3. **Supprimer** le type "Test"
4. **Résultat attendu** : Type supprimé avec succès

### Scénario 6 : Modification avec Doublon

1. **Créer** deux types : "Designer" et "Photographe"
2. **Modifier** "Photographe" → "Designer"
3. **Résultat attendu** : Erreur 409 - "Le type de vendeur \"Designer\" existe déjà"

---

## 📊 Diagramme de Flux

```
┌─────────────────────────────────────────────────────────────┐
│             GESTION DES TYPES DE VENDEURS                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Admin ouvre la page     │
                 │ Gestion Types Vendeurs  │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ GET /vendor-types       │
                 │ Charger tous les types  │
                 └─────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Afficher liste avec:    │
                 │ - Label, Description    │
                 │ - Nombre vendeurs       │
                 │ - Boutons Modifier/Sup  │
                 └─────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
           [Créer nouveau]        [Modifier existant]
                    │                   │
                    ▼                   ▼
         ┌─────────────────┐  ┌─────────────────┐
         │ Ouvrir modal    │  │ Ouvrir modal    │
         │ CreateForm      │  │ EditForm        │
         └─────────────────┘  └─────────────────┘
                    │                   │
                    ▼                   ▼
         ┌─────────────────┐  ┌─────────────────┐
         │ Validation:     │  │ Validation:     │
         │ - Label (2-50)  │  │ - Label (2-50)  │
         │ - Desc (5-200)  │  │ - Desc (5-200)  │
         └─────────────────┘  └─────────────────┘
                    │                   │
          ┌─────────┴─────────┐         │
          │                   │         │
       [Valide]           [Invalide]    │
          │                   │         │
          ▼                   ▼         ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ POST /vendor-    │  │ Afficher erreurs │  │ PATCH /vendor-   │
│ types            │  │ de validation    │  │ types/:id        │
└──────────────────┘  └──────────────────┘  └──────────────────┘
          │                                          │
          ▼                                          ▼
┌──────────────────┐                      ┌──────────────────┐
│ Backend vérifie  │                      │ Backend vérifie  │
│ label unique     │                      │ label unique     │
└──────────────────┘                      └──────────────────┘
          │                                          │
  ┌───────┴───────┐                        ┌─────────┴─────────┐
  │               │                        │                   │
[Unique]      [Doublon]                [Unique]            [Doublon]
  │               │                        │                   │
  ▼               ▼                        ▼                   ▼
┌─────┐  ┌────────────┐            ┌─────────┐      ┌────────────┐
│ 201 │  │ 409 Conflict│            │ 200 OK  │      │ 409 Conflict│
│ OK  │  │ "existe déjà"│            │ Modifié │      │ "existe déjà"│
└─────┘  └────────────┘            └─────────┘      └────────────┘
  │               │                        │                   │
  ▼               ▼                        ▼                   ▼
┌─────────────────────────┐      ┌─────────────────────────┐
│ Fermer modal            │      │ Afficher erreur         │
│ Recharger liste         │      │ Garder modal ouvert     │
│ Message succès          │      │                         │
└─────────────────────────┘      └─────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                  SUPPRESSION TYPE VENDEUR                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌─────────────────────────┐
                 │ Clic bouton Supprimer   │
                 └─────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
           [userCount > 0]      [userCount = 0]
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ Bouton désactivé │  │ Modal confirmat. │
         │ Message warning  │  │ "Êtes-vous sûr?" │
         └──────────────────┘  └──────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                         [Annuler]          [Confirmer]
                              │                   │
                              ▼                   ▼
                    ┌─────────────┐    ┌─────────────────┐
                    │ Fermer modal│    │ DELETE /vendor- │
                    │             │    │ types/:id       │
                    └─────────────┘    └─────────────────┘
                                                │
                                                ▼
                                    ┌─────────────────┐
                                    │ Backend vérifie │
                                    │ userCount = 0   │
                                    └─────────────────┘
                                                │
                                      ┌─────────┴─────────┐
                                      │                   │
                               [userCount = 0]    [userCount > 0]
                                      │                   │
                                      ▼                   ▼
                            ┌─────────────┐    ┌──────────────────┐
                            │ 200 OK      │    │ 400 Bad Request  │
                            │ Supprimé    │    │ "X vendeur(s)"   │
                            └─────────────┘    └──────────────────┘
                                      │                   │
                                      ▼                   ▼
                            ┌─────────────┐    ┌──────────────────┐
                            │ Fermer modal│    │ Afficher erreur  │
                            │ Recharger   │    │ dans modal       │
                            │ Message OK  │    │                  │
                            └─────────────┘    └──────────────────┘
```

---

## 🎯 Points Clés

### ✅ Validation Frontend
- **Label** : 2-50 caractères, obligatoire
- **Description** : 5-200 caractères, obligatoire
- Compteur de caractères en temps réel
- Messages d'erreur clairs

### 🚫 Contraintes de Suppression
- Bouton désactivé si `userCount > 0`
- Message d'avertissement visible
- Backend retourne erreur 400 si tentative de suppression

### 🔄 Workflow Complet
1. Admin liste les types → Backend renvoie tous les types avec `userCount`
2. Admin crée type → Backend vérifie unicité → Succès ou erreur 409
3. Admin modifie type → Backend vérifie unicité (sauf ID actuel) → Succès ou erreur 409
4. Admin supprime type → Backend vérifie `userCount` → Succès ou erreur 400

### 🎨 UX/UI
- Formulaires dans des modals
- Boutons désactivés avec tooltips explicatifs
- Compteurs de vendeurs visibles dans la liste
- Messages d'erreur contextuels (validation, doublon, contrainte)

---

## 📝 Résumé des Endpoints

| Méthode | Endpoint | Rôle Requis | Description |
|---------|----------|-------------|-------------|
| `POST` | `/vendor-types` | ADMIN, SUPERADMIN | Créer type |
| `GET` | `/vendor-types` | Tous | Lister types |
| `GET` | `/vendor-types/:id` | Tous | Détails type |
| `PATCH` | `/vendor-types/:id` | ADMIN, SUPERADMIN | Modifier type |
| `DELETE` | `/vendor-types/:id` | ADMIN, SUPERADMIN | Supprimer type |

---

## 🚀 Conclusion

Ce système permet à l'admin de :
- ✅ **Créer des types personnalisés** selon les besoins métier
- ✅ **Gérer l'unicité** des labels automatiquement
- ✅ **Protéger l'intégrité** des données (impossible de supprimer un type utilisé)
- ✅ **Suivre l'utilisation** via le compteur de vendeurs
- ✅ **Valider en temps réel** côté frontend et backend

Le tout avec une UX fluide et des messages d'erreur clairs ! 🎉
