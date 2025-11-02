#!/bin/bash

# Script para habilitar todas las APIs necesarias para Grada Negra
# Ejecutar después de configurar billing

set -e

echo "🚀 Habilitando APIs de Google Cloud para Grada Negra..."
echo ""

# Verificar que el proyecto esté configurado
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ Error: No hay proyecto configurado"
    echo "Ejecuta: gcloud config set project gradanegra-prod"
    exit 1
fi

echo "📦 Proyecto: $PROJECT_ID"
echo ""

# APIs Core
echo "🔧 Habilitando APIs Core..."
gcloud services enable \
    cloudresourcemanager.googleapis.com \
    serviceusage.googleapis.com \
    cloudapis.googleapis.com

echo "✅ APIs Core habilitadas"
echo ""

# APIs de Compute y Networking
echo "🌐 Habilitando APIs de Compute y Networking..."
gcloud services enable \
    compute.googleapis.com \
    vpcaccess.googleapis.com

echo "✅ APIs de Compute habilitadas"
echo ""

# APIs de Aplicación
echo "🚀 Habilitando APIs de Aplicación..."
gcloud services enable \
    run.googleapis.com \
    cloudbuild.googleapis.com \
    artifactregistry.googleapis.com \
    containerregistry.googleapis.com

echo "✅ APIs de Aplicación habilitadas"
echo ""

# APIs de Base de Datos
echo "🗄️  Habilitando APIs de Base de Datos..."
gcloud services enable \
    sqladmin.googleapis.com \
    sql-component.googleapis.com \
    firestore.googleapis.com

echo "✅ APIs de Base de Datos habilitadas"
echo ""

# APIs de Storage
echo "📦 Habilitando APIs de Storage..."
gcloud services enable \
    storage.googleapis.com \
    storage-api.googleapis.com \
    storage-component.googleapis.com

echo "✅ APIs de Storage habilitadas"
echo ""

# APIs de Seguridad
echo "🔐 Habilitando APIs de Seguridad..."
gcloud services enable \
    secretmanager.googleapis.com \
    iam.googleapis.com \
    iamcredentials.googleapis.com

echo "✅ APIs de Seguridad habilitadas"
echo ""

# APIs de Monitoring y Logging
echo "📊 Habilitando APIs de Monitoring..."
gcloud services enable \
    logging.googleapis.com \
    monitoring.googleapis.com \
    cloudtrace.googleapis.com

echo "✅ APIs de Monitoring habilitadas"
echo ""

# APIs de Scheduling
echo "⏰ Habilitando APIs de Scheduling..."
gcloud services enable \
    cloudscheduler.googleapis.com \
    cloudtasks.googleapis.com

echo "✅ APIs de Scheduling habilitadas"
echo ""

# Verificar APIs habilitadas
echo "📋 Verificando APIs habilitadas..."
echo ""
gcloud services list --enabled --filter="config.name:*.googleapis.com" --format="table(config.name)"

echo ""
echo "✅ ¡Todas las APIs han sido habilitadas exitosamente!"
echo ""
echo "🎯 Próximos pasos:"
echo "   1. Configurar Application Default Credentials:"
echo "      gcloud auth application-default login"
echo ""
echo "   2. Crear service account:"
echo "      ./scripts/create-service-account.sh"
echo ""
echo "   3. Crear base de datos:"
echo "      ./scripts/setup-database.sh"
echo ""
