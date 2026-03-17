# 🎯 Stratégie Backend – Zones de Personnalisation (Délimitations)

**Objectif :** Garantir que les zones de personnalisation s'affichent toujours correctement, quel que soit le redimensionnement de l'image et la plateforme d'affichage.

---

## 1. Unifier le référentiel de coordonnées

| Décision | Détail |
|----------|--------|
| **Format canonique** | 100 % **pourcentages** (0-100) pour `x`, `y`, `width`, `height`. |
| **Conversion automatique** | Si le frontend envoie des **pixels**, le backend convertit en pourcentages **avant** persistence. |
| **Migration** | Script SQL / Prisma pour convertir les anciennes entrées `PIXEL` → `PERCENTAGE`. |

```sql
-- Exemple de conversion (pseudo-SQL)
UPDATE Delimitation
SET x      = (x      / imgWidth ) * 100,
    y      = (y      / imgHeight) * 100,
    width  = (width  / imgWidth ) * 100,
    height = (height / imgHeight) * 100,
    coordinateType = 'PERCENTAGE'
WHERE coordinateType = 'PIXEL';
```

---

## 2. Modèle de données (Prisma)

```prisma
model Delimitation {
  id             Int          @id @default(autoincrement())
  productImage   ProductImage @relation(fields: [productImageId], references: [id])
  productImageId Int
  x              Float  // 0-100 %
  y              Float  // 0-100 %
  width          Float  // 0-100 %
  height         Float  // 0-100 %
  name           String?
  rotation       Float?  // degrés (-180 à 180)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 3. Endpoints API

| Méthode | Route | Comportement |
|---------|-------|--------------|
| `POST`  | `/delimitations` | Payload accepté en `%` **ou** `px`. Conversion en `%` avant `create`. |
| `GET`   | `/delimitations/image/:imageId` | Retourne toujours les coordonnées **en %** + `{ naturalWidth, naturalHeight }` de l'image. |
| `PUT`   | `/delimitations/:id` | Même logique de conversion qu'au `POST`. |
| `DELETE`| `/delimitations/:id` | Suppression classique. |

---

## 4. Validation côté serveur (pseudo-code)

```ts
if (x < 0 || y < 0 || width <= 0 || height <= 0) throw BadRequestException('Coordonnées négatives');
if (x + width > 100 || y + height > 100) throw BadRequestException('Zone hors limites (0-100 %)');
```

---

## 5. Plan de test

1. **Unitaires** :
   - Conversion px → % (précision ±0,01).
   - Validation limites.
2. **E2E** :
   - Round-trip : créer → récupérer → comparer (écart ≤0,1 %).
3. **Migration** :
   - Script de conversion et assertions BDD post-migration.

---

## 6. Communication Front ↔ Back

- Documenter dans l'OpenAPI / Swagger : *« Le backend stocke **toujours** en pourcentages. `coordinateType` sert uniquement à indiquer si une conversion est nécessaire. »*
- Fournir des exemples Postman pour : `%` natif, pixels convertis, mise à jour, etc.

---

## 7. Plan de déploiement

1. Ajouter la colonne `rotation` (nullable) si absente + mettre à jour Prisma.
2. Implémenter la logique de conversion dans les endpoints `POST` et `PUT`.
3. Lancer le script de migration pour convertir les anciennes données (`PIXEL` → `%`).
4. Mettre à jour le frontend pour envoyer uniquement des coordonnées en `%`.

---

### 📌 Résumé Jira (copier/coller)
> **Bug** : certaines zones de personnalisation sont mal alignées car enregistrées en pixels et interprétées en pourcentages.  
> **Actions** :  
> 1. Stockage canonique en % ; conversion px → % côté backend.  
> 2. Ajouter `coordinateType` dans l'API + migration des données.  
> 3. Retourner `{ naturalWidth, naturalHeight }` dans `GET /delimitations/image/:imageId`.  
> 4. Tests unitaires + E2E round-trip.

---

*Stratégie rédigée le 10/06/2025 – Valider et planifier dans le prochain sprint.* 