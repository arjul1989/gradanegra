# TypeScript Fixes - Comercio Type Issues

## Problem

The dashboard page has TypeScript errors because the `Comercio` interface is missing properties that are being accessed in the code.

**Errors**:
- Property 'plan' does not exist on type 'Comercio'
- Property 'configuracion' does not exist on type 'Comercio'

---

## Solution

Update the `Comercio` interface to match the actual data structure from the backend.

### File: `frontend/contexts/ComercioContext.tsx`

**Replace the current interface** (lines 7-35) with:

```typescript
interface Comercio {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  logo?: string;
  imagenBanner?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  website?: string;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  colorPrimario?: string;
  colorSecundario?: string;
  
  // Plan fields - ADD THESE
  tipoPlan: 'free' | 'basic' | 'pro' | 'premium' | 'enterprise';
  plan?: 'free' | 'basic' | 'pro' | 'premium' | 'enterprise'; // Alias for tipoPlan
  limiteEventos: number;
  comision: number;
  
  // Configuration - ADD THIS
  configuracion?: {
    comision?: number;
    limiteEventos?: number;
    destacados?: number;
    [key: string]: any;
  };
  
  status: string;
  createdAt: string;
  updatedAt: string;
  
  // Billing fields (optional)
  nit?: string;
  razonSocial?: string;
  direccionFiscal?: string;
  emailFacturacion?: string;
  
  // Owner reference
  ownerId?: string;
}
```

---

## Alternative: Create Shared Types File

For better maintainability, create a shared types file:

### File: `frontend/types/comercio.ts`

```typescript
export interface Comercio {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  logo?: string;
  imagenBanner?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  website?: string;
  redesSociales?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  colorPrimario?: string;
  colorSecundario?: string;
  
  // Plan configuration
  tipoPlan: 'free' | 'basic' | 'pro' | 'premium' | 'enterprise';
  plan?: 'free' | 'basic' | 'pro' | 'premium' | 'enterprise';
  limiteEventos: number;
  comision: number;
  
  // Additional configuration
  configuracion?: {
    comision?: number;
    limiteEventos?: number;
    destacados?: number;
    [key: string]: any;
  };
  
  status: string;
  createdAt: string;
  updatedAt: string;
  
  // Billing
  nit?: string;
  razonSocial?: string;
  direccionFiscal?: string;
  emailFacturacion?: string;
  
  // References
  ownerId?: string;
}

export interface ComercioStats {
  eventosActivos: number;
  eventosDestacados: number;
  limiteEventos: number;
  totalCompras: number;
  ventasTotales: number;
  comisionesPlataforma: number;
  ingresosNetos: number;
  plan: string;
  comision: number;
  totalEventosCreados?: number;
  totalBoletosVendidos?: number;
  tasaOcupacionPromedio?: number;
  ingresosBrutos?: number;
  comisionesPagadas?: number;
  ventasPorMes?: Array<{
    mes: string;
    ventas: number;
    ingresos: number;
  }>;
  eventosPorVentas?: Array<{
    nombre: string;
    ventas: number;
    ingresos: number;
  }>;
  ventasPorTier?: Array<{
    nombre: string;
    cantidad: number;
    porcentaje: number;
  }>;
  ocupacionPorEvento?: Array<{
    nombre: string;
    vendidos: number;
    total: number;
    ocupacion: number;
  }>;
}

export interface Evento {
  id: string;
  nombre: string;
  imagen?: string;
  ciudad: string;
  status: string;
  createdAt: string;
  descripcion?: string;
  categoria?: string;
  precio?: number;
  comercioId?: string;
}
```

### Then update imports:

**File**: `frontend/contexts/ComercioContext.tsx`

```typescript
import { Comercio } from '@/types/comercio';

// Remove the interface definition, use imported type
```

**File**: `frontend/app/panel/dashboard/page.tsx`

```typescript
import { Comercio, ComercioStats, Evento } from '@/types/comercio';

// Remove interface definitions, use imported types
```

---

## Backend Consistency Check

Ensure the backend returns consistent data structure:

### File: `backend/src/models/Comercio.js`

```javascript
class Comercio {
  constructor(data) {
    this.id = data.id;
    this.nombre = data.nombre;
    this.slug = data.slug;
    this.email = data.email;
    
    // Plan fields
    this.tipoPlan = data.tipoPlan || 'free';
    this.plan = data.plan || data.tipoPlan || 'free'; // Support both
    this.limiteEventos = data.limiteEventos || 3;
    this.comision = data.comision || 10;
    
    // Configuration object
    this.configuracion = data.configuracion || {
      comision: data.comision || 10,
      limiteEventos: data.limiteEventos || 3,
      destacados: data.destacados || 0,
    };
    
    // ... rest of fields
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      slug: this.slug,
      email: this.email,
      tipoPlan: this.tipoPlan,
      plan: this.plan, // Include both for compatibility
      limiteEventos: this.limiteEventos,
      comision: this.comision,
      configuracion: this.configuracion,
      // ... rest of fields
    };
  }
}
```

---

## Quick Fix for Dashboard

If you want a quick fix without changing types, use optional chaining and fallbacks:

### File: `frontend/app/panel/dashboard/page.tsx`

```typescript
// Instead of:
<p className="text-2xl font-bold">Plan {comercio?.plan?.toUpperCase() || 'FREE'}</p>

// Use:
<p className="text-2xl font-bold">
  Plan {(comercio?.plan || comercio?.tipoPlan || 'free').toUpperCase()}
</p>

// Instead of:
<p className="text-sm text-gray-400">
  Comisión: {comercio?.configuracion?.comision || 10}% por venta
</p>

// Use:
<p className="text-sm text-gray-400">
  Comisión: {comercio?.configuracion?.comision || comercio?.comision || 10}% por venta
</p>
```

---

## Recommended Approach

1. **Create shared types file** (`frontend/types/comercio.ts`) ✅
2. **Update ComercioContext** to use shared types ✅
3. **Update all components** to import from shared types ✅
4. **Ensure backend consistency** in returned data ✅

This approach:
- ✅ Fixes TypeScript errors
- ✅ Provides single source of truth for types
- ✅ Makes future changes easier
- ✅ Improves IDE autocomplete
- ✅ Catches type errors at compile time

---

## Testing

After making changes, verify:

```bash
# Check for TypeScript errors
cd frontend
npm run build

# Should complete without type errors
```

---

## Additional Type Safety

For even better type safety, add runtime validation:

### File: `frontend/lib/validators.ts`

```typescript
import { Comercio } from '@/types/comercio';

export function validateComercio(data: any): Comercio {
  // Ensure required fields exist
  if (!data.id || !data.nombre) {
    throw new Error('Invalid comercio data');
  }

  // Normalize plan field
  const plan = data.plan || data.tipoPlan || 'free';
  
  // Normalize configuration
  const configuracion = data.configuracion || {
    comision: data.comision || 10,
    limiteEventos: data.limiteEventos || 3,
  };

  return {
    ...data,
    plan,
    tipoPlan: plan,
    configuracion,
    comision: data.comision || configuracion.comision || 10,
    limiteEventos: data.limiteEventos || configuracion.limiteEventos || 3,
  };
}
```

Use in ComercioContext:

```typescript
import { validateComercio } from '@/lib/validators';

const fetchComercio = async () => {
  // ... fetch logic ...
  
  const data = await response.json();
  const validatedData = validateComercio(data);
  setComercio(validatedData);
};
```

---

This ensures your frontend always has consistent, type-safe data regardless of backend variations.
