# 🎯 Guide Frontend – Appliquer **Transformations & Position** du design après publication

> Version : 08/07/2025 – Architecture V2 – Endpoints "direct"

Ce guide explique :
1. Comment **sauvegarder** la position (x, y, scale, rotation) du design avec lʼendpoint V2.
2. Comment **récupérer** cette position pour afficher le design exactement là où il a été défini.
3. Exemple de **Hook React** et de **composant overlay**.

---

## 1. Rappel des endpoints

| Verbe | Endpoint | Payload / Réponse |
|-------|----------|-------------------|
| GET | `/api/vendor-products/{productId}/designs/{designId}/position/direct` | `{ success, data: Position | null }` |
| PUT | `/api/vendor-products/{productId}/designs/{designId}/position/direct` | Body `PositionDto` → `200 { success: true }` |

`PositionDto` :
```ts
interface PositionDto {
  x: number;      // px relatifs au conteneur image
  y: number;      // px relatifs au conteneur image
  scale: number;  // 1 = 100 %
  rotation: number; // degrés
  constraints?: {  // facultatif, infos UI
    adaptive?: boolean;
    area?: 'design-placement' | string;
  };
}
```

---

## 2. Hook `useDesignPosition`

```ts
// hooks/useDesignPosition.ts
import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient';

export function useDesignPosition(productId: number, designId: number) {
  const [position, setPosition] = useState<PositionDto | null>(null);
  const [loading, setLoading] = useState(false);

  // 1️⃣ Charger la position
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/vendor-products/${productId}/designs/${designId}/position/direct`, { withCredentials: true });
        if (mounted) setPosition(data?.data || null);
      } catch (e) {
        console.warn('No position yet', e);
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [productId, designId]);

  // 2️⃣ Sauvegarder la position (drag end / confirm)
  const save = useCallback(async (p: PositionDto) => {
    await api.put(`/api/vendor-products/${productId}/designs/${designId}/position/direct`, p, { withCredentials: true });
    setPosition(p);
  }, [productId, designId]);

  return { position, save, loading };
}
```

---

## 3. Composant Overlay

```tsx
// components/DesignOverlay.tsx
import React from 'react';
import { useDesignPosition } from '../hooks/useDesignPosition';

type Props = {
  productId: number;
  designId: number;
  adminImageUrl: string; // URL de lʼimage admin (front / back)
  designUrl: string;     // URL Cloudinary design
};

export const DesignOverlay: React.FC<Props> = ({ productId, designId, adminImageUrl, designUrl }) => {
  const { position } = useDesignPosition(productId, designId);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <img src={adminImageUrl} style={{ width: '100%', display: 'block' }} />

      {position && (
        <img
          src={designUrl}
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotation}deg)`,
            transformOrigin: 'center',
            pointerEvents: 'none',
            width: '200px', // taille de référence ; ajustez selon vos besoins
          }}
        />
      )}
    </div>
  );
};
```

### Explications clés
* `translate(-50%, -50%)` centre lʼimage sur `(x, y)` (coordonées centre). Si vous stockez le coin supérieur gauche, retirez cette partie.
* Les valeurs `x` / `y` sont **en pixels** relatifs au conteneur dʼimage admin côté backend. Gardez la même échelle.
* Vous pouvez adapter `width`/`height` ou utiliser `max-width` si le design doit être responsive.

---

## 4. Workflow côté page "SellDesign"

1. **Publication** → obtenez `productId` + `designId`.
2. **(Optionnel)** Ouvrez un éditeur de position :
   * Chargez lʼadmin image + design.
   * Sur `drag`, mettez à jour le preview local.
   * Au `dragend`, appelez `save()`.
3. **Affichage liste / détail** → utilisez simplement `<DesignOverlay />` avec `productId` et `designId`.

---

## 5. Tips & Edge cases

1. Si aucun enregistrement nʼexiste, le backend renvoie `data: null`. Affichez le design au centre par défaut.
2. Le service backend renvoie la **dernière position enregistrée** si `designId` nʼest pas trouvée (fallback). Vous pouvez lʼindiquer visuellement (badge "hérité").
3. Les champs `constraints` ne sont pas utilisés par le backend ; stockez-y librement vos préférences UI.

---

## 6. Checklist Frontend

- [ ] Vous appelez **GET position** après avoir reçu `productId` / `designId`.
- [ ] Vous stockez la position dans le store ou via `useDesignPosition`.
- [ ] Vous utilisez `transform: translate(...) scale(...) rotate(...)` pour lʼaffichage.
- [ ] Au `dragend` ou `confirm`, vous appelez **PUT position**.

Une fois ces étapes suivies, le design sʼaffichera **exactement** là où l’utilisateur l’a défini, sur toutes vos pages (preview, detail, panier…). 