# 🔥 FIX: Error 500 en /api/eventos - Índice de Firestore Faltante

## 📋 Problema

El backend estaba devolviendo un **error 500** al intentar cargar eventos:

```
GET https://gradanegra-api-juyoedy62a-uc.a.run.app/api/eventos 500 (Internal Server Error)
```

**Error específico**:
```json
{
  "success": false,
  "message": "Error al obtener eventos",
  "error": "9 FAILED_PRECONDITION: The query requires an index."
}
```

---

## 🔍 Diagnóstico

El error indicaba que faltaba un **índice compuesto en Firestore** para la colección `fechas_evento`.

La consulta requería un índice con los siguientes campos en orden:
1. `deletedAt`
2. `eventoId`
3. `status`
4. `fecha`
5. `__name__` (implícito)

---

## ✅ Solución Implementada

### **1. Agregado Índice en firestore.indexes.json**

Se agregó el siguiente índice al archivo `/backend/firestore.indexes.json`:

```json
{
  "collectionGroup": "fechas_evento",
  "queryScope": "COLLECTION",
  "fields": [
    {
      "fieldPath": "deletedAt",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "eventoId",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "status",
      "order": "ASCENDING"
    },
    {
      "fieldPath": "fecha",
      "order": "ASCENDING"
    }
  ]
}
```

### **2. Desplegado a Firestore**

Se desplegó el índice usando Firebase CLI:

```bash
cd /Users/jules/MyApps/gradanegra/backend
firebase deploy --only firestore:indexes --project gradanegra-prod
```

**Resultado**:
```
✔ firestore: deployed indexes in firestore.indexes.json successfully for (default) database
✔ Deploy complete!
```

---

## ⏳ Tiempo de Construcción

**Nota Importante**: Los índices de Firestore no están disponibles inmediatamente.

⚠️ **Firestore debe construir el índice**, lo que puede tomar:
- **2-5 minutos** para índices pequeños
- **10-15 minutos** para índices medianos
- **Más tiempo** si hay muchos documentos

---

## 🧪 Verificación

### **Cómo Verificar que el Índice Está Listo**

1. Ir a la [Consola de Firebase](https://console.firebase.google.com/project/gradanegra-prod/firestore/indexes)
2. Buscar el índice en `fechas_evento`
3. El estado debe ser: **"Enabled" (Verde)**
4. Si dice **"Building" (Amarillo)**, esperar un poco más

### **Probar el Endpoint**

Una vez que el índice esté construido, probar:

```bash
curl -X GET "https://gradanegra-api-juyoedy62a-uc.a.run.app/api/eventos"
```

**Respuesta esperada**:
```json
{
  "success": true,
  "count": 20,
  "data": [...]
}
```

---

## 🔄 Despliegue Frontend

También se actualizó el frontend a la última imagen:

**Imagen**: `gcr.io/gradanegra-prod/gradanegra-frontend:1762902762`  
**Revisión**: `gradanegra-frontend-00023-gp9`  
**URL**: https://gradanegra-frontend-350907539319.us-central1.run.app

**Cambios incluidos**:
- ✅ Mapeo correcto de campos (`title`, `date`, `location`) en eventos filtrados
- ✅ Búsqueda por nombre de evento funcional
- ✅ Filtro por ciudad funcional
- ✅ Cards con fecha y ubicación correctas

---

## 📝 Qué Causó Este Error

El backend estaba intentando hacer una consulta compleja en la colección `fechas_evento` que requería múltiples campos:

```javascript
// Consulta que requiere el índice
db.collection('fechas_evento')
  .where('deletedAt', '==', null)
  .where('eventoId', '==', eventoId)
  .where('status', '==', 'activa')
  .orderBy('fecha', 'asc')
```

Firestore requiere **índices compuestos** para:
- Consultas con múltiples `where` en diferentes campos
- Consultas que combinan `where` con `orderBy`
- Consultas de desigualdad en múltiples campos

---

## 🚀 Próximos Pasos

1. **Esperar 5-10 minutos** para que Firestore construya el índice
2. **Verificar** en la consola de Firebase que el índice esté "Enabled"
3. **Refrescar** la aplicación web (CTRL + SHIFT + R)
4. **Probar** búsqueda y filtros

---

## 📊 Estado Actual

| Componente | Status | Detalles |
|------------|--------|----------|
| Índice Firestore | 🟡 Building | Esperando que Firestore lo construya |
| Backend | ✅ Running | No requiere redeploy |
| Frontend | ✅ Deployed | Revisión 00023-gp9 |
| Búsqueda | ✅ Ready | Implementada y deployada |
| Filtro Ciudad | ✅ Ready | Implementado y deployado |

---

## 🔗 Enlaces Útiles

**Consola de Índices Firestore**:
https://console.firebase.google.com/project/gradanegra-prod/firestore/indexes

**Documentación de Índices**:
https://firebase.google.com/docs/firestore/query-data/indexing

**Backend API**:
https://gradanegra-api-juyoedy62a-uc.a.run.app

**Frontend App**:
https://gradanegra-frontend-350907539319.us-central1.run.app

---

## ✨ Resumen

El problema era un **índice de Firestore faltante**, no un error de código. 

**Fix aplicado**:
- ✅ Índice agregado a `firestore.indexes.json`
- ✅ Desplegado a Firebase
- ✅ Frontend actualizado

**Acción requerida**:
- ⏳ Esperar 5-10 minutos a que Firestore construya el índice
- 🔄 Refrescar la app después

---

**Fecha**: 11 de noviembre de 2025  
**Status**: 🟡 En progreso (esperando construcción de índice)

