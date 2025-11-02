#!/bin/bash

# Script para habilitar Google Authentication en Firebase
# Grada Negra - November 2025

echo "🔥 Habilitando Google Authentication en Firebase"
echo "================================================"
echo ""

PROJECT_ID="gradanegra-prod"

echo "📋 Instrucciones para habilitar Google Sign-In:"
echo ""
echo "1. Abre Firebase Console:"
echo "   https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
echo ""
echo "2. En la sección 'Proveedores de acceso', busca 'Google'"
echo ""
echo "3. Haz clic en 'Google' para editarlo"
echo ""
echo "4. Activa el interruptor para 'Habilitar'"
echo ""
echo "5. Configura los siguientes campos:"
echo "   - Nombre público del proyecto: Grada Negra"
echo "   - Correo de asistencia del proyecto: (tu correo)"
echo ""
echo "6. Haz clic en 'Guardar'"
echo ""
echo "7. IMPORTANTE: También habilita 'Email/Password'"
echo "   - Busca 'Correo electrónico/Contraseña' en la lista"
echo "   - Haz clic para editar"
echo "   - Activa el interruptor"
echo "   - Haz clic en 'Guardar'"
echo ""

# Intentar abrir automáticamente en el navegador
if command -v open &> /dev/null; then
    echo "🌐 Abriendo Firebase Console en tu navegador..."
    open "https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
elif command -v xdg-open &> /dev/null; then
    xdg-open "https://console.firebase.google.com/project/${PROJECT_ID}/authentication/providers"
fi

echo ""
echo "Presiona Enter cuando hayas completado estos pasos..."
read

echo ""
echo "✅ Perfecto! Ahora prueba de nuevo:"
echo "   1. Recarga tu aplicación (http://localhost:3000)"
echo "   2. Ve a /login o /register"
echo "   3. Haz clic en 'Continuar con Google'"
echo ""
echo "Si sigues teniendo problemas, verifica:"
echo "   - Que Google esté habilitado (interruptor en verde)"
echo "   - Que Email/Password también esté habilitado"
echo "   - Que hayas guardado los cambios"
echo ""
