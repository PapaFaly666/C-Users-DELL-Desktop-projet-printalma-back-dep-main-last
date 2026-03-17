#!/bin/bash

BASE_URL="http://localhost:3004"
VENDOR_EMAIL="pf.d@zig.univ.sn"
VENDOR_PASSWORD="testpassword123"

echo "🧪 Test des endpoints du système de fonds vendeur"
echo "================================================"

# 1. Connexion vendeur
echo "📝 1. Connexion du vendeur..."
LOGIN_RESPONSE=$(curl -s -c cookies.txt -w "\n%{http_code}" -X POST \
  "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$VENDOR_EMAIL\",
    \"password\": \"$VENDOR_PASSWORD\"
  }")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo "✅ Connexion réussie"
    echo "$RESPONSE_BODY" | jq .
else
    echo "❌ Échec de la connexion (Code: $HTTP_CODE)"
    echo "$RESPONSE_BODY"
    exit 1
fi

echo ""

# 2. Récupérer les gains du vendeur
echo "💰 2. Récupération des gains du vendeur..."
EARNINGS_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  "$BASE_URL/vendor/earnings")

HTTP_CODE=$(echo "$EARNINGS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$EARNINGS_RESPONSE" | head -n -1)

echo "Code HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Gains récupérés avec succès"
    echo "$RESPONSE_BODY" | jq .
else
    echo "❌ Erreur lors de la récupération des gains"
    echo "$RESPONSE_BODY"
fi

echo ""

# 3. Récupérer les demandes de fonds du vendeur
echo "📋 3. Récupération des demandes de fonds..."
REQUESTS_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  "$BASE_URL/vendor/funds-requests")

HTTP_CODE=$(echo "$REQUESTS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REQUESTS_RESPONSE" | head -n -1)

echo "Code HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Demandes récupérées avec succès"
    echo "$RESPONSE_BODY" | jq .
else
    echo "❌ Erreur lors de la récupération des demandes"
    echo "$RESPONSE_BODY"
fi

echo ""

# 4. Créer une nouvelle demande de fonds
echo "➕ 4. Création d'une nouvelle demande de fonds..."
CREATE_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" -X POST \
  "$BASE_URL/vendor/funds-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 150.00,
    "description": "Demande de test via script",
    "paymentMethod": "WAVE",
    "phoneNumber": "+221771234567"
  }')

HTTP_CODE=$(echo "$CREATE_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$CREATE_RESPONSE" | head -n -1)

echo "Code HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ] || [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Demande créée avec succès"
    REQUEST_ID=$(echo "$RESPONSE_BODY" | jq -r '.data.id')
    echo "ID de la demande: $REQUEST_ID"
    echo "$RESPONSE_BODY" | jq .
else
    echo "❌ Erreur lors de la création de la demande"
    echo "$RESPONSE_BODY"
fi

echo ""

# 5. Récupérer les détails d'une demande
if [ ! -z "$REQUEST_ID" ] && [ "$REQUEST_ID" != "null" ]; then
    echo "🔍 5. Récupération des détails de la demande $REQUEST_ID..."
    DETAILS_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" \
      "$BASE_URL/vendor/funds-requests/$REQUEST_ID")

    HTTP_CODE=$(echo "$DETAILS_RESPONSE" | tail -n1)
    RESPONSE_BODY=$(echo "$DETAILS_RESPONSE" | head -n -1)

    echo "Code HTTP: $HTTP_CODE"
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Détails récupérés avec succès"
        echo "$RESPONSE_BODY" | jq .
    else
        echo "❌ Erreur lors de la récupération des détails"
        echo "$RESPONSE_BODY"
    fi
else
    echo "⏭️ 5. Test des détails ignoré (pas d'ID de demande)"
fi

echo ""

# 6. Test des endpoints admin (nécessite d'être admin)
echo "👑 6. Test des endpoints admin..."
echo "⚠️  Note: Ces tests peuvent échouer si l'utilisateur n'est pas admin"

# Statistiques admin
ADMIN_STATS_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  "$BASE_URL/admin/funds-requests/statistics")

HTTP_CODE=$(echo "$ADMIN_STATS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ADMIN_STATS_RESPONSE" | head -n -1)

echo "📊 Statistiques admin - Code HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Statistiques récupérées avec succès"
    echo "$RESPONSE_BODY" | jq .
else
    echo "❌ Erreur (normal si pas admin): $RESPONSE_BODY"
fi

echo ""

# Toutes les demandes (admin)
ALL_REQUESTS_RESPONSE=$(curl -s -b cookies.txt -w "\n%{http_code}" \
  "$BASE_URL/admin/funds-requests")

HTTP_CODE=$(echo "$ALL_REQUESTS_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$ALL_REQUESTS_RESPONSE" | head -n -1)

echo "📋 Toutes les demandes (admin) - Code HTTP: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Demandes récupérées avec succès"
    echo "$RESPONSE_BODY" | jq .
else
    echo "❌ Erreur (normal si pas admin): $RESPONSE_BODY"
fi

echo ""
echo "🎉 Tests terminés! Suppression du fichier cookies..."
rm -f cookies.txt

echo ""
echo "📝 Résumé des tests:"
echo "- Connexion vendeur: Testé"
echo "- Récupération des gains: Testé"
echo "- Liste des demandes: Testé"
echo "- Création de demande: Testé"
echo "- Détails de demande: Testé"
echo "- Endpoints admin: Testés (peuvent échouer selon les permissions)"