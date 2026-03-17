# 🚀 Endpoints PrintAlma - Référence Rapide

**Base URL**: `http://localhost:3000`  
**Important**: Toujours ajouter `credentials: 'include'` dans vos requêtes !

## 🔐 Authentification

| Endpoint | Méthode | Permission | Description |
|----------|---------|------------|-------------|
| `/auth/login` | POST | Public | Connexion utilisateur |
| `/auth/logout` | POST | Auth | Déconnexion |
| `/auth/check` | GET | Auth | Vérifier auth |
| `/auth/profile` | GET | Auth | Profil utilisateur |
| `/auth/change-password` | PUT | Auth | Changer mot de passe |

## 👥 Vendeurs (Authentifié)

| Endpoint | Méthode | Permission | Description |
|----------|---------|------------|-------------|
| `/auth/vendors` | GET | Auth | Lister vendeurs actifs |
| `/auth/vendors/stats` | GET | Auth | Statistiques vendeurs |

## 👥 Gestion Clients (Admin)

| Endpoint | Méthode | Permission | Description |
|----------|---------|------------|-------------|
| `/auth/admin/create-client` | POST | Admin | Créer client |
| `/auth/admin/clients` | GET | Admin | Lister clients |
| `/auth/admin/clients/{id}/toggle-status` | PUT | Admin | Activer/Désactiver |

## 📧 Services & Tests

| Endpoint | Méthode | Permission | Description |
|----------|---------|------------|-------------|
| `/mail/seller-types` | GET | Public | Types vendeurs |
| `/mail/test-send-email` | POST | Public | Test email |
| `/mail/test-send-email-with-type` | POST | Public | Test email typé |
| `/mail/test-password-generation` | GET | Public | Test génération mot de passe |

---

## 📋 Exemples d'utilisation

### 1. Connexion
```javascript
fetch('/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'admin@printalma.com',
    password: 'motdepasse123'
  })
});
```

### 2. Lister les vendeurs (pour utilisateurs connectés)
```javascript
// Liste des vendeurs actifs
fetch('/auth/vendors', { credentials: 'include' });

// Statistiques des vendeurs par type
fetch('/auth/vendors/stats', { credentials: 'include' });
```

### 3. Créer un client (admin)
```javascript
fetch('/auth/admin/create-client', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean@example.com',
    vendeur_type: 'DESIGNER'
  })
});
```

### 4. Lister les clients avec filtres (admin)
```javascript
// Tous les clients
fetch('/auth/admin/clients', { credentials: 'include' });

// Clients actifs uniquement
fetch('/auth/admin/clients?status=true', { credentials: 'include' });

// Designers uniquement
fetch('/auth/admin/clients?vendeur_type=DESIGNER', { credentials: 'include' });

// Recherche "jean" + pagination
fetch('/auth/admin/clients?search=jean&page=1&limit=20', { credentials: 'include' });
```

### 5. Activer/Désactiver un client (admin)
```javascript
fetch('/auth/admin/clients/15/toggle-status', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include'
});
```

---

## 🎯 Types de Vendeurs

- `DESIGNER` 🎨
- `INFLUENCEUR` 📱  
- `ARTISTE` 🎭

---

## ⚠️ Points Importants

1. **TOUJOURS** ajouter `credentials: 'include'`
2. Les **cookies sont automatiques** (pas de gestion manuelle)
3. **Admin requis** pour les endpoints `/auth/admin/*`
4. **Authentifié requis** pour `/auth/vendors/*`
5. **Pagination** : `?page=X&limit=Y` (max 100) - pour clients admin
6. **Filtres** : `?status=true&vendeur_type=DESIGNER&search=nom` - pour clients admin

---

**Docs complètes** : Voir `API_ENDPOINTS_REFERENCE.md` 📚 