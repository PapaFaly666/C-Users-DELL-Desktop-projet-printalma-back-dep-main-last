# 🖼️ Guide Complet – Positions & Transformations du Design (Architecture V2)

> 08 juillet 2025  |  Référence unique pour tous les devs front-end
>
> • **Legacy** (`/vendor/design-transforms/save`, table `VendorDesignTransform`) — OBSOLETE ❌  
> • **Nouveau** (`/position/direct`, table `ProductDesignPosition`) — UTILISER ✅

---

## 1. Vue d’ensemble du flux V2

```mermaid
graph LR
A[POST /vendor/designs] --> B[POST /vendor/products]
B --> C[PUT /api/vendor-products/{vpId}/designs/{designId}/position/direct]
C --> D[GET /api/vendor-products/{vpId}/designs/{designId}/position/direct]
```

| Étape | Action | Endpoint | Résultat |
|-------|--------|----------|----------|
| A | Créer le design | `POST /vendor/designs` | `designId` |
| B | Créer le produit vendeur | `POST /vendor/products` | `productId` (≙ `vpId`) |
| C | Sauvegarder la position | `PUT /…/position/direct` | 200 OK |
| D | Lire la position | `GET /…/position/direct` | `{ x, y, scale, rotation }` |

---

## 2. Schéma `PositionDto`

```ts
interface PositionDto {
  x: number;     // px relativisés (origine coin sup-gauche conteneur)
  y: number;
  scale: number; // 1 = 100 %
  rotation: number; // degrés
  constraints?: { adaptive?: boolean; area?: string };
}
```

> 📝 Les « constraints » sont libres : le backend les stocke mais ne les interprète pas (utile pour votre UI Drag & Drop).

---

## 3. Hook universel `useDesignPosition`

```ts
// hooks/useDesignPosition.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';

export function useDesignPosition(productId: number, designId: number) {
  const [pos, setPos] = useState<PositionDto | null>(null);
  const [loading, setLoading] = useState(true);

  // 🔄 Charger
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get(`/api/vendor-products/${productId}/designs/${designId}/position/direct`, { withCredentials: true });
        if (mounted) setPos(data?.data || null);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [productId, designId]);

  // 💾 Sauvegarder
  const save = useCallback(async (p: PositionDto) => {
    await api.put(`/api/vendor-products/${productId}/designs/${designId}/position/direct`, p, { withCredentials: true });
    setPos(p);
  }, [productId, designId]);

  return { position: pos, save, loading };
}
```

---

## 4. Composant Overlay minimaliste

```tsx
// components/DesignOverlay.tsx
import React from 'react';
import { useDesignPosition } from '../hooks/useDesignPosition';

type Props = {
  vpId: number;
  designId: number;
  adminImg: string; // url image admin
  designImg: string; // url design
};

export function DesignOverlay({ vpId, designId, adminImg, designImg }: Props) {
  const { position } = useDesignPosition(vpId, designId);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img src={adminImg} style={{ width: '100%', display: 'block' }} />
      {position && (
        <img
          src={designImg}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotation}deg)`,
            transformOrigin: 'center',
            pointerEvents: 'none',
            width: '200px', // ajuster
          }}
        />
      )}
    </div>
  );
}
```

---

## 5. Migration pas-à-pas depuis le Legacy

1. **Supprimez** tout :
   * `api.post('/vendor/design-transforms/save', …)`
   * Fichiers/Services `useDesignTransforms`, `vendor-design-transform.service`, etc.
2. **Installez** `useDesignPosition` (section 3) et remplacez les appels.
3. **Sauvegarde :** appelez `save(payload)` lors de l’événement `dragend` ou bouton *Valider*.
4. **Affichage :** utilisez `DesignOverlay` ou équivalent partout (listing, détail, panier, checkout).

---

## 6. Vérifications & Debug

| Contrôle | Attendu |
|----------|---------|
| Réseau | `PUT /api/vendor-products/{vpId}/designs/{designId}/position/direct` → 200 |
| Base de données | Table `ProductDesignPosition` renseigne `(vendor_product_id, design_id)` + JSON position |
| UI après refresh | Design exactement au même endroit |

---

## 7. Edge Cases / FAQ

**Q : Je reçois 404 sur `/position/direct`**  
A : Vérifiez que vous utilisez **`vpId` (vendorProductId)** et non `baseProductId`. Utilisez la liste `/vendor/products` pour mapper.

**Q : Plusieurs designs sur un même produit ?**  
A : Enregistrez une ligne par design ; la clé primaire composite le permet.

**Q : Comment gérer la responsivité ?**  
A : Stockez les positions en pourcentage dans `constraints` et convertissez-les en px au rendu.

---

## 8. Checklist finale

- [ ] Aucune requête `/vendor/design-transforms/save` dans l’onglet Réseau.  
- [ ] Des lignes apparaissent dans `ProductDesignPosition`.  
- [ ] Les designs se chargent aux positions sauvegardées après F5.  
- [ ] Les valeurs `x`, `y`, `scale`, `rotation` sont cohérentes—pas de décalage visuel.

---

✨ **Done !** Vous exploitez désormais pleinement l’architecture V2. 