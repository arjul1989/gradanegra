#!/bin/bash

# Script de deployment del backend a Cloud Run
# Grada Negra - Backend API

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOY BACKEND - GRADA NEGRA API"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variables
PROJECT_ID="gradanegra-api-350907539319"
REGION="us-central1"
SERVICE_NAME="gradanegra-api"
BACKEND_DIR="../backend"

# Verificar que estamos en el directorio correcto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Verificar que existe el archivo de credenciales
if [ ! -f "$BACKEND_DIR/firebase-credentials.json" ]; then
    echo "❌ Error: No se encontró firebase-credentials.json"
    echo "   Ubicación esperada: $BACKEND_DIR/firebase-credentials.json"
    exit 1
fi

echo "✅ Archivo de credenciales encontrado"
echo ""

# Leer credenciales de Firebase desde el JSON
FIREBASE_CREDS="$BACKEND_DIR/firebase-credentials.json"
FIREBASE_PROJECT_ID=$(jq -r '.project_id' "$FIREBASE_CREDS")
FIREBASE_CLIENT_EMAIL=$(jq -r '.client_email' "$FIREBASE_CREDS")
FIREBASE_PRIVATE_KEY=$(jq -r '.private_key' "$FIREBASE_CREDS")

echo "📋 Configuración:"
echo "   Project ID: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Service: $SERVICE_NAME"
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

echo "🔨 Construyendo y desplegando..."
echo ""

# Cambiar al directorio del backend
cd "$BACKEND_DIR"

# Build y deploy usando gcloud
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
    --set-env-vars "NODE_ENV=production,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID" \
    --set-secrets "FIREBASE_PRIVATE_KEY=firebase-private-key:latest,FIREBASE_CLIENT_EMAIL=firebase-client-email:latest"

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
echo "🌐 URL del backend: $SERVICE_URL"
echo ""
echo "🔍 Verificar:"
echo "   Health: $SERVICE_URL/health"
echo "   Events: $SERVICE_URL/api/public/events"
echo ""
echo "📊 Ver logs:"
echo "   gcloud run services logs read $SERVICE_NAME --project $PROJECT_ID --region $REGION"
echo ""
