#!/bin/bash

# Script de despliegue del frontend a Cloud Run
# Este script construye y despliega la aplicación Next.js

set -e

echo "🚀 Desplegando Frontend a Cloud Run..."
echo ""

# Variables
PROJECT_ID="gradanegra-prod"
SERVICE_NAME="gradanegra-frontend"
REGION="us-central1"
API_URL="https://gradanegra-api-350907539319.us-central1.run.app"

# Variables de Firebase (desde .env.local)
FIREBASE_API_KEY="AIzaSyDa0qWOCHkldgquB51q8oZtMI4Aoqx84lw"
FIREBASE_AUTH_DOMAIN="gradanegra-prod.firebaseapp.com"
FIREBASE_PROJECT_ID="gradanegra-prod"
FIREBASE_STORAGE_BUCKET="gradanegra-prod.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="350907539319"
FIREBASE_APP_ID="1:350907539319:web:d1206f7b3180d3abd94b72"

echo "📦 Configuración:"
echo "   Proyecto: $PROJECT_ID"
echo "   Servicio: $SERVICE_NAME"
echo "   Región: $REGION"
echo "   API URL: $API_URL"
echo ""
echo "ℹ️  Las variables de entorno se leen desde .env.production"
echo ""

# Desplegar directamente con --source (usa Dockerfile y .env.production)
echo "🔨 Desplegando a Cloud Run..."
gcloud run deploy $SERVICE_NAME \
  --source . \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 300 \
  --max-instances 10 \
  --set-env-vars "NODE_ENV=production" \
  --project $PROJECT_ID

echo ""
echo "✅ Despliegue completado!"
