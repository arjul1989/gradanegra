#!/bin/bash

# Script para configurar Firebase Authentication en Grada Negra
# Este script te guiará para obtener las credenciales de Firebase

echo "🔥 Configuración de Firebase Authentication"
echo "=========================================="
echo ""

PROJECT_ID="gradanegra-prod"

echo "📋 Paso 1: Habilitar Firebase Authentication"
echo "-------------------------------------------"
echo "1. Ve a: https://console.firebase.google.com/project/${PROJECT_ID}/authentication"
echo "2. Haz clic en 'Get Started' o 'Comenzar'"
echo "3. Ve a la pestaña 'Sign-in method'"
echo "4. Habilita:"
echo "   - Email/Password (activa ambas opciones)"
echo "   - Google (necesitarás configurar el email de soporte)"
echo ""
read -p "Presiona ENTER cuando hayas habilitado Authentication..."

echo ""
echo "📋 Paso 2: Obtener las Credenciales de Firebase"
echo "-----------------------------------------------"
echo "1. Ve a: https://console.firebase.google.com/project/${PROJECT_ID}/settings/general"
echo "2. Baja hasta la sección 'Your apps' (Tus aplicaciones)"
echo "3. Si no hay una app Web, haz clic en el ícono </> para crear una"
echo "4. Si ya existe, haz clic en 'Config' o el ícono de engranaje"
echo ""
read -p "Presiona ENTER para continuar..."

echo ""
echo "📋 Paso 3: Copiar las Credenciales"
echo "---------------------------------"
echo "Copia los valores de firebaseConfig. Deberías ver algo como:"
echo ""
echo "const firebaseConfig = {"
echo '  apiKey: "AIzaSy...",'
echo '  authDomain: "gradanegra-prod.firebaseapp.com",'
echo '  projectId: "gradanegra-prod",'
echo '  storageBucket: "gradanegra-prod.appspot.com",'
echo '  messagingSenderId: "350907539319",'
echo '  appId: "1:350907539319:web:..."'
echo "};"
echo ""
echo "Ahora ingresa los valores:"
echo ""

read -p "API Key (apiKey): " FIREBASE_API_KEY
read -p "App ID (appId): " FIREBASE_APP_ID

# Validar que no estén vacíos
if [ -z "$FIREBASE_API_KEY" ] || [ -z "$FIREBASE_APP_ID" ]; then
    echo ""
    echo "❌ Error: Debes proporcionar API Key y App ID"
    echo "Vuelve a ejecutar el script cuando tengas las credenciales"
    exit 1
fi

# Crear el archivo .env.local
ENV_FILE="frontend/.env.local"

cat > $ENV_FILE << EOF
# Firebase Configuration
# Generado automáticamente por setup-firebase.sh
# Fecha: $(date)

NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=gradanegra-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=gradanegra-prod
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=gradanegra-prod.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=350907539319
NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
EOF

echo ""
echo "✅ Archivo .env.local creado exitosamente!"
echo ""
echo "📋 Paso 4: Configurar Dominios Autorizados para OAuth"
echo "----------------------------------------------------"
echo "Para que funcione Google Sign-In:"
echo "1. Ve a: https://console.firebase.google.com/project/${PROJECT_ID}/authentication/settings"
echo "2. En 'Authorized domains', agrega:"
echo "   - localhost (ya debería estar)"
echo "   - gradanegra-frontend-350907539319.us-central1.run.app"
echo ""
read -p "Presiona ENTER cuando lo hayas configurado..."

echo ""
echo "✅ Configuración Completada!"
echo "============================"
echo ""
echo "🚀 Próximos pasos:"
echo "1. El servidor de desarrollo detectará los cambios automáticamente"
echo "2. Abre: http://localhost:3000"
echo "3. Prueba:"
echo "   - Registrarte en /register"
echo "   - Iniciar sesión en /login"
echo "   - Google Sign-In"
echo ""
echo "📚 Documentación completa en: docs/FIREBASE_AUTH_SETUP.md"
echo ""
echo "⚠️  IMPORTANTE: NO subas el archivo .env.local a Git"
echo ""
