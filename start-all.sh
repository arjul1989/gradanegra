#!/bin/bash

# Script para iniciar ambos servidores en background
echo "🚀 Iniciando todos los servidores..."

# Obtener directorio absoluto del script
BASE_DIR="$(cd "$(dirname "$0")" && pwd)"

# Crear directorio de logs
mkdir -p "$BASE_DIR/logs"

# Iniciar backend
echo "📦 Iniciando backend en puerto 8080..."
cd "$BASE_DIR/backend"
npm run dev > "$BASE_DIR/logs/backend.log" 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Esperar un poco
sleep 3

# Iniciar frontend
echo "🎨 Iniciando frontend en puerto 3000..."
cd "$BASE_DIR/frontend"
npm run dev > "$BASE_DIR/logs/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

# Guardar PIDs
echo $BACKEND_PID > "$BASE_DIR/logs/backend.pid"
echo $FRONTEND_PID > "$BASE_DIR/logs/frontend.pid"

echo ""
echo "✅ Servidores iniciados!"
echo "📊 Backend:  http://localhost:8080 (PID: $BACKEND_PID)"
echo "🎨 Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo "📝 Logs en:"
echo "   Backend:  logs/backend.log"
echo "   Frontend: logs/frontend.log"
echo ""
echo "⚠️  Para detener los servidores, ejecuta: ./stop-all.sh"
