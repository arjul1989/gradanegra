# PROMPT: Panel de Administración para Comercios - Grada Negra

## 🎯 CONTEXTO DEL PROYECTO

**Grada Negra** es una plataforma de venta de boletos para eventos en Colombia (similar a Ticketmaster). Estamos implementando un **Panel de Administración para Comercios/Organizadores** que les permita gestionar sus eventos, boletos y perfil empresarial.

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
  tipoPlan: 'free' | 'basic' | 'pro' | 'enterprise',
  limiteEventos: number,
  comision: number (porcentaje),
  status: 'activo' | 'inactivo',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

**PLANES DISPONIBLES:**
- **FREE**: 2 eventos, 1 usuario, 10% comisión, sin destacados
- **BASIC**: 10 eventos, 2 usuarios, 7% comisión, sin destacados
- **PRO**: 50 eventos, 3 usuarios, 5% comisión, 2 destacados
- **ENTERPRISE**: ilimitado, 10 usuarios, 3% comisión, 5 destacados

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

#### **FECHA_EVENTO** (Un evento puede tener múltiples fechas)
```javascript
{
  id: string,
  eventoId: string,
  fecha: string (YYYY-MM-DD),
  horaInicio: string (HH:MM),
  horaFin: string (HH:MM, opcional),
  aforoTotal: number,
  aforoDisponible: number,
  status: 'activa' | 'agotada' | 'cancelada',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **TIER** (Tipos de entrada: General, VIP, Palco, etc.)
```javascript
{
  id: string,
  fechaEventoId: string,
  nombre: string (ej: 'General', 'VIP', 'Palco'),
  descripcion: string,
  precio: number,
  cantidad: number (total de boletos),
  disponibles: number,
  orden: number (para ordenar tiers),
  status: 'activo' | 'agotado' | 'inactivo',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### **BOLETO** (Boletos individuales generados automáticamente)
```javascript
{
  id: string,
  tierId: string,
  numeroBoleto: string (único, ej: 'GN-001234'),
  precio: number,
  compraId: string (null hasta que se venda),
  status: 'disponible' | 'reservado' | 'vendido' | 'usado' | 'cancelado',
  qrCode: string (generado al vender),
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

## 🎨 REQUISITOS DE DISEÑO

### 1. **ACCESO AL PANEL**

**Ubicación del Botón:**
- En el header principal (junto al botón "Ayuda")
- Texto: "Negocios" o "Panel Comercios"
- Icono: Material Symbol `business` o `storefront`
- Debe redirigir a `/panel` o `/comercios/login`

**Flujo de Autenticación:**
1. Click en "Negocios" → Pantalla de Login
2. Login con Google (reutilizar el sistema existente)
3. Verificar que el usuario tenga un `comercioId` asociado
4. Si tiene comercio → Dashboard
5. Si NO tiene comercio → Mensaje "No tienes permisos" o "Solicita acceso"

---

### 2. **PANTALLAS REQUERIDAS**

#### **A. LOGIN / AUTENTICACIÓN**
- Replicar la pantalla de login existente
- Botón "Continuar con Google"
- Logo de Grada Negra
- Título: "Panel de Comercios"
- Mensaje: "Gestiona tus eventos y ventas"

#### **B. DASHBOARD PRINCIPAL**
Debe mostrar:
- **Header:**
  - Logo del comercio (si tiene)
  - Nombre del comercio
  - Notificaciones
  - Menú de usuario (perfil, cerrar sesión)

- **Sidebar Izquierdo (Navegación):**
  - 📊 Dashboard (inicio)
  - 🎟️ Mis Eventos
  - ➕ Crear Evento
  - 👤 Mi Perfil
  - 📈 Estadísticas
  - ⚙️ Configuración
  - ❓ Ayuda

- **Contenido Principal - Resumen:**
  - **Tarjetas de Estadísticas:**
    - Eventos Activos (con límite del plan)
    - Boletos Vendidos (este mes)
    - Ingresos Netos (después de comisiones)
    - Próximo Evento (fecha más cercana)
  
  - **Plan Actual:**
    - Badge con el plan (FREE/BASIC/PRO/ENTERPRISE)
    - Límite de eventos usados (ej: "3/10 eventos")
    - Botón "Mejorar Plan"
    - Comisión actual (ej: "7%")

  - **Eventos Recientes:**
    - Lista de últimos 5 eventos creados
    - Cada evento muestra: imagen, nombre, ciudad, status, ventas

  - **Gráficas (opcional para PRO/ENTERPRISE):**
    - Ventas por mes
    - Eventos más vendidos

#### **C. MIS EVENTOS (Lista)**
- **Vista de Tabla o Cards:**
  - Imagen del evento
  - Nombre
  - Ciudad
  - Fechas próximas
  - Status (activo/pausado/finalizado)
  - Boletos vendidos / Total
  - Ingresos
  - Acciones: Ver | Editar | Pausar | Eliminar

- **Filtros:**
  - Por ciudad
  - Por status
  - Por rango de fechas
  - Buscar por nombre

- **Botón destacado:** "➕ Crear Nuevo Evento"

#### **D. CREAR/EDITAR EVENTO**
**Formulario en pasos (Wizard):**

**Paso 1: Información Básica**
- Nombre del evento *
- Descripción (textarea con editor rich text) *
- Categoría (select con categorías de BD)
- Ciudad *
- Ubicación / Dirección *
- Subir imagen principal (drag & drop) *
- Checkbox: "Destacar evento" (solo si el plan lo permite)

**Paso 2: Fechas y Horarios**
- Botón: "➕ Agregar Fecha"
- Por cada fecha:
  - Fecha (date picker) *
  - Hora inicio (time picker) *
  - Hora fin (time picker, opcional)
  - Aforo total *
  - Botón: "🗑️ Eliminar fecha"

**Paso 3: Tiers y Precios**
- Por cada fecha agregada, mostrar:
  - Nombre de la fecha (ej: "15 Nov 2025 - 20:00")
  - Botón: "➕ Agregar Tier"
  
- Por cada tier:
  - Nombre (ej: General, VIP, Palco) *
  - Descripción
  - Precio (COP) *
  - Cantidad de boletos *
  - Orden (número para ordenar tiers)
  - Botón: "🗑️ Eliminar tier"

**Paso 4: Resumen y Publicación**
- Vista previa de todo el evento
- Total de boletos a generar
- Estimado de ingresos (si se vende todo)
- Comisión de la plataforma
- Ingreso neto estimado
- Botones:
  - "⬅️ Volver"
  - "💾 Guardar como Borrador"
  - "✅ Publicar Evento"

**Validaciones:**
- Si se intenta crear más eventos del límite → Mensaje "Has alcanzado el límite de X eventos. Mejora tu plan"
- Si se intenta destacar sin permiso → Deshabilitar checkbox con tooltip
- Si aforo total ≠ suma de boletos de tiers → Warning

#### **E. VER DETALLE DE EVENTO**
Muestra:
- **Encabezado:**
  - Imagen grande
  - Nombre del evento
  - Status badge
  - Botones: Editar | Pausar/Reanudar | Eliminar

- **Información General:**
  - Descripción
  - Ciudad y ubicación
  - Categoría

- **Fechas del Evento:**
  - Lista de fechas con cards
  - Por cada fecha:
    - Fecha y hora
    - Aforo total / disponible
    - Progress bar de ocupación
    - Botón: "Ver Tiers"

- **Tiers (expandible por fecha):**
  - Tabla con: Nombre | Precio | Vendidos/Total | % Ocupación | Disponibles

- **Estadísticas de Ventas:**
  - Total vendidos
  - Ingresos brutos
  - Comisión plataforma
  - Ingresos netos

- **Boletos Vendidos (tabla expandible):**
  - # Boleto
  - Tier
  - Precio
  - Fecha de compra
  - Comprador (email)
  - Status (vendido/usado)
  - QR Code (botón ver/descargar)

#### **F. MI PERFIL**
**Formulario con tabs:**

**Tab 1: Información del Negocio**
- Nombre del comercio *
- Slug (solo lectura, generado automáticamente)
- Descripción (textarea)
- Email de contacto *
- Teléfono
- Sitio web
- Dirección completa
- Ciudad *
- País (default: Colombia)

**Tab 2: Branding**
- Logo (subir imagen, 512x512 recomendado)
- Banner (subir imagen, 1920x400 recomendado)
- Color primario (color picker)
- Color secundario (color picker)
- Vista previa de colores

**Tab 3: Redes Sociales**
- Facebook (URL)
- Instagram (URL)
- Twitter (URL)
- TikTok (URL)

**Tab 4: Plan y Facturación**
- Plan actual (badge destacado)
- Límite de eventos (usado/total)
- Comisión (%)
- Puede destacar eventos: Sí/No
- Eventos destacados (usado/total)
- Botón: "Mejorar Plan"
- Tabla de comparación de planes

**Botones:**
- "💾 Guardar Cambios"
- "❌ Cancelar"

#### **G. ESTADÍSTICAS**
- **Filtros:**
  - Rango de fechas (date range picker)
  - Por evento (select)
  - Exportar CSV

- **KPIs:**
  - Total eventos creados
  - Eventos activos
  - Total boletos vendidos
  - Tasa de ocupación promedio (%)
  - Ingresos brutos
  - Comisiones pagadas
  - Ingresos netos

- **Gráficas:**
  - Ventas por mes (line chart)
  - Ventas por evento (bar chart)
  - Ventas por tier (pie chart)
  - Ocupación por evento (progress bars)

- **Tabla de eventos:**
  - Ordenable por ventas, ingresos, ocupación
  - Exportable a CSV

---

## 🎨 GUÍA DE ESTILO

### **Paleta de Colores:**
- **Primary:** Usar el tema actual de Grada Negra (grays)
- **Success:** Verde (#10b981) para estados activos, publicados
- **Warning:** Amarillo (#f59e0b) para borradores, pausados
- **Danger:** Rojo (#ef4444) para cancelados, eliminados
- **Info:** Azul (#3b82f6) para información, estadísticas

### **Tipografía:**
- Mantener la fuente actual (Inter)
- Tamaños:
  - H1: 2rem (32px) - Títulos principales
  - H2: 1.5rem (24px) - Subtítulos
  - Body: 1rem (16px) - Texto normal
  - Small: 0.875rem (14px) - Etiquetas, ayudas

### **Componentes:**
- **Botones:**
  - Primary: Degradado gris oscuro (actual)
  - Secondary: Borde gris con fondo blanco
  - Danger: Rojo sólido
  - Icon buttons: Solo icono con hover

- **Cards:**
  - Fondo blanco
  - Border radius: 0.75rem (12px)
  - Shadow: `shadow-lg`
  - Padding: 1.5rem (24px)

- **Inputs:**
  - Border: gray-200
  - Focus: ring-gray-900
  - Border radius: 0.5rem (8px)
  - Padding: 0.75rem (12px)

- **Tables:**
  - Header: fondo gray-50
  - Rows: hover con gray-50
  - Borders: gray-200
  - Alternating rows (opcional)

### **Iconografía:**
- Usar Material Symbols (actual)
- Tamaño base: 24px
- Color: gray-700 (default)

### **Layout:**
- **Sidebar fijo:** 256px ancho
- **Header:** 64px alto
- **Contenido:** Max-width 1600px, centrado
- **Spacing:** Sistema de 8px (0.5rem, 1rem, 1.5rem, 2rem, etc.)

### **Responsive:**
- **Mobile (<768px):**
  - Sidebar se convierte en drawer (hamburger menu)
  - Tablas se convierten en cards verticales
  - Formularios a 1 columna

- **Tablet (768px-1024px):**
  - Sidebar visible
  - Formularios a 2 columnas

- **Desktop (>1024px):**
  - Layout completo
  - Formularios a 2-3 columnas

---

## 🔐 CONSIDERACIONES DE SEGURIDAD

1. **Autenticación:**
   - Solo usuarios autenticados pueden acceder
   - Verificar que el usuario tenga un `comercioId` válido
   - Redirect a login si no está autenticado

2. **Autorización:**
   - Comercio solo puede ver/editar SUS propios eventos
   - Verificar `comercioId` en todas las queries
   - No exponer eventos de otros comercios

3. **Validaciones:**
   - Frontend: Validación inmediata en formularios
   - Backend: Validación completa antes de guardar
   - Límites de plan enforced en backend

4. **Manejo de Imágenes:**
   - Subir a Firebase Storage
   - Validar tipo (jpg, png, webp)
   - Validar tamaño (max 5MB)
   - Optimizar automáticamente

---

## 📱 FLUJO DE USUARIO

### **Crear un Evento Completo:**
```
1. Login con Google → Dashboard
2. Click "Crear Evento" → Formulario Paso 1
3. Llenar info básica → "Siguiente"
4. Agregar fechas (ej: 3 fechas diferentes) → "Siguiente"
5. Por cada fecha, agregar tiers:
   - Fecha 1: General ($50k, 100 boletos), VIP ($100k, 50 boletos)
   - Fecha 2: General ($50k, 100 boletos), VIP ($100k, 50 boletos)
   - Fecha 3: General ($50k, 100 boletos)
6. Ver resumen:
   - Total boletos: 400
   - Ingresos potenciales: $25,000,000 COP
   - Comisión (7%): $1,750,000 COP
   - Ingresos netos: $23,250,000 COP
7. Click "Publicar Evento"
8. Sistema genera 400 boletos individuales automáticamente
9. Evento visible en el sitio público
10. Dashboard del comercio muestra el nuevo evento
```

---

## 🛠️ TECNOLOGÍA

- **Frontend:** Next.js 14+ con App Router
- **Styling:** Tailwind CSS
- **Icons:** Material Symbols
- **Auth:** Firebase Auth (Google)
- **Database:** Firestore
- **Storage:** Firebase Storage (imágenes)
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts o Chart.js
- **Date Pickers:** React DatePicker
- **Notifications:** React Hot Toast

---

## 📋 PRIORIDAD DE DESARROLLO

### **Fase 1 (MVP):**
1. ✅ Login/Auth
2. ✅ Dashboard básico
3. ✅ Mi Perfil (tabs 1 y 2)
4. ✅ Crear Evento (wizard completo)
5. ✅ Lista de Eventos

### **Fase 2:**
6. Ver Detalle de Evento
7. Editar Evento
8. Estadísticas básicas
9. Mi Perfil (tabs 3 y 4)

### **Fase 3:**
10. Gestión de Boletos vendidos
11. Gráficas avanzadas
12. Exportar datos
13. Notificaciones en tiempo real

---

## 🎯 OBJETIVO FINAL

Crear un panel profesional, intuitivo y completo que permita a los comercios/organizadores:
- Gestionar eventos fácilmente
- Ver estadísticas de ventas en tiempo real
- Administrar su perfil empresarial
- Todo alineado con el modelo de datos existente
- Diseño moderno, limpio y responsive
- Experiencia similar a plataformas como Eventbrite, Ticketmaster Dashboard, o Stripe Dashboard

---

## 📸 REFERENCIAS VISUALES (inspiración)

- **Eventbrite Dashboard:** Layout limpio, cards para eventos
- **Stripe Dashboard:** Estadísticas elegantes, gráficas minimalistas
- **Shopify Admin:** Sidebar fijo, navegación clara
- **Vercel Dashboard:** Diseño moderno, espaciado generoso
- **Linear:** Atajos de teclado, transiciones suaves

---

## ✅ ENTREGABLES ESPERADOS

Por favor, genera diseños detallados para:

1. **Login/Auth Screen**
2. **Dashboard Principal**
3. **Lista de Eventos** (vista tabla y cards)
4. **Crear Evento** (wizard de 4 pasos)
5. **Ver Detalle de Evento**
6. **Mi Perfil** (4 tabs)
7. **Estadísticas**

**Formato:** Figma, Sketch, Adobe XD, o capturas de pantalla de alta fidelidad

**Incluir:**
- Versiones desktop (1920px)
- Versiones mobile (375px)
- Estados: default, hover, loading, error
- Paleta de colores exacta
- Especificaciones de spacing
- Componentes reutilizables

---

**¿Necesitas alguna aclaración o detalle adicional del modelo de datos?**
