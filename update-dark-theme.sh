#!/bin/bash

# Script para actualizar todos los archivos del panel con el tema oscuro
# Colores del diseño:
# - Primary: #0d59f2
# - Background dark: #101622  
# - Sidebar: #1b1f27
# - Secondary: #282e39
# - Borders: #3b4354 / gray-700
# - Text: white / gray-400

PANEL_DIR="/Users/jules/MyApps/gradanegra/frontend/app/panel"

echo "🎨 Actualizando tema oscuro en el panel de comercios..."

# Función para reemplazar en todos los archivos
function replace_in_files() {
    find "$PANEL_DIR" -name "*.tsx" -type f ! -path "*/node_modules/*" -exec sed -i '' "$1" {} \;
}

# 1. Fondos blancos -> oscuros
echo "📦 Actualizando fondos..."
replace_in_files 's/bg-white /bg-[#1b1f27] /g'
replace_in_files 's/bg-white"/bg-[#1b1f27]"/g'

# 2. Bordes grises claros -> oscuros
echo "🔲 Actualizando bordes..."
replace_in_files 's/border-gray-200/border-gray-700/g'
replace_in_files 's/border-gray-300/border-gray-600/g'
replace_in_files 's/border-gray-100/border-gray-700/g'

# 3. Texto oscuro -> claro
echo "📝 Actualizando textos..."
replace_in_files 's/text-gray-900/text-white/g'
replace_in_files 's/text-gray-800/text-white/g'
replace_in_files 's/text-gray-700/text-gray-300/g'
replace_in_files 's/text-gray-600/text-gray-400/g'
replace_in_files 's/text-gray-500/text-gray-400/g'

# 4. Fondos de hover grises -> oscuros
echo "🖱️  Actualizando hovers..."
replace_in_files 's/hover:bg-gray-50/hover:bg-[#282e39]/g'
replace_in_files 's/hover:bg-gray-100/hover:bg-[#282e39]/g'
replace_in_files 's/hover:bg-white/hover:bg-[#1b1f27]/g'

# 5. Fondos grises claro-50 -> oscuros
echo "🎨 Actualizando fondos secundarios..."
replace_in_files 's/bg-gray-50/bg-[#282e39]/g'
replace_in_files 's/bg-gray-100/bg-[#282e39]/g'

# 6. Dividers
echo "➖ Actualizando separadores..."
replace_in_files 's/divide-gray-200/divide-gray-700/g'
replace_in_files 's/divide-gray-100/divide-gray-700/g'

# 7. Spinners y loading
echo "⏳ Actualizando spinners..."
replace_in_files 's/border-t-gray-900/border-t-[#0d59f2]/g'
replace_in_files 's/border-gray-200 border-t-gray-900/border-gray-700 border-t-[#0d59f2]/g'

# 8. Inputs
echo "📋 Actualizando inputs..."
replace_in_files 's/focus:ring-gray-900/focus:ring-[#0d59f2]/g'

# 9. Botones gradiente gris -> azul  
echo "🔘 Actualizando botones..."
replace_in_files 's/from-gray-900 to-gray-700/from-[#0d59f2] to-blue-600/g'
replace_in_files 's/from-gray-800 to-gray-600/from-blue-600 to-[#0d59f2]/g'

# 10. Iconos grises -> apropiados
echo "🎭 Actualizando iconos..."
replace_in_files 's/text-gray-400/text-gray-500/g'
replace_in_files 's/text-gray-300/text-gray-700/g'

echo "✅ Actualización completada!"
echo "📁 Archivos actualizados en: $PANEL_DIR"
