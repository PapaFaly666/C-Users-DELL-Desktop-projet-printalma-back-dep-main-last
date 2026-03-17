# 🚨 MISE À JOUR FRONTEND – Gestions des Délimitations

**Date :** 10 juin 2025  
**Version API :** 2.1  
**Modules impactés :** Délimitations (zones de personnalisation)

---

## 🎯 Quoi de neuf ?
1. **Réponse enrichie** du backend : l'endpoint `GET /api/delimitations/image/:imageId` renvoie désormais :
   ```jsonc
   {
     "success": true,
     "imageId": 42,
     "naturalWidth": 2400,
     "naturalHeight": 3200,
     "delimitations": [
       { "id":1, "x":12.5, "y":7, "width":30, "height":20, "name":"Zone poitrine" }
     ],
     "count": 1
   }
   ```
   *Les champs `naturalWidth` / `naturalHeight` permettent de convertir si besoin.*

2. **Validation renforcée** : le backend ne renvoie plus jamais de coordonnées > 100 lorsque `coordinateType = "PERCENTAGE"`.
   - Si vous renvoyez des pixels par erreur, le backend les convertit en `%`.
   - Toute valeur hors plage 0-100 déclenche un **HTTP 400**.

3. **Consistance garantie** : toutes les délimitations sont désormais **stockées et retournées** en pourcentages (0–100). Vous n'avez plus besoin de gérer le mix % / px côté front.

---

## 🔧 Ce que vous devez faire côté Frontend
1. **Affichage des zones**
   ```ts
   const { naturalWidth, naturalHeight, delimitations } = apiResponse;
   
   delimitations.forEach(d => {
     const pixelCoords = {
       left: (d.x / 100) * displayedImageWidth,
       top: (d.y / 100) * displayedImageHeight,
       width: (d.width / 100) * displayedImageWidth,
       height: (d.height / 100) * displayedImageHeight,
     };
     // Render rectangle
   });
   ```
2. **Création / mise à jour** : envoyez **toujours** des pourcentages (0-100). Exemple :
   ```jsonc
   {
     "productImageId": 42,
     "delimitation": {
       "x": 15,
       "y": 20,
       "width": 40,
       "height": 25,
       "name": "Zone texte",
       "coordinateType": "PERCENTAGE"
     }
   }
   ```
3. **Sécurité UX** : avant envoi, validez que `x + width ≤ 100` et `y + height ≤ 100`.
4. **Anciennes données** : plus besoin de correctifs front, le backend migre tout. Les éventuelles valeurs >100 seront normalisées automatiquement.

---

## 🌐 Endpoints concernés
| Méthode | Route | Changement |
|---------|-------|------------|
| `GET` | `/api/delimitations/image/:imageId` | Ajout `naturalWidth`, `naturalHeight` et toujours %{x,y,width,height} |
| `POST` | `/api/delimitations` | Si pixels envoyés → conversion immédiate en % |
| `PUT` | `/api/delimitations/:id` | Même logique de conversion + validation |

---

## ⚠️ Points d'attention
- Valider côté client les coordonnées avant envoi pour éviter **400 Bad Request**.
- Utiliser `credentials: 'include'` sur tous les appels.
- Si vous stockiez localement des vieux pixels, convertissez-les avec `naturalWidth/naturalHeight`.

---

**En résumé :** Le backend est 100 % cohérent en pourcentages ➜ l'affichage est responsive sans effort. Mettez simplement à jour votre code pour n'envoyer et n'utiliser que des valeurs 0–100 %.

---

*Document généré automatiquement – 10/06/2025* 