#!/bin/bash

# 🚀 Script de Deployment Completo - Grada Negra
# Este script hace push a GitHub y despliega a GCP

set -e  # Salir si hay algún error

echo "🚀 Iniciando deployment completo..."
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Push a GitHub
echo -e "${BLUE}📤 Paso 1: Pushing a GitHub...${NC}"
git push origin main
echo -e "${GREEN}✅ Push completado${NC}"
echo ""

# 2. Deploy Backend
echo -e "${BLUE}🔧 Paso 2: Desplegando Backend a Cloud Run...${NC}"
gcloud run deploy gradanegra-api \
  --source ./backend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 10 \
  --memory 1Gi \
  --timeout 300 \
  --quiet

echo -e "${GREEN}✅ Backend desplegado${NC}"
echo ""

# 3. Deploy Frontend
echo -e "${BLUE}🎨 Paso 3: Desplegando Frontend a Cloud Run...${NC}"
gcloud run deploy gradanegra-frontend \
  --source ./frontend \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --min-instances 0 \
  --max-instances 5 \
  --memory 512Mi \
  --timeout 60 \
  --quiet

echo -e "${GREEN}✅ Frontend desplegado${NC}"
echo ""

# 4. Verificar deployments
echo -e "${BLUE}🔍 Paso 4: Verificando deployments...${NC}"

echo "Backend Health Check:"
curl -s https://gradanegra-api-350907539319.us-central1.run.app/health | head -n 5
echo ""

echo "Frontend Health Check:"
curl -s -I https://gradanegra-frontend-350907539319.us-central1.run.app | head -n 1
echo ""

# 5. Mostrar URLs
echo -e "${GREEN}🎉 ¡Deployment completado exitosamente!${NC}"
echo ""
echo -e "${YELLOW}📊 URLs de Producción:${NC}"
echo "  Frontend:     https://gradanegra-frontend-350907539319.us-central1.run.app"
echo "  Backend API:  https://gradanegra-api-350907539319.us-central1.run.app"
echo "  Admin Panel:  https://gradanegra-frontend-350907539319.us-central1.run.app/admin"
echo "  Panel Comercio: https://gradanegra-frontend-350907539319.us-central1.run.app/panel"
echo ""

# 6. Recordatorio de seguridad
echo -e "${YELLOW}⚠️  IMPORTANTE - Seguridad:${NC}"
echo "  1. Rotar credenciales de Firebase inmediatamente"
echo "  2. Actualizar Secret Manager con nuevas credenciales"
echo "  3. Revocar credenciales antiguas en Firebase Console"
echo ""

echo -e "${GREEN}✨ Todo listo!${NC}"
