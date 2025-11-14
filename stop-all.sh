#!/bin/bash

# Script para detener ambos servidores
echo "🛑 Deteniendo servidores..."

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Detener backend
if [ -f "$BASE_DIR/logs/backend.pid" ]; then
    BACKEND_PID=$(cat "$BASE_DIR/logs/backend.pid")
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "Deteniendo backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        rm "$BASE_DIR/logs/backend.pid"
    else
        echo "Backend ya está detenido"
    fi
fi

# Detener frontend
if [ -f "$BASE_DIR/logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$BASE_DIR/logs/frontend.pid")
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "Deteniendo frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        rm "$BASE_DIR/logs/frontend.pid"
    else
        echo "Frontend ya está detenido"
    fi
fi

# Fuerza matar procesos en los puertos si aún existen
echo "Verificando puertos..."
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo "Puerto 8080 liberado"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "Puerto 3000 liberado"

echo "✅ Servidores detenidos"
