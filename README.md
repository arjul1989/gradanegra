# 🎫 Grada Negra - Sistema de Ticketing Multitenant

Sistema de venta y validación de tickets para eventos con arquitectura white-label.

## 📚 Documentación de Producto

Este repositorio contiene la documentación inicial del producto en fase de análisis:

- **[PRD.md](./PRD.md)** - Product Requirements Document completo
- **[USER_STORY_MAP.md](./USER_STORY_MAP.md)** - User Story Mapping con backlog priorizado

## 🎯 Resumen Ejecutivo

**Grada Negra** es una plataforma SaaS multitenant que permite a comercios/organizadores:
- ✅ Crear y gestionar eventos
- ✅ Vender tickets con hasta 10 tipos de entrada
- ✅ Generar tickets seguros con hash anti-falsificación
- ✅ Entregar PDF + Apple Wallet (.pkpass)
- ✅ Validar entradas con escaneo de QR
- ✅ Gestionar roles (Admin, Finanzas, Operaciones)

## 🏗️ Arquitectura Conceptual

```
┌─────────────────────────────────────────────────────────┐
│                   GRADA NEGRA PLATFORM                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Comercio   │  │   Comercio   │  │   Comercio   │ │
│  │      A       │  │      B       │  │      C       │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│         │                 │                 │          │
│         └─────────────────┴─────────────────┘          │
│                         │                               │
│              ┌──────────▼──────────┐                   │
│              │   Core Platform     │                   │
│              │  - Events Engine    │                   │
│              │  - Ticket Generator │                   │
│              │  - Hash Security    │                   │
│              │  - Multi-tenant DB  │                   │
│              └─────────────────────┘                   │
│                         │                               │
│         ┌───────────────┼───────────────┐              │
│         │               │               │              │
│    ┌────▼────┐    ┌────▼────┐    ┌────▼────┐         │
│    │ Payment │    │  Email  │    │ Storage │         │
│    │ Gateway │    │ Service │    │  (GCS)  │         │
│    └─────────┘    └─────────┘    └─────────┘         │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Seguridad del Ticket

Cada ticket genera un hash único usando:
```
SHA256(ticketId + eventId + userId + timestamp + salt)
```

El hash se embebe en:
- QR Code (para escaneo rápido)
- PDF (visual + validación)
- Base de datos (registro de emisión)
- Sistema de validación (check-in)

## 👥 Roles y Permisos

| Rol | Crear Eventos | Ver Finanzas | Validar Tickets | Gestionar Comercio |
|-----|---------------|--------------|-----------------|-------------------|
| **Admin Plataforma** | ❌ | ✅ Todo | ✅ Todo | ✅ Todos |
| **Admin Comercio** | ✅ | ✅ Propio | ✅ Propio | ✅ Propio |
| **Finanzas** | ❌ | ✅ Propio | ❌ | ❌ |
| **Operaciones** | ❌ | ❌ | ✅ Propio | ❌ |

## 📊 Límites del Sistema

| Recurso | Límite | Rationale |
|---------|--------|-----------|
| Tickets por evento | 1,000 | Gestión operativa manejable |
| Tipos de entrada | 10 | Suficiente flexibilidad sin complejidad |
| Usuarios por comercio | 3 roles | Simplicidad operacional |
| Eventos por comercio | Ilimitado | Monetización sin restricción |

## 🚀 Roadmap de Desarrollo

### ✅ Fase 0: Análisis (Actual)
- PRD completado
- User Story Map definido
- Arquitectura conceptual

### 🎯 Fase 1: MVP (Meses 1-3)
- Setup en Google Cloud
- Backend API + Base de datos
- Frontend administración
- Generación de tickets (PDF + QR)
- Integración de pago
- Sistema de validación básico

### 📈 Fase 2: Producto Completo (Meses 4-6)
- Apple Wallet (.pkpass)
- Cuenta de compradores
- Reportes y analytics
- Clonación de eventos
- Personalización de marca

### 🔮 Fase 3: Escalamiento (Meses 7-9)
- API pública
- App móvil de validación
- Integraciones (CRM, Marketing)
- Multi-idioma
- Transferencia de tickets

## 🛠️ Stack Tecnológico (Propuesto)

**Backend:**
- Node.js + Express / Python + FastAPI
- PostgreSQL (Cloud SQL)
- Redis (caching)

**Frontend:**
- React + Next.js
- Tailwind CSS
- React Query

**Infraestructura:**
- Google Cloud Platform
- Cloud Run (containerización)
- Cloud Functions (serverless tasks)
- Cloud Storage (assets)
- Cloud CDN

**Integraciones:**
- Stripe / Mercado Pago (pagos)
- SendGrid (email)
- Passkit.js (Apple Wallet)

## 📖 Estado Actual del Proyecto

### ✅ COMPLETADO - Fase de Setup
1. ✅ PRD creado y documentado
2. ✅ User Story Map con 44 historias de usuario
3. ✅ Google Cloud SDK instalado y configurado
4. ✅ Autenticación con GCP exitosa
5. ✅ Proyecto "gradanegra-prod" creado
6. ✅ Billing configurado y activo
7. ✅ Todas las APIs habilitadas (39 servicios)
8. ✅ Firestore creado (FREE TIER)
9. ✅ Cloud Storage configurado
10. ✅ Backend estructurado y funcionando
11. ✅ Sistema de seguridad (hash) implementado
12. ✅ Dependencias instaladas (719 packages)

### 🚀 LISTO PARA DESARROLLO
**El servidor backend está corriendo en:** `http://localhost:8080`

#### � Progreso del MVP

## 📊 Progreso del MVP

```
██████████████████████░░░░░░░░░ 70% (7/10 historias core completadas)
```

### ✅ Completado
- **US-006**: Sistema de autenticación con Firebase Auth
  - Registro y login de usuarios
  - Gestión de perfiles
  - Control de acceso basado en roles (RBAC)
  - Middleware de autenticación y autorización
  - [Ver documentación](./API_AUTH.md) | [Ver progreso](./PROGRESS_US006.md)

- **US-001**: Crear Comercio (Tenant)
  - CRUD completo de tenants
  - Generación automática de slugs únicos
  - Configuración personalizada (colores, moneda, impuestos)
  - Sistema de suscripciones con límites (free, basic, premium)
  
- **US-002**: Asignar Administrador al Comercio
  - Creación de admins para tenants
  - Asignación de permisos granulares
  - Integración con Firebase Auth
  
- **US-003**: Listar Comercios
  - Listado con filtros (status, plan)
  - Ordenamiento y paginación
  - Estadísticas por tenant
  - [Ver documentación](./API_TENANTS.md) | [Ver progreso](./PROGRESS_US001-003.md)

- **US-007**: Dashboard de Comercio
  - Vista completa de métricas del tenant
  - Cálculo de promedios y KPIs
  - Estado de suscripción y límites
  - Lista de eventos del tenant
  - [Ver documentación](./API_TENANTS.md#obtener-dashboard)

- **US-012**: Crear Eventos
  - CRUD completo de eventos
  - Validaciones (capacidad max 1000)
  - Gestión de status (draft, published, cancelled)
  - Integración con límites de tenant
  - Sistema de publicación

- **US-013**: Configurar Tiers
  - Sistema de tipos de entrada (max 10)
  - Precio, capacidad y beneficios por tier
  - IDs únicos generados automáticamente
  - Validación de capacidad total
  - Tracking de ventas por tier

- **US-008**: Gestión de Usuarios del Tenant
  - CRUD completo de usuarios
  - Límite de 3 usuarios por rol
  - Roles: tenant_admin, finance, operations
  - Permisos configurables
  - Activar/desactivar usuarios

- **US-007**: Dashboard de Comercio
  - GET /tenants/:id/dashboard (estadísticas generales)
  - GET /tenants/:id/events (eventos del tenant con paginación)
  - Integración con modelo Event para datos en tiempo real
  - Métricas de eventos, tickets vendidos, revenue
  
- **US-012**: Crear y Gestionar Eventos
  - CRUD completo de eventos
  - Sistema de tiers (hasta 10 tipos de entrada)
  - Límite de capacidad de 1000 tickets por evento
  - Estados: draft, published, active, past, cancelled
  - Publicar/despublicar eventos
  - Estadísticas por evento y tier
  - [Ver documentación](./backend/API_EVENTS.md)
  
- **US-013**: Configurar Tiers
  - Configuración de tiers integrada en eventos
  - Máximo 10 tiers por evento
  - IDs únicos con UUID v4
  - Tracking de capacidad y tickets vendidos por tier
  - Validación de disponibilidad en tiempo real
  
- **US-014**: Generar Tickets con QR y Hash
  - Modelo Ticket completo con generación automática
  - Hash de seguridad SHA-256
  - QR code único por ticket (formato PNG base64)
  - 9 endpoints: crear, obtener, validar, cancelar, regenerar QR, enviar email
  - Sistema de check-in con prevención de duplicados
  - Verificación de hash de seguridad
  - [Ver documentación](./backend/API_TICKETS.md)

- **US-031, US-032, US-033**: Envío de Tickets por Email con PDF
  - Integración con Resend (servicio de email)
  - Generación automática de PDF profesional con PDFKit
  - QR code integrado en el PDF (200x200px)
  - Template HTML responsive y personalizable
  - Envío automático al crear tickets
  - Endpoint de reenvío manual (POST /api/tickets/:id/send-email)
  - Template de recordatorio de evento
  - Branding personalizable por tenant
  - [Ver progreso](./PROGRESS_US031.md)

- **US-034, US-035** ✅ COMPLETADO - Generación de Apple Wallet (.pkpass)
  - Librería @walletpass/pass-js integrada
  - Generación automática de .pkpass con branding del tenant
  - Adjunto automático en emails de confirmación
  - Endpoint de descarga individual (GET /api/tickets/:id/apple-wallet)
  - QR code embebido en formato PKBarcodeFormatQR
  - Personalización completa (logo, colores, campos)
  - Graceful degradation sin certificados
  - Documentación completa para setup de certificados
  - [Ver progreso](./PROGRESS_US034.md)

- **US-015, US-016** ✅ COMPLETADO - Gestión avanzada de eventos
  - Eventos gratuitos (precio = $0) soportados
  - Estados de eventos: draft, published, cancelled
  - Endpoints para publicar/despublicar eventos
  - Endpoint para cancelar eventos permanentemente
  - Validaciones para no vender tickets de eventos no publicados
  - Warnings cuando se despublica evento con tickets vendidos

- **US-037** ✅ COMPLETADO - Sistema de recordatorios automáticos
  - Job que envía recordatorios 24 horas antes del evento
  - Email grupal por comprador (todos sus tickets)
  - Template HTML profesional de recordatorio
  - Endpoints manual y webhook para Cloud Scheduler
  - Script ejecutable: scripts/run-reminders.js
  - Prevención de duplicados con metadata
  - Logging completo de operaciones
  - [Ver progreso](./PROGRESS_US037_REMINDERS.md)

- **US-004 a US-010, US-036** ✅ COMPLETADO - Sistema de Usuarios Compradores
  - Modelo completo de comprador con perfil, stats, preferencias
  - Registro con email/password (Firebase Auth)
  - Login con Google OAuth (Sign in with Google)
  - Gestión de perfil (GET/PATCH/DELETE)
  - Historial completo de tickets (buyerId + email)
  - Re-envío de tickets por email
  - Vinculación automática de tickets con cuenta
  - Soporte para compras anónimas y autenticadas
  - 9 nuevos endpoints (/api/buyers)
  - Middleware: authenticateBuyer, optionalAuth
  - [Ver progreso](./PROGRESS_BUYER_SYSTEM.md)

### 🔄 En Progreso
- Ninguna

### 📋 Pendiente
- **Google Wallet**: Implementación completa (placeholder existe)
- **US-025**: Integración de pagos (Stripe/Conekta) - Requiere contrato comercial
- Certificados Apple Developer (US-034 requiere cuenta $99/año)
- Reportes financieros avanzados y analytics
- Rate limiting middleware
- Unit tests automatizados
- Frontend completo

### 🎯 Progreso del MVP

**Completado: 99%** (17+ user stories core completadas) 🎉

#### Core Features ✅
- ✅ Sistema de autenticación multi-rol (admin/tenant users)
- ✅ **Sistema de cuentas de compradores** 🆕
  - ✅ Registro con email/password
  - ✅ Login con Google OAuth
  - ✅ Gestión de perfil completo
  - ✅ Historial de tickets
  - ✅ Re-descarga de tickets
  - ✅ Compras anónimas y autenticadas
- ✅ Gestión de tenants (comercios)
- ✅ Gestión de usuarios por tenant
- ✅ Dashboard con métricas en tiempo real
- ✅ Sistema de eventos con tiers
- ✅ Eventos gratuitos (precio = $0)
- ✅ Publicar/Despublicar/Cancelar eventos
- ✅ Generación de tickets con QR y hash
- ✅ Envío de emails con PDF adjunto
- ✅ Templates HTML responsive
- ✅ Apple Wallet (.pkpass) generation
- ✅ Wallet branding personalizado
- ✅ Sistema de recordatorios automáticos

#### Pendientes 🔜
- 🔜 Integración de pagos (requiere contrato)
- 🔜 Google Wallet completo (Android)
- 🔜 Certificados Apple (externo, $99/año)
- 🔜 Unit tests automatizados
- 🔜 Frontend completo

### 🎯 Cómo Ejecutar

```bash
# Iniciar servidor
cd backend && npm start

node scripts/create-admin.js

# Crear tenant (comercio) con su admin
node scripts/create-tenant.js

# Ver documentación de la API
cat backend/API_AUTH.md        # Autenticación
cat backend/API_TENANTS.md     # Tenants y Dashboard
cat backend/API_EVENTS.md      # Eventos y Tiers
cat backend/API_TICKETS.md     # Tickets con QR
cat backend/API_USERS.md       # Gestión de usuarios
```

### 📊 Estadísticas del Backend

- **Total de Endpoints:** 51 (+9 nuevos para buyers)
- **Modelos:** 5 (Tenant, User, Event, Ticket, **Buyer** 🆕)
- **Colecciones Firestore:** 5 (tenants, users, events, tickets, **buyers** 🆕)
- **Dependencias:** qrcode, pdfkit, resend, @walletpass/pass-js, uuid, joi, winston
- **Utilidades:** email.js, pdf.js, crypto.js, qrcode.js, wallet.js, logger.js
- **Líneas de Código:** ~5,800+

```

### � Estadísticas del Backend

- **Total de Endpoints:** 37
- **Modelos:** 4 (Tenant, User, Event, Ticket)
- **Colecciones Firestore:** 4 (tenants, users, events, tickets)
- **Dependencias:** qrcode, pdfkit, uuid, joi, winston
- **Líneas de Código:** ~3,500+

### 📄 Documentos Importantes

#### 🎯 Empezar Aquí
- **[DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md)** 🗂️ - Índice completo de documentación
- **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** 📊 - Resumen ejecutivo para stakeholders
- **[MVP_STATUS.md](./MVP_STATUS.md)** ✅ - Estado detallado del MVP (99%)
- **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** 🚀 - Guía para desarrolladores frontend

#### 📚 Producto y Planning
- **[PRD.md](./PRD.md)** - Product Requirements Document
- **[USER_STORY_MAP.md](./USER_STORY_MAP.md)** - Mapa completo con progreso

#### 🔧 Arquitectura y Setup
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura técnica
- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** - Resumen completo del setup
- **[BILLING_SETUP.md](./BILLING_SETUP.md)** - Estrategia de costos $0

#### 📖 API Documentation
- **[backend/API_AUTH.md](./backend/API_AUTH.md)** - Autenticación y usuarios
- **[backend/API_TENANTS.md](./backend/API_TENANTS.md)** - Tenants y dashboard
- **[backend/API_EVENTS.md](./backend/API_EVENTS.md)** - Eventos y tiers
- **[backend/API_TICKETS.md](./backend/API_TICKETS.md)** - Tickets y validación
- **[backend/API_USERS.md](./backend/API_USERS.md)** - Gestión de usuarios

#### 🎉 Documentos de Progreso
- **[PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md)** ⭐ Sistema de compradores completo
- **[PROGRESS_US037_REMINDERS.md](./PROGRESS_US037_REMINDERS.md)** - Recordatorios automáticos
- **[PROGRESS_US034.md](./PROGRESS_US034.md)** - Apple Wallet integration
- **[PROGRESS_US031.md](./PROGRESS_US031.md)** - Email y PDF
- **[PROGRESS_US006.md](./PROGRESS_US006.md)** - Sistema de autenticación
- **[PROGRESS_US001-003.md](./PROGRESS_US001-003.md)** - Gestión de tenants

## 📞 Contacto

**Repositorio:** gradanegra  
**Owner:** arjul1989  
**Estado:** Análisis  
**Última actualización:** Noviembre 2025

---

**Nota:** Este es un proyecto en fase de análisis. La implementación comenzará después de la aprobación del PRD y User Story Map.
