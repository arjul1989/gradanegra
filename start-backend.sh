#!/bin/bash

# Script para iniciar el servidor backend
echo "🚀 Iniciando servidor backend..."
cd "$(dirname "$0")/backend"
npm run dev
