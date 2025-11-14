#!/bin/bash

# COMANDO EXACTO PARA REDESPLEGAR BACKEND
# Ejecutar DESPUÉS de las correcciones

set -e

echo "🚀 COMANDO EXACTO PARA REDESPLEGAR BACKEND"
echo "==========================================="
echo ""

echo "📋 RESUMEN DEL PROBLEMA:"
echo "- publicKey: '\"-n APP_USR-...\"' (contiene espacios)"
echo "- accessToken: Token corrupto con '-n'"
echo "- PSE: No disponible por token inválido"
echo "- Frontend: 'Cargando sistema de pagos...' permanente"
echo ""

echo "💡 SOLUCIÓN:"
echo "Ejecutar estos comandos EXACTOS:"
echo ""

echo "1️⃣ Ir al directorio del backend:"
echo "cd /Users/jules/MyApps/gradanegra/backend"
echo ""

echo "2️⃣ Ejecutar redespliegue:"
echo 'gcloud run deploy gradanegra-api --source . --project=gradanegra-api-350907539319 --region=us-central1 --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --set-env-vars="NODE_ENV=production" --quiet'
echo ""

echo "3️⃣ Verificar después de 2-3 minutos:"
echo "curl -s 'https://gradanegra-api-350907539319.us-central1.run.app/api/payments/config'"
echo ""

echo "✅ RESULTADO ESPERADO:"
echo '{"success":true,"publicKey":"APP_USR-4b192185-10c7-4b18-b2ef-5e098dffcb9c","environment":"production"}'
echo ""
echo "❌ DEBE SER SIN: '\"-n \"' al inicio del publicKey"
echo ""

echo "4️⃣ Verificar PSE:"
echo "curl -s 'https://gradanegra-api-350907539319.us-central1.run.app/api/payments/pse-banks'"
echo ""

echo "5️⃣ Probar frontend:"
echo "https://gradanegra-frontend-350907539319.us-central1.run.app/checkout/[EVENTO_ID]"
echo ""

echo "🔧 COMANDO COMPLETO COPY-PASTE:"
echo "==============================="
echo 'cd /Users/jules/MyApps/gradanegra/backend && gcloud run deploy gradanegra-api --source . --project=gradanegra-api-350907539319 --region=us-central1 --platform=managed --allow-unauthenticated --memory=512Mi --cpu=1 --set-env-vars="NODE_ENV=production" --quiet'
echo ""

echo "⚠️ NOTAS IMPORTANTES:"
echo "- Requiere permisos de gcloud para proyecto gradanegra-api-350907539319"
echo "- Esperar 2-3 minutos después del despliegue"
echo "- El backend debe reiniciarse con las credenciales limpias"
echo ""
