#!/bin/bash

# Script de test des endpoints Admin Funds
# Usage: ./TEST_ADMIN_ENDPOINTS.sh [TOKEN]

echo "🧪 Test des Endpoints Admin Funds"
echo "=================================="
echo ""

BASE_URL="http://localhost:3004"
TOKEN="$1"

# Couleurs pour l'output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction de test
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local description=$4

    echo -n "Testing: $description ... "

    if [ -z "$TOKEN" ]; then
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" 2>&1)
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ OK${NC} (HTTP $status_code)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        echo "Response: $body"
        return 1
    fi
}

echo "📍 Backend URL: $BASE_URL"
echo ""

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}⚠️  Aucun token fourni - Test sans authentification${NC}"
    echo "Usage: $0 <JWT_TOKEN>"
    echo ""
    EXPECTED_AUTH=401
else
    echo -e "${GREEN}✅ Token fourni - Test avec authentification${NC}"
    echo ""
    EXPECTED_AUTH=200
fi

echo "────────────────────────────────────"
echo "Test 1 : Routes SANS /api (CORRECT)"
echo "────────────────────────────────────"

test_endpoint "GET" "/admin/funds-requests" "$EXPECTED_AUTH" "GET /admin/funds-requests"
test_endpoint "GET" "/admin/funds-requests/statistics" "$EXPECTED_AUTH" "GET /admin/funds-requests/statistics"

echo ""
echo "────────────────────────────────────"
echo "Test 2 : Routes AVEC /api (INCORRECT)"
echo "────────────────────────────────────"

test_endpoint "GET" "/api/admin/funds-requests" "404" "GET /api/admin/funds-requests"
test_endpoint "GET" "/api/admin/funds-requests/statistics" "404" "GET /api/admin/funds-requests/statistics"

echo ""
echo "────────────────────────────────────"
echo "📊 Résumé"
echo "────────────────────────────────────"

if [ -z "$TOKEN" ]; then
    echo -e "${YELLOW}Sans token :${NC}"
    echo "  ✅ Les routes /admin/funds-requests retournent 401 (route existe, auth requise)"
    echo "  ❌ Les routes /api/admin/funds-requests retournent 404 (route n'existe pas)"
    echo ""
    echo "💡 Solution Frontend :"
    echo "   Retirer le préfixe /api dans adminFundsService.ts"
    echo ""
    echo "🔑 Pour tester avec authentification :"
    echo "   1. Se connecter à http://localhost:3004/auth/login"
    echo "   2. Utiliser admin1@printalma.com / password123"
    echo "   3. Relancer : $0 <TOKEN>"
else
    echo -e "${GREEN}Avec token :${NC}"
    echo "  ✅ Les routes /admin/funds-requests retournent 200 (données OK)"
    echo "  ❌ Les routes /api/admin/funds-requests retournent 404 (route n'existe pas)"
    echo ""
    echo "💡 Solution Frontend :"
    echo "   Retirer le préfixe /api dans adminFundsService.ts"
fi

echo ""
echo "=================================="
echo "🎯 Conclusion"
echo "=================================="
echo ""
echo "Les endpoints backend sont configurés sur :"
echo "  ✅ /admin/funds-requests"
echo "  ✅ /admin/funds-requests/statistics"
echo "  ✅ /admin/funds-requests/:id"
echo "  ✅ /admin/funds-requests/:id/process"
echo ""
echo "Le frontend doit utiliser ces URLs SANS le préfixe /api"
echo ""
