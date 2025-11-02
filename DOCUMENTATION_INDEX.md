# 📚 Grada Negra - Índice de Documentación

## 🎯 Empezar Aquí

### Para Stakeholders / Product Owners
1. **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** ⭐ NUEVO
   - Resumen ejecutivo del proyecto
   - Estado actual: 99% MVP completado
   - Próximos pasos y opciones de lanzamiento
   - Inversión y timeline

2. **[MVP_STATUS.md](./MVP_STATUS.md)** ⭐ NUEVO
   - Estado detallado del backend
   - 51 endpoints documentados
   - User stories completadas (17)
   - Estadísticas completas

3. **[README.md](./README.md)**
   - Visión general del proyecto
   - Progreso actualizado
   - Quick start

### Para Desarrolladores Frontend
1. **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** ⭐ NUEVO
   - Guía completa de integración
   - Ejemplos de código (React/Next.js)
   - Setup de Firebase Auth
   - Componentes de UI sugeridos
   - Endpoints por pantalla

2. **[PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md)** ⭐ NUEVO
   - Sistema completo de compradores
   - Autenticación (email/password + Google OAuth)
   - 9 endpoints de buyers
   - Ejemplos de uso
   - Flujos de autenticación

### Para Product Managers
1. **[PRD.md](./PRD.md)**
   - Product Requirements Document completo
   - Features, límites, roles
   - Roadmap original

2. **[USER_STORY_MAP.md](./USER_STORY_MAP.md)**
   - 44 user stories mapeadas
   - 17 completadas ✅
   - Priorización por release

---

## 📖 Documentación Técnica

### API Documentation

#### Autenticación y Usuarios
- **[backend/API_AUTH.md](./backend/API_AUTH.md)**
  - Sistema de autenticación con Firebase
  - Roles y permisos
  - 6 endpoints (register, login, profile)
  - Middleware: authenticate, requireRole, requirePermission

#### Tenants (Comercios)
- **[backend/API_TENANTS.md](./backend/API_TENANTS.md)**
  - CRUD completo de tenants
  - Dashboard con métricas
  - 8 endpoints
  - Planes y límites

#### Eventos
- **[backend/API_EVENTS.md](./backend/API_EVENTS.md)**
  - CRUD de eventos
  - Tiers configurables (max 10)
  - Publicar/Despublicar/Cancelar
  - Estadísticas por evento
  - 9 endpoints

#### Tickets
- **[backend/API_TICKETS.md](./backend/API_TICKETS.md)**
  - Generación de tickets con QR
  - Hash de seguridad SHA-256
  - Validación y check-in
  - Email con PDF + .pkpass
  - 9 endpoints

#### Gestión de Usuarios
- **[backend/API_USERS.md](./backend/API_USERS.md)**
  - Gestión de usuarios por tenant
  - Límite: 3 usuarios por rol
  - Activar/Desactivar usuarios
  - 6 endpoints

### Documentos de Progreso

#### Completados
- **[PROGRESS_US006.md](./PROGRESS_US006.md)**
  - Sistema de autenticación (US-006)
  - Firebase Auth integration
  - RBAC implementation

- **[PROGRESS_US001-003.md](./PROGRESS_US001-003.md)**
  - Gestión de tenants (US-001, 002, 003)
  - Multi-tenant architecture
  - Dashboard de comercio

- **[PROGRESS_US031.md](./PROGRESS_US031.md)**
  - Sistema de email con PDF (US-031, 032, 033)
  - Resend integration
  - PDFKit implementation

- **[PROGRESS_US034.md](./PROGRESS_US034.md)**
  - Apple Wallet integration (US-034, 035)
  - @walletpass/pass-js
  - Branding personalizado

- **[PROGRESS_US037_REMINDERS.md](./PROGRESS_US037_REMINDERS.md)**
  - Sistema de recordatorios automáticos (US-037)
  - Job scheduler
  - Email templates

- **[PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md)** ⭐ NUEVO
  - Sistema completo de compradores (US-004, 005, 009, 010, 027, 028, 036)
  - Autenticación multi-proveedor
  - Gestión de perfil
  - Historial de tickets

---

## 🏗️ Arquitectura y Setup

### Arquitectura
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**
  - Diagrama de arquitectura
  - Stack tecnológico
  - Decisiones de diseño
  - Flujos de datos

### Setup y Configuración
- **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)**
  - Setup de Google Cloud Platform
  - Configuración de Firestore
  - APIs habilitadas
  - Cloud Storage setup

- **[BILLING_SETUP.md](./BILLING_SETUP.md)**
  - Estrategia de costos $0
  - Free tiers utilizados
  - Proyección de costos
  - Optimización

---

## 🗂️ Por Tipo de Usuario

### 👨‍💼 Admin de Plataforma
**Documentos relevantes:**
1. [API_TENANTS.md](./backend/API_TENANTS.md) - Gestión de comercios
2. [API_USERS.md](./backend/API_USERS.md) - Gestión de usuarios
3. [MVP_STATUS.md](./MVP_STATUS.md) - Estado general

**Endpoints principales:**
- `GET /api/tenants` - Listar comercios
- `POST /api/tenants` - Crear comercio
- `GET /api/tenants/:id/dashboard` - Ver métricas

---

### 🏢 Admin de Comercio
**Documentos relevantes:**
1. [API_EVENTS.md](./backend/API_EVENTS.md) - Gestión de eventos
2. [API_TICKETS.md](./backend/API_TICKETS.md) - Gestión de tickets
3. [API_TENANTS.md](./backend/API_TENANTS.md) - Dashboard

**Endpoints principales:**
- `POST /api/events` - Crear evento
- `GET /api/tenants/:id/dashboard` - Ver dashboard
- `GET /api/events/:id/stats` - Estadísticas de evento
- `GET /api/tickets?eventId=...` - Ver tickets vendidos

---

### 💰 Finanzas
**Documentos relevantes:**
1. [API_TENANTS.md](./backend/API_TENANTS.md) - Dashboard financiero
2. [API_EVENTS.md](./backend/API_EVENTS.md) - Estadísticas

**Endpoints principales:**
- `GET /api/tenants/:id/dashboard` - Métricas financieras
- `GET /api/events/:id/stats` - Revenue por evento

---

### 🎭 Operaciones
**Documentos relevantes:**
1. [API_TICKETS.md](./backend/API_TICKETS.md) - Validación de tickets

**Endpoints principales:**
- `POST /api/validate` - Validar ticket por QR
- `PATCH /api/tickets/:id/validate` - Check-in manual
- `GET /api/tickets?eventId=...` - Tickets del evento

---

### 👤 Comprador (Buyer)
**Documentos relevantes:**
1. [PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md) - Sistema completo
2. [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) - Integración

**Endpoints principales:**
- `POST /api/buyers/register` - Registro
- `POST /api/buyers/login` - Login
- `POST /api/buyers/auth/google` - Google OAuth
- `GET /api/buyers/me` - Ver perfil
- `GET /api/buyers/me/tickets` - Mis tickets
- `POST /api/tickets` - Comprar tickets (anónimo o autenticado)

---

## 🔍 Por Funcionalidad

### Autenticación
- [API_AUTH.md](./backend/API_AUTH.md) - Staff/Admin
- [PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md) - Buyers
- [PROGRESS_US006.md](./PROGRESS_US006.md) - Implementación

### Multi-Tenant
- [API_TENANTS.md](./backend/API_TENANTS.md)
- [PROGRESS_US001-003.md](./PROGRESS_US001-003.md)

### Eventos y Tickets
- [API_EVENTS.md](./backend/API_EVENTS.md)
- [API_TICKETS.md](./backend/API_TICKETS.md)

### Email y PDF
- [PROGRESS_US031.md](./PROGRESS_US031.md)
- Utilidad: `backend/src/utils/email.js`
- Utilidad: `backend/src/utils/pdf.js`

### Apple Wallet
- [PROGRESS_US034.md](./PROGRESS_US034.md)
- Utilidad: `backend/src/utils/wallet.js`

### Recordatorios
- [PROGRESS_US037_REMINDERS.md](./PROGRESS_US037_REMINDERS.md)
- Script: `scripts/run-reminders.js`

### Compradores
- [PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md)
- Modelo: `backend/src/models/Buyer.js`
- Controller: `backend/src/controllers/buyer.controller.js`

---

## 📊 Documentos de Estado

### Resúmenes Ejecutivos
1. **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** ⭐ NUEVO
   - Para stakeholders
   - Decisiones de negocio
   - Opciones de lanzamiento

2. **[MVP_STATUS.md](./MVP_STATUS.md)** ⭐ NUEVO
   - Estado técnico completo
   - 99% completado
   - Próximos pasos

3. **[README.md](./README.md)**
   - Visión general
   - Quick start
   - Progreso actualizado

### User Stories
- **[USER_STORY_MAP.md](./USER_STORY_MAP.md)**
  - 44 stories mapeadas
  - 17 completadas
  - Backlog priorizado

### Product
- **[PRD.md](./PRD.md)**
  - Requirements completos
  - Features y límites
  - Roadmap

---

## 🛠️ Guías Prácticas

### Para Desarrolladores
1. **[FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)** ⭐
   - Setup de Firebase
   - Ejemplos de código
   - Componentes sugeridos
   - Helper functions

2. **Setup del Backend**
   ```bash
   cd backend
   npm install
   npm start
   ```

3. **Scripts Útiles**
   - `scripts/create-admin.js` - Crear admin de plataforma
   - `scripts/create-tenant.js` - Crear comercio con admin
   - `scripts/run-reminders.js` - Ejecutar recordatorios
   - `scripts/test-reminder.js` - Test de email

### Para DevOps
- [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) - Setup de GCP
- [BILLING_SETUP.md](./BILLING_SETUP.md) - Configuración de billing
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Infraestructura

### Para QA
- [API_*.md](./backend/) - Documentación de endpoints para testing
- [MVP_STATUS.md](./MVP_STATUS.md) - Features a testear

---

## 📁 Estructura del Proyecto

```
gradanegra/
├── backend/
│   ├── src/
│   │   ├── models/           # 5 modelos
│   │   ├── controllers/      # 6 controllers
│   │   ├── routes/           # 9 routers
│   │   ├── middleware/       # auth, validation
│   │   └── utils/            # email, pdf, wallet, crypto, qr, logger
│   ├── config/               # Firebase credentials
│   ├── scripts/              # Automation scripts
│   ├── logs/                 # Winston logs
│   ├── API_AUTH.md          # Docs
│   ├── API_TENANTS.md
│   ├── API_EVENTS.md
│   ├── API_TICKETS.md
│   └── API_USERS.md
├── docs/
│   ├── PRD.md
│   ├── USER_STORY_MAP.md
│   ├── ARCHITECTURE.md
│   ├── SETUP_COMPLETE.md
│   ├── BILLING_SETUP.md
│   ├── PROGRESS_*.md
│   ├── MVP_STATUS.md         ⭐ NEW
│   ├── EXECUTIVE_SUMMARY.md  ⭐ NEW
│   ├── FRONTEND_INTEGRATION_GUIDE.md ⭐ NEW
│   └── DOCUMENTATION_INDEX.md ⭐ NEW (este archivo)
└── README.md
```

---

## 🔗 Enlaces Rápidos

### Documentación de Producto
- [PRD](./PRD.md)
- [User Story Map](./USER_STORY_MAP.md)
- [Resumen Ejecutivo](./EXECUTIVE_SUMMARY.md)

### Documentación Técnica
- [API Auth](./backend/API_AUTH.md)
- [API Tenants](./backend/API_TENANTS.md)
- [API Events](./backend/API_EVENTS.md)
- [API Tickets](./backend/API_TICKETS.md)
- [API Users](./backend/API_USERS.md)

### Guías de Implementación
- [Sistema de Compradores](./PROGRESS_BUYER_SYSTEM.md)
- [Integración Frontend](./FRONTEND_INTEGRATION_GUIDE.md)
- [Apple Wallet](./PROGRESS_US034.md)
- [Recordatorios](./PROGRESS_US037_REMINDERS.md)

### Estado del Proyecto
- [MVP Status](./MVP_STATUS.md)
- [README](./README.md)
- [Setup Completo](./SETUP_COMPLETE.md)

---

## 🎯 Casos de Uso

### "Quiero integrar el frontend"
1. Lee: [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md)
2. Revisa: [PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md)
3. Consulta: [API_*.md](./backend/) por módulo

### "Quiero entender el sistema de tickets"
1. Lee: [API_TICKETS.md](./backend/API_TICKETS.md)
2. Revisa: [PROGRESS_US031.md](./PROGRESS_US031.md) (Email/PDF)
3. Opcional: [PROGRESS_US034.md](./PROGRESS_US034.md) (Wallet)

### "Quiero ver el progreso del MVP"
1. Lee: [MVP_STATUS.md](./MVP_STATUS.md)
2. Revisa: [USER_STORY_MAP.md](./USER_STORY_MAP.md)
3. Opcional: [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)

### "Quiero presentar el proyecto"
1. Lee: [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)
2. Revisa: [README.md](./README.md)
3. Usa: [MVP_STATUS.md](./MVP_STATUS.md) para detalles

### "Quiero hacer deploy"
1. Lee: [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
2. Revisa: [BILLING_SETUP.md](./BILLING_SETUP.md)
3. Consulta: [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 📝 Changelog de Documentación

### Noviembre 2024 - Release 3 (Sistema de Compradores)
- ✅ NUEVO: `MVP_STATUS.md`
- ✅ NUEVO: `EXECUTIVE_SUMMARY.md`
- ✅ NUEVO: `FRONTEND_INTEGRATION_GUIDE.md`
- ✅ NUEVO: `PROGRESS_BUYER_SYSTEM.md`
- ✅ NUEVO: `DOCUMENTATION_INDEX.md`
- ✅ ACTUALIZADO: `README.md` (99% progreso)
- ✅ ACTUALIZADO: `USER_STORY_MAP.md` (US-027, 028, 036 completadas)

### Noviembre 2024 - Release 2
- NUEVO: `PROGRESS_US037_REMINDERS.md`
- NUEVO: `PROGRESS_US034.md`
- ACTUALIZADO: `README.md` (98% progreso)
- ACTUALIZADO: `USER_STORY_MAP.md`

### Octubre 2024 - Release 1
- NUEVO: `PROGRESS_US031.md`
- NUEVO: `API_TICKETS.md`
- NUEVO: `API_EVENTS.md`
- ACTUALIZADO: `README.md` (70% progreso)

### Septiembre 2024 - Setup
- NUEVO: `PROGRESS_US006.md`
- NUEVO: `PROGRESS_US001-003.md`
- NUEVO: `API_AUTH.md`
- NUEVO: `API_TENANTS.md`
- NUEVO: `API_USERS.md`
- NUEVO: `SETUP_COMPLETE.md`
- NUEVO: `BILLING_SETUP.md`
- NUEVO: `ARCHITECTURE.md`

### Agosto 2024 - Análisis
- NUEVO: `PRD.md`
- NUEVO: `USER_STORY_MAP.md`
- NUEVO: `README.md`

---

## 🎓 Recomendaciones de Lectura

### Si eres nuevo en el proyecto
1. [README.md](./README.md) - Contexto general
2. [PRD.md](./PRD.md) - Qué es Grada Negra
3. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) - Estado actual

### Si vas a desarrollar frontend
1. [FRONTEND_INTEGRATION_GUIDE.md](./FRONTEND_INTEGRATION_GUIDE.md) ⭐
2. [PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md)
3. [API_*.md](./backend/) - Todos los módulos

### Si vas a presentar el proyecto
1. [EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md) ⭐
2. [MVP_STATUS.md](./MVP_STATUS.md)
3. [USER_STORY_MAP.md](./USER_STORY_MAP.md)

### Si vas a hacer deploy
1. [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
2. [ARCHITECTURE.md](./ARCHITECTURE.md)
3. [BILLING_SETUP.md](./BILLING_SETUP.md)

---

## 📞 Contacto

**Proyecto:** Grada Negra  
**Repositorio:** GitHub  
**Última actualización:** Noviembre 2024  
**Estado:** ✅ Backend 99% MVP  
**Documentos:** 20+  

---

**Tip:** Este índice se actualiza con cada nuevo documento. Marca como favorito para referencia rápida. 📌
