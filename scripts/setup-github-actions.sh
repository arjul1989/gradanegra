#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PROJECT_ID="gradanegra-prod"
SA_NAME="github-actions-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"
KEY_FILE="github-actions-key.json"

echo -e "${BLUE}🔧 Configuración de GitHub Actions para CI/CD${NC}"
echo ""
echo "Este script configurará el auto-deploy desde GitHub."
echo ""

# Verificar si ya existe el service account
echo -e "${BLUE}1️⃣  Verificando Service Account...${NC}"
if gcloud iam service-accounts describe $SA_EMAIL --project=$PROJECT_ID &>/dev/null; then
  echo -e "${YELLOW}⚠️  Service account ya existe: $SA_EMAIL${NC}"
else
  echo "✨ Creando service account para GitHub Actions..."
  gcloud iam service-accounts create $SA_NAME \
    --display-name="GitHub Actions Deployment" \
    --description="Service account for automated deployments from GitHub Actions" \
    --project=$PROJECT_ID
  
  echo -e "${GREEN}✅ Service account creado${NC}"
fi

# Asignar roles necesarios
echo ""
echo -e "${BLUE}2️⃣  Configurando permisos...${NC}"

ROLES=(
  "roles/run.admin"
  "roles/iam.serviceAccountUser"
  "roles/cloudbuild.builds.editor"
  "roles/storage.admin"
)

for role in "${ROLES[@]}"; do
  echo "  • Asignando: $role"
  gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="$role" \
    --quiet \
    --condition=None
done

echo -e "${GREEN}✅ Permisos configurados${NC}"

# Crear key
echo ""
echo -e "${BLUE}3️⃣  Generando clave JSON...${NC}"

if [ -f "$KEY_FILE" ]; then
  echo -e "${YELLOW}⚠️  Archivo $KEY_FILE ya existe. Haciendo backup...${NC}"
  mv $KEY_FILE "${KEY_FILE}.backup.$(date +%s)"
fi

gcloud iam service-accounts keys create $KEY_FILE \
  --iam-account=$SA_EMAIL \
  --project=$PROJECT_ID

echo -e "${GREEN}✅ Clave generada: $KEY_FILE${NC}"

# Mostrar el contenido (base64 para GitHub)
echo ""
echo -e "${BLUE}4️⃣  Configurando GitHub Secrets...${NC}"
echo ""
echo -e "${YELLOW}📋 Copia el siguiente contenido y agrégalo como secret en GitHub:${NC}"
echo ""
echo -e "${BLUE}Pasos en GitHub:${NC}"
echo "  1. Ve a tu repositorio en GitHub"
echo "  2. Settings > Secrets and variables > Actions"
echo "  3. Click en 'New repository secret'"
echo "  4. Crea los siguientes secrets:"
echo ""

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Secret Name:${NC} GCP_SA_KEY"
echo -e "${YELLOW}Value:${NC}"
echo ""
cat $KEY_FILE
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Secret Name:${NC} FIREBASE_PROJECT_ID"
echo -e "${YELLOW}Value:${NC} $PROJECT_ID"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Secret Name:${NC} GCS_BUCKET_NAME"
echo -e "${YELLOW}Value:${NC} ${PROJECT_ID}-tickets"
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Información adicional
echo -e "${BLUE}5️⃣  Workflow ya está configurado:${NC}"
echo "  📄 Archivo: .github/workflows/deploy.yml"
echo ""
echo -e "${BLUE}El workflow se ejecutará automáticamente cuando:${NC}"
echo "  • 📤 Push a rama 'main' → Deploy a producción"
echo "  • 📤 Push a rama 'staging' → Deploy a staging"
echo "  • 🔍 Pull request → Ejecuta tests"
echo ""

# Guardar una copia segura
echo -e "${BLUE}6️⃣  Seguridad...${NC}"
echo ""
echo -e "${RED}⚠️  IMPORTANTE: Guarda el archivo $KEY_FILE en un lugar seguro${NC}"
echo -e "${RED}⚠️  NO lo subas a GitHub ni lo compartas públicamente${NC}"
echo ""
echo "Backup creado en: .keys/"
mkdir -p .keys
cp $KEY_FILE ".keys/${KEY_FILE}.$(date +%Y%m%d-%H%M%S)"
echo ""

echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
echo -e "${BLUE}📝 Próximos pasos:${NC}"
echo "  1. Copia el contenido JSON de arriba"
echo "  2. Ve a GitHub > Settings > Secrets"
echo "  3. Crea los 3 secrets mostrados"
echo "  4. Haz un push a 'main' para probar el auto-deploy"
echo ""
echo -e "${YELLOW}Para probar manualmente:${NC}"
echo "  git add ."
echo "  git commit -m 'test: GitHub Actions setup'"
echo "  git push origin main"
echo ""
echo -e "${BLUE}Monitorea el deployment en:${NC}"
echo "  https://github.com/TU_USUARIO/gradanegra/actions"
echo ""
