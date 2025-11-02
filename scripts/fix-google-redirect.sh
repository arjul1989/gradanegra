#!/bin/bash

# Script para configurar las URLs de redirección de Google OAuth
# Grada Negra - November 2025

echo "🔧 Configurando URLs de redirección de Google OAuth"
echo "=================================================="
echo ""

PROJECT_ID="gradanegra-prod"

echo "📋 Paso 1: Obtener las URLs autorizadas de Firebase"
echo ""
echo "Ve a Firebase Console > Authentication > Sign-in method > Google"
echo "https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
echo ""
echo "Busca la sección 'SDK configuration' y copia estas URLs:"
echo "  - Authorized JavaScript origins"
echo "  - Authorized redirect URIs"
echo ""
echo "Las URLs deberían ser algo como:"
echo "  https://${PROJECT_ID}.firebaseapp.com"
echo "  https://${PROJECT_ID}.firebaseapp.com/__/auth/handler"
echo ""
echo "También necesitamos agregar localhost para desarrollo:"
echo "  http://localhost:3000"
echo ""

# Intentar abrir Firebase Console
if command -v open &> /dev/null; then
    echo "🌐 Abriendo Firebase Console..."
    open "https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
fi

echo ""
echo "Presiona Enter cuando hayas copiado las URLs de Firebase..."
read

echo ""
echo "📋 Paso 2: Configurar en Google Cloud Console"
echo ""
echo "1. Abre Google Cloud Console - Credentials:"
echo "   https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"
echo ""
echo "2. Busca el OAuth 2.0 Client ID para 'Web client (auto created by Google Service)'"
echo ""
echo "3. Haz clic en el nombre para editar"
echo ""
echo "4. En 'Authorized JavaScript origins', agrega:"
echo "   - http://localhost"
echo "   - http://localhost:3000"
echo "   - https://${PROJECT_ID}.firebaseapp.com"
echo ""
echo "5. En 'Authorized redirect URIs', agrega:"
echo "   - http://localhost:3000"
echo "   - https://${PROJECT_ID}.firebaseapp.com/__/auth/handler"
echo ""
echo "6. Haz clic en 'Save'"
echo ""

# Intentar abrir Google Cloud Console
if command -v open &> /dev/null; then
    echo "🌐 Abriendo Google Cloud Console..."
    open "https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"
fi

echo ""
echo "Presiona Enter cuando hayas guardado los cambios..."
read

echo ""
echo "✅ Configuración completada!"
echo ""
echo "Ahora prueba de nuevo:"
echo "  1. Recarga tu aplicación: http://localhost:3000"
echo "  2. Ve a /login"
echo "  3. Haz clic en 'Continuar con Google'"
echo ""
echo "Si sigues teniendo problemas:"
echo "  - Verifica que las URLs estén exactamente como se muestran"
echo "  - Espera 1-2 minutos para que los cambios se propaguen"
echo "  - Limpia la caché del navegador o prueba en modo incógnito"
echo ""
