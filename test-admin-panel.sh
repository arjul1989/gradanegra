#!/bin/bash

# Script de verificación del Panel de Administrador
# Grada Negra - Noviembre 2025

echo "🔍 VERIFICACIÓN DEL PANEL DE ADMINISTRADOR"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar Backend
echo "1️⃣  Verificando Backend (puerto 8080)..."
if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend está corriendo${NC}"
    BACKEND_OK=true
else
    echo -e "${RED}❌ Backend NO está corriendo${NC}"
    echo -e "${YELLOW}   Ejecuta: cd backend && npm start${NC}"
    BACKEND_OK=false
fi
echo ""

# 2. Verificar Frontend
echo "2️⃣  Verificando Frontend (puerto 3000)..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend está corriendo${NC}"
    FRONTEND_OK=true
else
    echo -e "${RED}❌ Frontend NO está corriendo${NC}"
    echo -e "${YELLOW}   Ejecuta: cd frontend && npm run dev${NC}"
    FRONTEND_OK=false
fi
echo ""

# 3. Verificar endpoints de admin (solo si backend está corriendo)
if [ "$BACKEND_OK" = true ]; then
    echo "3️⃣  Verificando endpoints de admin..."
    
    # Health check
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Health check OK${NC}"
    else
        echo -e "${RED}❌ Health check falló (HTTP $RESPONSE)${NC}"
    fi
    
    # Dashboard métricas (con bypass de dev)
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Dev-Admin: yes" http://localhost:8080/api/admin/dashboard/metricas)
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Dashboard métricas OK${NC}"
    else
        echo -e "${RED}❌ Dashboard métricas falló (HTTP $RESPONSE)${NC}"
        if [ "$RESPONSE" = "401" ] || [ "$RESPONSE" = "403" ]; then
            echo -e "${YELLOW}   Verifica que el header X-Dev-Admin esté siendo enviado${NC}"
        fi
    fi
    
    # Comercios (con bypass de dev)
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Dev-Admin: yes" http://localhost:8080/api/admin/comercios)
    if [ "$RESPONSE" = "200" ]; then
        echo -e "${GREEN}✅ Lista de comercios OK${NC}"
        
        # Obtener el primer comercio para testing
        COMERCIOS_DATA=$(curl -s -H "X-Dev-Admin: yes" http://localhost:8080/api/admin/comercios)
        PRIMER_COMERCIO_ID=$(echo $COMERCIOS_DATA | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [ -n "$PRIMER_COMERCIO_ID" ]; then
            echo -e "${GREEN}   Comercio encontrado: $PRIMER_COMERCIO_ID${NC}"
            
            # Probar detalle del comercio
            RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "X-Dev-Admin: yes" http://localhost:8080/api/admin/comercios/$PRIMER_COMERCIO_ID)
            if [ "$RESPONSE" = "200" ]; then
                echo -e "${GREEN}✅ Detalle de comercio OK${NC}"
                echo -e "${GREEN}   URL Frontend: http://localhost:3000/admin/comercios/$PRIMER_COMERCIO_ID${NC}"
            else
                echo -e "${RED}❌ Detalle de comercio falló (HTTP $RESPONSE)${NC}"
            fi
        else
            echo -e "${YELLOW}   No se encontraron comercios en la base de datos${NC}"
            echo -e "${YELLOW}   Ejecuta: cd backend && node scripts/setup-comercio.js${NC}"
        fi
    else
        echo -e "${RED}❌ Lista de comercios falló (HTTP $RESPONSE)${NC}"
        if [ "$RESPONSE" = "404" ]; then
            echo -e "${YELLOW}   Verifica que las rutas estén registradas en backend/src/index.js${NC}"
        fi
    fi
else
    echo "3️⃣  Saltando verificación de endpoints (backend no está corriendo)"
fi
echo ""

# 4. URLs importantes
echo "4️⃣  URLs del Panel de Admin:"
echo ""
echo "   Dashboard:          http://localhost:3000/admin/dashboard"
echo "   Login:              http://localhost:3000/admin/login"
echo "   Comercios:          http://localhost:3000/admin/comercios"
if [ -n "$PRIMER_COMERCIO_ID" ]; then
    echo "   Detalle (ejemplo): http://localhost:3000/admin/comercios/$PRIMER_COMERCIO_ID"
fi
echo "   Reportes:           http://localhost:3000/admin/reportes"
echo ""

# 5. Resumen
echo "=========================================="
echo "RESUMEN:"
echo ""
if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✅ Todo está funcionando correctamente${NC}"
    echo -e "${GREEN}   Puedes acceder al panel admin en:${NC}"
    echo -e "${GREEN}   http://localhost:3000/admin/dashboard${NC}"
else
    echo -e "${RED}⚠️  Algunos servicios no están corriendo${NC}"
    echo ""
    if [ "$BACKEND_OK" = false ]; then
        echo -e "${YELLOW}   Para iniciar el backend:${NC}"
        echo -e "${YELLOW}   cd backend && npm start${NC}"
        echo ""
    fi
    if [ "$FRONTEND_OK" = false ]; then
        echo -e "${YELLOW}   Para iniciar el frontend:${NC}"
        echo -e "${YELLOW}   cd frontend && npm run dev${NC}"
        echo ""
    fi
fi
echo ""
echo "📖 Para más información, consulta: GUIA_PANEL_ADMIN.md"
echo ""

