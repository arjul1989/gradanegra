#!/bin/bash

# Script de corrección completa de credenciales MercadoPago
# Ejecutar después de las correcciones manuales en GCP

set -e

echo "🔧 CORRECCIÓN COMPLETA DE CREDENCIALES MERCADOPAGO"
echo "=================================================="
echo ""

# Variables
BACKEND_DIR="../backend"
API_URL="https://gradanegra-api-350907539319.us-central1.run.app"

echo "📋 Verificando estado actual..."
echo ""

# Paso 1: Verificar configuración actual
echo "1️⃣ Verificando configuración de MercadoPago..."
RESPONSE=$(curl -s "$API_URL/api/payments/config")
echo "Respuesta actual: $RESPONSE"

if echo "$RESPONSE" | grep -q '"-n"'; then
    echo "❌ ERROR: Aún hay espacios en blanco en el publicKey"
    echo "💡 SOLUCIÓN: Ejecutar el redespliegue del backend manualmente"
    echo ""
    echo "Para redesplegar, ejecutar:"
    echo "cd $BACKEND_DIR"
    echo "gcloud run deploy gradanegra-api --source . --project=gradanegra-api-350907539319 --region=us-central1 --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --set-env-vars='NODE_ENV=production' --quiet"
    echo ""
    exit 1
else
    echo "✅ publicKey está limpio"
fi

# Paso 2: Verificar métodos de pago
echo ""
echo "2️⃣ Verificando métodos de pago..."
METHODS_RESPONSE=$(curl -s "$API_URL/api/payments/methods")
echo "Respuesta métodos: $METHODS_RESPONSE"

if echo "$METHODS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Métodos de pago cargando correctamente"
else
    echo "❌ ERROR: Error 500 en métodos de pago"
    echo "Causa probable: Backend no actualizado con credenciales limpias"
fi

# Paso 3: Verificar bancos PSE
echo ""
echo "3️⃣ Verificando bancos PSE..."
PSE_RESPONSE=$(curl -s "$API_URL/api/payments/pse-banks")
echo "Respuesta PSE: $PSE_RESPONSE"

if echo "$PSE_RESPONSE" | grep -q '"success":true' && echo "$PSE_RESPONSE" | grep -q '"banks"'; then
    BANK_COUNT=$(echo "$PSE_RESPONSE" | grep -o '"id"' | wc -l)
    echo "✅ PSE disponible con $BANK_COUNT bancos"
else
    echo "❌ ERROR: PSE no disponible"
fi

# Paso 4: Verificar health check
echo ""
echo "4️⃣ Verificando health check..."
HEALTH_RESPONSE=$(curl -s "$API_URL/health" || echo "Error")
if [[ "$HEALTH_RESPONSE" != *"Error"* ]]; then
    echo "✅ Backend funcionando correctamente"
else
    echo "❌ ERROR: Backend no responde"
fi

echo ""
echo "📊 RESUMEN FINAL:"
echo "================"

# Verificar estado general
if echo "$RESPONSE" | grep -q '"-n"'; then
    echo "❌ PROBLEMA CRÍTICO: publicKey con espacios en blanco"
    echo "⚠️ ACCIÓN REQUERIDA: Redesplegar backend manualmente"
    echo ""
    echo "🔧 PASOS PARA CORREGIR:"
    echo "1. cd $BACKEND_DIR"
    echo "2. gcloud run deploy gradanegra-api --source . --project=gradanegra-api-350907539319 --region=us-central1 --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --set-env-vars='NODE_ENV=production' --quiet"
    echo "3. Esperar 2-3 minutos para que se actualice"
    echo "4. Ejecutar este script nuevamente para verificar"
    echo ""
    echo "💡 ALTERNATIVA: Usar script deploy-backup-gcp.sh si tienes permisos"
else
    echo "✅ CREDENCIALES: Limpias y funcionando"
fi

if echo "$METHODS_RESPONSE" | grep -q '"success":true'; then
    echo "✅ MÉTODOS DE PAGO: Cargando correctamente"
else
    echo "❌ MÉTODOS DE PAGO: Error 500"
fi

if echo "$PSE_RESPONSE" | grep -q '"success":true'; then
    echo "✅ PSE: Habilitado y disponible"
else
    echo "❌ PSE: No disponible"
fi

echo ""
echo "🎯 VERIFICACIÓN MANUAL:"
echo "======================"
echo "1. Ir a: https://gradanegra-frontend-350907539319.us-central1.run.app/checkout/"
echo "2. Verificar que NO aparezca 'Cargando sistema de pagos...'"
echo "3. Verificar que PSE esté habilitado"
echo "4. Verificar que el error aparezca DEBAJO del botón de pagar"
echo ""
