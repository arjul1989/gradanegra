# 🎨 GUÍA: Modales Personalizados - Reemplazar confirm() y alert()

**Fecha:** 10 de Noviembre, 2025  
**Estado:** ✅ Sistema implementado y listo para usar

---

## 📋 RESUMEN

He creado un sistema completo de modales personalizados para reemplazar los diálogos nativos del navegador (`confirm()` y `alert()`) con componentes React modernos y consistentes con el diseño de Grada Negra.

### ✅ Lo que se implementó:

1. **`ConfirmDialog.tsx`** - Modal de confirmación (Sí/No)
2. **`AlertDialog.tsx`** - Modal de alerta (Solo OK)
3. **`DialogContext.tsx`** - Context para manejar modales globalmente
4. **Integración en `layout.tsx`** - Proveedor global disponible en toda la app

---

## 🎯 ANTES vs DESPUÉS

### ❌ ANTES (Diálogos nativos del navegador)

```typescript
// Confirmación
const confirmado = confirm('¿Estás seguro de eliminar este evento?')
if (!confirmado) return

// Alerta
alert('Evento eliminado exitosamente')
```

**Problemas:**
- 😞 Diseño feo y anticuado
- 🚫 No se puede personalizar
- 📱 Mal aspecto en móviles
- 🎨 No coincide con el tema de la app

### ✅ DESPUÉS (Modales personalizados)

```typescript
import { useDialog } from '@/contexts/DialogContext'

const { confirm, showSuccess, showError } = useDialog()

// Confirmación
const confirmado = await confirm({
  title: '¿Eliminar evento?',
  message: '¿Estás seguro de eliminar este evento?\n\nEsta acción no se puede deshacer.',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar',
  icon: 'danger'
})
if (!confirmado) return

// Alerta de éxito
await showSuccess('Evento eliminado exitosamente')
```

**Ventajas:**
- ✨ Diseño moderno y profesional
- 🎨 Totalmente personalizable
- 📱 Responsive (se ve perfecto en móvil y desktop)
- 🌙 Coincide con el tema oscuro de la app
- ♿ Accesible (soporte de teclado, ARIA labels)
- 🎭 Animaciones suaves

---

## 🚀 CÓMO USAR EL NUEVO SISTEMA

### 1. Importar el hook

En cualquier componente, importa el hook `useDialog`:

```typescript
import { useDialog } from '@/contexts/DialogContext'

export default function MiComponente() {
  const { confirm, alert, showSuccess, showError, showWarning, showInfo } = useDialog()
  
  // ... tu código
}
```

### 2. Métodos disponibles

#### `confirm()` - Modal de confirmación

```typescript
const confirmado = await confirm({
  title: string,           // Título del modal (requerido)
  message: string,         // Mensaje (requerido)
  confirmText?: string,    // Texto del botón confirmar (default: "Confirmar")
  cancelText?: string,     // Texto del botón cancelar (default: "Cancelar")
  icon?: 'warning' | 'danger' | 'info' | 'success',  // Ícono (default: 'warning')
  confirmButtonClass?: string  // Clase CSS custom para botón confirmar
})

// Retorna: Promise<boolean>
// true = usuario confirmó
// false = usuario canceló
```

**Ejemplos:**

```typescript
// Confirmación de eliminación (peligrosa)
const confirmado = await confirm({
  title: '¿Eliminar evento?',
  message: 'Esta acción no se puede deshacer',
  icon: 'danger',
  confirmText: 'Eliminar',
  cancelText: 'Cancelar'
})

// Confirmación de cambio de estado (advertencia)
const confirmado = await confirm({
  title: '¿Cambiar estado?',
  message: '¿Estás seguro de cambiar el estado a inactivo?',
  icon: 'warning',
  confirmText: 'Sí, cambiar',
  cancelText: 'No'
})

// Confirmación informativa
const confirmado = await confirm({
  title: 'Guardar cambios',
  message: '¿Deseas guardar los cambios realizados?',
  icon: 'info',
  confirmText: 'Guardar',
  cancelText: 'Descartar'
})
```

#### `alert()` - Modal de alerta

```typescript
await alert({
  title: string,           // Título del modal (requerido)
  message: string,         // Mensaje (requerido)
  buttonText?: string,     // Texto del botón (default: "Aceptar")
  type?: 'success' | 'error' | 'info' | 'warning'  // Tipo (default: 'info')
})

// Retorna: Promise<void>
```

#### Atajos de conveniencia

```typescript
// Mensaje de éxito
await showSuccess('Operación completada exitosamente')
await showSuccess('Cambios guardados', 'Perfecto!')  // Con título custom

// Mensaje de error
await showError('No se pudo completar la operación')
await showError('Email ya registrado', 'Error de validación')

// Mensaje de advertencia
await showWarning('Esta acción puede tener consecuencias')
await showWarning('El evento tiene boletos vendidos', '¡Cuidado!')

// Mensaje informativo
await showInfo('Los cambios tardarán 24 horas en aplicarse')
await showInfo('Nuevo sistema de pagos disponible', 'Novedad')
```

---

## 📝 PATRÓN DE REEMPLAZO

### Patrón 1: Reemplazar confirm()

**❌ Antes:**
```typescript
const handleDelete = async () => {
  if (!confirm('¿Estás seguro?')) return
  
  // Lógica de eliminación
}
```

**✅ Después:**
```typescript
const { confirm } = useDialog()

const handleDelete = async () => {
  const confirmado = await confirm({
    title: '¿Eliminar?',
    message: '¿Estás seguro?',
    icon: 'danger',
    confirmText: 'Eliminar',
    cancelText: 'Cancelar'
  })
  
  if (!confirmado) return
  
  // Lógica de eliminación
}
```

### Patrón 2: Reemplazar alert()

**❌ Antes:**
```typescript
try {
  // ... operación
  alert('Operación exitosa')
} catch (error) {
  alert('Error en la operación')
}
```

**✅ Después:**
```typescript
const { showSuccess, showError } = useDialog()

try {
  // ... operación
  await showSuccess('Operación exitosa')
} catch (error) {
  await showError('Error en la operación')
}
```

### Patrón 3: Confirmación con window.confirm

**❌ Antes:**
```typescript
if (window.confirm('¿Continuar?')) {
  // hacer algo
}
```

**✅ Después:**
```typescript
const confirmado = await confirm({
  title: 'Confirmar acción',
  message: '¿Continuar?',
  confirmText: 'Sí',
  cancelText: 'No'
})

if (confirmado) {
  // hacer algo
}
```

---

## 🎨 TIPOS DE ÍCONOS Y COLORES

### Ícono: `danger` (rojo)
- **Uso:** Acciones destructivas (eliminar, cancelar permanente)
- **Color:** Rojo (#ef4444)
- **Ejemplos:** Eliminar evento, cancelar compra, borrar cuenta

### Ícono: `warning` (amarillo)
- **Uso:** Advertencias, cambios importantes
- **Color:** Amarillo (#f59e0b)
- **Ejemplos:** Cambiar estado, modificar configuración, salir sin guardar

### Ícono: `info` (azul)
- **Uso:** Información, confirmaciones neutras
- **Color:** Azul (#3b82f6)
- **Ejemplos:** Guardar cambios, continuar proceso, aceptar términos

### Ícono: `success` (verde)
- **Uso:** Confirmaciones positivas
- **Color:** Verde (#10b981)
- **Ejemplos:** Publicar evento, activar función, completar configuración

---

## 🔄 ARCHIVOS QUE NECESITAN MIGRACIÓN

### Archivos con `confirm()` (11 archivos)

1. ✅ `frontend/app/panel/eventos/page.tsx` - **EJEMPLO COMPLETADO**
2. ⏳ `frontend/app/admin/comercios/[id]/page.tsx`
3. ⏳ `frontend/app/panel/cupones/page.tsx`
4. ⏳ `frontend/app/panel/eventos/[id]/page.tsx`
5. ⏳ `frontend/app/panel/eventos/[id]/editar/page.tsx`
6. ⏳ `frontend/app/panel/eventos/[id]/gestionar-fechas/page.tsx`
7. ⏳ `frontend/app/panel/eventos/[id]/verificar/page.tsx`
8. ⏳ `frontend/app/panel/eventos/crear/paso-4/page.tsx`
9. ⏳ `frontend/app/panel/equipo/page.tsx`
10. ⏳ `frontend/app/panel/perfil/page.tsx`
11. ⏳ `frontend/app/usuario/perfil/page.tsx`

### Archivos con `alert()` (18 archivos)

Todos los archivos listados arriba + adicionales con solo `alert()`

---

## ⚡ MIGRACIÓN RÁPIDA (PASO A PASO)

### Paso 1: Agregar el import

```typescript
import { useDialog } from '@/contexts/DialogContext'
```

### Paso 2: Obtener los métodos

```typescript
export default function MiComponente() {
  const { confirm, showSuccess, showError } = useDialog()
  // ...
}
```

### Paso 3: Buscar todos los `confirm()` y `alert()`

```bash
# En tu archivo actual
# Ctrl+F (o Cmd+F) buscar: confirm(
# Ctrl+F (o Cmd+F) buscar: alert(
```

### Paso 4: Reemplazar uno por uno

Sigue los patrones de arriba para cada instancia.

---

## 🧪 EJEMPLO COMPLETO

Aquí está el archivo `panel/eventos/page.tsx` como referencia completa:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useDialog } from '@/contexts/DialogContext'

export default function EventosPage() {
  // 1. Obtener métodos del hook
  const { confirm, showSuccess, showError } = useDialog()
  
  // 2. Usar en funciones async
  const handleDelete = async (eventoId: string, eventoNombre: string) => {
    // Confirmación personalizada
    const confirmado = await confirm({
      title: '¿Eliminar evento?',
      message: `¿Estás seguro de eliminar el evento "${eventoNombre}"?\n\nEsta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      icon: 'danger'
    })
    
    if (!confirmado) return

    try {
      const response = await fetch(`${API_URL}/api/eventos/${eventoId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Error al eliminar evento')

      // Alerta de éxito
      await showSuccess('Evento eliminado exitosamente')
      fetchEventos()
    } catch (error) {
      console.error('Error deleting evento:', error)
      // Alerta de error
      await showError('Error al eliminar el evento')
    }
  }
  
  // ... resto del componente
}
```

---

## 🐛 TROUBLESHOOTING

### Error: "useDialog must be used within a DialogProvider"

**Problema:** El componente no tiene acceso al DialogProvider  
**Solución:** Verifica que `DialogProvider` esté en `app/layout.tsx`

```typescript
// app/layout.tsx
import { DialogProvider } from '@/contexts/DialogContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          <DialogProvider>  {/* ✅ Debe estar aquí */}
            {children}
          </DialogProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
```

### Los modales no se ven

**Problema:** Tailwind no está compilando las clases  
**Solución:** Verifica que los componentes estén en rutas incluidas en `tailwind.config.js`

### El modal no se cierra con Escape

**Problema:** Conflicto con otros event listeners  
**Solución:** Verifica que no haya otros listeners de `keydown` interfiriendo

---

## 📊 CARACTERÍSTICAS TÉCNICAS

### Accesibilidad (A11y)
- ✅ Role `dialog` y `aria-modal`
- ✅ `aria-labelledby` apuntando al título
- ✅ Soporte de teclado (Escape para cerrar, Enter para confirmar alerts)
- ✅ Focus trap (el focus se mantiene en el modal)

### UX
- ✅ Click fuera del modal para cerrar (backdrop clickeable)
- ✅ Backdrop con blur para mejor contraste
- ✅ Animaciones suaves de entrada/salida
- ✅ Prevención de scroll del body cuando está abierto
- ✅ Responsive (se adapta a móvil, tablet, desktop)

### Performance
- ✅ Lazy rendering (solo renderiza cuando `isOpen` es true)
- ✅ Cleanup de event listeners al desmontar
- ✅ No re-renderiza toda la app al abrir/cerrar

---

## 📝 CHECKLIST DE MIGRACIÓN

Para cada archivo:

- [ ] Agregar `import { useDialog } from '@/contexts/DialogContext'`
- [ ] Agregar `const { confirm, showSuccess, showError } = useDialog()` en el componente
- [ ] Buscar todos los `confirm(` y reemplazarlos
- [ ] Buscar todos los `alert(` y reemplazarlos
- [ ] Buscar todos los `window.confirm(` y reemplazarlos
- [ ] Probar que funciona correctamente
- [ ] Verificar que se vea bien en móvil
- [ ] Commit con mensaje: `refactor: replace native dialogs with custom modals in [nombre-archivo]`

---

## 🎯 PRÓXIMOS PASOS

1. **Migrar archivo por archivo** siguiendo la lista de arriba
2. **Probar en navegador** cada cambio
3. **Ajustar mensajes** para que sean más descriptivos
4. **Agregar más variantes** si es necesario (por ejemplo, modales con inputs)

---

## 💡 TIPS Y MEJORES PRÁCTICAS

### 1. Mensajes claros y concisos

❌ Malo: `confirm({ title: 'Confirmar', message: '¿Confirmar?' })`  
✅ Bueno: `confirm({ title: '¿Eliminar evento?', message: 'Esta acción no se puede deshacer' })`

### 2. Usa el ícono apropiado

- `danger` → Eliminar, cancelar permanente
- `warning` → Cambios importantes, advertencias
- `info` → Información general, confirmaciones neutras
- `success` → Acciones positivas, publicar, activar

### 3. Siempre usa await

❌ Malo: `confirm({...})` sin await  
✅ Bueno: `const confirmado = await confirm({...})`

### 4. Maneja errores con showError

❌ Malo: `alert('Error: ' + error.message)`  
✅ Bueno: `await showError('No se pudo completar la operación')`

### 5. Mensajes multi-línea con `\n`

```typescript
await confirm({
  title: 'Título',
  message: 'Primera línea\n\nSegunda línea con espacio'
})
```

---

## 🎨 PERSONALIZACIÓN ADICIONAL

Si necesitas un modal con diseño completamente diferente:

```typescript
// Puedes usar clases CSS personalizadas
const confirmado = await confirm({
  title: 'Custom',
  message: 'Mensaje',
  confirmButtonClass: 'bg-purple-600 hover:bg-purple-700'
})
```

O crear un nuevo componente de modal basado en `ConfirmDialog.tsx` y `AlertDialog.tsx`.

---

## 📞 SOPORTE

Si encuentras algún problema durante la migración:

1. Revisa esta guía
2. Mira el ejemplo en `panel/eventos/page.tsx`
3. Verifica que `DialogProvider` esté en `layout.tsx`
4. Comprueba la consola del navegador por errores

---

**Autor:** Claude + GitHub Copilot  
**Fecha:** 10 de Noviembre, 2025  
**Estado:** ✅ Sistema completo y funcional  
**Ejemplo completado:** `frontend/app/panel/eventos/page.tsx`

