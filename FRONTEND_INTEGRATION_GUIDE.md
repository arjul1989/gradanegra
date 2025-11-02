# 🚀 Guía de Integración Frontend - Grada Negra

## 📋 Información Rápida

**Base URL:** `http://localhost:8080` (desarrollo)  
**Total Endpoints:** 51  
**Auth Provider:** Firebase Auth  
**Database:** Firestore  

---

## 🔐 Autenticación

### Setup Firebase (Frontend)

```javascript
// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  // ... resto de config
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
```

### Tipos de Usuario

| Tipo | Roles | Login Endpoint | Auth Header |
|------|-------|---------------|-------------|
| **Admin/Staff** | platform_admin, tenant_admin, finance, operations | `/api/auth/login` | `Authorization: Bearer {idToken}` |
| **Buyer** | buyer | `/api/buyers/login` o `/api/buyers/auth/google` | `Authorization: Bearer {idToken}` |

---

## 👥 Flujos de Autenticación

### 1. Login Admin/Staff (Email/Password)

```javascript
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './firebase';

async function loginAdmin(email, password) {
  try {
    // 1. Login con Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // 2. Obtener idToken
    const idToken = await userCredential.user.getIdToken();
    
    // 3. Verificar con backend (obtiene perfil + permisos)
    const response = await fetch('http://localhost:8080/api/auth/login', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      }
    });
    
    const data = await response.json();
    
    // 4. Guardar
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('user', JSON.stringify(data.user));
    
    return data.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}
```

### 2. Login Buyer (Google OAuth)

```javascript
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

async function loginWithGoogle() {
  try {
    // 1. Popup de Google
    const result = await signInWithPopup(auth, googleProvider);
    
    // 2. Obtener idToken
    const idToken = await result.user.getIdToken();
    
    // 3. Enviar a backend (crea/actualiza perfil)
    const response = await fetch('http://localhost:8080/api/buyers/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    });
    
    const data = await response.json();
    
    // 4. Guardar
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('buyer', JSON.stringify(data.buyer));
    
    return data.buyer;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
}
```

### 3. Registro Buyer (Email/Password)

```javascript
async function registerBuyer(email, password, displayName, phoneNumber) {
  try {
    const response = await fetch('http://localhost:8080/api/buyers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, phoneNumber })
    });
    
    const data = await response.json();
    
    // Backend retorna customToken para login automático
    // Usar customToken con Firebase SDK:
    import { signInWithCustomToken } from 'firebase/auth';
    await signInWithCustomToken(auth, data.customToken);
    
    const idToken = await auth.currentUser.getIdToken();
    localStorage.setItem('idToken', idToken);
    localStorage.setItem('buyer', JSON.stringify(data.buyer));
    
    return data.buyer;
  } catch (error) {
    console.error('Register error:', error);
    throw error;
  }
}
```

---

## 🛠️ Helper de API

```javascript
// lib/api.js
import { auth } from './firebase';

export async function apiCall(endpoint, options = {}) {
  const user = auth.currentUser;
  const idToken = user ? await user.getIdToken() : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (idToken) {
    headers['Authorization'] = `Bearer ${idToken}`;
  }
  
  const response = await fetch(`http://localhost:8080${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API Error');
  }
  
  return response.json();
}

// Uso:
// const events = await apiCall('/api/events');
// const profile = await apiCall('/api/buyers/me');
```

---

## 📦 Endpoints por Pantalla

### 🏠 Dashboard Admin Plataforma

**GET /api/tenants** - Listar todos los comercios
```javascript
const response = await apiCall('/api/tenants?limit=20&offset=0');
// { success, count, data: [tenants] }
```

**POST /api/tenants** - Crear nuevo comercio
```javascript
const tenant = await apiCall('/api/tenants', {
  method: 'POST',
  body: JSON.stringify({
    name: "Mi Comercio",
    slug: "mi-comercio", // opcional, se genera automático
    email: "admin@comercio.com",
    phone: "+5215512345678",
    branding: {
      logo: "https://...",
      primaryColor: "#FF6B35"
    }
  })
});
```

---

### 🏢 Dashboard Admin Comercio

**GET /api/tenants/:id/dashboard** - Métricas del comercio
```javascript
const dashboard = await apiCall(`/api/tenants/${tenantId}/dashboard`);
// {
//   tenant: { ... },
//   stats: { totalEvents, activeEvents, totalTicketsSold, totalRevenue },
//   averages: { revenuePerEvent, ticketsPerEvent },
//   subscription: { plan, eventsUsed, eventsLimit, ticketsUsed, ticketsLimit }
// }
```

**GET /api/tenants/:id/events** - Eventos del comercio
```javascript
const events = await apiCall(`/api/tenants/${tenantId}/events?limit=10`);
// { success, count, data: [events] }
```

**GET /api/tenants/:tenantId/users** - Usuarios del comercio
```javascript
const users = await apiCall(`/api/tenants/${tenantId}/users`);
// { success, count, data: [users] }
```

---

### 🎉 Gestión de Eventos

**POST /api/events** - Crear evento
```javascript
const event = await apiCall('/api/events', {
  method: 'POST',
  body: JSON.stringify({
    tenantId: "tenant123",
    name: "Concierto Rock",
    description: "La mejor banda de rock",
    date: "2024-12-15T20:00:00.000Z",
    venue: {
      name: "Arena CDMX",
      address: "Av. Principal 123",
      city: "Ciudad de México",
      capacity: 1000
    },
    tiers: [
      {
        name: "VIP",
        price: 500,
        capacity: 100,
        benefits: ["Acceso backstage", "Meet & greet"]
      },
      {
        name: "General",
        price: 200,
        capacity: 900,
        benefits: []
      }
    ],
    status: "draft" // draft | published
  })
});
```

**GET /api/events** - Listar eventos
```javascript
// Con filtros
const events = await apiCall('/api/events?tenantId=tenant123&status=published&limit=20');

// Sin filtros (todos)
const allEvents = await apiCall('/api/events');
```

**GET /api/events/:id** - Detalle de evento
```javascript
const event = await apiCall(`/api/events/${eventId}`);
// Incluye tiers con stats (sold, available)
```

**PATCH /api/events/:id** - Actualizar evento
```javascript
const updated = await apiCall(`/api/events/${eventId}`, {
  method: 'PATCH',
  body: JSON.stringify({
    name: "Nuevo nombre",
    description: "Nueva descripción"
  })
});
```

**POST /api/events/:id/publish** - Publicar evento
```javascript
const published = await apiCall(`/api/events/${eventId}/publish`, {
  method: 'POST'
});
```

**POST /api/events/:id/unpublish** - Despublicar evento
```javascript
const unpublished = await apiCall(`/api/events/${eventId}/unpublish`, {
  method: 'POST'
});
```

**POST /api/events/:id/cancel** - Cancelar evento
```javascript
const cancelled = await apiCall(`/api/events/${eventId}/cancel`, {
  method: 'POST'
});
```

**GET /api/events/:id/stats** - Estadísticas de evento
```javascript
const stats = await apiCall(`/api/events/${eventId}/stats`);
// {
//   event: { ... },
//   totalTicketsSold, totalRevenue, totalCapacity, occupancyRate,
//   tiers: [ { tierId, name, sold, available, revenue, occupancy } ]
// }
```

---

### 🎫 Compra de Tickets (Público)

**POST /api/tickets** - Crear tickets (NO requiere auth)
```javascript
// Compra anónima (sin Authorization header)
const tickets = await fetch('http://localhost:8080/api/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    eventId: "event123",
    tierId: "tier456",
    quantity: 2,
    buyer: {
      name: "Juan Pérez",
      email: "juan@example.com",
      phone: "+5215512345678"
    }
  })
});

// Compra autenticada (con Authorization header)
// Los tickets se vinculan automáticamente con buyerId
const authenticatedTickets = await apiCall('/api/tickets', {
  method: 'POST',
  body: JSON.stringify({
    eventId: "event123",
    tierId: "tier456",
    quantity: 2,
    buyer: {
      name: "Juan Pérez",
      email: "juan@example.com",
      phone: "+5215512345678"
    }
  })
});
// Retorna: { success, data: [tickets] }
```

---

### 👤 Perfil de Buyer

**GET /api/buyers/me** - Ver perfil
```javascript
const profile = await apiCall('/api/buyers/me');
// {
//   id, email, displayName, photoURL, phoneNumber,
//   profile: { firstName, lastName, address, preferences },
//   stats: { totalTicketsPurchased, totalSpent, totalEventsAttended }
// }
```

**PATCH /api/buyers/me** - Actualizar perfil
```javascript
const updated = await apiCall('/api/buyers/me', {
  method: 'PATCH',
  body: JSON.stringify({
    displayName: "Juan Carlos Pérez",
    phoneNumber: "+5215598765432",
    profile: {
      firstName: "Juan Carlos",
      lastName: "Pérez García",
      address: {
        street: "Av. Reforma 123",
        city: "Ciudad de México",
        state: "CDMX",
        postalCode: "06600"
      },
      preferences: {
        notifications: {
          email: true,
          sms: true
        }
      }
    }
  })
});
```

**DELETE /api/buyers/me** - Eliminar cuenta
```javascript
await apiCall('/api/buyers/me', { method: 'DELETE' });
// Soft delete: desactiva en Firestore + Firebase Auth
```

---

### 🎫 Mis Tickets (Buyer)

**GET /api/buyers/me/tickets** - Historial de tickets
```javascript
const tickets = await apiCall('/api/buyers/me/tickets');
// Combina tickets con buyerId + tickets con email
// Deduplicación automática
// Retorna: { success, count, data: [tickets] }
```

**GET /api/buyers/me/tickets/:id** - Detalle de ticket
```javascript
const ticket = await apiCall(`/api/buyers/me/tickets/${ticketId}`);
// Valida ownership antes de retornar
```

**POST /api/buyers/me/tickets/:id/resend** - Reenviar ticket
```javascript
await apiCall(`/api/buyers/me/tickets/${ticketId}/resend`, {
  method: 'POST'
});
// Regenera PDF + pkpass, envía email
```

**GET /api/tickets/:id/apple-wallet** - Descargar .pkpass
```javascript
// Link directo (no requiere auth)
const walletUrl = `http://localhost:8080/api/tickets/${ticketId}/apple-wallet`;
// Retorna archivo .pkpass para descargar
```

---

### ✅ Validación de Tickets (Operaciones)

**POST /api/validate** - Validar ticket por QR
```javascript
const validation = await apiCall('/api/validate', {
  method: 'POST',
  body: JSON.stringify({
    ticketNumber: "TKT-2024-ABC123",
    securityHash: "a1b2c3d4e5f6..."
  })
});
// { 
//   valid: true/false, 
//   ticket: { ... },
//   message: "Ticket válido" | "Ya fue validado" | "Hash inválido"
// }
```

**PATCH /api/tickets/:id/validate** - Check-in manual
```javascript
const checkedIn = await apiCall(`/api/tickets/${ticketId}/validate`, {
  method: 'PATCH'
});
// Marca isValidated = true, guarda validatedAt
```

**GET /api/tickets** - Listar tickets (con filtros)
```javascript
// Filtros disponibles
const tickets = await apiCall('/api/tickets?eventId=event123&status=confirmed&limit=50');
```

---

## 🎨 Componentes de UI Sugeridos

### AuthGuard (Proteger rutas)

```javascript
// components/AuthGuard.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';

export default function AuthGuard({ children, role }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/login');
        return;
      }

      // Verificar rol si es necesario
      const idToken = await user.getIdToken(true);
      const response = await fetch('http://localhost:8080/api/auth/me', {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      
      const data = await response.json();
      
      if (role && data.user.role !== role) {
        router.push('/unauthorized');
        return;
      }

      setAuthorized(true);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [role]);

  if (loading) return <div>Loading...</div>;
  if (!authorized) return null;

  return children;
}

// Uso:
// <AuthGuard role="tenant_admin">
//   <DashboardPage />
// </AuthGuard>
```

### EventCard

```javascript
// components/EventCard.js
export default function EventCard({ event }) {
  return (
    <div className="border rounded-lg p-4 shadow hover:shadow-lg">
      <h3 className="text-xl font-bold">{event.name}</h3>
      <p className="text-gray-600">{event.venue.name}</p>
      <p className="text-gray-500">
        {new Date(event.date).toLocaleDateString('es-MX', {
          dateStyle: 'full'
        })}
      </p>
      <div className="mt-4">
        <span className={`px-2 py-1 rounded text-sm ${
          event.status === 'published' ? 'bg-green-100 text-green-800' : 
          event.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {event.status}
        </span>
      </div>
      <p className="mt-2 text-lg font-semibold">
        Desde ${event.tiers[0]?.price.toLocaleString('es-MX')} MXN
      </p>
    </div>
  );
}
```

### TicketCard

```javascript
// components/TicketCard.js
import Image from 'next/image';

export default function TicketCard({ ticket }) {
  return (
    <div className="border rounded-lg p-4 shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">{ticket.eventName}</h3>
          <p className="text-gray-600">{ticket.tierName}</p>
          <p className="text-sm text-gray-500">{ticket.ticketNumber}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold">${ticket.price} MXN</p>
          <span className={`px-2 py-1 rounded text-xs ${
            ticket.isValidated ? 'bg-red-100 text-red-800' : 
            'bg-green-100 text-green-800'
          }`}>
            {ticket.isValidated ? 'Usado' : 'Válido'}
          </span>
        </div>
      </div>
      
      {ticket.qrCodeDataUrl && (
        <div className="mt-4 flex justify-center">
          <Image 
            src={ticket.qrCodeDataUrl} 
            alt="QR Code" 
            width={200} 
            height={200}
          />
        </div>
      )}
      
      <div className="mt-4 space-x-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Ver Ticket
        </button>
        <a 
          href={`/api/tickets/${ticket.id}/apple-wallet`}
          className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 inline-block"
        >
          📱 Agregar a Wallet
        </a>
      </div>
    </div>
  );
}
```

---

## 🔧 Variables de Entorno

```bash
# .env.local (Next.js)

# Firebase (Frontend)
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef

# API Backend
NEXT_PUBLIC_API_URL=http://localhost:8080

# Opcional (production)
NEXT_PUBLIC_API_URL=https://api.gradanegra.com
```

---

## 📱 Consideraciones Mobile

### Apple Wallet
- Link directo funciona en Safari iOS
- Automáticamente pregunta "¿Agregar a Wallet?"
- Requiere certificados en producción

### Google Wallet
- Placeholder implementado (`/api/tickets/:id/google-wallet`)
- Requiere configuración de Google Pay API
- Funciona con link directo en Android

### QR Code
- Usar librería de escaneo: `html5-qrcode` o `react-qr-scanner`
- QR contiene: `ticketNumber|securityHash`
- Validar con: `POST /api/validate`

---

## 🚨 Manejo de Errores

```javascript
// lib/api.js
export async function apiCall(endpoint, options = {}) {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, options);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    // Logging
    console.error('API Error:', error);
    
    // UI feedback
    toast.error(error.message || 'Error de conexión');
    
    // Re-throw para manejo específico
    throw error;
  }
}
```

### Errores Comunes

| Status | Mensaje | Acción |
|--------|---------|--------|
| 400 | Bad Request | Revisar datos enviados |
| 401 | Unauthorized | Re-autenticar usuario |
| 403 | Forbidden | Usuario no tiene permisos |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Ya existe (ej: slug duplicado) |
| 500 | Server Error | Mostrar error genérico |

---

## 🎯 Checklist de Integración

### Setup Inicial
- [ ] Crear proyecto Next.js
- [ ] Instalar Firebase SDK (`npm install firebase`)
- [ ] Configurar variables de entorno
- [ ] Setup de Tailwind CSS
- [ ] Instalar shadcn/ui (opcional)

### Autenticación
- [ ] Implementar login admin (email/password)
- [ ] Implementar login buyer (email/password + Google)
- [ ] Implementar registro de buyer
- [ ] Crear AuthGuard component
- [ ] Implementar logout
- [ ] Persistencia de sesión

### Admin Dashboard
- [ ] Dashboard de plataforma (métricas globales)
- [ ] Dashboard de comercio (eventos, tickets, revenue)
- [ ] Gestión de eventos (CRUD)
- [ ] Gestión de usuarios del tenant
- [ ] Reportes y estadísticas

### Pantallas Públicas
- [ ] Home page
- [ ] Catálogo de eventos
- [ ] Detalle de evento
- [ ] Carrito de compra
- [ ] Checkout (sin pago online por ahora)
- [ ] Confirmación de compra

### Buyer Dashboard
- [ ] Registro y login
- [ ] Mi perfil
- [ ] Mis tickets
- [ ] Detalle de ticket con QR
- [ ] Re-descarga de tickets
- [ ] Agregar a Apple/Google Wallet

### Validación (Operaciones)
- [ ] Escáner de QR
- [ ] Validación manual (por número)
- [ ] Dashboard de evento en vivo
- [ ] Check-in masivo

---

## 📚 Recursos Adicionales

### Documentación
- Firebase Auth: https://firebase.google.com/docs/auth/web/start
- Next.js: https://nextjs.org/docs
- Tailwind CSS: https://tailwindcss.com/docs

### Librerías Útiles
- `react-hook-form` - Manejo de formularios
- `zod` - Validación de schemas
- `react-query` - Data fetching
- `zustand` - State management
- `recharts` - Charts y gráficas
- `html5-qrcode` - QR scanner
- `react-hot-toast` - Notificaciones

---

**¿Dudas? Consulta la documentación completa:**
- [PROGRESS_BUYER_SYSTEM.md](./PROGRESS_BUYER_SYSTEM.md)
- [backend/API_*.md](./backend/)
- [MVP_STATUS.md](./MVP_STATUS.md)
