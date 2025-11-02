#!/bin/bash

# Deploy simplificado a Cloud Run usando Application Default Credentials
# No requiere serviceAccountKey.json para development

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

# Verificar autenticación
echo "🔐 Checking authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
  echo "❌ Not authenticated. Run: gcloud auth login"
  exit 1
fi

# Configurar nombre del servicio según ambiente
if [ "$ENVIRONMENT" = "staging" ]; then
  SERVICE_NAME="$SERVICE_NAME-staging"
  MEMORY="512Mi"
  CPU="1"
  MIN_INSTANCES="0"
  MAX_INSTANCES="5"
else
  MEMORY="1Gi"
  CPU="2"
  MIN_INSTANCES="0"
  MAX_INSTANCES="10"
fi

echo "📦 Building Docker image..."
cd backend
docker build -t gcr.io/$PROJECT_ID/$SERVICE_NAME:latest -f Dockerfile .

echo "⬆️  Pushing to Container Registry..."
docker push gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

echo "☁️  Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=$ENVIRONMENT,PORT=8080,FIREBASE_PROJECT_ID=$PROJECT_ID,GCS_BUCKET_NAME=gradanegra-prod-tickets" \
  --memory $MEMORY \
  --cpu $CPU \
  --timeout 300 \
  --max-instances $MAX_INSTANCES \
  --min-instances $MIN_INSTANCES \
  --concurrency 80 \
  --service-account cloud-run-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --project $PROJECT_ID

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔗 Service URL:"
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)')
echo "$SERVICE_URL"

echo ""
echo "🧪 Testing health endpoint..."
sleep 5
if curl -f -s "$SERVICE_URL/health" > /dev/null; then
  echo "✅ Health check passed!"
else
  echo "⚠️  Health check failed (service may still be starting...)"
fi

echo ""
echo "📋 Useful commands:"
echo "  View logs:  gcloud run services logs tail $SERVICE_NAME --region $REGION --project $PROJECT_ID"
echo "  Delete:     gcloud run services delete $SERVICE_NAME --region $REGION --project $PROJECT_ID"
