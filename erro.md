🔄 [ProductService] Création du produit...
productService.ts:299 🔍 [DEBUG] Données reçues: {
  "name": "Test001",
  "description": "ddddddddddddddddddd",
  "price": 300000,
  "suggestedPrice": 300000,
  "stock": 10,
  "status": "published",
  "categories": [
    "Vêtements > T-shirts"
  ],
  "sizes": [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL"
  ],
  "genre": "FEMME",
  "isReadyProduct": false,
  "colorVariations": [
    {
      "name": "dzd",
      "colorCode": "#000000",
      "images": [
        {
          "fileId": "1757503677588",
          "view": "Front",
          "delimitations": [
            {
              "x": 439.6744791666667,
              "y": 417.12239583333337,
              "width": 290,
              "height": 413.33333333333337,
              "rotation": 0
            }
          ]
        }
      ]
    }
  ]
}
productService.ts:300 🔍 [DEBUG] Images reçues: 1
productService.ts:301 🔍 [DEBUG] Genre reçu: FEMME
productService.ts:302 🔍 [DEBUG] Genre sera envoyé: FEMME
productNormalization.ts:72 🧹 Payload nettoyé: {name: 'Test001', description: 'ddddddddddddddddddd', price: 300000, suggestedPrice: 300000, stock: 10, …}categories: ['Vêtements > T-shirts']colorVariations: [{…}]description: "ddddddddddddddddddd"genre: "FEMME"isReadyProduct: falsename: "Test001"price: 300000sizes: (7) ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']status: "published"stock: 10suggestedPrice: 300000[[Prototype]]: Object
productService.ts:349 🔍 [DEBUG] Structure backendProductData: {
  "name": "Test001",
  "description": "ddddddddddddddddddd",
  "price": 300000,
  "suggestedPrice": 300000,
  "stock": 10,
  "status": "published",
  "categories": [
    "Vêtements > T-shirts"
  ],
  "sizes": [
    "XS",
    "S",
    "M",
    "L",
    "XL",
    "XXL",
    "3XL"
  ],
  "genre": "FEMME",
  "isReadyProduct": false,
  "colorVariations": [
    {
      "name": "dzd",
      "colorCode": "#000000",
      "images": [
        {
          "fileId": "1757503677588",
          "view": "Front",
          "delimitations": [
            {
              "x": 439.6744791666667,
              "y": 417.12239583333337,
              "width": 290,
              "height": 413.33333333333337,
              "rotation": 0,
              "coordinateType": "PERCENTAGE"
            }
          ]
        }
      ]
    }
  ]
}
productService.ts:350 🔍 [DEBUG] Genre dans backendProductData: FEMME
productService.ts:368 📎 [DEBUG] Ajout fichier: file_1757503677588 -> Mockup_gourde_bleu.jpg
productService.ts:375 🔍 [DEBUG] FormData contents:
productService.ts:380   productData: {"name":"Test001","description":"ddddddddddddddddddd","price":300000,"suggestedPrice":300000,"stock"...
productService.ts:378   file_1757503677588: File(Mockup_gourde_bleu.jpg, 52170 bytes)
productService.ts:397 ✅ [ProductService] Produit créé avec succès (format direct)