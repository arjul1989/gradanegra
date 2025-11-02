#!/bin/bash

# Script de inicio rápido para desarrollo local de Grada Negra

echo "🎫 Grada Negra - Inicio Rápido"
echo "================================"
echo ""

# Verificar que estamos en el directorio correcto
if [ ! -f "backend/package.json" ]; then
    echo "❌ Error: Ejecuta este script desde la raíz del proyecto"
    exit 1
fi

# Verificar configuración de GCP
echo "🔍 Verificando configuración de Google Cloud..."
PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ "$PROJECT" != "gradanegra-prod" ]; then
    echo "⚠️  Proyecto GCP no configurado correctamente"
    echo "   Ejecutando: gcloud config set project gradanegra-prod"
    gcloud config set project gradanegra-prod
fi

echo "✅ Proyecto: $PROJECT"
echo ""

# Verificar Application Default Credentials
echo "🔐 Verificando credenciales..."
if [ ! -f "$HOME/.config/gcloud/application_default_credentials.json" ]; then
    echo "⚠️  Application Default Credentials no configuradas"
    echo "   Por favor ejecuta: gcloud auth application-default login"
    exit 1
fi
echo "✅ Credenciales configuradas"
echo ""

# Verificar que exista .env
if [ ! -f "backend/.env" ]; then
    echo "📝 Creando archivo .env..."
    cp backend/.env.example backend/.env
    echo "✅ Archivo .env creado (revisa la configuración)"
    echo ""
fi

# Verificar node_modules
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Instalando dependencias..."
    cd backend && npm install && cd ..
    echo "✅ Dependencias instaladas"
    echo ""
fi

echo "🚀 Iniciando servidor backend..."
echo ""
echo "   El servidor estará disponible en:"
echo "   👉 http://localhost:8080"
echo ""
echo "   Health check:"
echo "   👉 http://localhost:8080/health"
echo ""
echo "   Para detener el servidor: Ctrl+C"
echo ""
echo "================================"
echo ""

# Iniciar servidor
cd backend && npm run dev
