#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ID="gradanegra-prod"
SERVICE_NAME="gradanegra-api"
REGION="us-central1"
SECRET_NAME="RESEND_API_KEY"

echo -e "${BLUE}📧 Configuración de Resend API Key${NC}"
echo ""
echo "Este script te ayudará a configurar el envío de emails con Resend."
echo ""
echo -e "${YELLOW}Pasos previos:${NC}"
echo "1. Ve a https://resend.com y crea una cuenta (es gratis)"
echo "2. Crea un API Key en: Dashboard > API Keys > Create API Key"
echo "3. Copia tu API Key (empieza con 're_')"
echo ""

# Solicitar API Key
read -p "¿Tienes tu Resend API Key lista? (y/n): " has_key

if [ "$has_key" != "y" ]; then
  echo -e "${YELLOW}⏸️  Proceso pausado.${NC}"
  echo ""
  echo "Cuando tengas tu API Key, ejecuta este script nuevamente."
  echo ""
  echo -e "${BLUE}Para obtener una API Key:${NC}"
  echo "1. Visita: https://resend.com/signup"
  echo "2. Crea una cuenta (gratis, 3000 emails/mes)"
  echo "3. Ve a: Dashboard > API Keys"
  echo "4. Click en 'Create API Key'"
  echo "5. Dale un nombre (ej: 'Grada Negra Production')"
  echo "6. Copia la key y vuelve aquí"
  exit 0
fi

echo ""
read -sp "Pega tu Resend API Key: " api_key
echo ""

if [ -z "$api_key" ]; then
  echo -e "${RED}❌ API Key no puede estar vacía${NC}"
  exit 1
fi

if [[ ! $api_key == re_* ]]; then
  echo -e "${YELLOW}⚠️  Warning: La API Key debería empezar con 're_'${NC}"
  read -p "¿Continuar de todas formas? (y/n): " continue
  if [ "$continue" != "y" ]; then
    exit 0
  fi
fi

echo ""
echo -e "${BLUE}🔐 Creando secreto en Secret Manager...${NC}"

# Verificar si el secreto ya existe
if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
  echo -e "${YELLOW}⚠️  El secreto ya existe. Creando nueva versión...${NC}"
  echo -n "$api_key" | gcloud secrets versions add $SECRET_NAME \
    --data-file=- \
    --project=$PROJECT_ID
else
  echo "✨ Creando nuevo secreto..."
  echo -n "$api_key" | gcloud secrets create $SECRET_NAME \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID
fi

echo -e "${GREEN}✅ Secreto creado/actualizado${NC}"
echo ""

# Dar permisos al service account
echo -e "${BLUE}🔑 Configurando permisos...${NC}"
gcloud secrets add-iam-policy-binding $SECRET_NAME \
  --member="serviceAccount:cloud-run-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=$PROJECT_ID \
  --quiet

echo -e "${GREEN}✅ Permisos configurados${NC}"
echo ""

# Actualizar Cloud Run service
echo -e "${BLUE}🚀 Actualizando Cloud Run service...${NC}"
gcloud run services update $SERVICE_NAME \
  --update-secrets="RESEND_API_KEY=$SECRET_NAME:latest" \
  --region=$REGION \
  --project=$PROJECT_ID \
  --quiet

echo ""
echo -e "${GREEN}✅ Resend API Key configurada exitosamente!${NC}"
echo ""
echo -e "${BLUE}📧 El envío de emails está ahora habilitado${NC}"
echo ""
echo "Los emails se enviarán automáticamente cuando:"
echo "  • Se compre un ticket (email con PDF y QR)"
echo "  • Se envíen recordatorios de eventos (24h antes)"
echo ""
echo -e "${YELLOW}⚠️  Importante:${NC}"
echo "  • Verifica tu dominio en Resend para mejor deliverability"
echo "  • Free tier: 3,000 emails/mes"
echo "  • Los emails saldrán desde: tickets@gradanegra.com"
echo ""
echo -e "${BLUE}Para verificar el dominio:${NC}"
echo "  1. Ve a: https://resend.com/domains"
echo "  2. Agrega: gradanegra.com"
echo "  3. Configura los DNS records (MX, TXT, CNAME)"
echo ""
