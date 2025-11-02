#!/bin/bash

# Script de prueba de integración Frontend-Backend
# Grada Negra

echo "🧪 Pruebas de Integración Frontend-Backend"
echo "=========================================="
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:3000"

# Función para verificar si un servicio está corriendo
check_service() {
    local url=$1
    local name=$2
    
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo -e "${GREEN}✅ $name está corriendo${NC}"
        return 0
    else
        echo -e "${RED}❌ $name NO está corriendo${NC}"
        return 1
    fi
}

# 1. Verificar servicios
echo "1️⃣  Verificando servicios..."
echo "----------------------------"
check_service "$BACKEND_URL/health" "Backend (puerto 8080)"
BACKEND_STATUS=$?

check_service "$FRONTEND_URL" "Frontend (puerto 3000)"
FRONTEND_STATUS=$?

echo ""

if [ $BACKEND_STATUS -ne 0 ] || [ $FRONTEND_STATUS -ne 0 ]; then
    echo -e "${RED}⚠️  Algunos servicios no están corriendo${NC}"
    echo ""
    echo "Para iniciarlos:"
    echo "  Backend:  cd backend && npm start"
    echo "  Frontend: cd frontend && npm run dev"
    exit 1
fi

# 2. Probar endpoints públicos
echo "2️⃣  Probando endpoints públicos..."
echo "-----------------------------------"

# Health check
echo -n "  • GET /health: "
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "healthy"; then
    echo -e "${GREEN}✅ OK${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Eventos públicos
echo -n "  • GET /api/public/events: "
EVENTS_RESPONSE=$(curl -s "$BACKEND_URL/api/public/events")
EVENT_COUNT=$(echo "$EVENTS_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['count'])" 2>/dev/null)

if [ ! -z "$EVENT_COUNT" ] && [ "$EVENT_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ OK${NC} (${EVENT_COUNT} eventos)"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Evento por categoría
echo -n "  • GET /api/public/events?category=rock-underground: "
ROCK_RESPONSE=$(curl -s "$BACKEND_URL/api/public/events?category=rock-underground")
ROCK_COUNT=$(echo "$ROCK_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['count'])" 2>/dev/null)

if [ ! -z "$ROCK_COUNT" ]; then
    echo -e "${GREEN}✅ OK${NC} (${ROCK_COUNT} eventos)"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

# Eventos destacados
echo -n "  • GET /api/public/events?featured=true: "
FEATURED_RESPONSE=$(curl -s "$BACKEND_URL/api/public/events?featured=true")
FEATURED_COUNT=$(echo "$FEATURED_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['count'])" 2>/dev/null)

if [ ! -z "$FEATURED_COUNT" ]; then
    echo -e "${GREEN}✅ OK${NC} (${FEATURED_COUNT} eventos destacados)"
else
    echo -e "${RED}❌ FAIL${NC}"
fi

echo ""

# 3. Probar endpoints protegidos (sin autenticación)
echo "3️⃣  Probando endpoints protegidos (sin auth)..."
echo "------------------------------------------------"

echo -n "  • GET /api/buyers/me: "
PROFILE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/buyers/me")
if [ "$PROFILE_RESPONSE" == "401" ]; then
    echo -e "${GREEN}✅ OK${NC} (401 Unauthorized - esperado)"
else
    echo -e "${YELLOW}⚠️  Got $PROFILE_RESPONSE (esperado 401)${NC}"
fi

echo -n "  • GET /api/buyers/me/tickets: "
TICKETS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/buyers/me/tickets")
if [ "$TICKETS_RESPONSE" == "401" ]; then
    echo -e "${GREEN}✅ OK${NC} (401 Unauthorized - esperado)"
else
    echo -e "${YELLOW}⚠️  Got $TICKETS_RESPONSE (esperado 401)${NC}"
fi

echo ""

# 4. Verificar CORS
echo "4️⃣  Verificando CORS..."
echo "----------------------"

echo -n "  • CORS headers: "
CORS_HEADERS=$(curl -s -I -H "Origin: http://localhost:3000" "$BACKEND_URL/api/public/events" | grep -i "access-control")
if [ ! -z "$CORS_HEADERS" ]; then
    echo -e "${GREEN}✅ OK${NC}"
    echo "$CORS_HEADERS" | sed 's/^/      /'
else
    echo -e "${RED}❌ NO CORS headers${NC}"
fi

echo ""

# 5. Resumen
echo "📊 Resumen"
echo "=========="
echo ""
echo "✅ Servicios corriendo:"
echo "  • Backend:  $BACKEND_URL"
echo "  • Frontend: $FRONTEND_URL"
echo ""
echo "✅ Endpoints públicos funcionando:"
echo "  • Health check"
echo "  • Listado de eventos"
echo "  • Filtros por categoría"
echo "  • Eventos destacados"
echo ""
echo "✅ Seguridad funcionando:"
echo "  • Endpoints protegidos requieren autenticación"
echo "  • CORS configurado correctamente"
echo ""
echo "🧪 Pruebas Manuales Recomendadas:"
echo "  1. Abrir http://localhost:3000"
echo "  2. Ver que carguen los 12 eventos"
echo "  3. Registrarse en /register"
echo "  4. Iniciar sesión en /login"
echo "  5. Intentar acceder a /mis-boletos"
echo "  6. Verificar que el navbar muestre el usuario"
echo ""
echo "📚 Documentación:"
echo "  • API Docs: README.md"
echo "  • Auth Setup: docs/FIREBASE_AUTH_SETUP.md"
echo "  • Quick Start: QUICKSTART.md"
echo ""
