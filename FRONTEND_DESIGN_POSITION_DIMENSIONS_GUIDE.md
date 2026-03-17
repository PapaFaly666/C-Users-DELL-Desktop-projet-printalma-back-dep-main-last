# 🖼️ Guide Frontend – Ajout de `design_width` & `design_height` dans `position`

Ce court guide décrit la _nouvelle façon_ d’envoyer la position d’un design : désormais `design_width` et `design_height` **doivent** (ou peuvent) être inclus dans l’objet `position`, au même titre que `x`, `y`, `scale` et `rotation`.

---

## 1. Contexte

Historiquement, le front envoyait les dimensions finales du design à la racine du payload :

```jsonc
{
  "vendorProductId": 42,
  "designId": 99,
  "design_width": 200,
  "design_height": 150,
  "position": { "x": 0, "y": 0, "scale": 1, "rotation": 0 }
}
```

Pour plus de cohérence, le backend accepte maintenant (⚙️ PR _Position-Dimensions_) la structure suivante :

```jsonc
{
  "vendorProductId": 42,
  "designId": 99,
  "position": {
    "x": 0,
    "y": 0,
    "scale": 1,
    "rotation": 0,
    "design_width": 200,
    "design_height": 150
  }
}
```

> Remarque : Les champs à la racine **restent** supportés pour assurer la rétro-compatibilité. Vous pouvez donc migrer de façon progressive.

---

## 2. Exemple d’appel RTK Query

```ts
export const saveDesignPosition = api.injectEndpoints({
  endpoints: (builder) => ({
    savePosition: builder.mutation<void, SavePositionPayload>({
      query: ({ vendorProductId, designId, position }) => ({
        url: `/vendor-products/${vendorProductId}/designs/${designId}/position/direct`,
        method: 'PUT',
        body: {
          vendorProductId,
          designId,
          position, //  <-- design_width & design_height inclus ici
        },
      }),
      invalidatesTags: (_res, _err, { vendorProductId }) => [
        { type: 'VendorProduct', id: vendorProductId },
      ],
    }),
  }),
});
```

Où :

```ts
interface Positioning {
  x: number;
  y: number;
  scale: number;
  rotation?: number;
  design_width?: number;
  design_height?: number;
}

interface SavePositionPayload {
  vendorProductId: number;
  designId: number;
  position: Positioning;
}
```

---

## 3. Checklist migration

- [ ] Mettre à jour le type `Positioning` dans votre code front.
- [ ] Envoyer `design_width` & `design_height` **à l’intérieur** de `position`.
- [ ] Supprimer l’envoi en racine dès que possible (optionnel).
- [ ] Vérifier dans DevTools que la requête contient la nouvelle structure.

---

## 4. Foire aux questions

**Q : Dois-je renseigner `design_width` & `design_height` quand le design est redimensionnable par l’utilisateur ?**  
R : Oui, envoyez la taille finale (en pixels) correspondant à l’affichage sur le mock-up.

**Q : Que se passe-t-il si j’envoie les dimensions aux deux endroits ?**  
R : Le backend priorise d’abord les valeurs dans `position`, puis retombe sur celles en racine. Évitez les doublons pour garder un payload propre.

---

📌 Pour tout problème ou question, contactez l’équipe backend (#channel-backend) ou ouvrez une issue `frontend/position-dimensions`. 