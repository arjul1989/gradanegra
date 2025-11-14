#!/bin/bash

# Script de deployment directo del frontend usando build local
# Grada Negra - Frontend Next.js

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY FRONTEND DIRECTO - GRADA NEGRA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variables
PROJECT_ID="gradanegra-prod"
REGION="us-central1"
SERVICE_NAME="gradanegra-frontend"
BACKEND_SERVICE="gradanegra-api"
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

# Obtener URL del backend
echo "🔍 Obteniendo URL del backend..."
BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format 'value(status.url)' 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Error: No se pudo obtener la URL del backend"
    exit 1
fi

echo "✅ Backend URL: $BACKEND_URL"
echo ""

# Leer credenciales de Firebase
FRONTEND_ENV="$FRONTEND_DIR/.env.local"
if [ ! -f "$FRONTEND_ENV" ]; then
    echo "❌ Error: No se encontró .env.local"
    exit 1
fi

FIREBASE_API_KEY=$(grep NEXT_PUBLIC_FIREBASE_API_KEY "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_AUTH_DOMAIN=$(grep NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_PROJECT_ID=$(grep NEXT_PUBLIC_FIREBASE_PROJECT_ID "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_MESSAGING_SENDER_ID=$(grep NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_APP_ID=$(grep NEXT_PUBLIC_FIREBASE_APP_ID "$FRONTEND_ENV" | cut -d '=' -f2)

echo "📋 Configuración:"
echo "   Project: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"
echo "   Backend: $BACKEND_URL"
echo ""

cd "$FRONTEND_DIR"

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf .next

# Build con variables de entorno
echo "🔨 Construyendo aplicación..."
NODE_ENV=production \
NEXT_PUBLIC_API_URL="$BACKEND_URL" \
NEXT_PUBLIC_FIREBASE_API_KEY="$FIREBASE_API_KEY" \
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$FIREBASE_AUTH_DOMAIN" \
NEXT_PUBLIC_FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$FIREBASE_STORAGE_BUCKET" \
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$FIREBASE_MESSAGING_SENDER_ID" \
NEXT_PUBLIC_FIREBASE_APP_ID="$FIREBASE_APP_ID" \
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build"
    exit 1
fi

echo "✅ Build completado"
echo ""

# Verificar que el build standalone existe
if [ ! -d ".next/standalone" ]; then
    echo "❌ Error: No se encontró el build standalone"
    exit 1
fi

echo "📦 Desplegando a Cloud Run usando Dockerfile..."

# Deploy usando Dockerfile con build args
gcloud run deploy "$SERVICE_NAME" \
    --source . \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=$BACKEND_URL,NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID" \
    --set-build-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL,NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID"

# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format 'value(status.url)')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETADO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URL del frontend: $SERVICE_URL"
echo "🔗 URL del backend: $BACKEND_URL"
echo ""
echo "🎉 ¡Aplicación desplegada exitosamente!"
echo ""