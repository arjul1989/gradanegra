# User Story Map - Sistema de Ticketing "Grada Negra"

---

## 🎯 Objetivo del Usuario
**"Como organizador de eventos, quiero vender tickets seguros y validables para mis eventos, de manera simple y profesional"**

---

## 📊 Estructura del Story Map

```
BACKBONE (Actividades Principales)
    ├─ USER JOURNEY
    │   └─ STORIES (priorizadas verticalmente)
    └─ MVP / RELEASES
```

---

## 🏗️ BACKBONE - Actividades Principales

### 1️⃣ Gestionar Plataforma
### 2️⃣ Administrar Comercio
### 3️⃣ Crear Evento
### 4️⃣ Vender Tickets
### 5️⃣ Recibir Ticket
### 6️⃣ Validar Entrada

---

## 📖 USER STORIES por Actividad

### 1️⃣ GESTIONAR PLATAFORMA
**Actor:** Administrador de Plataforma

#### 🔴 MVP - Release 1
- **US-001** ✅ COMPLETADO - Como admin de plataforma, quiero crear un nuevo comercio con nombre, email y logo para añadirlo al sistema
  - ✅ Modelo Tenant con validaciones
  - ✅ Generación automática de slug único
  - ✅ Endpoint POST /api/tenants con validación Joi
  - ✅ Creación automática de admin inicial (opcional)
  - ✅ Configuración de plan free por defecto (10 eventos, 1000 tickets)
- **US-002** ✅ COMPLETADO - Como admin de plataforma, quiero asignar un administrador inicial al comercio para que pueda empezar a operar
  - ✅ Endpoint POST /api/tenants/:id/admins
  - ✅ Creación de usuario Firebase + Firestore
  - ✅ Asignación de rol tenant_admin
  - ✅ Permisos configurables (manage_events, manage_tickets, view_reports)
- **US-003** ✅ COMPLETADO - Como admin de plataforma, quiero ver un listado de todos los comercios activos para monitorear la plataforma
  - ✅ Endpoint GET /api/tenants con filtros (status, plan, limit)
  - ✅ Ordenamiento por fecha de creación
  - ✅ Respuesta con conteo de resultados

#### 🟡 Release 2
- **US-004** Como admin de plataforma, quiero desactivar/activar comercios para controlar el acceso
- **US-005** Como admin de plataforma, quiero ver métricas globales (comercios, eventos, tickets vendidos) para análisis del negocio

---

### 2️⃣ ADMINISTRAR COMERCIO
**Actor:** Administrador de Comercio

#### 🔴 MVP - Release 1
- **US-006** ✅ COMPLETADO - Como admin de comercio, quiero iniciar sesión con email/password para acceder al sistema
  - ✅ Modelo User implementado
  - ✅ Middleware de autenticación con Firebase
  - ✅ Middleware de autorización (roles/permisos)
  - ✅ Endpoints de registro, login, perfil
  - ✅ Validaciones con Joi
  - ✅ Script create-admin.js
  - ✅ Documentación API (API_AUTH.md)
- **US-007** ✅ COMPLETADO - Como admin de comercio, quiero ver el dashboard de mi comercio con eventos activos, tickets vendidos y revenue para monitorear el desempeño
  - ✅ GET /api/tenants/:id/dashboard (métricas completas)
  - ✅ GET /api/tenants/:id/events (lista de eventos)
  - ✅ Cálculo de promedios (revenue/evento, tickets/evento)
  - ✅ Estado de suscripción (eventos usados vs disponibles)
  - ✅ Acceso para roles: platform_admin, tenant_admin, finance
- **US-008** ✅ COMPLETADO - Como admin de comercio, quiero invitar usuarios con rol (Admin/Finanzas/Operaciones) hasta máximo 3 roles asignados
  - ✅ GET /api/tenants/:tenantId/users (listar usuarios)
  - ✅ POST /api/tenants/:tenantId/users (crear/invitar usuario)
  - ✅ GET /api/users/:id (detalles de usuario)
  - ✅ PATCH /api/users/:id (actualizar usuario)
  - ✅ DELETE /api/users/:id (desactivar usuario)
  - ✅ POST /api/users/:id/activate (reactivar usuario)
  - ✅ Límite: 3 usuarios por rol por tenant
  - ✅ Permisos por defecto según rol
  - ✅ Desactivación en Firebase Auth + Firestore

#### 🟡 Release 2
- **US-009** Como admin de comercio, quiero personalizar el logo y color de mis eventos para reflejar mi marca
- **US-010** Como admin de comercio, quiero ver reportes de ventas por evento para tomar decisiones
- **US-011** Como usuario de Finanzas, quiero ver solo información financiera y reportes sin poder modificar eventos

---

### 3️⃣ CREAR EVENTO
**Actor:** Administrador/Operaciones de Comercio

#### 🔴 MVP - Release 1
- **US-012** ✅ COMPLETADO - Como admin, quiero crear un evento con nombre, descripción, fecha y ubicación para publicarlo
  - ✅ Modelo Event con validaciones completas
  - ✅ POST /api/events (crear evento)
  - ✅ GET /api/events (listar con filtros)
  - ✅ GET /api/events/:id (detalles)
  - ✅ PATCH /api/events/:id (actualizar)
  - ✅ DELETE /api/events/:id (cancelar)
  - ✅ POST /api/events/:id/publish (publicar)
  - ✅ PATCH /api/events/:id/unpublish (despublicar) ⭐ NEW
  - ✅ PATCH /api/events/:id/cancel (cancelar permanentemente) ⭐ NEW
  - ✅ GET /api/events/:id/stats (estadísticas)
  - ✅ Límite de capacidad: 1000 tickets
  - ✅ Integración con límites del tenant
  
- **US-013** ✅ COMPLETADO - Como admin, quiero configurar tipos de entrada (tiers) con precio y capacidad para cada evento
  - ✅ Sistema de tiers integrado en Event
  - ✅ Validación: máximo 10 tiers
  - ✅ IDs únicos por tier (UUID)
  - ✅ Validación de capacidad total
  - ✅ Tracking de tickets vendidos por tier
  - ✅ Cálculo de disponibilidad por tier
  
- **US-014** ✅ COMPLETADO - Como sistema, quiero generar tickets únicos con QR code y hash de seguridad al completarse una compra
  - ✅ Modelo Ticket con generación de hash SHA-256
  - ✅ Generación de QR code con datos del ticket
  - ✅ 8 endpoints implementados: crear, obtener, validar, cancelar
  - ✅ Validación de disponibilidad de tiers
  - ✅ Verificación de hash de seguridad
  - ✅ Check-in system (validate ticket)
  - ✅ Sistema de prevención de duplicados

- **US-015** ✅ COMPLETADO - Como admin, quiero crear eventos gratuitos (precio = $0) ⭐ NEW
  - ✅ Validación permite tier.price >= 0
  - ✅ Flujo de tickets funciona sin pagos
  - ✅ PDF y email se generan correctamente
  - ✅ Sin modificaciones necesarias en controllers

- **US-016** ✅ COMPLETADO - Como admin, quiero publicar/despublicar eventos dinámicamente ⭐ NEW
  - ✅ Estados: draft, published, cancelled
  - ✅ POST /api/events/:id/publish
  - ✅ PATCH /api/events/:id/unpublish
  - ✅ PATCH /api/events/:id/cancel
  - ✅ Validaciones para no vender tickets no publicados
  - ✅ Warnings cuando se despublica evento con tickets vendidos
  - ✅ Metadata de cancelación (razón, timestamp, usuario)
- **US-015** Como admin, quiero crear eventos gratuitos (precio = $0) para eventos sin costo
- **US-016** Como admin, quiero publicar/despublicar un evento para controlar su visibilidad

#### 🟡 Release 2
- **US-017** Como admin, quiero clonar un evento existente para reutilizar configuración
- **US-018** Como admin, quiero configurar eventos multi-día para festivales o conferencias
- **US-019** Como admin, quiero subir imágenes promocionales del evento
- **US-020** Como admin, quiero establecer fecha límite de venta de tickets

---

### 4️⃣ VENDER TICKETS
**Actor:** Comprador (Anónimo o Registrado)

#### 🔴 MVP - Release 1
- **US-021** Como comprador, quiero ver el catálogo de eventos disponibles para elegir
- **US-022** Como comprador, quiero ver detalles de un evento (fecha, lugar, precios) para decidir comprar
- **US-023** Como comprador, quiero seleccionar tipo y cantidad de entradas para agregar al carrito
- **US-024** Como comprador, quiero ingresar mis datos (nombre, email, teléfono) para recibir el ticket
- **US-025** Como comprador, quiero pagar con tarjeta de crédito/débito de forma segura
- **US-026** Como comprador, quiero recibir confirmación de compra inmediata en pantalla

#### 🟡 Release 2
- **US-027** ✅ COMPLETADO - Como comprador registrado, quiero iniciar sesión para ver mis tickets anteriores
  - ✅ Login con email/password (Firebase Auth)
  - ✅ Login con Google OAuth (Sign in with Google)
  - ✅ POST /api/buyers/login (con idToken)
  - ✅ POST /api/buyers/auth/google
  - ✅ Middleware authenticateBuyer
  - ✅ Auto-creación de perfil en primer login
- **US-028** ✅ COMPLETADO - Como comprador registrado, quiero crear una cuenta para gestionar mis compras
  - ✅ Registro con email/password
  - ✅ POST /api/buyers/register
  - ✅ Modelo Buyer completo con perfil, stats, preferencias
  - ✅ GET /api/buyers/me (ver perfil)
  - ✅ PATCH /api/buyers/me (actualizar perfil)
  - ✅ DELETE /api/buyers/me (eliminar cuenta)
  - ✅ GET /api/buyers/me/tickets (historial)
  - ✅ Vinculación automática de tickets (buyerId)
- **US-029** Como comprador, quiero pagar con métodos alternativos (PSE, efectivo, etc.)
- **US-030** Como comprador, quiero aplicar un código de descuento

---

### 5️⃣ RECIBIR TICKET
**Actor:** Comprador

#### 🔴 MVP - Release 1
- **US-031** ✅ COMPLETADO - Como comprador, quiero recibir un email con mi ticket PDF adjunto inmediatamente después del pago
  - ✅ Integración con Resend (servicio de email)
  - ✅ Template HTML responsive y profesional
  - ✅ Envío automático al crear tickets
  - ✅ Endpoint de reenvío manual
  - ✅ Manejo robusto de errores
- **US-032** ✅ COMPLETADO - Como comprador, quiero que el PDF tenga un QR code único para validación
  - ✅ Generación de PDF con PDFKit
  - ✅ QR Code grande y visible (200x200px)
  - ✅ Alta corrección de errores (H level)
- **US-033** ✅ COMPLETADO - Como comprador, quiero ver información clara en el PDF (evento, fecha, lugar, hora, tipo de entrada)
  - ✅ Diseño profesional del PDF
  - ✅ Información completa del evento
  - ✅ Datos del comprador
  - ✅ Número de ticket destacado
  - ✅ Instrucciones de uso
  - ✅ Branding del tenant

#### 🟡 Release 2
- **US-034** ✅ COMPLETADO - Como comprador, quiero recibir un archivo .pkpass para agregar a Apple Wallet
  - ✅ Generación de .pkpass con @walletpass/pass-js
  - ✅ Integración automática en emails
  - ✅ Endpoint de descarga individual
  - ✅ QR code embebido en formato PKBarcodeFormatQR
  - ✅ Campos completos (evento, fecha, ubicación, asiento)
  - ⏳ Pendiente: Certificados Apple Developer ($99/año)
  
- **US-035** ✅ COMPLETADO - Como comprador, quiero que el pkpass tenga el logo y color del evento
  - ✅ Color de fondo personalizable (tenant.branding.primaryColor)
  - ✅ Logo del tenant incluido
  - ✅ Nombre de organización personalizado
  - ✅ Logo text con nombre del tenant
  - ✅ Colores de foreground y labels configurados
  
- **US-036** ✅ COMPLETADO - Como comprador registrado, quiero descargar nuevamente mis tickets desde mi cuenta
  - ✅ GET /api/buyers/me/tickets (historial completo)
  - ✅ GET /api/buyers/me/tickets/:id (detalle de ticket)
  - ✅ POST /api/buyers/me/tickets/:id/resend (re-enviar email)
  - ✅ Búsqueda por buyerId + email (tickets antiguos)
  - ✅ Deduplicación automática
  - ✅ Validación de ownership

- **US-037** ✅ COMPLETADO - Como comprador, quiero recibir recordatorios del evento 1 día antes ⭐ NEW
  - ✅ Job automático: scripts/run-reminders.js
  - ✅ Ventana de recordatorio: 23-25 horas antes
  - ✅ Email grupal por comprador (todos sus tickets)
  - ✅ Template HTML profesional de recordatorio
  - ✅ POST /api/jobs/reminders (trigger manual admin)
  - ✅ POST /api/jobs/reminders/:eventId (evento específico)
  - ✅ POST /api/jobs/webhook/reminders (Cloud Scheduler)
  - ✅ Prevención de duplicados (metadata.reminderSent)
  - ✅ Logging completo de operaciones
  - ✅ Manejo de errores individual por email

---

### 6️⃣ VALIDAR ENTRADA
**Actor:** Usuario de Operaciones

#### 🔴 MVP - Release 1
- **US-038** Como operador, quiero escanear el QR code del ticket para validar entrada
- **US-039** Como operador, quiero ver confirmación visual clara (✅ válido / ❌ inválido)
- **US-040** Como operador, quiero que el sistema detecte tickets ya utilizados para evitar duplicados
- **US-041** Como operador, quiero buscar un ticket manualmente por código si el QR no funciona

#### 🟡 Release 2
- **US-042** Como operador, quiero ver estadísticas en tiempo real de entradas validadas vs totales
- **US-043** Como operador, quiero validar tickets sin conexión (modo offline con sincronización)
- **US-044** Como operador, quiero ver historial de validaciones con timestamp

---

## 🎯 RELEASES PROPUESTAS

### 🔴 MVP - Release 1 (Meses 1-3)
**Objetivo:** Sistema funcional básico de venta y validación de tickets

**Incluye:**
- Gestión básica de comercios y usuarios
- Crear y publicar eventos simples
- Venta de tickets con pago online
- Generación de PDF con QR
- Validación de tickets con hash
- Email de confirmación

**Stories:** US-001 hasta US-033, US-038 hasta US-041  
**Valor:** Sistema operativo mínimo para primer piloto

---

### 🟡 Release 2 (Meses 4-6)
**Objetivo:** Mejora de experiencia y funcionalidades avanzadas

**Incluye:**
- Generación de Apple Wallet (.pkpass)
- Personalización de marca
- Cuenta de comprador
- Clonación de eventos
- Reportes y analytics
- Validación offline

**Stories:** US-004, US-005, US-009 hasta US-020, US-027 hasta US-037, US-042 hasta US-044  
**Valor:** Producto competitivo y diferenciado

---

### 🟢 Release 3 (Meses 7-9) - Futuro
**Incluye:**
- API pública
- App móvil nativa para validación
- Integraciones con CRM
- Sistema de devoluciones
- Transferencia de tickets
- Multi-idioma

---

## 📋 BACKLOG PRIORIZADO (Top 10 Stories para Sprint 1)

1. **US-006** - Login de administrador de comercio
2. **US-012** - Crear evento básico
3. **US-013** - Configurar aforo
4. **US-014** - Agregar tipos de entrada
5. **US-021** - Ver catálogo de eventos
6. **US-022** - Ver detalle de evento
7. **US-023** - Seleccionar entradas
8. **US-024** - Ingresar datos de comprador
9. **US-031** - Recibir PDF por email
10. **US-038** - Escanear QR para validar

---

## 🎨 ACCEPTANCE CRITERIA EXAMPLE

### US-012: Crear Evento Básico

**Como** administrador de comercio  
**Quiero** crear un evento con información básica  
**Para** publicarlo y empezar a vender tickets

**Criterios de Aceptación:**
```gherkin
DADO que soy un admin de comercio autenticado
CUANDO navego a "Crear Evento"
Y completo el formulario con:
  - Nombre del evento (requerido)
  - Descripción (opcional)
  - Fecha del evento (requerida)
  - Hora del evento (requerida)
  - Ubicación (requerida)
  - Ciudad (requerida)
Y hago clic en "Guardar"
ENTONCES el evento se crea en estado "Borrador"
Y puedo verlo en mi dashboard
Y puedo editarlo antes de publicar
```

**DoD (Definition of Done):**
- ✅ Formulario validado (campos requeridos)
- ✅ Evento guardado en base de datos
- ✅ Evento visible en dashboard del comercio
- ✅ Tests unitarios escritos
- ✅ Tests E2E del flujo completo
- ✅ Code review aprobado

---

## 🔄 Story Mapping Workshop - Participantes

- **Product Owner:** Define prioridades
- **Desarrolladores:** Estiman esfuerzo
- **Diseñador UX:** Valida flujos de usuario
- **Stakeholder del Comercio:** Valida necesidades reales

---

## 📝 Notas Adicionales

### Dependencias Técnicas Clave
- Sistema de hash debe implementarse desde Release 1
- Integración con pasarela de pago es crítica para MVP
- Generación de PDF debe ser rápida (<5 seg)

### Métricas de Éxito
- Tiempo promedio de compra < 2 min
- Tasa de éxito de pago > 95%
- Tiempo de validación de ticket < 3 seg
- 0% de falsificaciones detectadas

---

**Última actualización:** Noviembre 2025  
**Próxima revisión:** Después de Sprint 1
