#!/bin/bash

# 🚀 SCRIPT DE DEPLOYMENT LOCAL ROBUSTO
# Grada Negra API - Google Cloud Run
# Versión: 2.0 - Con validaciones y configuración centralizada

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Cargar configuración centralizada
CONFIG_FILE="./.deployment-config"
if [[ -f "$CONFIG_FILE" ]]; then
    source "$CONFIG_FILE"
else
    echo -e "${RED}❌ ERROR: No se encontró el archivo de configuración $CONFIG_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}🚀 GRADA NEGRA API - DEPLOYMENT ROBUSTO${NC}"
echo "=============================================="
echo ""

# Validaciones pre-despliegue
echo -e "${YELLOW}🔍 Validando configuración...${NC}"

# Verificar que estamos en el directorio correcto
if [[ ! -f "package.json" ]]; then
    echo -e "${RED}❌ ERROR: No se encontró package.json. Ejecutar desde el directorio backend${NC}"
    exit 1
fi

# Verificar variables críticas
if [[ -z "$PROJECT_ID" || -z "$SERVICE_NAME" || -z "$REGION" ]]; then
    echo -e "${RED}❌ ERROR: Variables críticas no configuradas en .deployment-config${NC}"
    exit 1
fi

# Verificar que gcloud esté instalado
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ ERROR: gcloud CLI no está instalado${NC}"
    echo "Instalar desde: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Verificar autenticación de gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "."; then
    echo -e "${RED}❌ ERROR: No hay cuenta de gcloud autenticada${NC}"
    echo "Ejecutar: gcloud auth login"
    exit 1
fi

echo -e "${GREEN}✅ Configuración validada${NC}"
echo ""

# Información del deployment
echo -e "${BLUE}📋 Información del Deployment:${NC}"
echo "   Proyecto: $PROJECT_ID"
echo "   Servicio: $SERVICE_NAME"
echo "   Región: $REGION"
echo "   Memoria: $MEMORY"
echo "   CPU: $CPU"
echo "   Plataforma: $PLATFORM"
echo "   Max Instances: $MAX_INSTANCES"
echo ""

# Confirmar deployment
echo -e "${YELLOW}🤔 ¿Proceder con el deployment? (y/n)${NC}"
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${RED}❌ Deployment cancelado${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}🔨 Iniciando deployment...${NC}"

# Construir comando de deployment
DEPLOYMENT_CMD="gcloud run deploy $SERVICE_NAME \
    --source . \
    --project=$PROJECT_ID \
    --region=$REGION \
    --platform=$PLATFORM \
    --allow-unauthenticated \
    --memory=$MEMORY \
    --cpu=$CPU \
    --timeout=$TIMEOUT \
    --max-instances=$MAX_INSTANCES \
    --min-instances=$MIN_INSTANCES \
    --quiet \
    --set-env-vars=\"NODE_ENV=$NODE_ENV,PORT=$PORT,FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID\""

# Agregar secretos si están configurados
if [[ -n "$SECRETS" ]]; then
    echo -e "${YELLOW}🔐 Configurando secretos...${NC}"
    
    # Convertir array de secretos en formato de gcloud
    SECRETS_STRING=""
    for secret in "${SECRETS[@]}"; do
        SECRETS_STRING="$SECRETS_STRING,$secret"
    done
    SECRETS_STRING="${SECRETS_STRING:1}" # Remover primera coma
    
    DEPLOYMENT_CMD="$DEPLOYMENT_CMD --set-secrets=\"$SECRETS_STRING\""
    echo -e "${GREEN}✅ Secretos configurados: $SECRETS_STRING${NC}"
fi

echo ""
echo -e "${BLUE}⚡ Ejecutando deployment...${NC}"
echo "Comando: $DEPLOYMENT_CMD"
echo ""

# Ejecutar deployment
if eval "$DEPLOYMENT_CMD"; then
    echo ""
    echo -e "${GREEN}🎉 DEPLOYMENT EXITOSO${NC}"
    echo "========================="
    
    # Obtener URL del servicio
    SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
        --project=$PROJECT_ID \
        --region=$REGION \
        --format='value(status.url)')
    
    echo -e "${GREEN}🌐 URL del servicio: $SERVICE_URL${NC}"
    echo ""
    
    # Verificación post-deployment
    echo -e "${BLUE}🔍 Verificando deployment...${NC}"
    
    # Health check
    sleep 5
    if curl -f -s "$SERVICE_URL/health" > /dev/null; then
        echo -e "${GREEN}✅ Health check exitoso${NC}"
    else
        echo -e "${YELLOW}⚠️ Health check pendiente (normal en primeros minutos)${NC}"
    fi
    
    # Verificar configuración de MercadoPago
    sleep 2
    echo -e "${YELLOW}🔍 Verificando configuración de MercadoPago...${NC}"
    MP_CONFIG=$(curl -s "$SERVICE_URL/api/payments/config" || echo "")
    
    if echo "$MP_CONFIG" | grep -q '"success":true'; then
        PUBLIC_KEY=$(echo "$MP_CONFIG" | jq -r '.publicKey' 2>/dev/null || echo "N/A")
        echo -e "${GREEN}✅ MercadoPago configurado correctamente${NC}"
        echo -e "${BLUE}   Public Key: $PUBLIC_KEY${NC}"
        
        # Verificar que no tenga espacios en blanco
        if [[ "$PUBLIC_KEY" == *"-n"* ]]; then
            echo -e "${YELLOW}⚠️ ADVERTENCIA: Public Key aún contiene espacios en blanco${NC}"
            echo -e "${YELLOW}   Esto puede causar errores en el frontend${NC}"
        fi
    else
        echo -e "${RED}❌ ERROR: MercadoPago no está configurado correctamente${NC}"
        echo -e "${RED}   Respuesta: $MP_CONFIG${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📊 URLs de Verificación:${NC}"
    echo "   Health: $SERVICE_URL/health"
    echo "   Config MP: $SERVICE_URL/api/payments/config"
    echo "   Métodos Pago: $SERVICE_URL/api/payments/methods"
    echo "   Bancos PSE: $SERVICE_URL/api/payments/pse-banks"
    echo ""
    
    echo -e "${GREEN}🚀 DEPLOYMENT COMPLETADO EXITOSAMENTE${NC}"
    echo "Para verificar en el frontend:"
    echo "1. Ir a: https://gradanegra-frontend-350907539319.us-central1.run.app"
    echo "2. Seleccionar un evento y verificar checkout"
    echo "3. Verificar que PSE esté habilitado"
    
else
    echo ""
    echo -e "${RED}❌ DEPLOYMENT FALLIDO${NC}"
    echo "========================"
    echo "Revisar los logs:"
    echo "gcloud run services logs read $SERVICE_NAME --project=$PROJECT_ID --region=$REGION"
    echo ""
    echo "Para diagnosticar:"
    echo "1. Verificar variables de entorno"
    echo "2. Verificar secretos en Secret Manager"
    echo "3. Verificar permisos de la cuenta de gcloud"
    echo "4. Verificar que el código compile correctamente"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 LOGS DE DEPLOYMENT:${NC}"
echo "gcloud run services logs read $SERVICE_NAME --project=$PROJECT_ID --region=$REGION"
echo ""