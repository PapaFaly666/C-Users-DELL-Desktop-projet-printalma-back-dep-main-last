# 🛠️ Guide Backend – Refonte du système de délimitations

> Version : 1.0 – 2025-05-21  
> Responsable : Équipe Backend PrintAlma

---

## 1️⃣ Objectif

• Associer chaque délimitation aux **dimensions natives** de l'image (`referenceWidth` / `referenceHeight`).  
• Unifier les types de coordonnées : ne conserver que `PERCENTAGE` et `ABSOLUTE` côté base, le front reçoit `PIXEL` ou `PERCENTAGE`.

---

## 2️⃣ Changement de schéma

```prisma
model Delimitation {
  id              Int       @id @default(autoincrement())
  x               Float
  y               Float
  width           Float
  height          Float
  rotation        Float     @default(0)
  name            String?
  coordinateType  CoordinateType @default(ABSOLUTE)
  // 🔥  NEW 🔥
  referenceWidth  Int?
  referenceHeight Int?
  // … reste inchangé …
}
```

SQL équivalent :

```sql
ALTER TABLE delimitations
  ADD COLUMN reference_width  INTEGER NULL,
  ADD COLUMN reference_height INTEGER NULL;
```

---

## 3️⃣ Migration des données existantes

```sql
-- Étape 1 : remplir reference_width / reference_height pour les délimitations ABSOLUTE (PIXEL)
UPDATE delimitations d
JOIN product_images i ON i.id = d.product_image_id
SET d.reference_width  = i.natural_width,
    d.reference_height = i.natural_height
WHERE d.coordinate_type = 'ABSOLUTE'
  AND (d.reference_width IS NULL OR d.reference_height IS NULL);

-- Étape 2 : facultatif – convertir toutes les ABSOLUTE en PERCENTAGE
UPDATE delimitations d
JOIN product_images i ON i.id = d.product_image_id
SET d.x      = d.x      / i.natural_width  * 100,
    d.y      = d.y      / i.natural_height * 100,
    d.width  = d.width  / i.natural_width  * 100,
    d.height = d.height / i.natural_height * 100,
    d.coordinate_type = 'PERCENTAGE'
WHERE d.coordinate_type = 'ABSOLUTE';
```

💡 Créez un script Prisma **migration.sql** ou utilisez un fichier JS pour exécuter ces requêtes après `prisma migrate deploy`.

---

## 4️⃣ Modifications du code

### 4.1 Prisma schema
* Ajouter les deux colonnes dans `schema.prisma`.
* Lancer `npx prisma generate`.

### 4.2 Enum `CoordinateType`
* Garder `ABSOLUTE` et `PERCENTAGE`.  
* Dans les DTO, exposer `PIXEL` comme alias d'`ABSOLUTE` pour compatibilité frontend.

### 4.3 DTO `DelimitationDto`
* Champs `referenceWidth`, `referenceHeight` (obligatoires si `PIXEL/ABSOLUTE`).
* Validation conditionnelle via `class-validator` (`ValidateIf`).

### 4.4 Service `DelimitationService`
* `createDelimitation` et `updateDelimitation` :
  * Exiger les références pour le mode PIXEL.
  * Enregistrer `coordinateType = ABSOLUTE` + références.
* `getImageWithDelimitations` : map `ABSOLUTE → PIXEL` avant de retourner au front.

### 4.5 Controller
* Adapter les réponses JSON (conversion `ABSOLUTE → PIXEL`).

---

## 5️⃣ Contrats API mis à jour

| Endpoint | Notes côté backend |
|----------|-------------------|
| `POST /delimitations` | Refuse `PIXEL` sans `referenceWidth/Height`. |
| `PUT /delimitations/:id` | Même règle. |
| `GET /delimitations/image/:id` | Retourne toujours les références si disponibles. |

Consultez le guide Frontend pour les payloads détaillés.

---

## 6️⃣ Tests

1. **Unitaires** : ajouter des tests pour chaque règle de validation.  
2. **E2E** : créer une délimitation PIXEL → lecture → comparaison de l'échelle.

---

## 7️⃣ Déploiement

1. Merge du code backend.  
2. `prisma migrate deploy` (ou `npm run prisma:migrate`) sur chaque environnement.  
3. Exécuter le script de migration des données.  
4. Vérifier les métriques : endpoint `GET /delimitations/stats` (pourcentage d'ABSOLUTE restant).

Rollback : restaurer une sauvegarde BDD + revenir à la version précédente du service.

---

## 8️⃣ FAQ

**Pourquoi garder ABSOLUTE dans la base ?**  
Pour assurer une migration progressive : tant que toutes les délimitations ne sont pas converties, on conserve le type d'origine.

**Que fait le front si les références manquent ?**  
Il affiche un avertissement et se rabat sur l'ancienne estimation.

---

## 9️⃣ Contact

Slack : `#backend-api`  
Email : dev@printalma.io  

Merci de suivre cette procédure afin de garantir une transition fluide ! 🙏 