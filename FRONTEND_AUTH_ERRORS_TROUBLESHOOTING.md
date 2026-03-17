# 🚑 Dépannage Auth Frontend — 401 `/auth/check` & 400 `/auth/register-vendeur`

**Date :** 12 juin 2025  
**Auteur :** Équipe Backend

Ce guide explique l’origine des erreurs vues dans la console et la marche à suivre côté Frontend pour les éliminer.

---

## 1. Erreur `401 Unauthorized` sur `GET /auth/check`

| Que signifie-t-elle ? | Comment la gérer ? |
|-----------------------|--------------------|
| Le cookie `auth_token` n'est pas présent : l'utilisateur n'est pas encore connecté. | • Ne pas traiter comme une erreur fatale.<br>• Considérer l'utilisateur comme « guest » et afficher la page de connexion. |

### Exemple de code React
```ts
try {
  const { data } = await api.get('/auth/check', {
    withCredentials: true,
  });
  setUser(data.user); // ✅ Authentifié
} catch (err: any) {
  if (err.response?.status === 401) {
    setUser(null);     // 🔓 Non connecté ➜ affichage login
  } else {
    console.error(err);
  }
}
```

---

## 2. Erreur `400 Bad Request` sur `POST /auth/register-vendeur`

| Cause la plus fréquente | Solution |
|-------------------------|----------|
| Payload incomplet ou invalide (email manquant, mot de passe trop court…). | 1. Vérifier la réponse JSON ➜ champ `message`.<br>2. Envoyer **tous** les champs :<br>`email`, `password`, `firstName`, `lastName`, `vendeur_type`. |

### Payload attendu
```jsonc
{
  "email": "vendeur@example.com",
  "password": "S3cureP@ss!",   // ≥ 8 car.
  "firstName": "Jean",
  "lastName": "Dupont",
  "vendeur_type": "DESIGNER"     // DESIGNER | ARTISTE | INFLUENCEUR
}
```

### Service d'inscription robuste
```ts
export async function registerVendor(form) {
  try {
    const { data } = await API.post('/auth/register-vendeur', form, {
      headers: { 'Content-Type': 'application/json' },
    });
    return { ok: true, msg: data.message };
  } catch (err: any) {
    const msg = err.response?.data?.message ?? 'Erreur inconnue';
    return { ok: false, msg };
  }
}
```

### Gestion UI
```tsx
const handleSubmit = async (e) => {
  e.preventDefault();
  const res = await registerVendor(form);
  if (res.ok) setStep('SUCCESS');
  else setError(res.msg); // « Email déjà utilisé », …
};
```

---

## 3. Cas « Compte en attente d'activation » lors du login
`POST /auth/login` renvoie :
```jsonc
{
  "statusCode": 401,
  "message": "🕒 Votre compte est en attente d'activation par le SuperAdmin."
}
```
Ajoutez dans votre _AuthService_ :
```ts
if (msg.includes("en attente d'activation")) return 'ACCOUNT_PENDING';
```
Et affichez :
```
⏳ Votre compte est en attente d'activation. Réessayez plus tard.
```

---

## 4. Checklist
- [ ] Utiliser `withCredentials: true` **uniquement** quand un cookie est attendu (login, `/auth/check`).
- [ ] Fournir un payload complet et `Content-Type: application/json` pour l'inscription.
- [ ] Gérer :`ACCOUNT_PENDING` dans le login.
- [ ] Traiter le 401 `/auth/check` comme un état « non connecté ».

---

> _Document à partager avec toute l'équipe Frontend pour un correctif rapide des erreurs._ 