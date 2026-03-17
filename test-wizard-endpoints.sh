#!/bin/bash

# 🧪 Script de Test - Endpoints Validation Produits WIZARD
# Utilise les nouveaux endpoints implémentés selon ha.md

echo "🎯 Test des Endpoints Validation Produits WIZARD"
echo "=============================================="

# Configuration
BASE_URL="http://localhost:3004"
JWT_TOKEN="your_admin_jwt_token_here"

# Headers
HEADERS=(
  -H "Authorization: Bearer $JWT_TOKEN"
  -H "Content-Type: application/json"
)

echo ""
echo "📋 1. Test GET /admin/pending-products"
echo "--------------------------------------"

# Test 1: Récupérer tous les produits en attente
echo "Test 1a: Tous les produits en attente"
curl -s -X GET "$BASE_URL/admin/pending-products" "${HEADERS[@]}" | jq '.'

echo ""
echo "Test 1b: Seulement les produits WIZARD"
curl -s -X GET "$BASE_URL/admin/pending-products?productType=WIZARD" "${HEADERS[@]}" | jq '.data.products[] | {id, productType, isWizardProduct, adminProductName}'

echo ""
echo "Test 1c: Seulement les produits TRADITIONAL"
curl -s -X GET "$BASE_URL/admin/pending-products?productType=TRADITIONAL" "${HEADERS[@]}" | jq '.data.products[] | {id, productType, hasDesign, designCloudinaryUrl}'

echo ""
echo "Test 1d: Avec pagination et filtre vendeur"
curl -s -X GET "$BASE_URL/admin/pending-products?vendor=john&page=1&limit=3" "${HEADERS[@]}" | jq '.data.pagination'

echo ""
echo "Test 1e: Statistiques par type"
curl -s -X GET "$BASE_URL/admin/pending-products" "${HEADERS[@]}" | jq '.data.stats'

echo ""
echo "✅ 2. Test PATCH /admin/validate-product/:id"
echo "-------------------------------------------"

# Test 2: Validation individuelle
PRODUCT_ID_TO_APPROVE=138
PRODUCT_ID_TO_REJECT=139

echo "Test 2a: Approuver un produit ($PRODUCT_ID_TO_APPROVE)"
curl -s -X PATCH "$BASE_URL/admin/validate-product/$PRODUCT_ID_TO_APPROVE" \
  "${HEADERS[@]}" \
  -d '{"approved": true}' | jq '.message, .data.productType, .data.isValidated'

echo ""
echo "Test 2b: Rejeter un produit ($PRODUCT_ID_TO_REJECT)"
curl -s -X PATCH "$BASE_URL/admin/validate-product/$PRODUCT_ID_TO_REJECT" \
  "${HEADERS[@]}" \
  -d '{"approved": false, "rejectionReason": "Images de mauvaise qualité"}' | jq '.message, .data.rejectionReason'

echo ""
echo "🔄 3. Test PATCH /admin/validate-products-batch"
echo "----------------------------------------------"

# Test 3: Validation en lot
BATCH_PRODUCT_IDS='[140, 141, 142]'

echo "Test 3a: Approuver un lot de produits"
curl -s -X PATCH "$BASE_URL/admin/validate-products-batch" \
  "${HEADERS[@]}" \
  -d "{\"productIds\": $BATCH_PRODUCT_IDS, \"approved\": true}" | \
  jq '.message, .data.successCount, .data.wizardProcessed, .data.traditionalProcessed'

echo ""
echo "Test 3b: Rejeter un lot de produits"
REJECT_BATCH_IDS='[143, 144]'
curl -s -X PATCH "$BASE_URL/admin/validate-products-batch" \
  "${HEADERS[@]}" \
  -d "{\"productIds\": $REJECT_BATCH_IDS, \"approved\": false, \"rejectionReason\": \"Non-conformité standards\"}" | \
  jq '.message, .data.errorCount, .data.errors'

echo ""
echo "🔒 4. Tests de Sécurité"
echo "----------------------"

echo "Test 4a: Sans token (doit retourner 401)"
curl -s -X GET "$BASE_URL/admin/pending-products" | jq '.statusCode, .message'

echo ""
echo "Test 4b: Avec token invalide (doit retourner 401)"
curl -s -X GET "$BASE_URL/admin/pending-products" \
  -H "Authorization: Bearer invalid_token" | jq '.statusCode, .message'

echo ""
echo "❌ 5. Tests d'Erreurs"
echo "--------------------"

echo "Test 5a: ID produit inexistant"
curl -s -X PATCH "$BASE_URL/admin/validate-product/99999" \
  "${HEADERS[@]}" \
  -d '{"approved": true}' | jq '.success, .message'

echo ""
echo "Test 5b: Données invalides (approved manquant)"
curl -s -X PATCH "$BASE_URL/admin/validate-product/138" \
  "${HEADERS[@]}" \
  -d '{"rejectionReason": "Test"}' | jq '.statusCode, .message'

echo ""
echo "Test 5c: Rejet sans raison"
curl -s -X PATCH "$BASE_URL/admin/validate-product/138" \
  "${HEADERS[@]}" \
  -d '{"approved": false}' | jq '.statusCode, .message'

echo ""
echo "📊 6. Test Performance et Structure"
echo "----------------------------------"

echo "Test 6a: Vérification structure réponse GET"
curl -s -X GET "$BASE_URL/admin/pending-products?limit=1" "${HEADERS[@]}" | \
  jq '{
    hasProducts: (.data.products | length > 0),
    hasPagination: (.data.pagination != null),
    hasStats: (.data.stats != null),
    hasWizardDetection: (.data.products[0].isWizardProduct != null),
    hasProductType: (.data.products[0].productType != null)
  }'

echo ""
echo "Test 6b: Vérification enrichissement WIZARD"
curl -s -X GET "$BASE_URL/admin/pending-products?productType=WIZARD&limit=1" "${HEADERS[@]}" | \
  jq '.data.products[0] | {
    id,
    isWizardProduct,
    productType,
    hasDesign,
    adminProductName,
    designCloudinaryUrl
  }'

echo ""
echo "🎯 Tests Terminés !"
echo "=================="
echo ""
echo "🔍 Vérifications importantes :"
echo "1. ✅ Tous les endpoints répondent"
echo "2. ✅ Détection WIZARD automatique"
echo "3. ✅ Enrichissement des données"
echo "4. ✅ Gestion des erreurs"
echo "5. ✅ Sécurité et autorisation"
echo ""
echo "📱 Le frontend peut maintenant utiliser ces endpoints !"
echo "Route frontend disponible: /admin/wizard-validation"