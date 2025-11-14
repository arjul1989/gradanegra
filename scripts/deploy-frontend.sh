#!/bin/bash

# Script de deployment del frontend a Cloud Run
# Grada Negra - Frontend Next.js

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY FRONTEND - GRADA NEGRA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variables
PROJECT_ID="gradanegra-prod"
REGION="us-central1"
SERVICE_NAME="gradanegra-frontend"
BACKEND_SERVICE="gradanegra-api"
FRONTEND_DIR="../frontend"

# Verificar que estamos en el directorio correcto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Obtener URL del backend
echo "🔍 Obteniendo URL del backend..."
BACKEND_URL=$(gcloud run services describe "$BACKEND_SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format 'value(status.url)' 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Error: No se pudo obtener la URL del backend"
    echo "   Verifica que el backend esté desplegado primero"
    exit 1
fi

echo "✅ Backend URL: $BACKEND_URL"
echo ""

# Leer credenciales de Firebase del .env.local
FRONTEND_ENV="$FRONTEND_DIR/.env.local"
if [ ! -f "$FRONTEND_ENV" ]; then
    echo "❌ Error: No se encontró .env.local en el frontend"
    exit 1
fi

# Extraer variables de Firebase
FIREBASE_API_KEY=$(grep NEXT_PUBLIC_FIREBASE_API_KEY "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_AUTH_DOMAIN=$(grep NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_PROJECT_ID=$(grep NEXT_PUBLIC_FIREBASE_PROJECT_ID "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_MESSAGING_SENDER_ID=$(grep NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_APP_ID=$(grep NEXT_PUBLIC_FIREBASE_APP_ID "$FRONTEND_ENV" | cut -d '=' -f2)

echo "📋 Configuración:"
echo "   Project ID: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"
echo "   Backend: $BACKEND_URL"
echo "   Firebase Project: $FIREBASE_PROJECT_ID"
echo ""

# Confirmar deployment (skip si AUTO_DEPLOY está configurado)
if [ -z "$AUTO_DEPLOY" ]; then
    read -p "¿Continuar con el deployment? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelado"
        exit 1
    fi
    echo ""
fi

echo "🔨 Construyendo aplicación localmente..."
echo ""

# Cambiar al directorio del frontend
cd "$FRONTEND_DIR"

# Limpiar build anterior
rm -rf .next

# Build local con todas las variables de entorno
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
    echo "❌ Error en el build local"
    exit 1
fi

echo ""
echo "✅ Build local completado"
echo ""
echo "📦 Desplegando a Cloud Run..."
echo ""

# Deploy usando gcloud con build args
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
    --quiet \
    --set-env-vars "\
NODE_ENV=production,\
NEXT_PUBLIC_API_URL=$BACKEND_URL,\
NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID,\
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID" \
    --build-env-vars "\
NEXT_PUBLIC_API_URL=$BACKEND_URL,\
NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY,\
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN,\
NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,\
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET,\
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID,\
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID"

# Obtener la URL del servicio
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
echo "📊 Ver logs:"
echo "   gcloud run services logs read $SERVICE_NAME --project $PROJECT_ID --region $REGION"
echo ""
echo "🎉 ¡Aplicación desplegada exitosamente!"
echo ""
