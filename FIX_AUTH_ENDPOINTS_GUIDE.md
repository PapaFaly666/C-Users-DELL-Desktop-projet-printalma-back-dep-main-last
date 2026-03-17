# 🛠️ Correctif Auth — Erreurs `401 /auth/check` & `404 /auth/register-vendeur`

**Date :** 12 juin 2025  
**Auteur :** Équipe Backend

---

## 1 ▪️ Diagnostic rapide
| Requête | Erreur | Cause racine |
|---------|--------|--------------|
| `GET /auth/check` | 401 Unauthorized | Cookie `auth_token` absent ou invalide ; requête lancée avant connexion. |
| `POST /auth/register-vendeur` | 404 Not Found | Endpoint inexistant côté backend (non défini dans `AuthController`). |

---

## 2 ▪️ Correctifs Backend
### 2.1 Ajouter l'endpoint **Inscription Vendeur**
1. **DTO** (`src/auth/dto/register-vendor.dto.ts`)
```ts
export class RegisterVendorDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  vendeur_type: 'DESIGNER' | 'ARTISTE' | 'INFLUENCEUR';
}
```
2. **Service** (`src/auth/auth.service.ts`)
```ts
async registerVendor(dto: RegisterVendorDto) {
  // 1. Vérifier unicité email
  const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
  if (exists) throw new BadRequestException('Email déjà utilisé');

  // 2. Hacher le mot de passe
  const hash = await bcrypt.hash(dto.password, 10);

  // 3. Créer l'utilisateur avec status = false (inactif)
  const user = await this.prisma.user.create({
    data: {
      ...dto,
      password: hash,
      role: 'VENDEUR',
      status: false,
    },
  });

  // 4. Envoyer email au SuperAdmin & au vendeur (optionnel)
  await this.mailService.notifyNewVendor(user);

  return {
    success: true,
    message: 'Votre compte a été créé. Il sera activé prochainement par le SuperAdmin.'
  };
}
```
3. **Controller** (`src/auth/auth.controller.ts`)
```ts
@Post('register-vendeur')
registerVendor(@Body() dto: RegisterVendorDto) {
  return this.authService.registerVendor(dto);
}
```

### 2.2 Endpoint **Statut d'activation**
```ts
@Get('activation-status/:email')
async activationStatus(@Param('email') email: string) {
  const user = await this.prisma.user.findUnique({ where: { email }, select: { status: true } });
  if (!user) throw new NotFoundException('Utilisateur introuvable');
  return { activated: user.status };
}
```

> Après ces ajouts : **redémarrez** le serveur NestJS.

---

## 3 ▪️ Correctifs Frontend
### 3.1 `/auth/check` → accepter le 401 « non connecté »
```ts
try {
  const { data } = await api.get('/auth/check', { withCredentials: true });
  setUser(data.user);
} catch (err: any) {
  if (err.response?.status === 401) {
    setUser(null); // état « non authentifié » normal
  } else {
    console.error(err);
  }
}
```

### 3.2 Formulaire d'inscription
Pointez vers le nouvel endpoint :
```ts
axios.post('/auth/register-vendeur', data, { withCredentials: false });
```

### 3.3 Gestion de l'erreur 401 « compte en attente » dans le login
Ajoutez un cas spécifique :
```ts
if (msg.includes('en attente d\'activation')) {
  return 'ACCOUNT_PENDING';
}
```

---

## 4 ▪️ Checklist de validation
- [ ] Rebuild backend et vérifier `POST /auth/register-vendeur` renvoie **201**.  
- [ ] Vérifier dans la DB que `status = false` pour le nouveau vendeur.  
- [ ] Tester `GET /auth/activation-status/:email` (should → `activated: false`).  
- [ ] Tenter de se connecter ⇒ recevoir `401 compte en attente`.  
- [ ] Activer le compte manuellement (`status = true`) puis retester le login ⇒ succès, cookie présent.  
- [ ] `/auth/check` renvoie **200** une fois connecté.

---

> _Document interne — à suivre pour corriger les erreurs d'authentification._ 