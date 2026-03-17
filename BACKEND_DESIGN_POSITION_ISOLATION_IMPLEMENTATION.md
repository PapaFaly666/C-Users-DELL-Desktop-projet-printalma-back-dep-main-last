# 🛠️ BACKEND FIX — Isolation des positions de design par produit

> dernière mise à jour : 2025-07-05  
> **Audience** : équipe Back-end (NestJS + Prisma)  
> **Tickets liés** : FRONT-1234, GITHUB #56

---

## 1. Problème
Lorsqu'un même design est utilisé dans plusieurs produits, sa position était jusqu'alors enregistrée dans la table `design` (champ `position`, ou équivalent).  
Toute mise à jour sur un produit écrasait donc la position dans les autres produits.

## 2. Solution adoptée
1. **Nouveau modèle Prisma :** `ProductDesignPosition` (PK composée `(vendorProductId, designId)`).  
   * Champs : `position` (JSON), `createdAt`, `updatedAt`.  
   * Relations : `VendorProduct` et `Design` avec `onDelete: Cascade`.
2. **Back-relations** ajoutées dans `VendorProduct` et `Design`.
3. **Endpoints REST protégés (JWT) :**
   * `PUT    /api/vendor-products/:productId/designs/:designId/position` — upsert
   * `GET    /api/vendor-products/:productId/designs/:designId/position` — read
   * `DELETE /api/vendor-products/:productId/designs/:designId/position` — delete
4. **Service `DesignPositionService`** : règles de sécurité (propriété vendeur) + upsert/find/delete.
5. **Module** : `VendorProductModule` expose `DesignPositionController` & `DesignPositionService`.
6. **Migration PostgreSQL / Prisma :**
   ```bash
   npx prisma migrate dev --name product_design_position
   ```
7. **Clean-up** : l'ancien champ `design.position` reste en lecture seule 48 h avant suppression.

## 3. Impact Front-end
Voir `FRONTEND_PRODUCT_DESIGN_POSITION_API.md` pour les routes et exemples.

## 4. Checklist de validation
- [ ] Création / MAJ / lecture / suppression d'une position par produit.
- [ ] Concurrence : positions isolées entre P1 et P2.
- [ ] Cascade : suppression d'un produit ou design supprime les positions liées.

---
🎉 Cette mise à jour élimine la régression d'écrasement de position et prépare la future gestion multi-designs. 
 
 
 
 