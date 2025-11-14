# 🔧 GUÍA: Panel de Administrador de Plataforma

**Fecha:** 10 de Noviembre, 2025  
**Problema resuelto:** Acceso al panel de administrador

---

## ❌ PROBLEMA IDENTIFICADO

Intentaste acceder a:
```
http://localhost:3000/comercios/b702c3bc-987f-4666-bba7-22c1415773aa
```

**Esto está incorrecto** por dos razones:
1. La ruta correcta es `/admin/comercios/[id]` no `/comercios/[id]`
2. El backend requiere autenticación de admin

---

## ✅ SOLUCIÓN IMPLEMENTADA

He actualizado el código del frontend para que funcione correctamente:

### Cambios realizados:

1. **`frontend/app/admin/comercios/page.tsx`** - Lista de comercios
   - ✅ Agregado header `X-Dev-Admin: yes` para bypass en desarrollo
   - ✅ Mejor manejo de errores con logs

2. **`frontend/app/admin/comercios/[id]/page.tsx`** - Detalle de comercio
   - ✅ Agregado header `X-Dev-Admin: yes` para bypass en desarrollo
   - ✅ Corregidos los nombres de campos en el endpoint PUT `/plan`
   - ✅ Mejor manejo de errores

3. **`frontend/app/admin/dashboard/page.tsx`** - Dashboard principal
   - ✅ Agregado header `X-Dev-Admin: yes` para todas las llamadas
   - ✅ Mejor manejo de errores

---

## 🚀 CÓMO USAR EL PANEL DE ADMIN

### Paso 1: Verificar que el backend esté corriendo

```bash
# Terminal 1: Backend
cd /Users/jules/MyApps/gradanegra/backend
npm start

# Deberías ver:
# 🚀 Grada Negra API running on port 8080
```

Verifica que funcione:
```bash
curl http://localhost:8080/health
# Debería devolver: {"status":"healthy"...}
```

### Paso 2: Verificar que el frontend esté corriendo

```bash
# Terminal 2: Frontend
cd /Users/jules/MyApps/gradanegra/frontend
npm run dev

# Deberías ver:
# ▲ Next.js 16.0.1
# - Local:        http://localhost:3000
```

### Paso 3: Acceder al Panel de Admin

**URLs correctas:**

| Página | URL Correcta |
|--------|-------------|
| Login Admin | `http://localhost:3000/admin/login` |
| Dashboard | `http://localhost:3000/admin/dashboard` |
| Lista Comercios | `http://localhost:3000/admin/comercios` |
| Detalle Comercio | `http://localhost:3000/admin/comercios/[ID]` |
| Reportes | `http://localhost:3000/admin/reportes` |

**Para el comercio que mencionaste:**
```
✅ Correcto: http://localhost:3000/admin/comercios/b702c3bc-987f-4666-bba7-22c1415773aa
❌ Incorrecto: http://localhost:3000/comercios/b702c3bc-987f-4666-bba7-22c1415773aa
```

---

## 🔐 AUTENTICACIÓN EN DESARROLLO

He implementado un **bypass de autenticación para desarrollo** que funciona automáticamente:

```typescript
// El frontend automáticamente agrega este header en desarrollo:
headers['X-Dev-Admin'] = 'yes'
```

Esto le dice al backend que permita el acceso sin verificar Firebase Auth tokens.

**⚠️ IMPORTANTE:** Esto solo funciona cuando `NODE_ENV !== 'production'`

---

## 🧪 PRUEBAS RÁPIDAS

### Verificar Backend Manualmente

```bash
# 1. Health check
curl http://localhost:8080/health

# 2. Obtener comercios (con bypass de dev)
curl -H "X-Dev-Admin: yes" \
  http://localhost:8080/api/admin/comercios

# 3. Obtener comercio específico
curl -H "X-Dev-Admin: yes" \
  http://localhost:8080/api/admin/comercios/b702c3bc-987f-4666-bba7-22c1415773aa

# 4. Dashboard métricas
curl -H "X-Dev-Admin: yes" \
  http://localhost:8080/api/admin/dashboard/metricas
```

Si ves errores 401 o 403, verifica:
- ✅ El header `X-Dev-Admin: yes` está siendo enviado
- ✅ El backend está en modo desarrollo (no producción)
- ✅ El endpoint existe (revisa `/backend/src/index.js`)

---

## 📂 ESTRUCTURA DE RUTAS

### Backend (API)
```
/api/admin/dashboard/metricas              GET  - Métricas generales
/api/admin/dashboard/planes                GET  - Distribución de planes
/api/admin/dashboard/top-comercios         GET  - Top 10 comercios
/api/admin/dashboard/actividad             GET  - Actividad reciente

/api/admin/comercios                       GET  - Listar comercios
/api/admin/comercios/:id                   GET  - Detalle de comercio
/api/admin/comercios/:id/estadisticas      GET  - Estadísticas del comercio
/api/admin/comercios/:id/eventos           GET  - Eventos del comercio
/api/admin/comercios/:id                   PUT  - Actualizar info básica
/api/admin/comercios/:id/estado           PATCH - Cambiar estado (activo/inactivo/suspendido)
/api/admin/comercios/:id/plan              PUT  - Configurar límites custom ⭐
```

### Frontend (Páginas)
```
/admin/login                  - Login de admin
/admin/dashboard              - Dashboard principal
/admin/comercios              - Lista de comercios
/admin/comercios/[id]         - Detalle + Configuración custom
/admin/reportes               - Reportes y comisiones
```

---

## 🛠️ TROUBLESHOOTING

### Problema: No se cargan los comercios

**Síntomas:**
- La página `/admin/comercios` está en blanco
- Console muestra errores 401 o 403

**Solución:**
1. Verifica que el backend esté corriendo en puerto 8080
2. Abre la consola del navegador (F12)
3. Verifica que los requests incluyan el header `X-Dev-Admin: yes`
4. Verifica que `NODE_ENV !== 'production'`

```bash
# Ver environment
echo $NODE_ENV

# Si está en producción, forzar desarrollo:
export NODE_ENV=development
```

### Problema: Backend responde 404

**Síntomas:**
- Error: `Route GET /api/admin/comercios not found`

**Solución:**
1. Verifica que el backend tenga las rutas registradas:

```javascript
// backend/src/index.js (líneas 94-96)
app.use('/api/admin/dashboard', require('./routes/admin/dashboard.routes'));
app.use('/api/admin/comercios', require('./routes/admin/comercios.routes'));
app.use('/api/admin/reportes', require('./routes/admin/reportes.routes'));
```

2. Reinicia el backend:

```bash
cd backend
npm start
```

### Problema: Error "Cannot read property 'limiteEventos' of undefined"

**Síntomas:**
- La página de detalle de comercio muestra error
- No se cargan los datos del comercio

**Solución:**
1. Verifica que el comercio existe en Firestore:
   - Ve a Firebase Console > Firestore Database
   - Busca la colección `comercios`
   - Verifica que el ID existe: `b702c3bc-987f-4666-bba7-22c1415773aa`

2. Si no existe, créalo:

```bash
cd backend
node scripts/setup-comercio.js
```

---

## 📊 ENDPOINTS CRÍTICOS IMPLEMENTADOS

### 1. GET /api/admin/comercios
**Descripción:** Lista todos los comercios con filtros y paginación

**Query Parameters:**
- `status` - Filtrar por estado (activo, inactivo, suspendido)
- `tipoPlan` - Filtrar por plan (free, basic, pro, premium, enterprise)
- `ciudad` - Filtrar por ciudad
- `search` - Buscar por nombre o email
- `limit` - Items por página (default: 25)
- `offset` - Offset de paginación (default: 0)

**Response:**
```json
{
  "comercios": [
    {
      "id": "b702c3bc-987f-4666-bba7-22c1415773aa",
      "nombre": "Mi Comercio",
      "email": "comercio@ejemplo.com",
      "tipoPlan": "pro",
      "status": "activo",
      "limiteEventos": 50,
      "limiteEventosCustom": 100,
      "eventosActivos": 3,
      "ventasMesActual": 1500000
    }
  ],
  "total": 1,
  "limit": 25,
  "offset": 0
}
```

### 2. GET /api/admin/comercios/:id
**Descripción:** Obtiene el detalle completo de un comercio

**Response:**
```json
{
  "id": "b702c3bc-987f-4666-bba7-22c1415773aa",
  "nombre": "Mi Comercio",
  "email": "comercio@ejemplo.com",
  "telefono": "+57 300 123 4567",
  "logo": "https://...",
  "tipoPlan": "pro",
  "status": "activo",
  "fechaCreacion": "2025-01-15T10:00:00Z",
  "limiteEventos": 50,
  "limiteDestacados": 2,
  "limiteUsuarios": 3,
  "comision": 5,
  "limiteEventosCustom": 100,
  "limiteDestacadosCustom": 5,
  "limiteUsuariosCustom": 10,
  "comisionCustom": 3,
  "limiteEventosEfectivo": 100,
  "limiteDestacadosEfectivo": 5,
  "limiteUsuariosEfectivo": 10,
  "comisionEfectiva": 3
}
```

### 3. PUT /api/admin/comercios/:id/plan ⭐ CRÍTICO
**Descripción:** Configurar límites custom que anulan el plan estándar

**Request Body:**
```json
{
  "limiteEventosCustom": 100,
  "limiteDestacadosCustom": 5,
  "limiteUsuariosCustom": 10,
  "comisionCustom": 3,
  "motivo": "Cliente VIP - necesita más límites"
}
```

**Response:**
```json
{
  "message": "Plan configurado exitosamente",
  "comercio": {
    "id": "b702c3bc-987f-4666-bba7-22c1415773aa",
    "nombre": "Mi Comercio",
    "limiteEventosCustom": 100,
    "limiteDestacadosCustom": 5,
    "limiteUsuariosCustom": 10,
    "comisionCustom": 3
  }
}
```

**⚠️ Notas:**
- El campo `motivo` es **obligatorio** (se guarda en logs de auditoría)
- Para remover un custom limit, enviar `null`: `{ "limiteEventosCustom": null }`
- Los valores custom anulan completamente los del plan estándar

---

## 🔍 VERIFICAR QUE TODO FUNCIONA

### Checklist Final

```bash
# 1. Backend corriendo
✅ curl http://localhost:8080/health

# 2. Frontend corriendo
✅ Abre http://localhost:3000

# 3. Panel admin accesible
✅ Abre http://localhost:3000/admin/dashboard

# 4. Lista de comercios carga
✅ Abre http://localhost:3000/admin/comercios

# 5. Detalle de comercio carga
✅ Abre http://localhost:3000/admin/comercios/[ID]

# 6. Puedes modificar límites custom
✅ En la página de detalle, edita los valores y guarda
```

---

## 📝 LOGS Y DEBUGGING

### Ver logs del backend en tiempo real

```bash
cd backend
tail -f logs/combined.log
```

### Ver logs de auditoría en Firestore

1. Ve a Firebase Console
2. Firestore Database
3. Colección `admin_logs`
4. Verás todos los cambios realizados desde el panel admin

**Ejemplo de log:**
```json
{
  "adminId": "dev-admin",
  "adminEmail": "dev@local",
  "adminRole": "super_admin",
  "accion": "configurar_plan_custom",
  "entidad": "comercio",
  "entidadId": "b702c3bc-987f-4666-bba7-22c1415773aa",
  "datosAnteriores": {
    "limiteEventosCustom": undefined,
    "comisionCustom": undefined
  },
  "datosNuevos": {
    "limiteEventosCustom": 100,
    "comisionCustom": 3
  },
  "motivo": "Cliente VIP - necesita más límites",
  "timestamp": "2025-11-10T10:30:00Z"
}
```

---

## 🎯 RESUMEN

### Lo que hice:

1. ✅ Actualicé el código del frontend para enviar el header `X-Dev-Admin: yes`
2. ✅ Corregí los nombres de campos en el endpoint PUT `/plan`
3. ✅ Agregué mejor manejo de errores con logs
4. ✅ Documenté todo el flujo de autenticación

### Lo que debes hacer:

1. **Acceder con la URL correcta:**
   ```
   http://localhost:3000/admin/comercios/b702c3bc-987f-4666-bba7-22c1415773aa
   ```

2. **Verificar que el backend esté corriendo:**
   ```bash
   cd backend && npm start
   ```

3. **Verificar que el frontend esté corriendo:**
   ```bash
   cd frontend && npm run dev
   ```

4. **Abrir la consola del navegador (F12)** para ver si hay errores

---

## 📞 SOPORTE

Si sigues teniendo problemas:

1. **Revisa los logs del backend:** `backend/logs/combined.log`
2. **Revisa la consola del navegador:** Presiona F12
3. **Verifica que el comercio existe en Firestore**
4. **Prueba con curl** los endpoints del backend directamente

---

**Autor:** Claude + GitHub Copilot  
**Fecha:** 10 de Noviembre, 2025  
**Versión:** 1.0  
**Estado:** ✅ Listo para usar

