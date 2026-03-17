# 📋 Référence des Endpoints API - PrintAlma

**Base URL**: `http://localhost:3000`

## 🔐 Authentification - `/auth`

### 1. Connexion utilisateur
```http
POST /auth/login
```
**Permissions**: Public  
**Content-Type**: `application/json`  
**Cookies**: Définit `auth_token` (httpOnly)

**Body**:
```json
{
  "email": "admin@printalma.com",
  "password": "motdepasse123"
}
```

**Réponse succès (200)**:
```json
{
  "user": {
    "id": 1,
    "email": "admin@printalma.com",
    "firstName": "Admin",
    "lastName": "PrintAlma",
    "role": "ADMIN",
    "vendeur_type": null,
    "status": true
  }
}
```

**Réponse changement mot de passe requis (200)**:
```json
{
  "mustChangePassword": true,
  "userId": 123,
  "message": "Vous devez changer votre mot de passe avant de continuer"
}
```

---

### 2. Déconnexion
```http
POST /auth/logout
```
**Permissions**: Authentifié  
**Content-Type**: `application/json`  
**Cookies**: Supprime `auth_token`

**Réponse (200)**:
```json
{
  "message": "Déconnexion réussie"
}
```

---

### 3. Vérification d'authentification
```http
GET /auth/check
```
**Permissions**: Authentifié  
**Cookies**: Lit `auth_token`

**Réponse authentifié (200)**:
```json
{
  "isAuthenticated": true,
  "user": {
    "id": 1,
    "email": "admin@printalma.com",
    "firstName": "Admin",
    "lastName": "PrintAlma",
    "role": "ADMIN",
    "vendeur_type": null
  }
}
```

**Réponse non authentifié (401)**:
```json
{
  "isAuthenticated": false,
  "user": null
}
```

---

### 4. Profil utilisateur
```http
GET /auth/profile
```
**Permissions**: Authentifié

**Réponse (200)**:
```json
{
  "id": 1,
  "email": "admin@printalma.com",
  "firstName": "Admin",
  "lastName": "PrintAlma",
  "role": "ADMIN",
  "vendeur_type": null,
  "status": true,
  "must_change_password": false,
  "last_login_at": "2024-01-15T10:30:00.000Z",
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-15T10:30:00.000Z"
}
```

---

### 5. Changement de mot de passe
```http
PUT /auth/change-password
```
**Permissions**: Authentifié  
**Content-Type**: `application/json`

**Body**:
```json
{
  "currentPassword": "ancienMotDePasse123",
  "newPassword": "nouveauMotDePasse456",
  "confirmPassword": "nouveauMotDePasse456"
}
```

**Réponse (200)**:
```json
{
  "message": "Mot de passe changé avec succès"
}
```

---

## 👥 Listing des Vendeurs (Authentifié) - `/auth`

### 1. Lister les vendeurs actifs
```http
GET /auth/vendors
```
**Permissions**: Authentifié (tous les utilisateurs connectés)

**Réponse (200)**:
```json
{
  "vendors": [
    {
      "id": 15,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@gmail.com",
      "vendeur_type": "DESIGNER",
      "created_at": "2024-01-15T10:30:00.000Z",
      "last_login_at": "2024-01-16T09:15:00.000Z"
    },
    {
      "id": 16,
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie.martin@gmail.com",
      "vendeur_type": "INFLUENCEUR",
      "created_at": "2024-01-10T08:00:00.000Z",
      "last_login_at": "2024-01-14T15:45:00.000Z"
    },
    {
      "id": 17,
      "firstName": "Paul",
      "lastName": "Artiste",
      "email": "paul.artiste@gmail.com",
      "vendeur_type": "ARTISTE",
      "created_at": "2024-01-12T14:20:00.000Z",
      "last_login_at": null
    }
  ],
  "total": 3,
  "message": "3 vendeurs trouvés"
}
```

### 2. Statistiques des vendeurs par type
```http
GET /auth/vendors/stats
```
**Permissions**: Authentifié (tous les utilisateurs connectés)

**Réponse (200)**:
```json
{
  "stats": [
    {
      "type": "DESIGNER",
      "count": 5,
      "label": "Designer",
      "icon": "🎨"
    },
    {
      "type": "INFLUENCEUR",
      "count": 3,
      "label": "Influenceur",
      "icon": "📱"
    },
    {
      "type": "ARTISTE",
      "count": 2,
      "label": "Artiste",
      "icon": "🎭"
    }
  ],
  "total": 10,
  "message": "Statistiques de 10 vendeurs actifs"
}
```

---

## 👥 Gestion des Clients (Admin) - `/auth/admin`

### 1. Créer un nouveau client
```http
POST /auth/admin/create-client
```
**Permissions**: Admin (`ADMIN` ou `SUPERADMIN`)  
**Content-Type**: `application/json`

**Body**:
```json
{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@gmail.com",
  "vendeur_type": "DESIGNER"
}
```

**Réponse (201)**:
```json
{
  "message": "Client créé avec succès. Un email avec le mot de passe temporaire a été envoyé.",
  "user": {
    "id": 15,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@gmail.com",
    "role": "VENDEUR",
    "vendeur_type": "DESIGNER",
    "status": true,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

---

### 2. Lister les clients avec filtres et pagination
```http
GET /auth/admin/clients
```
**Permissions**: Admin (`ADMIN` ou `SUPERADMIN`)

**Paramètres de requête**:
- `page` (number, optionnel): Page courante (défaut: 1)
- `limit` (number, optionnel): Éléments par page (défaut: 10, max: 100)
- `status` (boolean, optionnel): Filtrer par statut (true=actif, false=inactif)
- `vendeur_type` (string, optionnel): DESIGNER | INFLUENCEUR | ARTISTE
- `search` (string, optionnel): Recherche dans nom, prénom ou email

**Exemples d'URLs**:
```
GET /auth/admin/clients
GET /auth/admin/clients?page=2&limit=20
GET /auth/admin/clients?status=true
GET /auth/admin/clients?vendeur_type=DESIGNER
GET /auth/admin/clients?search=jean
GET /auth/admin/clients?status=true&vendeur_type=DESIGNER&search=martin&page=1&limit=5
```

**Réponse (200)**:
```json
{
  "clients": [
    {
      "id": 15,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@gmail.com",
      "role": "VENDEUR",
      "vendeur_type": "DESIGNER",
      "status": true,
      "must_change_password": true,
      "last_login_at": null,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "login_attempts": 0,
      "locked_until": null
    },
    {
      "id": 16,
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie.martin@gmail.com",
      "role": "VENDEUR",
      "vendeur_type": "INFLUENCEUR",
      "status": false,
      "must_change_password": false,
      "last_login_at": "2024-01-14T15:45:00.000Z",
      "created_at": "2024-01-10T08:00:00.000Z",
      "updated_at": "2024-01-15T09:20:00.000Z",
      "login_attempts": 2,
      "locked_until": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrevious": false
  },
  "filters": {
    "status": true,
    "vendeur_type": "DESIGNER",
    "search": "jean"
  }
}
```

---

### 3. Activer/Désactiver un client
```http
PUT /auth/admin/clients/{id}/toggle-status
```
**Permissions**: Admin (`ADMIN` ou `SUPERADMIN`)  
**Content-Type**: `application/json`

**Exemple**:
```
PUT /auth/admin/clients/15/toggle-status
```

**Réponse (200)**:
```json
{
  "message": "Client activé avec succès",
  "client": {
    "id": 15,
    "firstName": "Jean",
    "lastName": "Dupont",
    "email": "jean.dupont@gmail.com",
    "status": true,
    "updated_at": "2024-01-15T11:00:00.000Z"
  }
}
```

---

## 📧 Services Mail et Tests - `/mail`

### 1. Obtenir les types de vendeurs
```http
GET /mail/seller-types
```
**Permissions**: Public

**Réponse (200)**:
```json
{
  "message": "Types de vendeurs récupérés avec succès",
  "types": [
    {
      "value": "DESIGNER",
      "label": "Designer",
      "description": "Création de designs graphiques et visuels"
    },
    {
      "value": "INFLUENCEUR",
      "label": "Influenceur",
      "description": "Promotion via réseaux sociaux et influence"
    },
    {
      "value": "ARTISTE",
      "label": "Artiste",
      "description": "Création artistique et œuvres originales"
    }
  ]
}
```

---

### 2. Test d'envoi d'email simple
```http
POST /mail/test-send-email
```
**Permissions**: Public (développement uniquement)  
**Content-Type**: `application/json`

**Body**:
```json
{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User"
}
```

**Réponse (200)**:
```json
{
  "message": "Email de test envoyé avec succès !",
  "sentTo": "test@example.com",
  "temporaryPassword": "Abc123Xyz789"
}
```

---

### 3. Test d'envoi d'email avec type de vendeur
```http
POST /mail/test-send-email-with-type
```
**Permissions**: Public (développement uniquement)  
**Content-Type**: `application/json`

**Body**:
```json
{
  "email": "designer@example.com",
  "firstName": "Jean",
  "lastName": "Designer",
  "vendeurType": "DESIGNER"
}
```

**Réponse (200)**:
```json
{
  "message": "Email spécialisé envoyé avec succès !",
  "sentTo": "designer@example.com",
  "vendeurType": "DESIGNER",
  "temporaryPassword": "Def456Uvw012"
}
```

---

### 4. Test de génération de mot de passe
```http
GET /mail/test-password-generation
```
**Permissions**: Public (développement uniquement)

**Réponse (200)**:
```json
{
  "message": "Mot de passe généré avec succès",
  "password": "Ghi789Rst345",
  "length": 12
}
```

---

## 🚨 Codes d'Erreur

### Codes HTTP Standards
- **200**: OK - Requête réussie
- **201**: Created - Ressource créée avec succès
- **400**: Bad Request - Données invalides
- **401**: Unauthorized - Non authentifié
- **403**: Forbidden - Permissions insuffisantes
- **404**: Not Found - Ressource non trouvée
- **409**: Conflict - Conflit (ex: email déjà existant)
- **422**: Unprocessable Entity - Erreur de validation
- **500**: Internal Server Error - Erreur serveur

### Exemples de Réponses d'Erreur

**401 - Non authentifié**:
```json
{
  "statusCode": 401,
  "message": "Identifiants invalides"
}
```

**403 - Permissions insuffisantes**:
```json
{
  "statusCode": 403,
  "message": "Accès refusé"
}
```

**409 - Email déjà existant**:
```json
{
  "statusCode": 409,
  "message": "Un utilisateur avec cet email existe déjà"
}
```

**422 - Validation échouée**:
```json
{
  "statusCode": 422,
  "message": [
    "email must be an email",
    "Le mot de passe doit contenir au moins 8 caractères"
  ]
}
```

---

## 🔧 Authentification avec Cookies

### Configuration requise côté client
Toutes les requêtes doivent inclure :
```javascript
credentials: 'include'
```

### Exemple avec fetch
```javascript
const response = await fetch('http://localhost:3000/auth/admin/clients', {
  method: 'GET',
  credentials: 'include' // ⭐ OBLIGATOIRE
});
```

### Exemple avec Axios
```javascript
const response = await axios.get('/auth/admin/clients', {
  withCredentials: true // ⭐ OBLIGATOIRE
});
```

---

## 📊 Types de Vendeurs

| Valeur | Icône | Label | Description |
|--------|-------|-------|-------------|
| `DESIGNER` | 🎨 | Designer | Création de designs graphiques et visuels |
| `INFLUENCEUR` | 📱 | Influenceur | Promotion via réseaux sociaux et influence |
| `ARTISTE` | 🎭 | Artiste | Création artistique et œuvres originales |

---

## 🔄 Flux d'Authentification

```
1. POST /auth/login
   ↓ (Cookie auth_token défini automatiquement)
2. Toutes les requêtes incluent le cookie automatiquement
   ↓
3. GET /auth/check (vérification périodique)
   ↓
4. POST /auth/logout (suppression automatique du cookie)
```

---

## 📝 Notes Importantes

### 🍪 Cookies
- Les cookies sont **httpOnly** (inaccessibles en JavaScript)
- Expiration automatique après **24 heures**
- **Secure** en production (HTTPS uniquement)
- **SameSite=strict** (protection CSRF)

### 🔒 Sécurité
- Verrouillage automatique après **5 tentatives** échouées
- Verrouillage temporaire de **30 minutes**
- Mot de passe temporaire généré automatiquement
- Email de notification envoyé lors de la création de compte

### 📧 Emails
- Templates spécialisés par type de vendeur
- Mot de passe temporaire inclus
- Obligation de changer le mot de passe à la première connexion

---

**🚀 API PrintAlma - Authentification par Cookies Sécurisés** 