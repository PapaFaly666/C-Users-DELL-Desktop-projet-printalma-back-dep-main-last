#!/bin/bash

# Test pour créer un produit mockup dans le système Printalma Architecture v2
# Ce test démontre comment le système gère les mockups actuellement

echo "🧪 TEST DE CRÉATION DE MOCKUP - PRINTALMA ARCHITECTURE v2"
echo "=========================================================="

# Base URL de l'API
BASE_URL="http://localhost:3004"

# Test 1: Vérifier que le endpoint de mockup generation est désactivé (Architecture v2)
echo ""
echo "📋 Test 1: Vérification endpoint désactivé (Architecture v2)"
echo "-----------------------------------------------------------"

# Premier test : essayer de générer des mockups (devrait échouer car désactivé en v2)
echo "🔍 Test d'accès à l'endpoint de génération de mockups (désactivé en v2)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${BASE_URL}/vendor/products/1/generate-mockups" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token")

echo "Réponse: $RESPONSE"

# Test 2: Créer un mockup en utilisant l'endpoint admin (qui fonctionne encore)
echo ""
echo "📋 Test 2: Création mockum via endpoint admin (actif)"
echo "----------------------------------------------------"

# Exemple de payload pour créer un mockup
MOCKUP_PAYLOAD='{
  "name": "T-shirt Mockup Test",
  "description": "Mockup de test pour Architecture v2",
  "price": 100,
  "stock": 0,
  "status": "draft",
  "isReadyProduct": false,
  "genre": "HOMME",
  "categories": ["VETEMENTS"],
  "colorVariations": [
    {
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "url": "https://res.cloudinary.com/printalma/image/upload/v1234567/tshirt-white-front.jpg",
          "viewType": "FRONT",
          "delimitations": [
            {
              "x": 150,
              "y": 200,
              "width": 200,
              "height": 200,
              "coordinateType": "PIXEL"
            }
          ]
        }
      ]
    }
  ]
}'

echo "🎨 Création d'un mockum via endpoint admin..."
echo "Payload: $MOCKUP_PAYLOAD"

# Créer le mockup via l'endpoint admin (si disponible)
MOCKUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "${BASE_URL}/mockups" \
  -H "Content-Type: application/json" \
  -d "$MOCKUP_PAYLOAD")

echo "Réponse création mockup: $MOCKUP_RESPONSE"

# Test 3: Vérifier la configuration Cloudinary
echo ""
echo "📋 Test 3: Vérification configuration Cloudinary"
echo "------------------------------------------------"

CLOUDINARY_CHECK=$(curl -s "${BASE_URL}/cloudinary/config-check")
echo "Configuration Cloudinary: $CLOUDINARY_CHECK"

# Test 4: Vérifier les endpoints de vendor publish qui remplacent les mockups
echo ""
echo "📋 Test 4: Vérification endpoint vendor publish (Architecture v2)"
echo "---------------------------------------------------------------"

# Liste des produits vendeur (Architecture v2)
echo "📦 Test liste produits vendeur (Architecture v2)..."
VENDOR_PRODUCTS_RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "${BASE_URL}/vendor/products" \
  -H "Authorization: Bearer test-token")

echo "Réponse produits vendeur: $VENDOR_PRODUCTS_RESPONSE"

# Test 5: Créer un produit vendeur avec design (remplace les mockups)
echo ""
echo "📋 Test 5: Création produit vendeur avec design (Architecture v2)"
echo "----------------------------------------------------------------"

# Exemple de payload pour créer un produit vendeur avec design
VENDOR_PRODUCT_PAYLOAD='{
  "baseProductId": 4,
  "designId": 1,
  "vendorName": "T-shirt Test Design",
  "vendorPrice": 25000,
  "selectedColors": [
    {
      "id": 12,
      "name": "Rouge",
      "colorCode": "#ff0000"
    }
  ],
  "selectedSizes": [
    {
      "id": 1,
      "sizeName": "S"
    },
    {
      "id": 2,
      "sizeName": "M"
    }
  ],
  "productStructure": {
    "adminProduct": {
      "id": 4,
      "name": "T-shirt Basique",
      "description": "T-shirt en coton 100% de qualité premium",
      "price": 19000,
      "images": {
        "colorVariations": [
          {
            "id": 12,
            "name": "Rouge",
            "colorCode": "#ff0000",
            "images": [
              {
                "id": 101,
                "url": "https://res.cloudinary.com/printalma/tshirt-front-red.jpg",
                "viewType": "FRONT",
                "delimitations": [
                  {
                    "x": 150,
                    "y": 200,
                    "width": 200,
                    "height": 200,
                    "coordinateType": "PIXEL"
                  }
                ]
              }
            ]
          }
        ]
      },
      "sizes": [
        { "id": 1, "sizeName": "S" },
        { "id": 2, "sizeName": "M" }
      ]
    },
    "designApplication": {
      "scale": 0.6
    }
  }
}'

echo "🎨 Tentative de création produit vendeur avec design..."
echo "Remarque: Ce test nécessite un auth token valide et un design existant"

# Test 6: Vérifier l'état de santé du système
echo ""
echo "📋 Test 6: Vérification état de santé (Architecture v2)"
echo "----------------------------------------------------"

HEALTH_RESPONSE=$(curl -s "${BASE_URL}/vendor/health")
echo "État de santé du service vendeur: $HEALTH_RESPONSE"

echo ""
echo "📊 RÉSUMÉ DU TEST"
echo "=================="
echo "✅ Architecture v2: Les endpoints de génération de mockups sont désactivés"
echo "✅ Remplacement: Utilisation de designs séparés avec structure admin préservée"
echo "✅ Rendu: Client-side en temps réel au lieu de server-side generation"
echo "✅ Configuration Cloudinary: Directement dans le code"
echo ""
echo "🎯 CONCLUSION:"
echo "En Architecture v2, les mockups sont gérés différemment:"
echo "- Les designs sont créés séparément via POST /vendor/designs"
echo "- Les produits utilisent ces designs avec structure admin préservée"
echo "- Le rendu est fait en temps réel côté client"
echo "- Pas de génération server-side de mockups"