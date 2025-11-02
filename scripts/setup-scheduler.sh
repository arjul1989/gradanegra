#!/bin/bash

# Setup de Cloud Scheduler para recordatorios automáticos
# Ejecuta el job cada hora para chequear eventos que necesiten recordatorios

set -e

PROJECT_ID="gradanegra-prod"
REGION="us-central1"
SERVICE_NAME="gradanegra-api"
JOB_NAME="reminders-hourly"

echo "⏰ Setting up Cloud Scheduler for reminders..."

# Obtener URL del servicio
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region $REGION \
  --project $PROJECT_ID \
  --format 'value(status.url)' 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
  echo "❌ Error: Service $SERVICE_NAME not found. Deploy the service first."
  exit 1
fi

echo "📍 Service URL: $SERVICE_URL"

# Verificar si ya existe el job
if gcloud scheduler jobs describe $JOB_NAME --project $PROJECT_ID --location $REGION &>/dev/null; then
  echo "⚠️  Job $JOB_NAME already exists. Updating..."
  
  gcloud scheduler jobs update http $JOB_NAME \
    --location $REGION \
    --project $PROJECT_ID \
    --schedule "0 * * * *" \
    --uri "$SERVICE_URL/api/jobs/webhook/reminders" \
    --http-method POST \
    --oidc-service-account-email "cloud-run-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --oidc-token-audience "$SERVICE_URL" \
    --headers "Content-Type=application/json" \
    --message-body '{"source":"cloud-scheduler"}' \
    --time-zone "America/Mexico_City"
else
  echo "✨ Creating new job..."
  
  gcloud scheduler jobs create http $JOB_NAME \
    --location $REGION \
    --project $PROJECT_ID \
    --schedule "0 * * * *" \
    --uri "$SERVICE_URL/api/jobs/webhook/reminders" \
    --http-method POST \
    --oidc-service-account-email "cloud-run-sa@$PROJECT_ID.iam.gserviceaccount.com" \
    --oidc-token-audience "$SERVICE_URL" \
    --headers "Content-Type=application/json" \
    --message-body '{"source":"cloud-scheduler"}' \
    --time-zone "America/Mexico_City" \
    --description "Envía recordatorios de eventos 24 horas antes"
fi

echo ""
echo "✅ Cloud Scheduler configured!"
echo "📅 Schedule: Every hour (0 * * * *)"
echo "🌍 Timezone: America/Mexico_City"
echo "🔗 Endpoint: $SERVICE_URL/api/jobs/webhook/reminders"
echo ""
echo "To test manually:"
echo "gcloud scheduler jobs run $JOB_NAME --location $REGION --project $PROJECT_ID"
