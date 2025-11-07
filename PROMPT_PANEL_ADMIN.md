# PROMPT: Panel de Administración de Plataforma - Grada Negra

## 🎯 CONTEXTO DEL PROYECTO

**Grada Negra** es una plataforma SaaS multi-tenant de venta de boletos para eventos en Colombia (similar a Ticketmaster). Estamos implementando un **Panel de Administración de Plataforma** que permite a los super-administradores gestionar todos los comercios/organizadores, sus planes de suscripción, comisiones, límites personalizados, y monitorear la salud general de la plataforma.

---

## 🔑 CARACTERÍSTICAS PRINCIPALES

### Gestión de Comercios
- Listar todos los comercios con filtros avanzados
- Activar/Desactivar comercios
- Ver estadísticas detalladas de cada comercio
- Editar información básica de comercios
- Ver eventos activos, totales y métricas de ventas

### Gestión de Planes Personalizados
- Ver el plan actual de cada comercio (FREE, BASIC, PRO, ENTERPRISE)
- **Modificar límites custom** por comercio individual:
  - Límite de eventos gratuitos (override del plan estándar)
  - Límite de eventos destacados
  - Límite de usuarios del comercio
  - Porcentaje de comisión personalizado
- Asignar/Cambiar planes
- Ver historial de cambios de plan

### Gestión de Comisiones
- Ver comisiones generadas por comercio
- Modificar % de comisión por comercio (override)
- Ver total de comisiones de la plataforma
- Exportar reportes de comisiones
- Filtrar por período de tiempo

### Dashboard Administrativo
- Métricas globales de la plataforma
- Total de comercios activos/inactivos
- Total de eventos activos en la plataforma
- Total de boletos vendidos
- Ingresos brutos y comisiones totales
- Gráficas de crecimiento
- Actividad reciente

### Gestión de Usuarios Admin
- Crear/editar/eliminar usuarios administradores
- Roles: `super_admin`, `finance_admin`, `support_admin`
- Log de actividades administrativas

---

## 🏗️ ESTRUCTURA DEL SISTEMA

### Modelo de Datos Actual

#### **COMERCIO** (Organizador de Eventos)
```javascript
{
  id: string,
  nombre: string,
  slug: string,
  descripcion: string,
  logo: string (URL),
  imagenBanner: string (URL),
  email: string,
  telefono: string,
  direccion: string,
  ciudad: string,
  pais: string (default: 'Colombia'),
  website: string,
  redesSociales: {
    facebook: string,
    instagram: string,
    twitter: string,
    tiktok: string
  },
  colorPrimario: string (hex),
  colorSecundario: string (hex),
  
  // PLAN Y LÍMITES (Configurables por Admin)
  tipoPlan: 'free' | 'basic' | 'pro' | 'enterprise',
  limiteEventos: number, // -1 = ilimitado
  limiteDestacados: number,
  limiteUsuarios: number,
  comision: number, // Porcentaje (0-100)
  
  // ESTADO
  status: 'activo' | 'inactivo' | 'suspendido',
  
  // METADATOS
  createdAt: timestamp,
  updatedAt: timestamp,
  fechaSuspension: timestamp (nullable),
  motivoSuspension: string (nullable)
}
```

**PLANES ESTÁNDAR:**
```javascript
const PLANES = {
  free: {
    eventos: 2,
    destacados: 0,
    usuarios: 1,
    comision: 10.0,
    precio: 0
  },
  basic: {
    eventos: 10,
    destacados: 0,
    usuarios: 2,
    comision: 7.0,
    precio: 99000 // COP mensual
  },
  pro: {
    eventos: 50,
    destacados: 2,
    usuarios: 3,
    comision: 5.0,
    precio: 299000 // COP mensual
  },
  enterprise: {
    eventos: -1, // ilimitado
    destacados: 5,
    usuarios: 10,
    comision: 3.0,
    precio: 999000 // COP mensual
  }
};
```

**IMPORTANTE:** Los comercios tienen configuraciones **custom** que pueden override los valores del plan estándar. Por ejemplo, un comercio en plan BASIC puede tener `limiteEventos: 15` si el admin lo personaliza.

#### **EVENTO**
```javascript
{
  id: string,
  comercioId: string,
  nombre: string,
  descripcion: string,
  imagen: string (URL),
  ciudad: string,
  ubicacion: string,
  destacado: boolean,
  status: 'activo' | 'pausado' | 'finalizado' | 'cancelado',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **FECHA_EVENTO**
```javascript
{
  id: string,
  eventoId: string,
  fecha: string (YYYY-MM-DD),
  horaInicio: string (HH:MM),
  horaFin: string (HH:MM),
  aforoTotal: number,
  aforoDisponible: number,
  status: 'activa' | 'agotada' | 'cancelada',
  createdAt: timestamp
}
```

#### **TIER** (Tipos de entrada)
```javascript
{
  id: string,
  fechaEventoId: string,
  nombre: string,
  descripcion: string,
  precio: number,
  cantidad: number,
  disponibles: number,
  orden: number,
  status: 'activo' | 'agotado' | 'inactivo'
}
```

#### **BOLETO**
```javascript
{
  id: string,
  tierId: string,
  numeroBoleto: string,
  precio: number,
  compraId: string,
  status: 'vendido' | 'usado' | 'cancelado',
  qrCode: string (Data URL),
  fechaUso: timestamp (nullable),
  eventoNombre: string,
  eventoImagen: string,
  fechaEvento: string,
  tierNombre: string,
  createdAt: timestamp
}
```

#### **COMPRA**
```javascript
{
  id: string,
  userId: string,
  comercioId: string,
  eventoId: string,
  metodoPago: 'tarjeta' | 'pse' | 'efectivo' | 'transferencia',
  subtotal: number,
  descuento: number,
  total: number,
  cuponId: string (nullable),
  status: 'pendiente' | 'completada' | 'cancelada' | 'reembolsada',
  nombre: string,
  email: string,
  telefono: string,
  cedula: string,
  fechaCompra: timestamp,
  cantidadBoletos: number,
  eventoNombre: string,
  createdAt: timestamp
}
```

#### **USUARIO** (Comprador)
```javascript
{
  uid: string,
  email: string,
  displayName: string,
  photoURL: string,
  phoneNumber: string,
  cedula: string,
  ciudad: string,
  pais: string,
  status: 'activo' | 'inactivo',
  createdAt: timestamp
}
```

#### **USUARIOS_COMERCIOS** (Staff del comercio)
```javascript
{
  id: string,
  userId: string, // Firebase Auth UID
  comercioId: string,
  rol: 'admin' | 'editor' | 'verificador',
  email: string,
  displayName: string,
  status: 'activo' | 'inactivo',
  createdAt: timestamp
}
```

#### **ADMIN_LOG** (Nueva colección para auditoría)
```javascript
{
  id: string,
  adminId: string, // Firebase Auth UID del admin
  adminEmail: string,
  accion: string, // 'activar_comercio', 'modificar_plan', 'cambiar_comision', etc.
  entidad: 'comercio' | 'evento' | 'plan' | 'usuario',
  entidadId: string,
  datosAnteriores: object,
  datosNuevos: object,
  timestamp: timestamp
}
```

---

## 🎨 REQUISITOS DE DISEÑO

### 1. **ACCESO AL PANEL DE ADMINISTRADOR**

**URL Independiente:**
- Local: `http://localhost:3001` (puerto diferente del frontend principal)
- Producción: `https://admin.gradanegra.com` (o similar)

**Autenticación:**
- Login separado con Firebase Auth
- Solo usuarios con claim `admin: true` en Firebase Auth pueden acceder
- Roles: `super_admin`, `finance_admin`, `support_admin`

**Layout General:**
- Sidebar izquierdo con navegación principal
- Header con:
  - Logo de Grada Negra + badge "Admin"
  - Buscador global
  - Notificaciones
  - Avatar del admin con dropdown
- Breadcrumbs para navegación
- Tema oscuro por defecto (profesional)

---

### 2. **PÁGINA: DASHBOARD PRINCIPAL** (`/admin/dashboard`)

#### Layout de 4 Filas

**FILA 1: MÉTRICAS GLOBALES (4 cards)**
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Comercios  │   Eventos   │   Boletos   │  Comisiones │
│   Activos   │   Activos   │  Vendidos   │    Totales  │
│     124     │     856     │   45,329    │  $12.5M COP │
│  ↗ +12%    │  ↗ +8%     │  ↗ +23%    │   ↗ +15%    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```
- Colores: Azul (#0d59f2), Verde (#10b981), Morado (#8b5cf6), Amarillo (#f59e0b)
- Iconos: Material Symbols (`store`, `event`, `confirmation_number`, `paid`)
- Comparación con período anterior (flecha ↗↘ y porcentaje)
- Al hacer click, filtrar vista correspondiente

**FILA 2: GRÁFICA DE INGRESOS Y COMISIONES (2 columnas)**
```
┌────────────────────────────────┬────────────────────────────┐
│  Ingresos Brutos vs Comisiones │  Comercios por Plan        │
│  (Últimos 12 meses)            │  (Gráfica de Donut)        │
│  [Gráfica de líneas]           │  FREE: 45%                 │
│                                │  BASIC: 30%                │
│                                │  PRO: 20%                  │
│                                │  ENTERPRISE: 5%            │
└────────────────────────────────┴────────────────────────────┘
```
- Gráfica de líneas: Chart.js o Recharts
- Selector de rango de fechas (últimos 7d, 30d, 90d, 1y, custom)

**FILA 3: TOP COMERCIOS (Tabla compacta)**
```
┌────────────────────────────────────────────────────────────┐
│  Top 10 Comercios por Ventas (Este mes)                    │
├───┬──────────────┬──────┬──────────┬────────┬─────────────┤
│ # │ Comercio     │ Plan │ Eventos  │ Ventas │ Comisiones  │
├───┼──────────────┼──────┼──────────┼────────┼─────────────┤
│ 1 │ Movistar A.  │ PRO  │    12    │ $2.5M  │ $125K (5%)  │
│ 2 │ Royal Center │ ENT  │    45    │ $2.1M  │ $63K (3%)   │
│ 3 │ ClubX Events │ BASIC│     8    │ $890K  │ $62.3K (7%) │
└───┴──────────────┴──────┴──────────┴────────┴─────────────┘
```
- Link a detalle del comercio en cada fila
- Ordenable por columna

**FILA 4: ACTIVIDAD RECIENTE (Timeline)**
```
┌────────────────────────────────────────────────────────────┐
│  Actividad Administrativa Reciente                         │
├────────────────────────────────────────────────────────────┤
│ 🟢 Hace 2h - Admin: maria@grada.com                        │
│    Activó comercio "Festival del Sur" (#C-1234)           │
│                                                            │
│ 🔵 Hace 5h - Admin: carlos@grada.com                       │
│    Modificó comisión de "Royal Center" de 5% → 3%         │
│                                                            │
│ 🟡 Hace 1d - Admin: maria@grada.com                        │
│    Cambió plan de "ClubX Events" de FREE → BASIC          │
└────────────────────────────────────────────────────────────┘
```
- Últimas 10 acciones
- Link a "Ver todo el log" → página de auditoría completa

---

### 3. **PÁGINA: GESTIÓN DE COMERCIOS** (`/admin/comercios`)

#### Header con Filtros y Búsqueda
```
┌──────────────────────────────────────────────────────────────┐
│ Gestión de Comercios                         [+ Nuevo]      │
├──────────────────────────────────────────────────────────────┤
│ [🔍 Buscar por nombre o email...]                           │
│                                                              │
│ Filtros:                                                     │
│ [Plan: Todos ▼] [Estado: Todos ▼] [Ciudad: Todas ▼]        │
│ [Ordenar por: Ventas ▼]                                     │
└──────────────────────────────────────────────────────────────┘
```

#### Tabla Principal de Comercios
```
┌────┬──────────┬───────────────┬──────┬────────┬─────────┬─────────┬────────────┐
│    │ Logo     │ Comercio      │ Plan │ Estado │ Eventos │ Ventas  │ Acciones   │
├────┼──────────┼───────────────┼──────┼────────┼─────────┼─────────┼────────────┤
│ 🟢 │ [IMG]    │ Movistar A.   │ PRO  │ Activo │  12/50  │ $2.5M   │ [Ver][✏️][⚙️]│
│    │          │ movistar@...  │      │        │  2★     │ Com:5%  │            │
│    │          │ Bogotá        │      │        │         │         │            │
├────┼──────────┼───────────────┼──────┼────────┼─────────┼─────────┼────────────┤
│ 🔴 │ [IMG]    │ Festival X    │ FREE │ Inact. │   0/2   │   $0    │ [Ver][✏️][⚙️]│
│    │          │ festx@...     │      │        │  0★     │ Com:10% │            │
│    │          │ Medellín      │      │        │         │         │            │
└────┴──────────┴───────────────┴──────┴────────┴─────────┴─────────┴────────────┘
```

**Columnas:**
1. **Indicador de Estado**: 🟢 Activo, 🔴 Inactivo, 🟡 Suspendido
2. **Logo**: Miniatura circular
3. **Comercio**: 
   - Nombre (bold, clickeable)
   - Email (gris, pequeño)
   - Ciudad (gris, pequeño)
4. **Plan**: Badge con color según plan
   - FREE (gris), BASIC (azul), PRO (morado), ENTERPRISE (dorado)
5. **Estado**: Badge de color
6. **Eventos**: 
   - `12/50` (activos/límite)
   - `2★` (destacados activos)
   - Si está cerca del límite (>80%), mostrar badge amarillo "⚠️ Límite próximo"
7. **Ventas**:
   - Total en COP (mes actual)
   - Comisión % (pequeño, abajo)
8. **Acciones**:
   - [Ver]: Ver detalle completo
   - [✏️]: Editar información básica
   - [⚙️]: Configurar plan y límites custom

**Paginación:**
- 25 por página
- Botones de navegación en footer de tabla

---

### 4. **PÁGINA: DETALLE DE COMERCIO** (`/admin/comercios/:id`)

#### Layout de 3 Columnas

**COLUMNA IZQUIERDA (Información del Comercio)**
```
┌─────────────────────────────────────┐
│        [LOGO GRANDE]                │
│                                     │
│  Movistar Arena Bogotá              │
│  movistar@arena.com                 │
│  +57 300 123 4567                   │
│  Bogotá, Colombia                   │
│                                     │
│  Estado: [🟢 Activo]    [Suspender] │
│                                     │
│  Plan Actual: [PRO Badge]           │
│  Miembro desde: 15 Ene 2024         │
│  Última actividad: Hace 2 horas     │
│                                     │
│  [Editar Información]               │
│  [Configurar Plan]                  │
│  [Ver Eventos]                      │
└─────────────────────────────────────┘
```

**COLUMNA CENTRAL (Estadísticas del Comercio)**
```
┌─────────────────────────────────────┐
│  Estadísticas (Últimos 30 días)    │
├─────────────────────────────────────┤
│  [Card] Eventos Activos: 12        │
│  [Card] Boletos Vendidos: 1,234    │
│  [Card] Ingresos Brutos: $2.5M     │
│  [Card] Comisiones: $125K (5%)     │
│                                     │
│  [Gráfica de ventas mensuales]     │
│                                     │
│  Eventos Destacados: 2/2           │
│  Usuarios del Comercio: 3/3        │
└─────────────────────────────────────┘
```

**COLUMNA DERECHA (Configuración de Plan Custom)**
```
┌─────────────────────────────────────┐
│  ⚙️ Configuración Custom del Plan   │
├─────────────────────────────────────┤
│  Plan Base: [PRO ▼]                │
│                                     │
│  Límites Personalizados:           │
│                                     │
│  Eventos Gratuitos:                │
│  [50] ← Plan estándar: 50          │
│  [✓] Custom: [75]                  │
│                                     │
│  Eventos Destacados:               │
│  [2] ← Plan estándar: 2            │
│  [✓] Custom: [5]                   │
│                                     │
│  Usuarios Permitidos:              │
│  [3] ← Plan estándar: 3            │
│  [✓] Custom: [5]                   │
│                                     │
│  Comisión (%):                     │
│  [5%] ← Plan estándar: 5%          │
│  [✓] Custom: [3%]                  │
│                                     │
│  💡 Nota: Los valores custom       │
│     overridean los del plan base   │
│                                     │
│  [Guardar Cambios]  [Restablecer]  │
│                                     │
│  Historial de Cambios:             │
│  • 5 Mar - Comisión: 5% → 3%       │
│  • 1 Feb - Eventos: 50 → 75        │
└─────────────────────────────────────┘
```

**TAB: Eventos del Comercio**
- Tabla con todos los eventos
- Filtros: activo, pausado, finalizado
- Acciones rápidas: pausar, reactivar, eliminar

**TAB: Transacciones y Comisiones**
- Historial de todas las compras
- Total de comisiones generadas
- Exportar a CSV/Excel

**TAB: Usuarios del Comercio**
- Lista de staff (admin, editor, verificador)
- Agregar/eliminar usuarios
- Ver actividad de cada usuario

---

### 5. **MODAL: CONFIGURAR PLAN Y LÍMITES CUSTOM**

Este modal es CRÍTICO para la funcionalidad principal del admin.

```
╔═══════════════════════════════════════════════════════════╗
║  ⚙️ Configuración Custom - Movistar Arena               ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  Plan Base:                                              ║
║  ○ FREE    ○ BASIC    ● PRO    ○ ENTERPRISE             ║
║                                                           ║
║  ─────────────────────────────────────────────────────── ║
║                                                           ║
║  Límites Personalizados                                  ║
║                                                           ║
║  Eventos Gratuitos:                                      ║
║  ┌─────────────────────────────────────────────┐        ║
║  │ Plan estándar PRO: 50 eventos               │        ║
║  │                                             │        ║
║  │ [x] Aplicar límite custom                  │        ║
║  │                                             │        ║
║  │ Límite custom: [__75__]                    │        ║
║  │ ( ) Sin límite (ilimitado)                 │        ║
║  └─────────────────────────────────────────────┘        ║
║                                                           ║
║  Eventos Destacados:                                     ║
║  ┌─────────────────────────────────────────────┐        ║
║  │ Plan estándar PRO: 2 destacados             │        ║
║  │                                             │        ║
║  │ [x] Aplicar límite custom                  │        ║
║  │                                             │        ║
║  │ Límite custom: [__5__]                     │        ║
║  └─────────────────────────────────────────────┘        ║
║                                                           ║
║  Usuarios del Comercio:                                  ║
║  ┌─────────────────────────────────────────────┐        ║
║  │ Plan estándar PRO: 3 usuarios               │        ║
║  │                                             │        ║
║  │ [x] Aplicar límite custom                  │        ║
║  │                                             │        ║
║  │ Límite custom: [__5__]                     │        ║
║  └─────────────────────────────────────────────┘        ║
║                                                           ║
║  Comisión de la Plataforma:                              ║
║  ┌─────────────────────────────────────────────┐        ║
║  │ Plan estándar PRO: 5.0%                     │        ║
║  │                                             │        ║
║  │ [x] Aplicar comisión custom                │        ║
║  │                                             │        ║
║  │ Comisión custom: [__3.0__] %               │        ║
║  │                                             │        ║
║  │ Rango permitido: 0% - 15%                  │        ║
║  └─────────────────────────────────────────────┘        ║
║                                                           ║
║  Motivo del cambio (opcional):                           ║
║  ┌─────────────────────────────────────────────┐        ║
║  │ [Negociación especial con cliente VIP...]  │        ║
║  └─────────────────────────────────────────────┘        ║
║                                                           ║
║  [Cancelar]              [Guardar Configuración]        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
```

**Validaciones:**
- Límite de eventos: mínimo 1, máximo 999 (o ilimitado)
- Límite de destacados: mínimo 0, máximo límite de eventos
- Límite de usuarios: mínimo 1, máximo 50
- Comisión: 0% - 15% (validación en 0.1 incrementos)

**Confirmación:**
Al guardar, mostrar confirmación:
```
┌────────────────────────────────────────┐
│  ✓ Configuración guardada              │
│                                        │
│  Los cambios se aplicarán de inmediato│
│  y se registrarán en el log de admin  │
│                                        │
│  [Aceptar]                             │
└────────────────────────────────────────┘
```

---

### 6. **PÁGINA: REPORTES Y COMISIONES** (`/admin/reportes`)

#### Sección 1: Filtros
```
┌──────────────────────────────────────────────────────────┐
│  Reportes de Comisiones                                  │
├──────────────────────────────────────────────────────────┤
│  Período:                                                │
│  [Desde: 01/01/2025] [Hasta: 31/01/2025]                │
│                                                          │
│  Filtros:                                                │
│  [Comercio: Todos ▼] [Plan: Todos ▼] [Ciudad: Todas ▼] │
│                                                          │
│  [Buscar] [Exportar Excel] [Exportar PDF]               │
└──────────────────────────────────────────────────────────┘
```

#### Sección 2: Resumen
```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│  Ingresos   │  Comisiones │  Ingresos   │  # Compras  │
│  Brutos     │  Totales    │  Netos      │  Totales    │
│  $25.5M     │   $1.2M     │  $24.3M     │   12,459    │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

#### Sección 3: Tabla Detallada
```
┌────────────────┬──────┬────────┬──────────┬────────────┬────────────┐
│ Comercio       │ Plan │ Com.%  │ Ingresos │ Comisiones │ # Ventas   │
├────────────────┼──────┼────────┼──────────┼────────────┼────────────┤
│ Movistar Arena │ PRO  │ 5%     │ $2.5M    │ $125K      │ 1,234      │
│ Royal Center   │ ENT  │ 3% ★   │ $2.1M    │ $63K       │ 987        │
│ ClubX Events   │ BASIC│ 7%     │ $890K    │ $62.3K     │ 567        │
└────────────────┴──────┴────────┴──────────┴────────────┴────────────┘
```
- ★ indica comisión custom (diferente al plan estándar)
- Click en fila abre detalle del comercio
- Exportable a Excel/CSV

---

### 7. **PÁGINA: LOG DE AUDITORÍA** (`/admin/auditoria`)

```
┌──────────────────────────────────────────────────────────┐
│  Log de Actividad Administrativa                         │
├──────────────────────────────────────────────────────────┤
│  Filtros:                                                │
│  [Admin: Todos ▼] [Acción: Todas ▼] [Fecha: 30d ▼]     │
└──────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Timestamp          │ Admin          │ Acción              │
├────────────────────┼────────────────┼─────────────────────┤
│ 2025-01-15 14:30  │ maria@g.com    │ 🟢 Activó comercio   │
│                    │                │ "Festival del Sur"  │
│                    │                │ [Ver detalles ▼]    │
├────────────────────┼────────────────┼─────────────────────┤
│ 2025-01-15 10:15  │ carlos@g.com   │ 🔵 Modificó comisión │
│                    │                │ Royal: 5% → 3%      │
│                    │                │ [Ver detalles ▼]    │
└────────────────────┴────────────────┴─────────────────────┘
```

**Detalles expandibles:**
Al hacer click en "Ver detalles":
```
┌──────────────────────────────────────────┐
│  Detalles del Cambio                     │
├──────────────────────────────────────────┤
│  Comercio: Royal Center (#C-0012)        │
│                                          │
│  Datos Anteriores:                       │
│  • comision: 5.0                         │
│                                          │
│  Datos Nuevos:                           │
│  • comision: 3.0                         │
│                                          │
│  Motivo: "Cliente VIP - negociación"    │
└──────────────────────────────────────────┘
```

---

### 8. **PÁGINA: ADMINISTRADORES** (`/admin/usuarios-admin`)

```
┌──────────────────────────────────────────────────────────┐
│  Gestión de Usuarios Administradores      [+ Nuevo]     │
├──────────────────────────────────────────────────────────┤
│  Email               │ Rol          │ Estado │ Acciones  │
├──────────────────────┼──────────────┼────────┼───────────┤
│ maria@grada.com      │ Super Admin  │ Activo │ [✏️] [🗑️]  │
│ carlos@grada.com     │ Finance Admin│ Activo │ [✏️] [🗑️]  │
│ ana@grada.com        │ Support Admin│ Inact. │ [✏️] [🗑️]  │
└──────────────────────┴──────────────┴────────┴───────────┘
```

**Modal: Nuevo Admin**
```
┌────────────────────────────────┐
│  Crear Nuevo Administrador     │
├────────────────────────────────┤
│  Email:                        │
│  [____________________]        │
│                                │
│  Nombre:                       │
│  [____________________]        │
│                                │
│  Rol:                          │
│  ○ Super Admin                 │
│  ○ Finance Admin               │
│  ○ Support Admin               │
│                                │
│  [Cancelar]     [Crear]        │
└────────────────────────────────┘
```

---

## 🔧 ESPECIFICACIONES TÉCNICAS

### Endpoints API Necesarios (Backend)

#### Gestión de Comercios
```javascript
// Listar todos los comercios con filtros
GET /api/admin/comercios
  ?status=activo
  &tipoPlan=pro
  &ciudad=Bogotá
  &limit=25
  &offset=0
  &orderBy=ventasTotales

// Obtener detalle de comercio
GET /api/admin/comercios/:id

// Actualizar información básica
PUT /api/admin/comercios/:id
Body: { nombre, email, telefono, etc. }

// Activar/Desactivar comercio
PATCH /api/admin/comercios/:id/estado
Body: { status: 'activo' | 'inactivo' | 'suspendido', motivo }

// Configurar plan y límites custom
PUT /api/admin/comercios/:id/plan
Body: {
  tipoPlan: 'pro',
  limiteEventosCustom: 75,
  limiteDestacadosCustom: 5,
  limiteUsuariosCustom: 5,
  comisionCustom: 3.0,
  motivo: "Negociación especial"
}

// Obtener estadísticas del comercio
GET /api/admin/comercios/:id/estadisticas
  ?fechaInicio=2025-01-01
  &fechaFin=2025-01-31

// Obtener eventos del comercio
GET /api/admin/comercios/:id/eventos
  ?status=activo
  &limit=25
  &offset=0
```

#### Dashboard y Estadísticas
```javascript
// Métricas globales de la plataforma
GET /api/admin/dashboard/metricas
Response: {
  comerciosActivos: number,
  eventosActivos: number,
  boletosVendidos: number,
  comisionesTotales: number,
  comparacionPeriodoAnterior: {
    comercios: percentage,
    eventos: percentage,
    boletos: percentage,
    comisiones: percentage
  }
}

// Ingresos y comisiones por período
GET /api/admin/dashboard/ingresos
  ?periodo=12m (7d, 30d, 90d, 12m, custom)
  &fechaInicio=2024-01-01
  &fechaFin=2025-01-31
Response: {
  ingresosPorMes: [
    { mes: '2024-01', ingresos: 1500000, comisiones: 75000 },
    ...
  ]
}

// Distribución de comercios por plan
GET /api/admin/dashboard/planes
Response: {
  free: { cantidad: 120, porcentaje: 45 },
  basic: { cantidad: 80, porcentaje: 30 },
  pro: { cantidad: 40, porcentaje: 20 },
  enterprise: { cantidad: 10, porcentaje: 5 }
}

// Top comercios por ventas
GET /api/admin/dashboard/top-comercios
  ?limit=10
  &periodo=30d

// Actividad reciente
GET /api/admin/dashboard/actividad
  ?limit=10
```

#### Reportes y Comisiones
```javascript
// Reporte de comisiones
GET /api/admin/reportes/comisiones
  ?fechaInicio=2025-01-01
  &fechaFin=2025-01-31
  &comercioId=optional
  &tipoPlan=optional
  &ciudad=optional
Response: {
  resumen: {
    ingresosBrutos: number,
    comisionesTotales: number,
    ingresosNetos: number,
    totalCompras: number
  },
  detalles: [
    {
      comercioId,
      comercioNombre,
      tipoPlan,
      comisionPorcentaje,
      ingresos,
      comisiones,
      ventasCount
    }
  ]
}

// Exportar reporte (devuelve archivo)
GET /api/admin/reportes/exportar
  ?formato=excel|csv|pdf
  &fechaInicio=2025-01-01
  &fechaFin=2025-01-31
```

#### Log de Auditoría
```javascript
// Listar log de actividad
GET /api/admin/auditoria
  ?adminId=optional
  ?accion=optional
  ?entidad=comercio|evento|plan
  ?fechaInicio=2025-01-01
  ?fechaFin=2025-01-31
  ?limit=50
  ?offset=0

// Crear entrada de log (automático en cada cambio)
POST /api/admin/auditoria
Body: {
  adminId,
  adminEmail,
  accion,
  entidad,
  entidadId,
  datosAnteriores,
  datosNuevos
}
```

#### Usuarios Admin
```javascript
// Listar admins
GET /api/admin/usuarios-admin

// Crear admin
POST /api/admin/usuarios-admin
Body: {
  email,
  displayName,
  rol: 'super_admin' | 'finance_admin' | 'support_admin'
}

// Actualizar admin
PUT /api/admin/usuarios-admin/:id

// Eliminar admin
DELETE /api/admin/usuarios-admin/:id
```

### Seguridad y Autenticación

**Firebase Auth Custom Claims:**
```javascript
// Al crear un usuario admin, agregar claim:
{
  admin: true,
  adminRole: 'super_admin' | 'finance_admin' | 'support_admin'
}

// Middleware de verificación en backend:
const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization;
  const decodedToken = await admin.auth().verifyIdToken(token);
  
  if (!decodedToken.admin) {
    return res.status(403).json({ error: 'Acceso denegado' });
  }
  
  req.admin = decodedToken;
  next();
};

// Aplicar a todas las rutas admin:
app.use('/api/admin/*', verifyAdmin);
```

**Permisos por Rol:**
- **super_admin**: Acceso total
- **finance_admin**: Dashboard, reportes, comisiones (solo lectura de comercios)
- **support_admin**: Ver comercios, activar/desactivar (sin modificar planes)

### Estructura de Firestore

**Colección: `admin_logs`**
```javascript
{
  id: auto-generated,
  adminId: string,
  adminEmail: string,
  adminRole: string,
  accion: string,
  entidad: 'comercio' | 'evento' | 'plan' | 'usuario',
  entidadId: string,
  datosAnteriores: {
    // Estado anterior de los campos modificados
    comision: 5.0,
    limiteEventos: 50
  },
  datosNuevos: {
    // Nuevo estado
    comision: 3.0,
    limiteEventos: 75
  },
  motivo: string (opcional),
  timestamp: Firestore.Timestamp
}
```

**Índices necesarios en Firestore:**
```javascript
// comercios
- status + tipoPlan + ciudad
- tipoPlan + createdAt
- status + createdAt

// admin_logs
- adminId + timestamp
- entidad + entidadId + timestamp
- timestamp (descendente)
```

---

## 🎨 COMPONENTES DE DISEÑO

### Paleta de Colores (Dark Mode)

```css
:root {
  /* Backgrounds */
  --bg-primary: #0f172a;      /* Slate 900 */
  --bg-secondary: #1e293b;    /* Slate 800 */
  --bg-tertiary: #334155;     /* Slate 700 */
  
  /* Borders */
  --border-color: #475569;    /* Slate 600 */
  
  /* Text */
  --text-primary: #f1f5f9;    /* Slate 100 */
  --text-secondary: #cbd5e1;  /* Slate 300 */
  --text-muted: #94a3b8;      /* Slate 400 */
  
  /* Brand */
  --brand-primary: #0d59f2;   /* Azul Grada Negra */
  --brand-hover: #0a47c4;
  
  /* Status */
  --success: #10b981;         /* Green 500 */
  --warning: #f59e0b;         /* Amber 500 */
  --danger: #ef4444;          /* Red 500 */
  --info: #3b82f6;            /* Blue 500 */
  
  /* Plans */
  --plan-free: #6b7280;       /* Gray 500 */
  --plan-basic: #3b82f6;      /* Blue 500 */
  --plan-pro: #8b5cf6;        /* Violet 500 */
  --plan-enterprise: #f59e0b; /* Amber 500 */
}
```

### Componentes Reutilizables

**Badges:**
```jsx
// Badge de Plan
<Badge variant="free|basic|pro|enterprise">
  PRO
</Badge>

// Badge de Estado
<Badge variant="success|warning|danger">
  Activo
</Badge>
```

**Cards de Métricas:**
```jsx
<MetricCard
  title="Comercios Activos"
  value={124}
  change={12}
  changeType="increase"
  icon={<StoreIcon />}
  color="blue"
/>
```

**Tabla Admin:**
```jsx
<AdminTable
  columns={columns}
  data={data}
  sortable={true}
  paginated={true}
  onRowClick={handleRowClick}
  actions={rowActions}
/>
```

**Formulario de Filtros:**
```jsx
<FilterBar>
  <SearchInput />
  <SelectFilter name="plan" options={planOptions} />
  <SelectFilter name="status" options={statusOptions} />
  <DateRangeFilter />
</FilterBar>
```

---

## 📱 RESPONSIVENESS

El panel admin estará optimizado principalmente para **desktop** (1440px+), pero debe funcionar en tablets (768px+).

**Mobile (< 768px):**
- Sidebar colapsable
- Tablas se convierten en cards apiladas
- Gráficas responsivas
- Modales ocupan pantalla completa

---

## 🚀 PRIORIDADES DE IMPLEMENTACIÓN

### Fase 1 (MVP) - ALTA PRIORIDAD
1. ✅ Dashboard con métricas globales
2. ✅ Listado de comercios con filtros
3. ✅ Detalle de comercio con estadísticas
4. ✅ **Modal de configuración custom de plan** (CRÍTICO)
5. ✅ Activar/Desactivar comercios
6. ✅ Log básico de auditoría

### Fase 2 - MEDIA PRIORIDAD
7. Reportes de comisiones
8. Exportación a Excel/CSV
9. Top comercios y gráficas avanzadas
10. Gestión de usuarios admin

### Fase 3 - BAJA PRIORIDAD
11. Notificaciones en tiempo real
12. Dashboard personalizable
13. Alertas automáticas (comercio cerca de límite)
14. Comparación de períodos

---

## 📋 CONSIDERACIONES ESPECIALES

### 1. **Sistema de Override de Límites**

El backend debe verificar en este orden:
```javascript
// Ejemplo: verificar límite de eventos
async function verificarLimiteEventos(comercioId) {
  const comercio = await db.collection('comercios').doc(comercioId).get();
  const data = comercio.data();
  
  // 1. Verificar si hay límite custom
  if (data.limiteEventosCustom !== undefined && data.limiteEventosCustom !== null) {
    return data.limiteEventosCustom; // Usar custom
  }
  
  // 2. Si no hay custom, usar del plan estándar
  return data.limiteEventos; // Usar plan
}
```

### 2. **Registro Automático de Cambios**

Cada endpoint que modifique un comercio debe crear un log:
```javascript
async function logAdminAction(adminId, accion, entidad, entidadId, antes, despues, motivo) {
  await db.collection('admin_logs').add({
    adminId,
    adminEmail: req.admin.email,
    adminRole: req.admin.adminRole,
    accion,
    entidad,
    entidadId,
    datosAnteriores: antes,
    datosNuevos: despues,
    motivo: motivo || null,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
}
```

### 3. **Validaciones de Negocio**

- No se puede desactivar un comercio con eventos activos en las próximas 24h
- No se puede reducir el límite de eventos si ya tiene más eventos activos
- Comisión mínima: 0%, máxima: 15%
- Al cambiar plan, validar compatibilidad con límites actuales

### 4. **Performance**

- Cachear métricas de dashboard (Redis o Firestore con TTL)
- Paginar todas las listas (25-50 items por página)
- Usar índices compuestos en Firestore
- Lazy loading en tablas grandes

---

## 🎯 RESULTADO ESPERADO

Una plataforma administrativa **profesional, intuitiva y potente** que permita a los administradores de Grada Negra:

1. ✅ **Visibilidad total** de todos los comercios y su actividad
2. ✅ **Control granular** sobre planes y límites individuales
3. ✅ **Gestión flexible** de comisiones personalizadas
4. ✅ **Monitoreo en tiempo real** de la salud de la plataforma
5. ✅ **Auditoría completa** de todos los cambios administrativos
6. ✅ **Reportes financieros** claros y exportables

**Diferenciador clave:** La capacidad de hacer **modificaciones custom por comercio** sin cambiar el plan base, permitiendo negociaciones especiales con clientes VIP o casos de uso particulares.

---

## 📚 REFERENCIAS DE DISEÑO

Inspiración de interfaces admin existentes:
- **Stripe Dashboard**: Métricas claras, gráficas minimalistas
- **Shopify Admin**: Tablas bien organizadas, filtros intuitivos
- **Firebase Console**: Dark mode profesional, navegación clara
- **Linear**: UI limpia, acciones rápidas, búsqueda potente

---

**Versión:** 1.0  
**Fecha:** 7 de Noviembre, 2025  
**Autor:** Equipo Grada Negra  
**Para:** Diseñador UI/UX
