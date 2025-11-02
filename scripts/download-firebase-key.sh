#!/bin/bash

# Script para descargar Firebase Service Account Key

echo "🔑 Downloading Firebase Service Account Key..."
echo ""
echo "⚠️  IMPORTANTE: Este archivo contiene credenciales sensibles"
echo ""

PROJECT_ID="gradanegra-prod"

# Crear directorio si no existe
mkdir -p backend/config

echo "📥 Descargando key desde Firebase..."
echo ""
echo "Opción 1: Desde Firebase Console"
echo "==========================================="
echo "1. Ve a: https://console.firebase.google.com/project/$PROJECT_ID/settings/serviceaccounts/adminsdk"
echo "2. Click en 'Generar nueva clave privada'"
echo "3. Guarda el archivo como: backend/config/serviceAccountKey.json"
echo ""
echo "Opción 2: Desde GCP Console"
echo "==========================================="
echo "1. Ve a: https://console.cloud.google.com/iam-admin/serviceaccounts?project=$PROJECT_ID"
echo "2. Busca: firebase-adminsdk"
echo "3. Click en los 3 puntos > 'Manage keys'"
echo "4. Click 'Add Key' > 'Create new key' > JSON"
echo "5. Guarda como: backend/config/serviceAccountKey.json"
echo ""
echo "Opción 3: Usar gcloud (si ya existe service account)"
echo "==========================================="
echo "gcloud iam service-accounts keys create backend/config/serviceAccountKey.json \\"
echo "  --iam-account=firebase-adminsdk-XXXXX@$PROJECT_ID.iam.gserviceaccount.com"
echo ""

# Verificar si ya existe
if [ -f "backend/config/serviceAccountKey.json" ]; then
  echo "✅ serviceAccountKey.json ya existe!"
  echo ""
  echo "📄 Validando formato..."
  if jq empty backend/config/serviceAccountKey.json 2>/dev/null; then
    echo "✅ JSON válido"
    
    # Extraer project_id
    FOUND_PROJECT_ID=$(jq -r '.project_id' backend/config/serviceAccountKey.json)
    echo "📍 Project ID: $FOUND_PROJECT_ID"
    
    if [ "$FOUND_PROJECT_ID" = "$PROJECT_ID" ]; then
      echo "✅ Project ID correcto"
    else
      echo "⚠️  Warning: Project ID no coincide"
    fi
  else
    echo "❌ JSON inválido"
  fi
else
  echo "❌ serviceAccountKey.json NO encontrado"
  echo ""
  echo "Por favor descarga el archivo siguiendo una de las opciones arriba."
fi
