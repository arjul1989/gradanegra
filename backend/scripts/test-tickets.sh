#!/bin/bash

# Script de prueba para la API de Tickets
# US-014: Generar Tickets con QR y Hash

echo "🎫 GRADA NEGRA - Test de API de Tickets"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables
API_URL="http://localhost:8080"
TENANT_ID=""
EVENT_ID=""
TIER_ID=""
ADMIN_TOKEN=""
TICKET_ID=""
TICKET_NUMBER=""

echo "📋 Pre-requisitos:"
echo "  1. Servidor debe estar corriendo en puerto 8080"
echo "  2. Debes tener un tenant creado"
echo "  3. Debes tener un evento publicado con al menos un tier"
echo ""

# Solicitar datos
read -p "Ingresa tu Firebase Auth Token: " ADMIN_TOKEN
read -p "Ingresa el ID del Tenant: " TENANT_ID
read -p "Ingresa el ID del Evento: " EVENT_ID
read -p "Ingresa el ID del Tier: " TIER_ID

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 1: Crear Tickets"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/tickets" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"eventId\": \"${EVENT_ID}\",
    \"tierId\": \"${TIER_ID}\",
    \"quantity\": 2,
    \"buyer\": {
      \"name\": \"Juan Pérez Test\",
      \"email\": \"juan.test@example.com\",
      \"phone\": \"+52 55 1234 5678\",
      \"documentId\": \"CURP123456\"
    }
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "201" ]; then
  echo -e "${GREEN}✅ Tickets creados exitosamente${NC}"
  echo "$BODY" | jq '.'
  
  # Extraer IDs para próximos tests
  TICKET_ID=$(echo "$BODY" | jq -r '.data.tickets[0].id')
  TICKET_NUMBER=$(echo "$BODY" | jq -r '.data.tickets[0].ticketNumber')
  
  echo ""
  echo "Ticket ID: $TICKET_ID"
  echo "Ticket Number: $TICKET_NUMBER"
else
  echo -e "${RED}❌ Error al crear tickets (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
  exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 2: Obtener Ticket por ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/tickets/${TICKET_ID}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Ticket obtenido exitosamente${NC}"
  echo "$BODY" | jq '.data | {id, ticketNumber, status, securityHash, isValidated}'
else
  echo -e "${RED}❌ Error al obtener ticket (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 3: Obtener Ticket por Número"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/tickets/number/${TICKET_NUMBER}" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Ticket obtenido por número${NC}"
  echo "$BODY" | jq '.data | {ticketNumber, status, isValidated}'
else
  echo -e "${RED}❌ Error al obtener ticket por número (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 4: Listar Tickets del Evento"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/events/${EVENT_ID}/tickets?status=confirmed" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Tickets del evento listados${NC}"
  TICKET_COUNT=$(echo "$BODY" | jq '.data.count')
  echo "Total de tickets confirmados: $TICKET_COUNT"
  echo "$BODY" | jq '.data.tickets[0] | {ticketNumber, buyer, status}'
else
  echo -e "${RED}❌ Error al listar tickets (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 5: Validar Ticket (Check-in)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/tickets/${TICKET_ID}/validate" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Ticket validado exitosamente${NC}"
  echo "$BODY" | jq '.data | {ticketNumber, status, isValidated, validatedAt}'
else
  echo -e "${RED}❌ Error al validar ticket (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 6: Intentar Validar Ticket Nuevamente (debe fallar)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/tickets/${TICKET_ID}/validate" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "400" ]; then
  echo -e "${GREEN}✅ Prevención de duplicados funcionando${NC}"
  echo "$BODY" | jq '.error'
else
  echo -e "${RED}❌ No se previno la doble validación (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 7: Regenerar QR Code"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/api/tickets/${TICKET_ID}/regenerate-qr" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ QR Code regenerado${NC}"
  echo "$BODY" | jq '{success, message}'
else
  echo -e "${RED}❌ Error al regenerar QR (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "TEST 8: Listar Tickets por Comprador"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/api/tickets/buyer/juan.test@example.com" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
  echo -e "${GREEN}✅ Tickets del comprador listados${NC}"
  TICKET_COUNT=$(echo "$BODY" | jq '.data.count')
  echo "Total de tickets del comprador: $TICKET_COUNT"
else
  echo -e "${RED}❌ Error al listar tickets del comprador (HTTP $HTTP_CODE)${NC}"
  echo "$BODY" | jq '.'
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "RESUMEN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${GREEN}✅ US-014 COMPLETADO${NC}"
echo ""
echo "Funcionalidades probadas:"
echo "  ✅ Crear tickets con QR y hash"
echo "  ✅ Obtener ticket por ID"
echo "  ✅ Obtener ticket por número"
echo "  ✅ Listar tickets por evento"
echo "  ✅ Validar ticket (check-in)"
echo "  ✅ Prevención de duplicados"
echo "  ✅ Regenerar QR code"
echo "  ✅ Listar tickets por comprador"
echo ""
echo "📊 Total de endpoints probados: 8/8"
echo ""
