# 📐 FRONTEND — API Positionnement d’un Design par Produit

> Version : 1.0 — 2025-07-05  
> **Concerne :** Équipe Front (React) / Mobile  
> **PR associée :** BACKEND #XYZ « Isolation des positions de design par produit »

## 1. Contexte
Jusqu’à présent, un design (
`Design D`
) ne pouvait stocker qu’un seul set de coordonnées (x, y, scale, rotation…) partagé par **tous** les produits qui l’utilisaient.  
Désormais chaque couple **(VendorProduct P, Design D)** dispose de sa propre entrée en BDD (`ProductDesignPosition`), ce qui résout le bug *« la position du produit P1 est écrasée par P2 »*.

Aucune modification UI n’est nécessaire ; seules les requêtes réseau changent : on ajoute `productId` dans le chemin des routes.

## 2. Nouvelles routes REST

| Action | Méthode & Path | Body / Query | Réponse (200) |
|--------|----------------|--------------|---------------|
| Créer / mettre à jour la position | `PUT /api/vendor-products/{productId}/designs/{designId}/position` | `{ x, y, scale?, rotation?, constraints? }` | `{ success: true, data: { productId, designId, position, createdAt, updatedAt } }` |
| Récupérer la position | `GET /api/vendor-products/{productId}/designs/{designId}/position` | — | `{ success: true, data: { position } }` |
| Supprimer l’association (design retiré du produit) | `DELETE /api/vendor-products/{productId}/designs/{designId}/position` | — | `{ success: true }` |

### 2.1. Payload `position`
```ts
interface DesignPosition {
  x: number;     // px ou % selon le configurateur
  y: number;
  scale?: number;    // 1 par défaut (optionnel)
  rotation?: number; // 0 par défaut (optionnel)
  constraints?: {
    adaptive?: boolean; // true si position relative / adaptative
    area?: string;      // ex. "front_chest", "back_center" …
    [key: string]: any; // extension future
  }
}
```

## 3. Exemple d’utilisation avec Axios

```ts
// utils/designPositioningApi.ts
import axios from 'axios';
import { DesignPosition } from '@/types/design';

export async function saveDesignPosition(
  token: string,
  productId: number,
  designId: number,
  position: DesignPosition,
) {
  await axios.put(
    `/api/vendor-products/${productId}/designs/${designId}/position`,
    position,
    { headers: { Authorization: `Bearer ${token}` } },
  );
}

export async function getDesignPosition(
  productId: number,
  designId: number,
): Promise<DesignPosition | null> {
  const { data } = await axios.get(
    `/api/vendor-products/${productId}/designs/${designId}/position`,
  );
  return data?.data?.position ?? null;
}
```

## 4. Comportement UI
1. Lorsque le configurateur se monte :
   * Appel `GET` pour récupérer la position existante (si 404 → aucune position enregistrée).
2. À l’enregistrement (clic « Sauvegarder » ou auto-save) :
   * Appel `PUT` pour créer / mettre à jour.
3. Si l’utilisateur retire complètement le design du produit :
   * Appel `DELETE` pour libérer la ligne.

## 5. Gestion des erreurs
| Code | Cas | Message typique |
|------|-----|-----------------|
| 401 | Token invalide / absent | « Unauthorized » |
| 403 | Le produit ou le design n’appartient pas au vendeur courant | « Ce produit ne vous appartient pas » |
| 404 | Produit / design / position introuvable | « Position non trouvée » |
| 409 | (Non implémenté) doublon de position — la PK empêche les doublons | « Position déjà existante » |

## 6. Checklist intégration
- [ ] Remplacer les anciennes routes par celles ci-dessus dans tous les appels réseau.
- [ ] Inclure `productId` dans le chemin (⚠️ breaking change).
- [ ] Mettre à jour les mocks / tests front (`msw`, etc.).
- [ ] Vérifier la compatibilité avec la couche Redux / React Query.

## 7. Roadmap
- Phase 1 (immédiat) : déploiement full stack + migration DB → production.  
- Phase 2 : suppression définitive de l’ancien champ `design.position` (lecture seule durant 48 h).

---
👩‍💻 **Référent back-end :** @backend-dev  
🧑‍🎨 **Référent front-end :** @frontend-dev  
📄 **Issue liée :** FRONT-1234 / GITHUB-#56 
 
 
 
 