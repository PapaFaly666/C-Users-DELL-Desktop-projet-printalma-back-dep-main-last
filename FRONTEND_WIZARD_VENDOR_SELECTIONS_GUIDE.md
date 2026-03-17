## 🎨 Frontend Guide — Wizard: Mockup, Tailles, Thème et Affichage Admin

Ce guide explique comment le frontend doit envoyer et lire les informations choisies dans le wizard (mockup, couleurs, tailles, thème) et où elles apparaissent côté admin pour validation.

---

### 1) Création via Wizard (Vendeur)

- URL: `POST /api/vendeur/create-product`
- Auth: JWT vendeur
- Content-Type: `multipart/form-data`

Payload (champs principaux à inclure dans `productData` JSON):

```json
{
  "selectedMockup": { "id": 34 },
  "productName": "Sweat Custom Noir",
  "productDescription": "Sweat à capuche premium",
  "productPrice": 12000,
  "basePrice": 10000,
  "vendorProfit": 2000,
  "expectedRevenue": 1400,
  "selectedColors": [
    { "id": 1, "name": "Noir", "colorCode": "#000000" },
    { "id": 2, "name": "Blanc", "colorCode": "#FFFFFF" }
  ],
  "selectedSizes": [
    { "id": 1, "sizeName": "S" },
    { "id": 2, "sizeName": "M" }
  ],
  "selectedTheme": "5", // ID de DesignCategory en string
  "postValidationAction": "TO_PUBLISHED" // ou "TO_DRAFT"
}
```

Images à envoyer en même temps (multipart):
- `baseImage`: fichier image principal
- `detailImage_1`, `detailImage_2`, ... (optionnel)

Ce que le backend stocke sur le `VendorProduct`:
- `sizes` (JSON) = `selectedSizes`
- `colors` (JSON) = `selectedColors`
- `vendorSelectedThemeId` (number) = ID du thème choisi
- `vendorSelectedThemeName` (string) = nom du thème choisi

---

### 2) Endpoint liste admin pour validation

- URL: `GET /admin/products/validation`
- Auth: JWT admin/superadmin

Chaque produit de la réponse contient désormais:

```json
{
  "id": 123,
  "isWizardProduct": true,
  "productType": "WIZARD",
  "adminProductName": "T-shirt Blanc",

  // Sélections du vendeur (depuis JSON en base)
  "selectedColors": [
    { "id": 1, "name": "Noir", "colorCode": "#000000" }
  ],
  "selectedSizes": [
    { "id": 1, "sizeName": "S" }
  ],

  // Thème choisi par le vendeur
  "vendorSelectedTheme": {
    "id": 5,
    "name": "Mangas"
  },

  // Détails enrichis du produit de base (mockup)
  "baseProduct": {
    "id": 34,
    "name": "Sweat à capuche",
    "sizes": [ { "id": 1, "sizeName": "S" }, ... ],
    "colorVariations": [
      {
        "id": 10,
        "name": "Noir",
        "colorCode": "#000000",
        "images": [
          { "id": 99, "url": "https://.../mockup.webp", "viewType": "FRONT", "delimitations": [...] }
        ]
      }
    ],
    "mockupImages": [
      { "id": 99, "url": "https://.../mockup.webp", "viewType": "FRONT", "colorName": "Noir", "colorCode": "#000000" }
    ]
  },

  // Images uploadées (WIZARD)
  "vendorImages": [
    { "id": 1, "imageType": "base", "cloudinaryUrl": "https://...", "colorName": null, "colorCode": null }
  ]
}
```

Notes frontend:
- Pour les produits WIZARD, `selectedColors`/`selectedSizes` viennent directement des champs JSON en base et sont déjà au bon format.
- `vendorSelectedTheme` reflète le thème choisi à l’étape 3; utilisez `id`/`name` pour l’UI.
- `baseProduct` est enrichi pour faciliter l’affichage (images mockup, tailles disponibles du produit de base, etc.).

---

### 3) Endpoint vendeur — liste produits (rappel)

- URL: `GET /vendor/products`
- Chaque produit expose également:
  - `selectedColors`, `selectedSizes`
  - `isWizardProduct` et `validationStatus`
  - `rejectionReason` si WIZARD rejeté

Exemple extrait:

```json
{
  "id": 123,
  "isWizardProduct": true,
  "validationStatus": "pending_admin_validation",
  "rejectionReason": null,
  "selectedColors": [ { "id": 1, "name": "Noir", "colorCode": "#000000" } ],
  "selectedSizes": [ { "id": 1, "sizeName": "S" } ]
}
```

---

### 4) Points d’attention

- Toujours envoyer `selectedTheme` comme un ID (string) correspondant à une `DesignCategory` existante.
- Les tailles et couleurs envoyées par le wizard doivent être des objets complets, pas seulement des IDs.
- En cas de `adminProductDetails: null` côté admin, vérifier que `baseProductId` est bien renvoyé par la liste et que le produit a été créé avec un mockup valide.

---

### 5) Récapitulatif des champs ajoutés/exposés

- Stockage côté `VendorProduct`:
  - `sizes` (JSON), `colors` (JSON)
  - `vendorSelectedThemeId` (number), `vendorSelectedThemeName` (string)

- Exposés côté admin (`GET /admin/products/validation`):
  - `selectedColors`, `selectedSizes`
  - `vendorSelectedTheme` { id, name }
  - `baseProduct` enrichi: tailles, variations couleurs, mockupImages
















