#!/bin/bash

# Script de deployment manual a Cloud Run
# Uso: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
PROJECT_ID="gradanegra-prod"
REGION="us-central1"
SERVICE_NAME="gradanegra-api"

echo "🚀 Deploying Grada Negra API to $ENVIRONMENT..."

# Validar argumento
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  echo "❌ Error: Environment must be 'staging' or 'production'"
  exit 1
fi

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/Dockerfile" ]; then
  echo "❌ Error: Must run from project root directory"
  exit 1
fi

# Configurar nombre del servicio según ambiente
if [ "$ENVIRONMENT" = "staging" ]; then
  SERVICE_NAME="$SERVICE_NAME-staging"
fi

echo "📦 Building Docker image..."
cd backend
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest .

echo "⬆️  Pushing to Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo "☁️  Deploying to Cloud Run..."
if [ "$ENVIRONMENT" = "production" ]; then
  # Production config
  gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=production,PORT=8080" \
    --memory 1Gi \
    --cpu 2 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 1 \
    --concurrency 80 \
    --project $PROJECT_ID
else
  # Staging config
  gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --set-env-vars="NODE_ENV=staging,PORT=8080" \
    --memory 512Mi \
    --cpu 1 \
    --timeout 60 \
    --max-instances 5 \
    --min-instances 0 \
    --concurrency 80 \
    --project $PROJECT_ID
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Service URL:"
gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)'
