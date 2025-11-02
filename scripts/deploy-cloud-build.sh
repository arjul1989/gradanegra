#!/bin/bash

# Deploy usando Cloud Build (no requiere Docker local)

set -e

ENVIRONMENT=${1:-production}
PROJECT_ID="gradanegra-prod"
REGION="us-central1"
SERVICE_NAME="gradanegra-api"

echo "🚀 Deploying Grada Negra API to $ENVIRONMENT using Cloud Build..."

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

echo "📦 Building image with Cloud Build..."
cd backend
gcloud builds submit \
  --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
  --project $PROJECT_ID \
  --timeout=10m

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
  curl -s "$SERVICE_URL/health" | jq . || curl -s "$SERVICE_URL/health"
else
  echo "⚠️  Health check failed (service may still be starting...)"
fi

echo ""
echo "📋 Next steps:"
echo "  1. Test API:    curl $SERVICE_URL/health"
echo "  2. View logs:   gcloud run services logs tail $SERVICE_NAME --region $REGION --project $PROJECT_ID"
echo "  3. Setup reminders: ./scripts/setup-scheduler.sh"
