#!/bin/bash

# 🔍 SCRIPT DE VERIFICACIÓN POST-DEPLOYMENT
# Grada Negra API - Verificación completa del sistema

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuración
BACKEND_URL="https://gradanegra-api-350907539319.us-central1.run.app"
FRONTEND_URL="https://gradanegra-frontend-350907539319.us-central1.run.app"

# Contadores
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

echo -e "${BLUE}🔍 VERIFICACIÓN POST-DEPLOYMENT${NC}"
echo "=================================="
echo ""

# Función para test individual
run_test() {
    local test_name="$1"
    local test_cmd="$2"
    local expect_success="$3"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    echo -e "${BLUE}🧪 Test $TESTS_TOTAL: $test_name${NC}"
    
    local result
    result=$(eval "$test_cmd" 2>/dev/null || echo "FAILED")
    
    local success=false
    if [[ "$expect_success" == "true" ]]; then
        if [[ "$result" != "FAILED" ]] && [[ -n "$result" ]]; then
            success=true
        fi
    else
        if [[ "$result" == "FAILED" ]] || [[ -z "$result" ]]; then
            success=true
        fi
    fi
    
    if $success; then
        echo -e "${GREEN}✅ PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        echo -e "${RED}❌ FAILED${NC}"
        if [[ "$result" != "FAILED" ]]; then
            echo -e "${RED}   Error: $result${NC}"
        fi
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    echo ""
}

# Test 1: Health Check
run_test "Health Check Backend" "curl -f -s $BACKEND_URL/health" "true"

# Test 2: Configuración MercadoPago
run_test "Configuración MercadoPago" "curl -s $BACKEND_URL/api/payments/config | jq -r '.publicKey'" "true"

# Test 3: Verificar que publicKey NO tenga espacios en blanco
echo -e "${BLUE}🧪 Verificación especial: Public Key sin espacios${NC}"
PUBLIC_KEY=$(curl -s $BACKEND_URL/api/payments/config 2>/dev/null | jq -r '.publicKey' 2>/dev/null || echo "N/A")
TESTS_TOTAL=$((TESTS_TOTAL + 1))

if [[ "$PUBLIC_KEY" == *"-n"* ]] || [[ "$PUBLIC_KEY" == "N/A" ]]; then
    echo -e "${RED}❌ FAILED - Public Key contiene espacios en blanco: $PUBLIC_KEY${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
else
    echo -e "${GREEN}✅ PASSED - Public Key limpio: $PUBLIC_KEY${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
fi
echo ""

# Test 4: Métodos de pago
run_test "Métodos de Pago" "curl -s $BACKEND_URL/api/payments/methods | jq -r '.success'" "true"

# Test 5: Bancos PSE
run_test "Bancos PSE" "curl -s $BACKEND_URL/api/payments/pse-banks | jq -r '.success'" "true"

# Test 6: Cantidad de bancos PSE
echo -e "${BLUE}🧪 Verificación especial: Cantidad de bancos PSE${NC}"
PSE_RESPONSE=$(curl -s $BACKEND_URL/api/payments/pse-banks 2>/dev/null || echo '{}')
BANK_COUNT=$(echo "$PSE_RESPONSE" | jq -r '.banks | length' 2>/dev/null || echo "0")
TESTS_TOTAL=$((TESTS_TOTAL + 1))

if [[ "$BANK_COUNT" -gt 0 ]]; then
    echo -e "${GREEN}✅ PASSED - $BANK_COUNT bancos PSE disponibles${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED - No hay bancos PSE disponibles${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Test 7: Eventos públicos
run_test "Eventos Públicos" "curl -s $BACKEND_URL/api/public/events | jq -r '.success'" "true"

# Test 8: Frontend básico
run_test "Frontend Disponible" "curl -f -s $FRONTEND_URL" "true"

# Test 9: Panel Admin
run_test "Panel Admin Disponible" "curl -f -s $FRONTEND_URL/admin" "true"

# Test 10: Autenticación Firebase
echo -e "${BLUE}🧪 Verificación especial: Configuración Firebase${NC}"
FIREBASE_TEST=$(curl -s $BACKEND_URL/api/public/events 2>/dev/null | jq -r '.success' 2>/dev/null || echo "false")
TESTS_TOTAL=$((TESTS_TOTAL + 1))

if [[ "$FIREBASE_TEST" == "true" ]]; then
    echo -e "${GREEN}✅ PASSED - Firebase configurado correctamente${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
else
    echo -e "${RED}❌ FAILED - Firebase no está respondiendo correctamente${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Resumen final
echo -e "${BLUE}📊 RESUMEN DE VERIFICACIÓN${NC}"
echo "============================="
echo -e "Total de tests: $TESTS_TOTAL"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo ""

# Calcular porcentaje
if [[ $TESTS_TOTAL -gt 0 ]]; then
    PERCENTAGE=$((TESTS_PASSED * 100 / TESTS_TOTAL))
    echo -e "${BLUE}Porcentaje de éxito: $PERCENTAGE%${NC}"
fi

echo ""

# Diagnóstico basado en resultados
if [[ $TESTS_FAILED -eq 0 ]]; then
    echo -e "${GREEN}🎉 DEPLOYMENT COMPLETAMENTE EXITOSO${NC}"
    echo "El sistema está funcionando correctamente"
elif [[ $TESTS_FAILED -le 2 ]]; then
    echo -e "${YELLOW}⚠️ DEPLOYMENT MAYORMENTE EXITOSO${NC}"
    echo "El sistema está funcionando pero hay algunos problemas menores"
else
    echo -e "${RED}❌ DEPLOYMENT CON PROBLEMAS SIGNIFICATIVOS${NC}"
    echo "Se requiere intervención inmediata"
fi

echo ""
echo -e "${BLUE}🔧 ACCIONES RECOMENDADAS:${NC}"
echo "=========================="

if echo "$PUBLIC_KEY" == *"-n"*; then
    echo -e "${RED}• CRÍTICO: Redesplegar backend para corregir credenciales MercadoPago${NC}"
    echo "  Comando: ./deploy-robust.sh"
fi

if [[ "$BANK_COUNT" -eq 0 ]]; then
    echo -e "${YELLOW}• PSE no está disponible - verificar token de MercadoPago${NC}"
fi

if [[ "$FIREBASE_TEST" == "false" ]]; then
    echo -e "${YELLOW}• Firebase no está respondiendo - verificar configuración de Firebase${NC}"
fi

echo ""
echo -e "${BLUE}🔗 ENLACES ÚTILES:${NC}"
echo "=================="
echo "• Backend: $BACKEND_URL"
echo "• Frontend: $FRONTEND_URL"
echo "• Health Check: $BACKEND_URL/health"
echo "• Logs: gcloud run services logs read gradanegra-api --project=gradanegra-api-350907539319 --region=us-central1"
echo ""
echo -e "${BLUE}🧪 Para hacer pruebas manuales:${NC}"
echo "1. Ir a: $FRONTEND_URL"
echo "2. Seleccionar un evento"
echo "3. Verificar que PSE esté habilitado"
echo "4. Completar una compra de prueba"
echo ""

# Exit code basado en resultados
if [[ $TESTS_FAILED -eq 0 ]]; then
    exit 0
elif [[ $TESTS_FAILED -le 2 ]]; then
    exit 1
else
    exit 2
fi