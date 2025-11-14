#!/bin/bash

# Script de redespliegue de emergencia para resolver problema de credenciales
# Grada Negra - Actualización crítica de credenciales MercadoPago

set -e

echo "🚀 REDESPLIEGUE EMERGENCIA - CREDENCIALES MERCADOPAGO"
echo "======================================================"

# Variables de configuración
PROJECT_ID="gradanegra-api-350907539319"
REGION="us-central1"
SERVICE_NAME="gradanegra-api"
BACKEND_DIR="../backend"

echo "📋 Configuración:"
echo "   Proyecto: $PROJECT_ID"
echo "   Región: $REGION"
echo "   Servicio: $SERVICE_NAME"
echo ""

# Confirmar ejecución
read -p "¿Ejecutar redespliegue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Redespliegue cancelado"
    exit 1
fi

echo "🔨 Iniciando redespliegue..."
echo ""

cd "$BACKEND_DIR"

# Opción 1: Redespliegue con código actualizado
echo "📦 Opción 1: Redespliegue desde fuente (CÓDIGO ACTUALIZADO)"
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --quiet \
    --set-env-vars "NODE_ENV=production" \
    --set-secrets "MERCADOPAGO_ACCESS_TOKEN_PROD=MERCADOPAGO_ACCESS_TOKEN_PROD:8,MERCADOPAGO_PUBLIC_KEY_PROD=MERCADOPAGO_PUBLIC_KEY_PROD:8,MERCADOPAGO_ACCESS_TOKEN_TEST=MERCADOPAGO_ACCESS_TOKEN_TEST:8,MERCADOPAGO_PUBLIC_KEY_TEST=MERCADOPAGO_PUBLIC_KEY_TEST:8"

# Verificar que el nuevo secreto esté configurado
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format 'value(status.url)')

echo ""
echo "✅ REDESPLIEGUE COMPLETADO"
echo "🌐 URL: $SERVICE_URL"
echo ""

# Verificar que las credenciales estén limpias
echo "🔍 Verificando credenciales..."
sleep 10

curl -s "$SERVICE_URL/api/payments/config" | jq .

echo ""
echo "🎯 Verificar que NO aparezca: '\"-n\"' en el publicKey"
echo "✅ Verificar que PSE esté habilitado en métodos de pago"
echo ""
