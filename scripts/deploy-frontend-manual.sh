#!/bin/bash

# Script de deployment manual del frontend
# Construye la imagen localmente y la sube a GCR

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY FRONTEND MANUAL - GRADA NEGRA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variables
PROJECT_ID="gradanegra-prod"
REGION="us-central1"
SERVICE_NAME="gradanegra-frontend"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"
TAG="v$(date +%Y%m%d-%H%M%S)"
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../frontend" && pwd)"

# Obtener URL del backend
echo "🔍 Obteniendo URL del backend..."
BACKEND_URL=$(gcloud run services describe gradanegra-api \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format 'value(status.url)' 2>/dev/null)

if [ -z "$BACKEND_URL" ]; then
    echo "❌ Error: No se pudo obtener la URL del backend"
    exit 1
fi

echo "✅ Backend URL: $BACKEND_URL"

# Leer credenciales de Firebase
FRONTEND_ENV="$FRONTEND_DIR/.env.local"
FIREBASE_API_KEY=$(grep NEXT_PUBLIC_FIREBASE_API_KEY "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_AUTH_DOMAIN=$(grep NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_PROJECT_ID=$(grep NEXT_PUBLIC_FIREBASE_PROJECT_ID "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_MESSAGING_SENDER_ID=$(grep NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID "$FRONTEND_ENV" | cut -d '=' -f2)
FIREBASE_APP_ID=$(grep NEXT_PUBLIC_FIREBASE_APP_ID "$FRONTEND_ENV" | cut -d '=' -f2)

echo "📋 Imagen: $IMAGE_NAME:$TAG"
echo ""

cd "$FRONTEND_DIR"

# Construir imagen Docker localmente
echo "🔨 Construyendo imagen Docker..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL="$BACKEND_URL" \
  --build-arg NEXT_PUBLIC_FIREBASE_API_KEY="$FIREBASE_API_KEY" \
  --build-arg NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="$FIREBASE_AUTH_DOMAIN" \
  --build-arg NEXT_PUBLIC_FIREBASE_PROJECT_ID="$FIREBASE_PROJECT_ID" \
  --build-arg NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="$FIREBASE_STORAGE_BUCKET" \
  --build-arg NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="$FIREBASE_MESSAGING_SENDER_ID" \
  --build-arg NEXT_PUBLIC_FIREBASE_APP_ID="$FIREBASE_APP_ID" \
  -t "$IMAGE_NAME:$TAG" \
  -t "$IMAGE_NAME:latest" \
  .

if [ $? -ne 0 ]; then
    echo "❌ Error al construir la imagen"
    exit 1
fi

echo "✅ Imagen construida"
echo ""

# Subir imagen a GCR
echo "📤 Subiendo imagen a Google Container Registry..."
docker push "$IMAGE_NAME:$TAG"
docker push "$IMAGE_NAME:latest"

echo "✅ Imagen subida"
echo ""

# Desplegar a Cloud Run
echo "🚀 Desplegando a Cloud Run..."
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME:$TAG" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --platform managed \
    --allow-unauthenticated \
    --port 3000 \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --set-env-vars "NODE_ENV=production,NEXT_PUBLIC_API_URL=$BACKEND_URL,NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY,NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN,NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET,NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID,NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID"

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