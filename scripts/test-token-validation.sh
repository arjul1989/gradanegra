#!/bin/bash

# Script para probar la validación de tokens de Firebase

echo "🔐 Prueba de validación de tokens de Firebase"
echo "=============================================="
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Instrucciones:${NC}"
echo "1. Abre el navegador en http://localhost:3000"
echo "2. Inicia sesión con Google o email/password"
echo "3. Abre las DevTools (F12)"
echo "4. Ve a la pestaña Console"
echo "5. Busca el mensaje que dice: '🔐 Token added to request: ...'"
echo "6. Copia el token completo (sin el prefijo '🔐 Token added to request: ')"
echo "7. Pégalo aquí:"
echo ""

read -p "Token de Firebase: " FIREBASE_TOKEN

if [ -z "$FIREBASE_TOKEN" ]; then
  echo -e "${RED}❌ No se proporcionó ningún token${NC}"
  exit 1
fi

echo ""
echo -e "${YELLOW}Probando el token con el backend...${NC}"
echo ""

# Test 1: Endpoint protegido con token
echo "📝 Test 1: GET /api/buyers/me (con token)"
RESPONSE=$(curl -s -w "\n%{http_code}" -X GET \
  "http://localhost:8080/api/buyers/me" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo -e "${GREEN}✅ Token válido! (HTTP 200)${NC}"
  echo ""
  echo "Datos del usuario:"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo -e "${GREEN}🎉 ¡La autenticación está funcionando correctamente!${NC}"
  echo ""
  echo "Ahora puedes:"
  echo "1. Navegar a http://localhost:3000/mis-boletos"
  echo "2. Ver tu perfil en http://localhost:3000/perfil"
  echo "3. Los endpoints protegidos deberían funcionar sin errores"
elif [ "$HTTP_CODE" -eq 401 ]; then
  echo -e "${RED}❌ Token inválido o expirado (HTTP 401)${NC}"
  echo ""
  echo "Respuesta del servidor:"
  echo "$BODY"
  echo ""
  echo -e "${YELLOW}Posibles causas:${NC}"
  echo "1. El token ha expirado (prueba cerrando sesión y volviendo a entrar)"
  echo "2. El token no es válido"
  echo "3. Las credenciales de Firebase en el backend no coinciden con el frontend"
  echo ""
  echo -e "${YELLOW}Solución:${NC}"
  echo "1. Cierra sesión en el frontend"
  echo "2. Vuelve a iniciar sesión"
  echo "3. Copia un nuevo token y prueba de nuevo"
else
  echo -e "${RED}❌ Error inesperado (HTTP $HTTP_CODE)${NC}"
  echo ""
  echo "Respuesta del servidor:"
  echo "$BODY"
fi

echo ""
echo "=============================================="
echo ""

# Test 2: Mis boletos
echo "📝 Test 2: GET /api/buyers/me/tickets (con token)"
RESPONSE2=$(curl -s -w "\n%{http_code}" -X GET \
  "http://localhost:8080/api/buyers/me/tickets" \
  -H "Authorization: Bearer $FIREBASE_TOKEN" \
  -H "Content-Type: application/json")

HTTP_CODE2=$(echo "$RESPONSE2" | tail -n 1)
BODY2=$(echo "$RESPONSE2" | sed '$d')

if [ "$HTTP_CODE2" -eq 200 ]; then
  echo -e "${GREEN}✅ Endpoint de tickets funcionando (HTTP 200)${NC}"
  echo ""
  TICKET_COUNT=$(echo "$BODY2" | jq 'length' 2>/dev/null)
  if [ -n "$TICKET_COUNT" ]; then
    echo "Número de boletos: $TICKET_COUNT"
  fi
  echo ""
elif [ "$HTTP_CODE2" -eq 401 ]; then
  echo -e "${RED}❌ Error de autenticación (HTTP 401)${NC}"
else
  echo -e "${YELLOW}⚠️  HTTP $HTTP_CODE2${NC}"
fi

echo ""
echo "=============================================="
echo ""
