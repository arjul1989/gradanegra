#!/bin/bash

# Script para iniciar el servidor frontend
echo "🚀 Iniciando servidor frontend..."
cd "$(dirname "$0")/frontend"
npm run dev
