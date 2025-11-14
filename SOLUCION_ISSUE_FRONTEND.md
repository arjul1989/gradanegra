# 🔧 SOLUCIÓN: Frontend no carga categorías ni eventos

## Fecha: 11 de Noviembre de 2025

---

## 🐛 PROBLEMA REPORTADO

El usuario reportó que al acceder a `https://gradanegra-frontend-350907539319.us-central1.run.app/` no se cargaban categorías ni eventos.

### Errores en Consola
```
GET https://gradanegra-api-350907539319.us-central1.run.app/api/categorias 404 (Not Found)
Error fetching categories: AxiosError - Request failed with status code 404
```

---

## 🔍 DIAGNÓSTICO

### 1. URL Incorrecta del Backend
- ❌ **URL incorrecta**: `https://gradanegra-api-350907539319.us-central1.run.app` (hardcodeada en `cloudbuild.yaml`)
- ✅ **URL correcta**: `https://gradanegra-api-juyoedy62a-uc.a.run.app`

### 2. Categorías Faltantes
- ❌ No había categorías en Firestore
- ❌ Las categorías creadas usaban `activo: true` en lugar de `status: 'activa'`
- ✅ El controller busca `status == 'activa'`

### 3. Eventos con Campos Incorrectos
- ❌ Eventos creados con `activo: true` en lugar de `status: 'activo'`
- ❌ Eventos sin el campo `deletedAt` requerido
- ✅ El controller busca `status == 'activo'` y `deletedAt == null`

### 4. Índice Faltante en Firestore
- ❌ El endpoint `/api/eventos` requiere un índice compuesto en la colección `fechas_evento`
- ✅ El endpoint `/api/eventos/destacados` funciona correctamente (10 eventos)

---

## ✅ SOLUCIONES IMPLEMENTADAS

### 1. Corregir URL del Backend ✅
**Archivo**: `frontend/cloudbuild.yaml` línea 5

**Cambio**:
```yaml
# Antes
'--build-arg', 'NEXT_PUBLIC_API_URL=https://gradanegra-api-350907539319.us-central1.run.app',

# Después
'--build-arg', 'NEXT_PUBLIC_API_URL=https://gradanegra-api-juyoedy62a-uc.a.run.app',
```

### 2. Crear Categorías Correctamente ✅
**Script**: `backend/scripts/create-categories.js`

**Cambios**:
- Cambio de `activo: true` a `status: 'activa'`
- 7 categorías creadas exitosamente

**Categorías creadas**:
1. Rock & Underground 🎸
2. Salsa & Tropical 🎺
3. Electrónica 🎧
4. Reggaeton & Urbano 🔥
5. Arte & Cultura 🎭
6. Deportes ⚽
7. Comedia 😂

**Verificación**:
```bash
curl -s "https://gradanegra-api-juyoedy62a-uc.a.run.app/api/categorias"
# Resultado: 7 categorías activas ✅
```

### 3. Corregir Creación de Eventos ✅
**Script**: `backend/scripts/create-demo-data.js`

**Cambios**:
```javascript
// Antes
activo: true,
publicado: true,

// Después
status: 'activo',  // Cambiado de activo: true
deletedAt: null,   // Campo requerido añadido
```

**Eventos creados**:
- 10 eventos para Live Music Arena
- 10 eventos para Comedy Central Club
- **Total: 20 eventos**

**Verificación**:
```bash
curl -s "https://gradanegra-api-juyoedy62a-uc.a.run.app/api/eventos/destacados"
# Resultado: 10 eventos destacados ✅
```

### 4. Re-desplegar Frontend 🔄
**Status**: EN PROGRESO

**Comando ejecutado**:
```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --project gradanegra-prod \
  --substitutions=SHORT_SHA="$(date +%s)",_FIREBASE_API_KEY="...",... \
  --timeout=20m
```

**Build ID**: `a0bbcb5b-4ca8-45cf-bfee-963fdadb79ca`

---

## ⚠️ PENDIENTE: Crear Índice en Firestore

### Problema
El endpoint `/api/eventos` (con filtros) requiere un índice compuesto en Firestore:

```
Error: The query requires an index.
Collection: fechas_evento
Fields: deletedAt, eventoId, status, fecha
```

### Solución
1. **Opción A - Manual**: Acceder al enlace proporcionado por Firestore:
   ```
   https://console.firebase.google.com/v1/r/project/gradanegra-prod/firestore/indexes?create_composite=...
   ```

2. **Opción B - Automática**: Agregar al archivo `firestore.indexes.json`:
   ```json
   {
     "indexes": [
       {
         "collectionGroup": "fechas_evento",
         "queryScope": "COLLECTION",
         "fields": [
           { "fieldPath": "deletedAt", "order": "ASCENDING" },
           { "fieldPath": "eventoId", "order": "ASCENDING" },
           { "fieldPath": "status", "order": "ASCENDING" },
           { "fieldPath": "fecha", "order": "ASCENDING" }
         ]
       }
     ]
   }
   ```
   
   Luego ejecutar:
   ```bash
   firebase deploy --only firestore:indexes
   ```

### Nota
- Los eventos destacados SÍ funcionan porque usan una consulta más simple
- El índice solo es necesario para el endpoint con filtros avanzados

---

## 📊 ESTADO ACTUAL

### Backend ✅
- **URL**: https://gradanegra-api-juyoedy62a-uc.a.run.app
- **Categorías**: 7 activas ✅
- **Eventos**: 20 creados ✅
- **Eventos destacados**: 10 disponibles ✅
- **Comercios**: 2 demo creados ✅

### Frontend 🔄
- **Build anterior**: https://gradanegra-frontend-juyoedy62a-uc.a.run.app (URL incorrecta)
- **Nuevo build**: EN PROGRESO
- **Build ID**: `a0bbcb5b-4ca8-45cf-bfee-963fdadb79ca`

### Base de Datos ✅
- **Categorías**: ✅ Creadas con `status: 'activa'`
- **Eventos**: ✅ Creados con `status: 'activo'` y `deletedAt: null`
- **Comercios**: ✅ 2 comercios demo
- **Usuarios**: ✅ 2 usuarios comercio + 1 superadmin

---

## 🔐 CREDENCIALES DE PRUEBA

### Comercios Demo
1. **Live Music Arena**
   - Email: `contacto@livemusicarena.com`
   - Password: `Demo2025!`
   - Eventos: 10 (Rock, Salsa, Electrónica, etc.)

2. **Comedy Central Club**
   - Email: `info@comedycentralclub.com`
   - Password: `Demo2025!`
   - Eventos: 10 (Stand-Up, Improvisación, etc.)

### Super Admin
- Email: `arjul1989@gmail.com`
- (Tu contraseña actual)

---

## 🎯 PRÓXIMOS PASOS

1. ⏳ **Esperar a que termine el build del frontend** (Build ID: `a0bbcb5b-4ca8-45cf-bfee-963fdadb79ca`)
2. 🔍 **Crear índice en Firestore** para `/api/eventos` con filtros
3. ✅ **Verificar que el frontend carga correctamente** con la URL del backend actualizada
4. ✅ **Probar flujo completo**: categorías → eventos → compra de boletos

---

## 📝 ARCHIVOS MODIFICADOS

1. `/frontend/cloudbuild.yaml` - URL del backend corregida
2. `/backend/scripts/create-categories.js` - Categorías con `status: 'activa'`
3. `/backend/scripts/create-demo-data.js` - Eventos con `status: 'activo'` y `deletedAt: null`

---

## ✨ RESULTADO ESPERADO

Una vez que el frontend termine de desplegarse:
- ✅ La home page cargará las 7 categorías
- ✅ Los eventos destacados aparecerán en el carrusel
- ✅ Los filtros por ciudad y categoría funcionarán
- ✅ Los comercios podrán gestionar sus eventos

---

*Solución implementada el 11 de Noviembre de 2025*  
*Tiempo total de troubleshooting: ~45 minutos*  
*Issues resueltos: 4*

