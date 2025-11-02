#!/bin/bash

# Script para probar la autenticación con el backend
# Grada Negra - November 2025

echo "🧪 Probando autenticación con el backend"
echo "=========================================="
echo ""

# Probar endpoint público (no requiere auth)
echo "1️⃣ Probando endpoint público /api/public/events..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8080/api/public/events)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Endpoint público funcionando"
    echo "   Eventos encontrados: $(echo "$BODY" | jq -r '.count // 0')"
else
    echo "❌ Error en endpoint público (HTTP $HTTP_CODE)"
fi

echo ""

# Probar endpoint protegido sin token (debe dar 401)
echo "2️⃣ Probando endpoint protegido sin token /api/buyers/me/tickets..."
RESPONSE=$(curl -s -w "\n%{http_code}" http://localhost:8080/api/buyers/me/tickets)
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "401" ]; then
    echo "✅ Endpoint protegido correctamente (401 sin token)"
else
    echo "⚠️ Respuesta inesperada (HTTP $HTTP_CODE)"
    echo "   Body: $BODY"
fi

echo ""
echo "📋 Diagnóstico:"
echo ""
echo "Si ves estos resultados:"
echo "  ✅ Público: 200 → Backend funcionando"
echo "  ✅ Protegido: 401 → Seguridad funcionando"
echo ""
echo "El problema es que el token de Firebase no se está enviando o no es válido."
echo ""
echo "Posibles causas:"
echo "  1. El usuario no está completamente autenticado en Firebase"
echo "  2. El token de Firebase expiró"
echo "  3. El backend no está configurado para validar tokens de Firebase"
echo ""
echo "Solución:"
echo "  1. Cierra sesión en http://localhost:3000"
echo "  2. Vuelve a iniciar sesión"
echo "  3. Abre la consola del navegador (F12)"
echo "  4. Ve a la pestaña 'Network'"
echo "  5. Navega a /mis-boletos"
echo "  6. Busca la petición a /api/buyers/me/tickets"
echo "  7. Verifica que tenga el header 'Authorization: Bearer ...'"
echo ""
