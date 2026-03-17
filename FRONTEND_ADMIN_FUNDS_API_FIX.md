# Guide de Résolution - Erreur 404 API Admin Funds Requests

## 🔍 Problème Identifié

Le frontend appelle les endpoints suivants qui retournent 404 :
```
GET http://localhost:3004/api/admin/funds-requests?page=1&limit=10&sortBy=createdAt&sortOrder=desc
GET http://localhost:3004/api/admin/funds-requests/statistics
```

**Erreur:** `Cannot GET /api/admin/funds-requests` (404 Not Found)

## 🎯 Cause du Problème

Le contrôleur backend est configuré avec :
```typescript
@Controller('admin')  // src/vendor-funds/admin-funds.controller.ts:26
```

Cela crée les routes :
- ✅ `http://localhost:3004/admin/funds-requests`
- ✅ `http://localhost:3004/admin/funds-requests/statistics`

**MAIS** le frontend appelle avec le préfixe `/api` :
- ❌ `http://localhost:3004/api/admin/funds-requests`
- ❌ `http://localhost:3004/api/admin/funds-requests/statistics`

## ✅ Solutions

### Option 1 : Modifier les URLs dans le Frontend (RECOMMANDÉ)

C'est la solution la plus simple et cohérente avec l'architecture actuelle du backend.

#### Fichier à modifier : `adminFundsService.ts`

Cherchez les constantes d'URL et modifiez-les :

**AVANT :**
```typescript
// adminFundsService.ts (lignes ~10-20)
const API_BASE = '/api/admin/funds-requests';
```

**APRÈS :**
```typescript
// adminFundsService.ts (lignes ~10-20)
const API_BASE = '/admin/funds-requests';  // Retirer le /api
```

#### Autres endroits à vérifier :

1. **Configuration des endpoints dans le service**
```typescript
// Chercher toutes les occurrences de '/api/admin/funds-requests'
// et les remplacer par '/admin/funds-requests'

// AVANT
const response = await fetch('/api/admin/funds-requests?page=1');

// APRÈS
const response = await fetch('/admin/funds-requests?page=1');
```

2. **URLs dans les fonctions du service**
```typescript
// adminFundsService.ts

// getAllFundsRequests
async getAllFundsRequests(filters: FilterParams) {
  // AVANT: const url = `/api/admin/funds-requests?${queryString}`;
  const url = `/admin/funds-requests?${queryString}`;  // ✅ APRÈS
  // ...
}

// getAdminFundsStatistics
async getAdminFundsStatistics() {
  // AVANT: const url = `/api/admin/funds-requests/statistics`;
  const url = `/admin/funds-requests/statistics`;  // ✅ APRÈS
  // ...
}

// processFundsRequest
async processFundsRequest(requestId: number, data: ProcessData) {
  // AVANT: const url = `/api/admin/funds-requests/${requestId}/process`;
  const url = `/admin/funds-requests/${requestId}/process`;  // ✅ APRÈS
  // ...
}

// batchProcessRequests
async batchProcessRequests(data: BatchData) {
  // AVANT: const url = `/api/admin/funds-requests/batch-process`;
  const url = `/admin/funds-requests/batch-process`;  // ✅ APRÈS
  // ...
}
```

### Option 2 : Ajouter un préfixe global dans le Backend

Si vous préférez utiliser `/api` comme préfixe pour toutes les routes admin.

#### Fichier à modifier : `src/main.ts`

**AJOUTER après la ligne 9 :**
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ✅ AJOUTER CETTE LIGNE
  app.setGlobalPrefix('api');  // Préfixe global pour toutes les routes

  app.use(cookieParser());
  // ... reste du code
}
```

**⚠️ ATTENTION:** Cette modification affectera TOUTES les routes de l'application. Vous devrez alors mettre à jour tous les appels API du frontend.

**Routes impactées :**
```typescript
// AVANT                          // APRÈS
/auth/login                  →  /api/auth/login
/products                    →  /api/products
/categories                  →  /api/categories
/admin/funds-requests        →  /api/admin/funds-requests
/vendor/funds-requests       →  /api/vendor/funds-requests
// ... etc
```

### Option 3 : Créer un préfixe uniquement pour les routes admin

Si vous voulez garder `/api` uniquement pour les routes admin sans toucher aux autres.

#### Fichier à modifier : `src/vendor-funds/admin-funds.controller.ts`

**AVANT :**
```typescript
@Controller('admin')
export class AdminFundsController {
  // ...
}
```

**APRÈS :**
```typescript
@Controller('api/admin')  // ✅ Ajouter le préfixe /api
export class AdminFundsController {
  // ...
}
```

**⚠️ Note:** Vous devrez faire la même chose pour tous les autres contrôleurs admin si vous avez une architecture cohérente.

## 📋 Liste Complète des Endpoints Concernés

Voici tous les endpoints de l'API Admin Funds qui doivent être accessibles :

| Méthode | URL Backend (actuelle) | URL Frontend (attendue) | Action |
|---------|------------------------|-------------------------|--------|
| GET | `/admin/funds-requests` | `/api/admin/funds-requests` | Liste des demandes |
| GET | `/admin/funds-requests/statistics` | `/api/admin/funds-requests/statistics` | Statistiques |
| GET | `/admin/funds-requests/:id` | `/api/admin/funds-requests/:id` | Détails d'une demande |
| PATCH | `/admin/funds-requests/:id/process` | `/api/admin/funds-requests/:id/process` | Traiter une demande |
| PATCH | `/admin/funds-requests/batch-process` | `/api/admin/funds-requests/batch-process` | Traitement en lot |

## 🔧 Implémentation Recommandée (Option 1)

### Étape 1 : Localiser le fichier de service frontend

```bash
# Trouver le fichier adminFundsService.ts
find . -name "adminFundsService.ts" -o -name "admin-funds-service.ts"
```

### Étape 2 : Modifier toutes les URLs

Chercher et remplacer dans le fichier :

```typescript
// Rechercher : /api/admin/funds-requests
// Remplacer par : /admin/funds-requests
```

**Exemple de code après modification :**

```typescript
class AdminFundsService {
  private readonly BASE_URL = '/admin/funds-requests';  // ✅ Sans /api

  async getAllFundsRequests(filters: FilterParams) {
    const queryString = new URLSearchParams({
      page: String(filters.page),
      limit: String(filters.limit),
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder,
    }).toString();

    const url = `${this.BASE_URL}?${queryString}`;  // ✅ Correct
    const response = await fetch(url);
    return response.json();
  }

  async getAdminFundsStatistics() {
    const url = `${this.BASE_URL}/statistics`;  // ✅ Correct
    const response = await fetch(url);
    return response.json();
  }

  async processFundsRequest(requestId: number, data: ProcessData) {
    const url = `${this.BASE_URL}/${requestId}/process`;  // ✅ Correct
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async batchProcessRequests(data: BatchData) {
    const url = `${this.BASE_URL}/batch-process`;  // ✅ Correct
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }
}
```

### Étape 3 : Vérifier les autres fichiers

Chercher tous les fichiers qui pourraient appeler ces endpoints :

```bash
# Chercher tous les appels à /api/admin/funds-requests
grep -r "/api/admin/funds-requests" ./src
```

## 🧪 Tests

Après avoir appliqué la solution, vérifier que les endpoints fonctionnent :

### Test 1 : Liste des demandes
```bash
# Avec authentification admin
curl -X GET "http://localhost:3004/admin/funds-requests?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Demandes récupérées avec succès",
  "data": {
    "items": [...],
    "pagination": {...}
  }
}
```

### Test 2 : Statistiques
```bash
curl -X GET "http://localhost:3004/admin/funds-requests/statistics" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

**Réponse attendue :**
```json
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    "totalRequests": 30,
    "pendingCount": 7,
    "approvedCount": 3,
    "paidCount": 10,
    "rejectedCount": 10,
    ...
  }
}
```

## 📊 Architecture des Routes Backend

Voici comment sont organisées les routes dans le backend :

```
src/
├── vendor-funds/
│   ├── vendor-funds.module.ts       # Module principal
│   ├── vendor-funds.service.ts      # Service métier
│   ├── vendor-funds.controller.ts   # @Controller('vendor')
│   └── admin-funds.controller.ts    # @Controller('admin')  ← ICI
```

**Routes générées automatiquement :**

```typescript
// admin-funds.controller.ts
@Controller('admin')                         // Préfixe : /admin
@Get('funds-requests')                       // Route : GET /admin/funds-requests
@Get('funds-requests/statistics')            // Route : GET /admin/funds-requests/statistics
@Get('funds-requests/:requestId')            // Route : GET /admin/funds-requests/:requestId
@Patch('funds-requests/:requestId/process')  // Route : PATCH /admin/funds-requests/:requestId/process
@Patch('funds-requests/batch-process')       // Route : PATCH /admin/funds-requests/batch-process
```

## 🔒 Notes sur l'Authentification

Les routes admin requièrent :
1. **JWT valide** dans le header `Authorization: Bearer <token>`
2. **Rôle ADMIN ou SUPERADMIN**

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
```

Si vous obtenez une erreur 401 ou 403, vérifiez :
- Le token JWT est valide et non expiré
- L'utilisateur a le rôle ADMIN ou SUPERADMIN
- Le header Authorization est bien présent

## ✅ Checklist de Résolution

- [ ] Identifier le fichier `adminFundsService.ts` dans le frontend
- [ ] Remplacer toutes les occurrences de `/api/admin/funds-requests` par `/admin/funds-requests`
- [ ] Vérifier les autres fichiers frontend qui appellent ces endpoints
- [ ] Tester la liste des demandes (GET /admin/funds-requests)
- [ ] Tester les statistiques (GET /admin/funds-requests/statistics)
- [ ] Vérifier l'authentification (token JWT + rôle admin)
- [ ] Vérifier que les données s'affichent correctement dans l'interface

## 🐛 Dépannage

### Erreur 404 persiste
**Cause possible :** Cache du navigateur ou du proxy
**Solution :** Vider le cache ou tester en navigation privée

### Erreur 401 Unauthorized
**Cause possible :** Token JWT invalide ou expiré
**Solution :** Se reconnecter pour obtenir un nouveau token

### Erreur 403 Forbidden
**Cause possible :** L'utilisateur n'a pas le rôle ADMIN
**Solution :** Vérifier le rôle dans la base de données

### Les données ne s'affichent pas
**Cause possible :** La base de données est vide
**Solution :** Exécuter le seeding : `npm run db:seed:funds`

## 📞 Support

Si le problème persiste après avoir appliqué ces solutions :

1. Vérifier que le backend est bien démarré sur le port 3004
2. Vérifier les logs du backend pour voir les requêtes reçues
3. Utiliser les outils de développement du navigateur (Network tab)
4. Tester directement avec curl ou Postman

---

**Date de création :** 2025-10-14
**Version :** 1.0.0
**Backend port :** 3004
**Frontend port :** 5174 (probable)
