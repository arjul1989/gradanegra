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

echo -e "${BLUE}🌐 Configuración de Dominio Personalizado${NC}"
echo ""
echo "Este script te ayudará a mapear un dominio personalizado a tu API."
echo ""
echo -e "${YELLOW}⚠️  Prerequisitos:${NC}"
echo "  • Debes tener un dominio registrado (ej: gradanegra.com)"
echo "  • Acceso a configurar DNS records del dominio"
echo ""

# Preguntar por el dominio
read -p "¿Tienes un dominio que quieras usar? (y/n): " has_domain

if [ "$has_domain" != "y" ]; then
  echo ""
  echo -e "${BLUE}💡 Sin problema. Puedes configurar esto más tarde.${NC}"
  echo ""
  echo "Tu API funciona perfectamente con la URL actual:"
  echo "  https://gradanegra-api-350907539319.us-central1.run.app"
  echo ""
  echo -e "${YELLOW}Cuando tengas un dominio:${NC}"
  echo "  1. Registra uno en: Namecheap, GoDaddy, Google Domains, etc."
  echo "  2. Ejecuta este script nuevamente"
  echo ""
  exit 0
fi

echo ""
read -p "Ingresa tu dominio (ej: api.gradanegra.com): " domain

if [ -z "$domain" ]; then
  echo -e "${RED}❌ Dominio no puede estar vacío${NC}"
  exit 1
fi

echo ""
echo -e "${BLUE}🔍 Verificando el servicio...${NC}"

SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format='value(status.url)')

echo "  Servicio actual: $SERVICE_URL"
echo "  Dominio nuevo: $domain"
echo ""

# Verificar dominio
echo -e "${BLUE}📝 Verificando dominio en Google Cloud...${NC}"

# Verificar si el dominio ya está mapeado
if gcloud run domain-mappings describe --domain=$domain --region=$REGION --project=$PROJECT_ID &>/dev/null; then
  echo -e "${YELLOW}⚠️  El dominio ya está configurado${NC}"
  echo ""
  read -p "¿Deseas actualizar la configuración? (y/n): " update
  if [ "$update" != "y" ]; then
    exit 0
  fi
fi

echo ""
echo -e "${BLUE}🌐 Creando domain mapping...${NC}"

gcloud run domain-mappings create \
  --service=$SERVICE_NAME \
  --domain=$domain \
  --region=$REGION \
  --project=$PROJECT_ID

echo ""
echo -e "${GREEN}✅ Domain mapping creado!${NC}"
echo ""

# Obtener los DNS records necesarios
echo -e "${BLUE}📋 Configuración DNS requerida:${NC}"
echo ""
echo "Debes agregar los siguientes DNS records en tu proveedor de dominio:"
echo ""

MAPPING_INFO=$(gcloud run domain-mappings describe $domain \
  --region=$REGION \
  --project=$PROJECT_ID \
  --format=json)

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "$MAPPING_INFO" | jq -r '.status.resourceRecords[] | 
  "Type: \(.type)\nName: \(.name)\nValue: \(.rrdata)\n"'
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}📝 Pasos para configurar DNS:${NC}"
echo ""
echo "1. Ve al panel de tu proveedor de dominio (Namecheap, GoDaddy, etc.)"
echo "2. Busca la sección 'DNS Management' o 'DNS Settings'"
echo "3. Agrega los records mostrados arriba"
echo "4. Guarda los cambios"
echo ""
echo -e "${YELLOW}⏱️  Tiempo de propagación: 5 minutos a 48 horas${NC}"
echo "   (Usualmente 10-30 minutos)"
echo ""

echo -e "${BLUE}🔐 SSL/TLS:${NC}"
echo "  • Google provee certificados SSL automáticamente"
echo "  • El certificado se generará después de la propagación DNS"
echo "  • Tu API será accesible vía HTTPS"
echo ""

echo -e "${BLUE}✅ Para verificar el estado:${NC}"
echo ""
echo "gcloud run domain-mappings describe $domain \\"
echo "  --region=$REGION \\"
echo "  --project=$PROJECT_ID"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ Configuración iniciada!${NC}"
echo ""
echo "Una vez que el DNS se propague, tu API estará disponible en:"
echo "  https://$domain"
echo ""
echo "Mientras tanto, sigue usando:"
echo "  $SERVICE_URL"
echo ""
