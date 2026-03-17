# 🧑‍💻 Guide Frontend — Intégration Correctif Auth (v2.2)

**Date :** 12 juin 2025  
**Auteur :** Équipe Backend

Ce document explique comment adapter rapidement le frontend aux nouveaux endpoints d'inscription vendeur et aux codes d'erreur associés, suite au correctif backend.

---

## 1. Endpoints à utiliser
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/auth/register-vendeur` | Crée un compte vendeur (status = `false`). |
| `GET`  | `/auth/activation-status/:email` | Retourne `{ activated: boolean }`. |
| `POST` | `/auth/login` | Refuse la connexion (`401`) tant que `status = false`. |
| `GET`  | `/auth/check` | Vérifie la session (nécessite cookie). |

---

## 2. Exemple Axios — Inscription
```ts
import axios from 'axios';
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3004',
  timeout: 10000,
});

export async function registerVendor(payload: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  vendeur_type: 'DESIGNER' | 'ARTISTE' | 'INFLUENCEUR';
}) {
  try {
    const { data } = await API.post('/auth/register-vendeur', payload);
    return { success: true, message: data.message };
  } catch (err: any) {
    const msg = err.response?.data?.message ?? 'Erreur inconnue';
    return { success: false, message: msg };
  }
}
```

---

## 3. Gestion des réponses
| Statut | Payload / Message | Action UI recommandée |
|--------|-------------------|-----------------------|
| `201` / `200` | `{ success: true }` ou `201` | Afficher écran « compte créé », indiquer qu'un email sera envoyé après activation. |
| `400` | « Email déjà utilisé » / « Mot de passe trop faible » / « Tous les champs sont requis » | Afficher l'erreur sous le champ approprié. |
| `422` | Validation Nest / DTO | Parcourir `errors` si présent et afficher pour chaque champ. |

---

## 4. Login : cas « compte en attente »
Lorsqu'un compte est créé mais pas encore activé, `POST /auth/login` renvoie :
```jsonc
{
  "statusCode": 401,
  "message": "🕒 Votre compte est en attente d'activation par le SuperAdmin."
}
```
Ajoutez un cas d'erreur :
```ts
if (msg.includes("en attente d'activation")) return 'ACCOUNT_PENDING';
```
Dans le composant d'erreur, affichez :
```
⏳ Votre compte est en attente d'activation. Réessayez plus tard.
```
Optionnel : proposer un bouton « Vérifier l'activation » (voir §5).

---

## 5. Vérifier l'activation
```ts
export async function checkActivation(email: string) {
  const { data } = await API.get(`/auth/activation-status/${encodeURIComponent(email)}`);
  return data.activated as boolean;
}
```
Exemple React :
```tsx
const [checking, setChecking] = useState(false);
async function onRetry() {
  setChecking(true);
  const activated = await checkActivation(form.email);
  setChecking(false);
  if (activated) navigate('/login', { state: { justActivated: true } });
  else alert('Toujours en attente d'activation');
}
```

---

## 6. Séquence UX conseillée
1. **Inscription réussie** ⇒ page « Merci 🎉 » + bouton « Retour au login ».  
2. **Tentative de login avant activation** ⇒ message `ACCOUNT_PENDING`.  
3. **Bouton Vérifier activation** ⇒ appelle `checkActivation`.  
4. Une fois activé par le SuperAdmin, login standard fonctionne et `/auth/check` renvoie 200.

---

## 7. Récap erreurs à gérer côté Frontend
| Code d'erreur interne | Scénario | Exemple message backend |
|-----------------------|----------|-------------------------|
| `ACCOUNT_PENDING` | Compte pas encore activé | 🕒 Votre compte est en attente d'activation… |
| `EMAIL_EXISTS` | Email déjà pris | Email déjà utilisé |
| `WEAK_PASSWORD` | Mot de passe trop court/faible | Mot de passe trop faible |
| `VALIDATION_ERROR` | Payload invalide | message.dtlos[ ] |
| _Autres existants_ | Voir `FRONTEND_LOGIN_ERROR_HANDLING.md` |

---

## 8. À faire dans le code existant
- [ ] Mettre à jour le **service d'auth** pour gérer `ACCOUNT_PENDING`.  
- [ ] Ajouter le formulaire d'inscription si absent (`RegisterVendorPage`).  
- [ ] Utiliser `checkActivation` pour polling manuel ou automatique.  
- [ ] Afficher un guide utilisateur clair dans l'UI.

---

> _Document à diffuser à toute l'équipe Frontend avant déploiement._ 