# 📑 API — Auto-inscription Vendeur (Self-Signup)

**Version :** 2.2  
**Date :** 12 juin 2025

---

## 1. Endpoint public
| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `POST`  | `/auth/register-vendeur` | Aucune | Crée un compte vendeur inactif (status = `false`). |

> • Aucun cookie requis.  
> • Taux limite : 5 requêtes / IP / heure (mettre en place via Nginx ou Nest middleware si besoin).

---

## 2. Payload requis
```jsonc
{
  "email": "vendeur@example.com",
  "password": "S3cureP@ss!",   // ≥ 8 caractères, 1 maj, 1 min, 1 chiffre, 1 spécial
  "firstName": "Jean",
  "lastName": "Dupont",
  "vendeur_type": "DESIGNER"     // DESIGNER | ARTISTE | INFLUENCEUR
}
```

| Champ | Type | Validation | Exemple |
|-------|------|------------|---------|
| email | string | Format email, unique | `vendeur@printalma.com` |
| password | string | ≥ 8 caractères, complexité minimale | `S3cureP@ss!` |
| firstName | string | Non vide | `Jean` |
| lastName | string | Non vide | `Dupont` |
| vendeur_type | enum | `DESIGNER`\|`ARTISTE`\|`INFLUENCEUR` | `DESIGNER` |

---

## 3. Réponses
### 3.1 Succès `201`
```jsonc
{
  "success": true,
  "message": "Votre compte a été créé. Il sera activé prochainement par le SuperAdmin."
}
```
Le compte est stocké en base avec :
```sql
status = false;
role   = 'VENDEUR';
```
Aucun cookie n'est posé.

### 3.2 Erreurs courantes
| Code | message | Action Frontend |
|------|---------|-----------------|
| 400 | Email déjà utilisé | Afficher message sous champ email |
| 400 | Mot de passe trop faible | Afficher aide mot de passe |
| 400 | Tous les champs sont requis | Vérifier formulaire |
| 422 | Validation Error | Afficher détails champ / DTO |

---

## 4. Workflow complet
```
[Vendeur] ➡ POST /auth/register-vendeur
        ↳ 201 success, status=false
        ↳ UI: Écran "Compte créé, en attente d'activation"

[SuperAdmin] ➡ Active le compte dans l'interface Admin (status=true)

[Vendeur] ➡ POST /auth/login              (tant que status=false) → 401 "compte en attente"
          ➡ POST /auth/login (après activation) → 200 + cookie auth_token
```

---

## 5. Vérifier l'activation (optionnel)
Endpoint :
```http
GET /auth/activation-status/:email
```
Réponse :
```jsonc
{ "activated": false }
```

---

## 6. Notes sécurité
1. Les mots de passe sont **hashés** en bcrypt (`10 salts`).
2. Le compte reste inactif jusqu'à révision du SuperAdmin pour éviter le spam.
3. Ajoutez reCAPTCHA ou équivalent sur le formulaire pour limiter les bots.

---

> _Distribuer ce document aux équipes Frontend & QA._ 