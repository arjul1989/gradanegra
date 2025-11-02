# 🏗️ Arquitectura Técnica - Grada Negra MVP

**Última actualización:** Noviembre 1, 2025  
**Fase:** MVP - Arquitectura $0 (Zero Cost)

---

## 🎯 Objetivos de Arquitectura

1. **Costo $0** durante desarrollo y MVP
2. **Escalable** para crecimiento futuro
3. **Segura** (hash anti-falsificación, autenticación)
4. **Simple** de mantener y desplegar

---

## 🏛️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USUARIOS FINALES                             │
│               (Compradores, Organizadores, Validadores)              │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │   Frontend Web      │   │   Admin Dashboard   │
         │   (Next.js)         │   │   (Next.js)         │
         │   Vercel - FREE     │   │   Vercel - FREE     │
         └──────────┬──────────┘   └─────────┬──────────┘
                    │                        │
                    └────────────┬───────────┘
                                 │ HTTPS/REST
                    ┌────────────▼────────────┐
                    │   Cloud Run API         │
                    │   (Backend Node.js)     │
                    │   min-instances: 0      │
                    │   FREE: 2M req/mes      │
                    └────────────┬────────────┘
                                 │
        ┌────────────┬───────────┼───────────┬────────────┐
        │            │           │           │            │
┌───────▼──────┐ ┌──▼────┐ ┌───▼───┐ ┌─────▼─────┐ ┌───▼───────┐
│  Firestore   │ │Storage│ │Secret │ │  Firebase  │ │  Resend   │
│  Database    │ │ (GCS) │ │Manager│ │    Auth    │ │  (Email)  │
│  FREE: 1GB   │ │FREE:5G│ │ FREE  │ │   FREE     │ │ FREE:3K/m │
└──────────────┘ └───────┘ └───────┘ └────────────┘ └───────────┘
```

---

## 🗂️ Estructura de Datos (Firestore)

### Colecciones Principales:

```
/tenants/{tenantId}
  - name: string
  - slug: string (unique)
  - logo: string (URL)
  - colors: object
  - active: boolean
  - createdAt: timestamp
  
/users/{userId}
  - email: string
  - name: string
  - tenantId: string
  - role: enum [platform_admin, tenant_admin, finance, operations]
  - active: boolean
  
/events/{eventId}
  - tenantId: string
  - name: string
  - description: string
  - date: timestamp
  - location: object
  - maxCapacity: number (max 1000)
  - tiers: array (max 10)
    - name: string
    - price: number
    - quantity: number
    - sold: number
  - status: enum [draft, published, closed]
  - createdAt: timestamp
  
/tickets/{ticketId}
  - eventId: string
  - tenantId: string
  - tierName: string
  - price: number
  - buyerEmail: string
  - buyerName: string
  - hash: string (SHA-256)
  - qrCode: string (data URL)
  - status: enum [pending, paid, validated, cancelled]
  - validatedAt: timestamp | null
  - validatedBy: string | null
  - purchaseDate: timestamp
  - transactionId: string
  
/buyers/{buyerId} (opcional - para cuentas)
  - email: string
  - name: string
  - phone: string
  - tickets: array<ticketId>
```

---

## 🔐 Sistema de Seguridad

### Hash de Ticket (Anti-falsificación)

```javascript
// Generación del hash
const crypto = require('crypto');

function generateTicketHash(ticket) {
  const data = [
    ticket.id,
    ticket.eventId,
    ticket.tenantId,
    ticket.buyerEmail,
    ticket.price,
    ticket.purchaseDate.toISOString(),
    process.env.SECRET_SALT
  ].join('|');
  
  return crypto
    .createHash('sha256')
    .update(data)
    .digest('hex');
}

// Validación del hash
function validateTicketHash(ticket) {
  const expectedHash = generateTicketHash(ticket);
  return ticket.hash === expectedHash;
}
```

### QR Code
```javascript
const QRCode = require('qrcode');

async function generateQR(ticketId, hash) {
  const data = JSON.stringify({
    ticketId,
    hash,
    timestamp: Date.now()
  });
  
  return await QRCode.toDataURL(data);
}
```

---

## 🛣️ API Endpoints

### Autenticación
```
POST   /api/auth/login              # Login con email/password
POST   /api/auth/register           # Registro (solo invitación)
POST   /api/auth/refresh            # Refresh token
GET    /api/auth/me                 # Usuario actual
```

### Tenants (Platform Admin)
```
GET    /api/tenants                 # Listar tenants
POST   /api/tenants                 # Crear tenant
GET    /api/tenants/:id             # Ver tenant
PATCH  /api/tenants/:id             # Actualizar tenant
DELETE /api/tenants/:id             # Desactivar tenant
```

### Users
```
GET    /api/users                   # Listar usuarios del tenant
POST   /api/users/invite            # Invitar usuario
GET    /api/users/:id               # Ver usuario
PATCH  /api/users/:id               # Actualizar usuario
DELETE /api/users/:id               # Desactivar usuario
```

### Events
```
GET    /api/events                  # Listar eventos del tenant
POST   /api/events                  # Crear evento
GET    /api/events/:id              # Ver evento
PATCH  /api/events/:id              # Actualizar evento
POST   /api/events/:id/clone        # Clonar evento
POST   /api/events/:id/publish      # Publicar evento
DELETE /api/events/:id              # Eliminar evento
GET    /api/events/:id/stats        # Estadísticas del evento
```

### Tickets (Compra)
```
GET    /api/public/events           # Eventos públicos
GET    /api/public/events/:id       # Detalle evento público
POST   /api/tickets/purchase        # Comprar tickets
GET    /api/tickets/:id             # Ver ticket (con hash)
POST   /api/tickets/:id/resend      # Reenviar ticket por email
```

### Validation (Operaciones)
```
POST   /api/validate/scan           # Validar ticket por QR
GET    /api/validate/event/:id      # Stats de validación
GET    /api/validate/history        # Historial de validaciones
```

### Buyers (Opcional)
```
POST   /api/buyers/register         # Crear cuenta
GET    /api/buyers/tickets          # Mis tickets
GET    /api/buyers/tickets/:id/download # Descargar ticket
```

---

## 🔧 Stack Tecnológico

### Backend
- **Runtime:** Node.js 20 LTS
- **Framework:** Express.js / Fastify
- **Database:** Firestore (Firebase)
- **Auth:** Firebase Authentication
- **Storage:** Google Cloud Storage
- **Email:** Resend (3K emails/mes gratis)
- **PDF:** PDFKit
- **QR:** qrcode.js
- **Deploy:** Cloud Run (min-instances: 0)

### Frontend
- **Framework:** Next.js 14 (App Router)
- **UI Library:** Tailwind CSS + shadcn/ui
- **State:** React Context / Zustand
- **Forms:** React Hook Form + Zod
- **HTTP:** Axios / Fetch
- **Deploy:** Vercel (gratis)

### DevOps
- **CI/CD:** GitHub Actions
- **Secrets:** Google Secret Manager
- **Monitoring:** Google Cloud Logging (gratis dentro de límites)
- **Version Control:** Git + GitHub

---

## 📦 Estructura del Proyecto

```
gradanegra/
├── backend/
│   ├── src/
│   │   ├── config/          # Configuración (Firebase, etc)
│   │   ├── models/          # Modelos de datos
│   │   ├── controllers/     # Lógica de negocio
│   │   ├── routes/          # Definición de rutas
│   │   ├── middleware/      # Auth, validation, etc
│   │   ├── services/        # Servicios (email, pdf, hash)
│   │   ├── utils/           # Utilidades
│   │   └── index.js         # Entry point
│   ├── tests/
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React components
│   │   ├── lib/            # Utilidades
│   │   ├── hooks/          # Custom hooks
│   │   └── styles/         # CSS/Tailwind
│   ├── public/
│   ├── package.json
│   └── next.config.js
├── admin/                  # Dashboard de administración
│   └── (similar a frontend)
├── scripts/                # Scripts de setup y deployment
├── docs/                   # Documentación
└── .github/
    └── workflows/          # GitHub Actions
```

---

## 🚀 Pipeline de Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
      - name: Build and Deploy
        run: |
          gcloud run deploy gradanegra-api \
            --source ./backend \
            --region us-central1 \
            --platform managed \
            --allow-unauthenticated \
            --min-instances 0 \
            --max-instances 10 \
            --memory 512Mi \
            --timeout 60
```

---

## 🎯 Próximos Pasos de Implementación

1. ✅ Crear estructura del proyecto backend
2. ✅ Configurar Firebase/Firestore
3. ✅ Implementar autenticación
4. ✅ Crear endpoints de eventos
5. ✅ Sistema de generación de hash
6. ✅ Integración con Resend (emails)
7. ✅ Generación de PDF
8. ✅ Deploy a Cloud Run
9. ✅ Frontend en Next.js
10. ✅ Deploy a Vercel

---

**Estado:** Esperando vinculación de billing para continuar
