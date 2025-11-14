#!/bin/bash

echo "🔄 REINICIANDO FRONTEND CON LIMPIEZA DE CACHÉ..."
echo ""

# 1. Buscar proceso del frontend
echo "📍 Buscando procesos de Next.js en puerto 3000..."
PIDS=$(lsof -ti:3000)

if [ -n "$PIDS" ]; then
  echo "⚠️  Encontrados procesos: $PIDS"
  echo "🛑 Matando procesos..."
  kill -9 $PIDS
  sleep 2
else
  echo "✅ No hay procesos corriendo en puerto 3000"
fi

# 2. Ir a directorio del frontend
cd /Users/jules/MyApps/gradanegra/frontend

# 3. Limpiar caché de Next.js
echo ""
echo "🧹 Limpiando caché de Next.js..."
rm -rf .next
rm -rf node_modules/.cache

echo ""
echo "✅ Caché limpiado"
echo ""
echo "🚀 Iniciando servidor..."
echo ""
echo "📌 IMPORTANTE: Los datos precargados ahora usan:"
echo "   - Número de documento: 12345678"
echo "   - Tarjeta: 5031 7557 3453 0604"
echo ""
echo "🌐 Abre en modo incógnito:"
echo "   http://localhost:3000/eventos/03b5a8ad-5c91-44ae-9a4c-66761ffa171e"
echo ""
echo "🔍 Abre la consola del navegador (F12) y busca:"
echo "   Doc Número: 12345678  ✅"
echo "   Status del pago: approved  ✅"
echo ""
echo "───────────────────────────────────────────────────────"
echo ""

npm run dev

