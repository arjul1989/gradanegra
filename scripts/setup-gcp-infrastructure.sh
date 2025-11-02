#!/bin/bash

# Setup completo de infraestructura en Google Cloud
# Este script debe ejecutarse UNA VEZ antes del primer deploy

set -e

PROJECT_ID="gradanegra-prod"
REGION="us-central1"
SERVICE_ACCOUNT_NAME="cloud-run-sa"

echo "🏗️  Setting up Google Cloud infrastructure..."
echo "📍 Project: $PROJECT_ID"
echo "📍 Region: $REGION"
echo ""

# 1. Habilitar APIs necesarias
echo "1️⃣  Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  containerregistry.googleapis.com \
  --project $PROJECT_ID

echo "✅ APIs enabled"

# 2. Crear Service Account para Cloud Run
echo ""
echo "2️⃣  Creating Service Account..."

if gcloud iam service-accounts describe $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com --project $PROJECT_ID &>/dev/null; then
  echo "⚠️  Service account already exists"
else
  gcloud iam service-accounts create $SERVICE_ACCOUNT_NAME \
    --display-name "Cloud Run Service Account" \
    --description "Service account for Grada Negra API on Cloud Run" \
    --project $PROJECT_ID
  
  echo "✅ Service account created"
fi

# 3. Asignar roles necesarios
echo ""
echo "3️⃣  Assigning IAM roles..."

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/datastore.user" \
  --condition=None

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer" \
  --condition=None

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --condition=None

echo "✅ IAM roles assigned"

# 4. Configurar secrets en Secret Manager
echo ""
echo "4️⃣  Setting up Secret Manager..."
echo "⚠️  You need to manually create these secrets:"
echo ""
echo "   For Firebase Private Key:"
echo "   gcloud secrets create FIREBASE_PRIVATE_KEY \\"
echo "     --data-file=backend/config/serviceAccountKey.json \\"
echo "     --project=$PROJECT_ID"
echo ""
echo "   For Resend API Key:"
echo "   echo -n 'YOUR_RESEND_API_KEY' | gcloud secrets create RESEND_API_KEY \\"
echo "     --data-file=- \\"
echo "     --project=$PROJECT_ID"
echo ""

# 5. Información para GitHub Actions
echo ""
echo "5️⃣  GitHub Actions Setup"
echo "   To enable CI/CD, create these GitHub Secrets:"
echo ""
echo "   GCP_SA_KEY:"
echo "   - Go to: IAM & Admin > Service Accounts"
echo "   - Create key for: $SERVICE_ACCOUNT_NAME@$PROJECT_ID.iam.gserviceaccount.com"
echo "   - Download JSON and add to GitHub Secrets as 'GCP_SA_KEY'"
echo ""
echo "   FIREBASE_PROJECT_ID:"
echo "   - Value: $PROJECT_ID"
echo ""

echo ""
echo "✅ Infrastructure setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Create secrets manually (see commands above)"
echo "2. Configure GitHub Secrets (for CI/CD)"
echo "3. Run: ./scripts/deploy.sh production"
echo "4. Run: ./scripts/setup-scheduler.sh (for reminders)"
