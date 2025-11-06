Si#!/bin/bash

# Script para configurar credenciales de Firebase Admin SDK

echo "🔑 Configuración de credenciales de Firebase Admin SDK"
echo "=================================================="
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Hay dos formas de configurar las credenciales:${NC}"
echo ""
echo "1️⃣  Usar Service Account Key (Recomendado para desarrollo)"
echo "2️⃣  Usar Application Default Credentials (ADC)"
echo ""
echo -e "${YELLOW}¿Qué método prefieres? (1 o 2):${NC}"
read -p "Método: " method

if [ "$method" == "1" ]; then
  echo ""
  echo -e "${GREEN}📥 Método 1: Service Account Key${NC}"
  echo "=================================================="
  echo ""
  echo "Pasos:"
  echo "1. Ve a: https://console.firebase.google.com/project/gradanegra-prod/settings/serviceaccounts/adminsdk"
  echo "2. Haz clic en 'Generate new private key'"
  echo "3. Descarga el archivo JSON"
  echo "4. Guárdalo en: backend/firebase-credentials.json"
  echo ""
  echo -e "${YELLOW}Presiona Enter cuando hayas descargado el archivo...${NC}"
  read
  
  # Check if file exists
  if [ -f "backend/firebase-credentials.json" ]; then
    echo ""
    echo -e "${GREEN}✅ Archivo encontrado!${NC}"
    echo ""
    echo "Ahora necesitas actualizar el archivo .env del backend"
    echo ""
    
    # Read the service account values from the JSON
    PROJECT_ID=$(cat backend/firebase-credentials.json | grep -o '"project_id": "[^"]*' | cut -d'"' -f4)
    CLIENT_EMAIL=$(cat backend/firebase-credentials.json | grep -o '"client_email": "[^"]*' | cut -d'"' -f4)
    PRIVATE_KEY=$(cat backend/firebase-credentials.json | grep -o '"private_key": "[^"]*' | cut -d'"' -f4)
    
    echo -e "${YELLOW}Valores extraídos del archivo JSON:${NC}"
    echo "PROJECT_ID: $PROJECT_ID"
    echo "CLIENT_EMAIL: $CLIENT_EMAIL"
    echo "PRIVATE_KEY: (oculto por seguridad)"
    echo ""
    
    echo -e "${YELLOW}¿Quieres que actualice automáticamente el .env? (s/n):${NC}"
    read -p "Respuesta: " update_env
    
    if [ "$update_env" == "s" ] || [ "$update_env" == "S" ]; then
      # Backup current .env
      cp backend/.env backend/.env.backup
      echo -e "${GREEN}✅ Backup creado: backend/.env.backup${NC}"
      
      # Update .env file
      # Remove old Firebase credentials if they exist
      sed -i '' '/^FIREBASE_PROJECT_ID=/d' backend/.env
      sed -i '' '/^FIREBASE_CLIENT_EMAIL=/d' backend/.env
      sed -i '' '/^FIREBASE_PRIVATE_KEY=/d' backend/.env
      
      # Add new credentials
      echo "" >> backend/.env
      echo "# Firebase Admin SDK Credentials" >> backend/.env
      echo "FIREBASE_PROJECT_ID=$PROJECT_ID" >> backend/.env
      echo "FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL" >> backend/.env
      echo "FIREBASE_PRIVATE_KEY=\"$PRIVATE_KEY\"" >> backend/.env
      
      echo ""
      echo -e "${GREEN}✅ Archivo .env actualizado!${NC}"
      echo ""
      echo -e "${YELLOW}Ahora reinicia el backend:${NC}"
      echo "cd backend && npm start"
    else
      echo ""
      echo -e "${YELLOW}Agrega estas líneas manualmente a backend/.env:${NC}"
      echo ""
      echo "FIREBASE_PROJECT_ID=$PROJECT_ID"
      echo "FIREBASE_CLIENT_EMAIL=$CLIENT_EMAIL"
      echo "FIREBASE_PRIVATE_KEY=\"$PRIVATE_KEY\""
    fi
  else
    echo ""
    echo -e "${RED}❌ No se encontró el archivo backend/firebase-credentials.json${NC}"
    echo "Por favor descárgalo y vuelve a ejecutar este script"
  fi

elif [ "$method" == "2" ]; then
  echo ""
  echo -e "${GREEN}🔐 Método 2: Application Default Credentials (ADC)${NC}"
  echo "=================================================="
  echo ""
  echo "Este método requiere que tengas gcloud CLI instalado"
  echo ""
  
  # Check if gcloud is installed
  if command -v gcloud &> /dev/null; then
    echo -e "${GREEN}✅ gcloud CLI encontrado${NC}"
    echo ""
    echo "Ejecutando: gcloud auth application-default login"
    echo ""
    
    gcloud auth application-default login --project=gradanegra-prod
    
    if [ $? -eq 0 ]; then
      echo ""
      echo -e "${GREEN}✅ Autenticación exitosa!${NC}"
      echo ""
      echo "Ahora actualiza el .env para asegurarte de que NO tenga credenciales explícitas:"
      echo ""
      
      # Backup current .env
      cp backend/.env backend/.env.backup
      echo -e "${GREEN}✅ Backup creado: backend/.env.backup${NC}"
      
      # Comment out explicit credentials
      sed -i '' 's/^FIREBASE_CLIENT_EMAIL=/#FIREBASE_CLIENT_EMAIL=/g' backend/.env
      sed -i '' 's/^FIREBASE_PRIVATE_KEY=/#FIREBASE_PRIVATE_KEY=/g' backend/.env
      
      # Ensure PROJECT_ID is set
      if ! grep -q "^FIREBASE_PROJECT_ID=" backend/.env; then
        echo "FIREBASE_PROJECT_ID=gradanegra-prod" >> backend/.env
      fi
      
      echo ""
      echo -e "${GREEN}✅ Configuración completada!${NC}"
      echo ""
      echo -e "${YELLOW}Ahora reinicia el backend:${NC}"
      echo "cd backend && npm start"
    else
      echo ""
      echo -e "${RED}❌ Error en la autenticación${NC}"
    fi
  else
    echo -e "${RED}❌ gcloud CLI no está instalado${NC}"
    echo ""
    echo "Para instalar gcloud CLI:"
    echo "brew install --cask google-cloud-sdk"
    echo ""
    echo "O descárgalo desde:"
    echo "https://cloud.google.com/sdk/docs/install"
  fi

else
  echo -e "${RED}❌ Opción inválida${NC}"
  exit 1
fi

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Configuración completada!${NC}"
echo ""
