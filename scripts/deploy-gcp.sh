#!/bin/bash

# Script maestro de deployment a GCP
# Grada Negra - Deployment completo

set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 DEPLOYMENT COMPLETO - GRADA NEGRA"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Variables
PROJECT_ID="gradanegra-prod"
REGION="us-central1"
BACKEND_DIR="../backend"

# Verificar que estamos en el directorio correcto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Verificar que gcloud está instalado
if ! command -v gcloud &> /dev/null; then
    echo "❌ Error: gcloud CLI no está instalado"
    echo "   Instala desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar que estamos autenticados
echo "🔐 Verificando autenticación..."
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$CURRENT_PROJECT" ]; then
    echo "❌ Error: No hay un proyecto configurado en gcloud"
    echo "   Ejecuta: gcloud auth login"
    echo "   Luego: gcloud config set project $PROJECT_ID"
    exit 1
fi

echo "✅ Proyecto actual: $CURRENT_PROJECT"
echo ""

# Verificar que el proyecto es el correcto
if [ "$CURRENT_PROJECT" != "$PROJECT_ID" ]; then
    echo "⚠️  El proyecto actual ($CURRENT_PROJECT) no coincide con $PROJECT_ID"
    read -p "¿Cambiar al proyecto $PROJECT_ID? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        gcloud config set project "$PROJECT_ID"
    else
        echo "❌ Deployment cancelado"
        exit 1
    fi
fi

# Habilitar APIs necesarias
echo "🔧 Verificando APIs habilitadas..."
REQUIRED_APIS=(
    "run.googleapis.com"
    "cloudbuild.googleapis.com"
    "secretmanager.googleapis.com"
    "firestore.googleapis.com"
)

for api in "${REQUIRED_APIS[@]}"; do
    if gcloud services list --enabled --filter="name:$api" --format="value(name)" | grep -q "$api"; then
        echo "   ✅ $api"
    else
        echo "   ⏳ Habilitando $api..."
        gcloud services enable "$api" --project="$PROJECT_ID"
    fi
done
echo ""

# Configurar secretos de Firebase
echo "🔐 Configurando secretos de Firebase..."
FIREBASE_CREDS="$BACKEND_DIR/firebase-credentials.json"

if [ ! -f "$FIREBASE_CREDS" ]; then
    echo "❌ Error: No se encontró firebase-credentials.json"
    echo "   Ubicación esperada: $FIREBASE_CREDS"
    exit 1
fi

# Extraer valores del JSON
FIREBASE_PRIVATE_KEY=$(jq -r '.private_key' "$FIREBASE_CREDS")
FIREBASE_CLIENT_EMAIL=$(jq -r '.client_email' "$FIREBASE_CREDS")

# Crear o actualizar secretos
echo "   📝 Creando/actualizando secret: firebase-private-key"
if gcloud secrets describe firebase-private-key --project="$PROJECT_ID" &>/dev/null; then
    echo "$FIREBASE_PRIVATE_KEY" | gcloud secrets versions add firebase-private-key \
        --data-file=- \
        --project="$PROJECT_ID" &>/dev/null
else
    echo "$FIREBASE_PRIVATE_KEY" | gcloud secrets create firebase-private-key \
        --data-file=- \
        --replication-policy="automatic" \
        --project="$PROJECT_ID" &>/dev/null
fi

echo "   📝 Creando/actualizando secret: firebase-client-email"
if gcloud secrets describe firebase-client-email --project="$PROJECT_ID" &>/dev/null; then
    echo "$FIREBASE_CLIENT_EMAIL" | gcloud secrets versions add firebase-client-email \
        --data-file=- \
        --project="$PROJECT_ID" &>/dev/null
else
    echo "$FIREBASE_CLIENT_EMAIL" | gcloud secrets create firebase-client-email \
        --data-file=- \
        --replication-policy="automatic" \
        --project="$PROJECT_ID" &>/dev/null
fi

echo "✅ Secretos configurados"
echo ""

# Dar permisos a Cloud Run para acceder a los secretos
echo "🔑 Configurando permisos de acceso a secretos..."
PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")
SERVICE_ACCOUNT="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

for secret in "firebase-private-key" "firebase-client-email"; do
    gcloud secrets add-iam-policy-binding "$secret" \
        --member="serviceAccount:$SERVICE_ACCOUNT" \
        --role="roles/secretmanager.secretAccessor" \
        --project="$PROJECT_ID" &>/dev/null || true
done

echo "✅ Permisos configurados"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1️⃣  DESPLEGANDO BACKEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

export AUTO_DEPLOY=1
bash "$SCRIPT_DIR/deploy-backend.sh" || {
    echo "❌ Error en el deployment del backend"
    exit 1
}

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2️⃣  DESPLEGANDO FRONTEND"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

export AUTO_DEPLOY=1
bash "$SCRIPT_DIR/deploy-frontend.sh" || {
    echo "❌ Error en el deployment del frontend"
    exit 1
}

# URLs finales
BACKEND_URL=$(gcloud run services describe gradanegra-api \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format 'value(status.url)')

FRONTEND_URL=$(gcloud run services describe gradanegra-frontend \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --format 'value(status.url)')

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ DEPLOYMENT COMPLETO EXITOSO"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 URLs de la aplicación:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "🔍 Verificar servicios:"
echo "   Backend Health: $BACKEND_URL/health"
echo "   Frontend: $FRONTEND_URL"
echo ""
echo "📊 Monitorear:"
echo "   gcloud run services logs read gradanegra-api --project $PROJECT_ID --region $REGION --follow"
echo "   gcloud run services logs read gradanegra-frontend --project $PROJECT_ID --region $REGION --follow"
echo ""
echo "🎉 ¡Aplicación desplegada y lista para usar!"
echo ""
