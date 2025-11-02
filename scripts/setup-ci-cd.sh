#!/bin/bash

# Script para configurar Cloud Build Triggers
# Este script crea triggers que automáticamente construyen y despliegan cuando hay push a main

PROJECT_ID="gradanegra-prod"
REGION="us-central1"
REPO_NAME="gradanegra"  # Nombre de tu repositorio
REPO_OWNER="arjul1989"  # Tu usuario de GitHub

echo "🚀 Configurando Cloud Build Triggers para Grada Negra..."
echo ""

# Verificar que estamos en el proyecto correcto
gcloud config set project $PROJECT_ID

echo "📦 Habilitando APIs necesarias..."
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID
gcloud services enable run.googleapis.com --project=$PROJECT_ID
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

echo ""
echo "⚙️  Configurando permisos para Cloud Build..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud iam service-accounts add-iam-policy-binding \
  ${PROJECT_NUMBER}-compute@developer.gserviceaccount.com \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

echo ""
echo "📋 TRIGGERS A CREAR:"
echo ""
echo "1. Backend Trigger"
echo "   - Nombre: deploy-backend"
echo "   - Branch: main"
echo "   - Path: backend/**"
echo "   - Config: backend/cloudbuild.yaml"
echo ""
echo "2. Frontend Trigger"
echo "   - Nombre: deploy-frontend"
echo "   - Branch: main"
echo "   - Path: frontend/**"
echo "   - Config: frontend/cloudbuild.yaml"
echo ""
echo "⚠️  IMPORTANTE: Para completar la configuración necesitas:"
echo ""
echo "1. Ir a: https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
echo "2. Hacer clic en 'CONNECT REPOSITORY'"
echo "3. Seleccionar 'GitHub' y autorizar"
echo "4. Seleccionar el repositorio: $REPO_OWNER/$REPO_NAME"
echo ""
echo "5. Luego crear manualmente los dos triggers con estos comandos:"
echo ""
echo "# Trigger para Backend:"
echo "gcloud builds triggers create github \\"
echo "  --name=deploy-backend \\"
echo "  --repo-name=$REPO_NAME \\"
echo "  --repo-owner=$REPO_OWNER \\"
echo "  --branch-pattern=^main$ \\"
echo "  --build-config=backend/cloudbuild.yaml \\"
echo "  --included-files='backend/**' \\"
echo "  --project=$PROJECT_ID"
echo ""
echo "# Trigger para Frontend:"
echo "gcloud builds triggers create github \\"
echo "  --name=deploy-frontend \\"
echo "  --repo-name=$REPO_NAME \\"
echo "  --repo-owner=$REPO_OWNER \\"
echo "  --branch-pattern=^main$ \\"
echo "  --build-config=frontend/cloudbuild.yaml \\"
echo "  --included-files='frontend/**' \\"
echo "  --project=$PROJECT_ID"
echo ""
echo "✅ Configuración de permisos completada!"
echo "📝 Ahora conecta tu repositorio de GitHub siguiendo las instrucciones de arriba."
