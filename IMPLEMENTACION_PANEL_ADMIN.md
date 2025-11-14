# 🚀 PLAN DE IMPLEMENTACIÓN - Panel de Administrador Grada Negra

**Fecha:** 7 de Noviembre, 2025  
**Versión:** 1.0  
**Estado:** Listo para implementar

---

## 📋 RESUMEN EJECUTIVO

Vamos a implementar el **Panel de Administrador** de Grada Negra, una plataforma independiente que permite a los super-administradores gestionar todos los comercios, personalizar planes, ajustar comisiones y monitorear la salud general de la plataforma.

### Características Principales:
✅ Dashboard con métricas globales  
✅ Gestión completa de comercios con filtros avanzados  
✅ **Sistema de configuración custom** (override de límites y comisiones)  
✅ Reportes financieros con exportación  
✅ Log de auditoría completo  
✅ Arquitectura separada (puerto 3001 / admin.gradanegra.com)

---

## 🗂️ ESTRUCTURA DEL PROYECTO

```
gradanegra/
├── backend/
│   ├── src/
│   │   ├── middleware/
│   │   │   └── verifyAdmin.js (NUEVO)
│   │   ├── routes/
│   │   │   ├── admin/
│   │   │   │   ├── dashboard.routes.js (NUEVO)
│   │   │   │   ├── comercios.routes.js (NUEVO)
│   │   │   │   ├── reportes.routes.js (NUEVO)
│   │   │   │   └── auditoria.routes.js (NUEVO)
│   │   │   ├── eventos.routes.js (MODIFICAR - agregar verificación custom)
│   │   │   └── usuarios-comercios.routes.js (MODIFICAR - agregar verificación custom)
│   │   ├── utils/
│   │   │   └── adminLogger.js (NUEVO - helper para logs)
│   │   └── index.js (MODIFICAR - registrar rutas admin)
│   └── scripts/
│       └── create-admin-user.js (NUEVO - asignar claims)
├── admin-panel/ (NUEVO - Aplicación Next.js independiente)
│   ├── app/
│   │   ├── layout.tsx (Layout con sidebar)
│   │   ├── page.tsx (Redirect a /dashboard)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── comercios/
│   │   │   ├── page.tsx (Lista)
│   │   │   └── [id]/
│   │   │       └── page.tsx (Detalle)
│   │   ├── reportes/
│   │   │   └── page.tsx
│   │   └── login/
│   │       └── page.tsx
│   ├── components/
│   │   ├── Sidebar.tsx
│   │   ├── MetricCard.tsx
│   │   ├── CommercesTable.tsx
│   │   ├── CustomPlanModal.tsx (CRÍTICO)
│   │   └── FilterBar.tsx
│   ├── lib/
│   │   ├── firebase.ts
│   │   └── api.ts
│   ├── package.json
│   ├── next.config.js (puerto 3001)
│   └── tailwind.config.js
└── frontend/ (Aplicación principal - sin cambios)
```

---

## 🔧 FASE 1: BACKEND - API ENDPOINTS (Días 1-3)

### 1.1 Middleware de Autenticación Admin

**Archivo:** `/backend/src/middleware/verifyAdmin.js`

```javascript
const admin = require('../config/firebase').admin;

/**
 * Middleware para verificar que el usuario es administrador
 * Verifica el custom claim 'admin' en Firebase Auth
 */
const verifyAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Verificar claim de admin
    if (!decodedToken.admin) {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requieren permisos de administrador.' 
      });
    }
    
    // Agregar info del admin al request
    req.admin = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: decodedToken.adminRole || 'super_admin'
    };
    
    next();
  } catch (error) {
    console.error('Error verificando admin:', error);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

/**
 * Middleware para verificar roles específicos
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(403).json({ error: 'Usuario no autenticado como admin' });
    }
    
    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({ 
        error: `Acceso denegado. Rol requerido: ${allowedRoles.join(' o ')}` 
      });
    }
    
    next();
  };
};

module.exports = { verifyAdmin, requireRole };
```

---

### 1.2 Utilidad de Logging

**Archivo:** `/backend/src/utils/adminLogger.js`

```javascript
const { db, admin } = require('../config/firebase');

/**
 * Registra una acción administrativa en Firestore
 */
async function logAdminAction({
  adminId,
  adminEmail,
  adminRole,
  accion,
  entidad,
  entidadId,
  datosAnteriores = {},
  datosNuevos = {},
  motivo = null
}) {
  try {
    await db.collection('admin_logs').add({
      adminId,
      adminEmail,
      adminRole,
      accion,
      entidad,
      entidadId,
      datosAnteriores,
      datosNuevos,
      motivo,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error('Error al registrar log de admin:', error);
    // No lanzar error para no bloquear la operación principal
  }
}

module.exports = { logAdminAction };
```

---

### 1.3 Rutas de Dashboard

**Archivo:** `/backend/src/routes/admin/dashboard.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { db } = require('../../config/firebase');
const { verifyAdmin } = require('../../middleware/verifyAdmin');

// Aplicar middleware a todas las rutas
router.use(verifyAdmin);

/**
 * GET /api/admin/dashboard/metricas
 * Métricas globales de la plataforma
 */
router.get('/metricas', async (req, res) => {
  try {
    // 1. Comercios activos
    const comerciosSnapshot = await db.collection('comercios')
      .where('status', '==', 'activo')
      .get();
    const comerciosActivos = comerciosSnapshot.size;

    // 2. Eventos activos
    const eventosSnapshot = await db.collection('eventos')
      .where('status', '==', 'activo')
      .get();
    const eventosActivos = eventosSnapshot.size;

    // 3. Total de boletos vendidos
    const boletosSnapshot = await db.collection('boletos')
      .where('status', 'in', ['vendido', 'usado'])
      .get();
    const boletosVendidos = boletosSnapshot.size;

    // 4. Comisiones totales (último mes)
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const comprasSnapshot = await db.collection('compras')
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', lastMonth)
      .get();

    let comisionesTotales = 0;
    for (const doc of comprasSnapshot.docs) {
      const compra = doc.data();
      const comercioDoc = await db.collection('comercios').doc(compra.comercioId).get();
      if (comercioDoc.exists) {
        const comercio = comercioDoc.data();
        const comision = (compra.total * (comercio.comision || 10)) / 100;
        comisionesTotales += comision;
      }
    }

    res.json({
      comerciosActivos,
      eventosActivos,
      boletosVendidos,
      comisionesTotales: Math.round(comisionesTotales * 100) / 100,
      comparacionPeriodoAnterior: {
        comercios: 2.5,
        eventos: 1.8,
        boletos: 5.2,
        comisiones: -0.5
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dashboard/planes
 * Distribución de comercios por plan
 */
router.get('/planes', async (req, res) => {
  try {
    const comerciosSnapshot = await db.collection('comercios').get();
    
    const distribucion = {
      free: 0,
      basic: 0,
      pro: 0,
      enterprise: 0
    };

    comerciosSnapshot.forEach(doc => {
      const comercio = doc.data();
      if (distribucion.hasOwnProperty(comercio.tipoPlan)) {
        distribucion[comercio.tipoPlan]++;
      }
    });

    const total = comerciosSnapshot.size;
    
    res.json({
      free: { cantidad: distribucion.free, porcentaje: (distribucion.free / total * 100).toFixed(1) },
      basic: { cantidad: distribucion.basic, porcentaje: (distribucion.basic / total * 100).toFixed(1) },
      pro: { cantidad: distribucion.pro, porcentaje: (distribucion.pro / total * 100).toFixed(1) },
      enterprise: { cantidad: distribucion.enterprise, porcentaje: (distribucion.enterprise / total * 100).toFixed(1) }
    });
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dashboard/top-comercios
 * Top 10 comercios por ventas
 */
router.get('/top-comercios', async (req, res) => {
  try {
    const { periodo = '30d' } = req.query;
    
    // Calcular fecha de inicio según período
    const now = new Date();
    let fechaInicio;
    if (periodo === '7d') {
      fechaInicio = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else {
      fechaInicio = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Obtener todas las compras del período
    const comprasSnapshot = await db.collection('compras')
      .where('status', '==', 'completada')
      .where('fechaCompra', '>=', fechaInicio)
      .get();

    // Agrupar por comercio
    const comerciosMap = {};
    comprasSnapshot.forEach(doc => {
      const compra = doc.data();
      if (!comerciosMap[compra.comercioId]) {
        comerciosMap[compra.comercioId] = {
          comercioId: compra.comercioId,
          totalVentas: 0,
          cantidadBoletos: 0
        };
      }
      comerciosMap[compra.comercioId].totalVentas += compra.total || 0;
      comerciosMap[compra.comercioId].cantidadBoletos += compra.cantidadBoletos || 0;
    });

    // Enriquecer con datos del comercio
    const topComercios = await Promise.all(
      Object.values(comerciosMap).map(async (item) => {
        const comercioDoc = await db.collection('comercios').doc(item.comercioId).get();
        const comercio = comercioDoc.data();
        return {
          ...item,
          nombre: comercio?.nombre || 'Desconocido',
          tipoPlan: comercio?.tipoPlan || 'free'
        };
      })
    );

    // Ordenar y limitar a top 10
    const top10 = topComercios
      .sort((a, b) => b.totalVentas - a.totalVentas)
      .slice(0, 10);

    res.json(top10);
  } catch (error) {
    console.error('Error obteniendo top comercios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/dashboard/actividad
 * Actividad administrativa reciente
 */
router.get('/actividad', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const logsSnapshot = await db.collection('admin_logs')
      .orderBy('timestamp', 'desc')
      .limit(parseInt(limit))
      .get();

    const actividad = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));

    res.json(actividad);
  } catch (error) {
    console.error('Error obteniendo actividad:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

### 1.4 Rutas de Comercios (Admin)

**Archivo:** `/backend/src/routes/admin/comercios.routes.js`

```javascript
const express = require('express');
const router = express.Router();
const { db } = require('../../config/firebase');
const { verifyAdmin } = require('../../middleware/verifyAdmin');
const { logAdminAction } = require('../../utils/adminLogger');

router.use(verifyAdmin);

/**
 * GET /api/admin/comercios
 * Listar comercios con filtros y paginación
 */
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      tipoPlan, 
      ciudad, 
      search,
      limit = 25, 
      offset = 0,
      orderBy = 'createdAt'
    } = req.query;

    let query = db.collection('comercios');

    // Aplicar filtros
    if (status) {
      query = query.where('status', '==', status);
    }
    if (tipoPlan) {
      query = query.where('tipoPlan', '==', tipoPlan);
    }
    if (ciudad) {
      query = query.where('ciudad', '==', ciudad);
    }

    // Ordenamiento
    query = query.orderBy(orderBy, 'desc');

    // Obtener total sin paginación
    const allSnapshot = await query.get();
    const total = allSnapshot.size;

    // Aplicar paginación
    query = query.limit(parseInt(limit)).offset(parseInt(offset));
    const snapshot = await query.get();

    // Enriquecer datos con estadísticas
    const comercios = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const comercio = { id: doc.id, ...doc.data() };

        // Contar eventos activos
        const eventosSnapshot = await db.collection('eventos')
          .where('comercioId', '==', doc.id)
          .where('status', '==', 'activo')
          .get();
        comercio.eventosActivos = eventosSnapshot.size;

        // Calcular ventas del mes actual
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const comprasSnapshot = await db.collection('compras')
          .where('comercioId', '==', doc.id)
          .where('status', '==', 'completada')
          .where('fechaCompra', '>=', firstDayOfMonth)
          .get();

        let ventasMesActual = 0;
        comprasSnapshot.forEach(compraDoc => {
          ventasMesActual += compraDoc.data().total || 0;
        });
        comercio.ventasMesActual = ventasMesActual;

        return comercio;
      })
    );

    // Filtrar por búsqueda (client-side para simplicidad)
    let filteredComercios = comercios;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredComercios = comercios.filter(c => 
        c.nombre?.toLowerCase().includes(searchLower) ||
        c.email?.toLowerCase().includes(searchLower)
      );
    }

    res.json({
      comercios: filteredComercios,
      total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (error) {
    console.error('Error listando comercios:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/admin/comercios/:id
 * Obtener detalle de comercio
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const comercioDoc = await db.collection('comercios').doc(id).get();
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const comercio = { id: comercioDoc.id, ...comercioDoc.data() };

    res.json(comercio);
  } catch (error) {
    console.error('Error obteniendo comercio:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/admin/comercios/:id/estado
 * Activar/Desactivar/Suspender comercio
 */
router.patch('/:id/estado', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, motivo } = req.body;

    if (!['activo', 'inactivo', 'suspendido'].includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    const comercioRef = db.collection('comercios').doc(id);
    const comercioDoc = await comercioRef.get();
    
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const datosAnteriores = comercioDoc.data();
    
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (status === 'suspendido') {
      updateData.fechaSuspension = new Date();
      updateData.motivoSuspension = motivo;
    }

    await comercioRef.update(updateData);

    // Log de auditoría
    await logAdminAction({
      adminId: req.admin.uid,
      adminEmail: req.admin.email,
      adminRole: req.admin.role,
      accion: `cambiar_estado_${status}`,
      entidad: 'comercio',
      entidadId: id,
      datosAnteriores: { status: datosAnteriores.status },
      datosNuevos: { status },
      motivo
    });

    res.json({ message: 'Estado actualizado', status });
  } catch (error) {
    console.error('Error actualizando estado:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/admin/comercios/:id/plan
 * Configurar plan y límites custom
 * ¡¡¡ENDPOINT CRÍTICO!!!
 */
router.put('/:id/plan', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      tipoPlan,
      limiteEventosCustom,
      limiteDestacadosCustom,
      limiteUsuariosCustom,
      comisionCustom,
      motivo 
    } = req.body;

    const comercioRef = db.collection('comercios').doc(id);
    const comercioDoc = await comercioRef.get();
    
    if (!comercioDoc.exists) {
      return res.status(404).json({ error: 'Comercio no encontrado' });
    }

    const datosAnteriores = comercioDoc.data();
    
    const updateData = {
      tipoPlan,
      updatedAt: new Date()
    };

    // Aplicar límites custom si se proporcionan
    if (limiteEventosCustom !== undefined) {
      updateData.limiteEventosCustom = limiteEventosCustom;
    }
    if (limiteDestacadosCustom !== undefined) {
      updateData.limiteDestacadosCustom = limiteDestacadosCustom;
    }
    if (limiteUsuariosCustom !== undefined) {
      updateData.limiteUsuariosCustom = limiteUsuariosCustom;
    }
    if (comisionCustom !== undefined) {
      updateData.comisionCustom = comisionCustom;
    }

    await comercioRef.update(updateData);

    // Log de auditoría detallado
    await logAdminAction({
      adminId: req.admin.uid,
      adminEmail: req.admin.email,
      adminRole: req.admin.role,
      accion: 'configurar_plan_custom',
      entidad: 'comercio',
      entidadId: id,
      datosAnteriores: {
        tipoPlan: datosAnteriores.tipoPlan,
        limiteEventosCustom: datosAnteriores.limiteEventosCustom,
        limiteDestacadosCustom: datosAnteriores.limiteDestacadosCustom,
        limiteUsuariosCustom: datosAnteriores.limiteUsuariosCustom,
        comisionCustom: datosAnteriores.comisionCustom
      },
      datosNuevos: updateData,
      motivo
    });

    res.json({ 
      message: 'Plan configurado exitosamente', 
      comercio: { id, ...updateData } 
    });
  } catch (error) {
    console.error('Error configurando plan:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

### 1.5 Modificar Lógica de Verificación de Límites

**Archivo:** `/backend/src/routes/eventos.routes.js` (MODIFICAR)

Encontrar la sección que verifica límites de eventos y reemplazar:

```javascript
// ANTES:
if (comercio.tipoPlan !== 'enterprise' && eventosActivos >= comercio.limiteEventos) {
  return res.status(403).json({
    error: `Has alcanzado el límite de ${comercio.limiteEventos} eventos...`
  });
}

// DESPUÉS:
// Verificar límite custom primero, luego plan estándar
const limiteEfectivo = comercio.limiteEventosCustom !== undefined 
  ? comercio.limiteEventosCustom 
  : comercio.limiteEventos;

if (comercio.tipoPlan !== 'enterprise' && limiteEfectivo !== -1 && eventosActivos >= limiteEfectivo) {
  return res.status(403).json({
    error: `Has alcanzado el límite de ${limiteEfectivo} eventos para tu configuración actual.`
  });
}
```

Aplicar el mismo patrón para verificación de destacados y usuarios.

---

### 1.6 Script para Crear Usuarios Admin

**Archivo:** `/backend/scripts/create-admin-user.js`

```javascript
const admin = require('../src/config/firebase').admin;

/**
 * Script para asignar custom claims de admin a un usuario
 * Uso: node scripts/create-admin-user.js email@example.com super_admin
 */
async function createAdmin() {
  const email = process.argv[2];
  const role = process.argv[3] || 'super_admin';

  if (!email) {
    console.error('❌ Error: Debes proporcionar un email');
    console.log('Uso: node scripts/create-admin-user.js email@example.com super_admin');
    process.exit(1);
  }

  try {
    // Buscar usuario por email
    const user = await admin.auth().getUserByEmail(email);
    
    // Asignar custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      admin: true,
      adminRole: role
    });

    console.log(`✅ Usuario ${email} configurado como administrador`);
    console.log(`   - UID: ${user.uid}`);
    console.log(`   - Rol: ${role}`);
    console.log('\n🔐 El usuario debe cerrar sesión y volver a iniciar para que los cambios surtan efecto.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
```

---

### 1.7 Registrar Rutas en index.js

**Archivo:** `/backend/src/index.js` (MODIFICAR)

Agregar después de las rutas existentes:

```javascript
// Panel de Administrador - Admin Routes (NUEVO)
const verifyAdmin = require('./middleware/verifyAdmin').verifyAdmin;
app.use('/api/admin/dashboard', verifyAdmin, require('./routes/admin/dashboard.routes'));
app.use('/api/admin/comercios', verifyAdmin, require('./routes/admin/comercios.routes'));
app.use('/api/admin/reportes', verifyAdmin, require('./routes/admin/reportes.routes'));
app.use('/api/admin/auditoria', verifyAdmin, require('./routes/admin/auditoria.routes'));
```

---

## 🎨 FASE 2: FRONTEND ADMIN (Días 4-7)

### 2.1 Crear Proyecto Admin Panel

```bash
cd /Users/jules/MyApps/gradanegra
npx create-next-app@latest admin-panel --typescript --tailwind --app --no-src-dir
cd admin-panel
npm install firebase chart.js recharts
```

### 2.2 Configurar Puerto 3001

**Archivo:** `/admin-panel/next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  },
  // Configurar puerto en package.json scripts
};

module.exports = nextConfig;
```

**Modificar:** `/admin-panel/package.json`

```json
{
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001"
  }
}
```

---

### 2.3 Componentes Base

Ya tienes los diseños HTML completos en:
- `platform_admin_dashboard/code.html`
- `merchant_management_list/code.html`
- `merchant_detail_&_custom_plan_configuration/code.html`
- `custom_plan_&_limits_configuration_modal/code.html`
- `reports_and_commissions_screen/code.html`

**PLAN:** Convertir cada HTML a componentes React/TypeScript manteniendo exactamente el diseño.

---

## 📊 ENDPOINTS RESUMEN

### Dashboard (4 endpoints)
```
GET /api/admin/dashboard/metricas
GET /api/admin/dashboard/planes
GET /api/admin/dashboard/top-comercios?periodo=30d
GET /api/admin/dashboard/actividad?limit=10
```

### Comercios (7 endpoints)
```
GET /api/admin/comercios?status=activo&tipoPlan=pro&limit=25&offset=0
GET /api/admin/comercios/:id
GET /api/admin/comercios/:id/estadisticas
GET /api/admin/comercios/:id/eventos
PUT /api/admin/comercios/:id (actualizar info básica)
PATCH /api/admin/comercios/:id/estado (activar/desactivar)
PUT /api/admin/comercios/:id/plan (configurar custom) ⭐ CRÍTICO
```

### Reportes (2 endpoints)
```
GET /api/admin/reportes/comisiones?fechaInicio=2025-01-01&fechaFin=2025-01-31
GET /api/admin/reportes/exportar?formato=excel
```

### Auditoría (1 endpoint)
```
GET /api/admin/auditoria?limit=50&offset=0
```

---

## 🔐 SEGURIDAD

### Custom Claims en Firebase Auth
```javascript
{
  admin: true,
  adminRole: 'super_admin' | 'finance_admin' | 'support_admin'
}
```

### Permisos por Rol:
- **super_admin**: Acceso total
- **finance_admin**: Dashboard, reportes (solo lectura comercios)
- **support_admin**: Ver/activar comercios (sin modificar planes)

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Backend (Día 1-3)
- [ ] 1. Crear middleware `verifyAdmin.js`
- [ ] 2. Crear utilidad `adminLogger.js`
- [ ] 3. Crear rutas `dashboard.routes.js` (4 endpoints)
- [ ] 4. Crear rutas `comercios.routes.js` (7 endpoints)
- [ ] 5. Crear rutas `reportes.routes.js` (2 endpoints)
- [ ] 6. Crear rutas `auditoria.routes.js` (1 endpoint)
- [ ] 7. Modificar `eventos.routes.js` (verificación custom)
- [ ] 8. Modificar `usuarios-comercios.routes.js` (verificación custom)
- [ ] 9. Crear script `create-admin-user.js`
- [ ] 10. Registrar rutas en `index.js`
- [ ] 11. Probar endpoints con Postman

### Frontend (Día 4-7)
- [ ] 12. Crear proyecto Next.js en `/admin-panel`
- [ ] 13. Configurar Firebase y puerto 3001
- [ ] 14. Crear layout base con Sidebar
- [ ] 15. Implementar página Dashboard
- [ ] 16. Implementar página Lista de Comercios
- [ ] 17. Implementar página Detalle de Comercio
- [ ] 18. Implementar Modal de Configuración Custom ⭐
- [ ] 19. Implementar página de Reportes
- [ ] 20. Probar flujo completo end-to-end

---

## 🚦 CRITERIOS DE ÉXITO

✅ Admin puede hacer login con cuenta especial  
✅ Dashboard muestra métricas correctas  
✅ Puede listar y filtrar comercios  
✅ Puede ver detalle de un comercio  
✅ **Puede modificar límites custom y comisión** ⭐  
✅ Los cambios se reflejan en verificaciones del backend  
✅ Todos los cambios se registran en audit log  
✅ Puede exportar reportes de comisiones  
✅ UI es responsive y profesional  

---

## 📝 NOTAS IMPORTANTES

1. **Prioridad #1:** Sistema de configuración custom (Modal + Endpoint PUT /plan)
2. Mantener diseño exacto de los HTML proporcionados
3. Todos los cambios admin deben loggearse en `admin_logs`
4. Validar permisos en cada endpoint backend
5. Frontend debe mostrar claramente cuando un valor es custom vs. estándar

---

**¿Listo para empezar la implementación?** 🚀

Siguiente comando:
```bash
cd /Users/jules/MyApps/gradanegra/backend/src
mkdir -p middleware routes/admin utils
```
