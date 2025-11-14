#!/bin/bash

# Script para encontrar todos los usos de confirm() y alert() nativos
# Grada Negra - Noviembre 2025

echo "🔍 BUSCANDO DIÁLOGOS NATIVOS EN EL PROYECTO"
echo "============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FRONTEND_DIR="/Users/jules/MyApps/gradanegra/frontend"

# Buscar confirm()
echo -e "${BLUE}📋 Archivos con confirm():${NC}"
echo ""
grep -r "confirm(" "$FRONTEND_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | awk -F: '{print $1}' \
  | sort -u \
  | while read -r file; do
      rel_path="${file#$FRONTEND_DIR/}"
      count=$(grep -c "confirm(" "$file")
      
      # Verificar si ya tiene useDialog
      has_use_dialog=$(grep -c "useDialog" "$file")
      
      if [ "$has_use_dialog" -gt 0 ]; then
        echo -e "  ${GREEN}✅${NC} $rel_path ($count usos) - ${GREEN}Ya tiene useDialog${NC}"
      else
        echo -e "  ${YELLOW}⏳${NC} $rel_path ($count usos) - ${YELLOW}Necesita migración${NC}"
      fi
    done

echo ""
echo ""

# Buscar alert()
echo -e "${BLUE}🔔 Archivos con alert():${NC}"
echo ""
grep -r "alert(" "$FRONTEND_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | awk -F: '{print $1}' \
  | sort -u \
  | while read -r file; do
      rel_path="${file#$FRONTEND_DIR/}"
      count=$(grep -c "alert(" "$file")
      
      # Verificar si ya tiene useDialog
      has_use_dialog=$(grep -c "useDialog" "$file")
      
      if [ "$has_use_dialog" -gt 0 ]; then
        echo -e "  ${GREEN}✅${NC} $rel_path ($count usos) - ${GREEN}Ya tiene useDialog${NC}"
      else
        echo -e "  ${YELLOW}⏳${NC} $rel_path ($count usos) - ${YELLOW}Necesita migración${NC}"
      fi
    done

echo ""
echo ""

# Resumen
echo "============================================="
echo -e "${BLUE}RESUMEN:${NC}"
echo ""

total_confirm=$(grep -r "confirm(" "$FRONTEND_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | wc -l | tr -d ' ')
  
total_alert=$(grep -r "alert(" "$FRONTEND_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | wc -l | tr -d ' ')

files_confirm=$(grep -r "confirm(" "$FRONTEND_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | awk -F: '{print $1}' \
  | sort -u \
  | wc -l | tr -d ' ')
  
files_alert=$(grep -r "alert(" "$FRONTEND_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | awk -F: '{print $1}' \
  | sort -u \
  | wc -l | tr -d ' ')

echo "  📋 confirm(): $total_confirm usos en $files_confirm archivos"
echo "  🔔 alert(): $total_alert usos en $files_alert archivos"
echo ""
echo "📖 Consulta GUIA_MODALES_PERSONALIZADOS.md para instrucciones detalladas"
echo ""

# Mostrar ejemplo del primer archivo sin migrar
echo ""
echo "============================================="
echo -e "${YELLOW}PRÓXIMO ARCHIVO A MIGRAR:${NC}"
echo ""

next_file=$(grep -r "confirm(\|alert(" "$FRONTEND_DIR" \
  --include="*.tsx" \
  --include="*.ts" \
  --exclude-dir=node_modules \
  --exclude-dir=.next \
  | awk -F: '{print $1}' \
  | sort -u \
  | while read -r file; do
      has_use_dialog=$(grep -c "useDialog" "$file")
      if [ "$has_use_dialog" -eq 0 ]; then
        echo "$file"
        break
      fi
    done)

if [ -n "$next_file" ]; then
  rel_path="${next_file#$FRONTEND_DIR/}"
  echo "  📁 $rel_path"
  echo ""
  echo "  Ejemplos de uso en ese archivo:"
  echo ""
  grep -n "confirm(\|alert(" "$next_file" | head -3 | while IFS=: read -r line_num content; do
    echo "    Línea $line_num: $(echo $content | sed 's/^[[:space:]]*//')"
  done
  echo ""
  echo "  Para migrarlo:"
  echo -e "  ${GREEN}1.${NC} Abre el archivo: $rel_path"
  echo -e "  ${GREEN}2.${NC} Agrega: import { useDialog } from '@/contexts/DialogContext'"
  echo -e "  ${GREEN}3.${NC} En el componente: const { confirm, showSuccess, showError } = useDialog()"
  echo -e "  ${GREEN}4.${NC} Reemplaza cada confirm() y alert() según la guía"
else
  echo -e "  ${GREEN}✅ ¡Todos los archivos ya han sido migrados!${NC}"
fi

echo ""

