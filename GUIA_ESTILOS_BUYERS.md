# 🎨 GUÍA DE ESTILOS - Sistema de Usuarios Buyers

**Fecha:** 10 de Noviembre, 2025  
**Estado:** ✅ Implementado según diseños de referencia

---

## 🎯 COLORES DEL SISTEMA

### Color Primario
```css
primary: #0d59f2 (Azul vibrante)
```
- Usado en botones principales
- Links y acciones importantes
- Elementos de foco y hover

### Fondos
```css
/* Modo Claro */
background-light: #f5f6f8 (Gris muy claro)
surface-light: #ffffff (Blanco)

/* Modo Oscuro */
background-dark: #101622 (Azul oscuro profundo)
surface-dark: rgba(30, 41, 59, 0.4) (Slate 900 con opacidad)
```

### Textos
```css
/* Modo Claro */
text-primary: #0f172a (Slate 900)
text-secondary: #64748b (Slate 500)
text-tertiary: #94a3b8 (Slate 400)

/* Modo Oscuro */
text-primary: #ffffff (Blanco)
text-secondary: #cbd5e1 (Slate 300)
text-tertiary: #94a3b8 (Slate 400)
```

### Bordes
```css
/* Modo Claro */
border-light: #e2e8f0 (Slate 200)
border-medium: #cbd5e1 (Slate 300)

/* Modo Oscuro */
border-dark: #334155 (Slate 700)
border-darker: #1e293b (Slate 800)
```

### Estados
```css
/* Success */
success: #28a745 (Verde)

/* Error */
error: #dc3545 (Rojo)

/* Warning */
warning: #ffc107 (Amarillo)

/* Info */
info: #0d59f2 (Azul primario)
```

---

## 📝 TIPOGRAFÍA

### Fuente Principal
```css
font-family: 'Inter', sans-serif
```

### Pesos
```css
font-normal: 400
font-medium: 500
font-semibold: 600
font-bold: 700
font-black: 900
```

### Tamaños
```css
/* Títulos */
text-4xl: 36px (font-black) - Títulos principales
text-3xl: 30px (font-black) - Subtítulos
text-2xl: 24px (font-black) - Secciones
text-xl: 20px (font-bold) - Logo
text-lg: 18px (font-bold) - Títulos de cards

/* Cuerpo */
text-base: 16px (font-normal) - Texto principal
text-sm: 14px (font-medium) - Labels, botones
text-xs: 12px (font-normal) - Hints, notas
```

---

## 🔘 COMPONENTES

### Botones

#### Botón Primario
```tsx
className="w-full py-3.5 bg-[#0d59f2] hover:bg-[#0d59f2]/90 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
```

#### Botón Secundario
```tsx
className="w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-lg transition-all"
```

#### Botón con Google
```tsx
className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 rounded-lg font-semibold text-slate-700 dark:text-slate-200 transition-all"
```

### Inputs

#### Input de Texto
```tsx
className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-[#0d59f2] focus:border-transparent outline-none transition-all text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
```

#### Input con Icono
```tsx
<div className="relative">
  <input className="..." />
  <button className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300">
    <span className="material-symbols-outlined text-xl">visibility</span>
  </button>
</div>
```

### Cards

#### Card Principal
```tsx
className="bg-white dark:bg-slate-900/40 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 p-8"
```

#### Card de Error
```tsx
className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 rounded-lg"
```

#### Card de Info
```tsx
className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4"
```

### Badges

#### Badge de Estado - Completado
```tsx
className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
```

#### Badge de Estado - Pendiente
```tsx
className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400"
```

#### Badge de Estado - Cancelado
```tsx
className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"
```

---

## 📐 ESPACIADO Y LAYOUT

### Contenedores
```tsx
/* Página completa */
className="min-h-screen bg-[#f5f6f8] dark:bg-[#101622] flex items-center justify-center p-4"

/* Contenedor central */
className="w-full max-w-md" // Login/Register
className="w-full max-w-5xl" // Dashboard
className="w-full max-w-6xl" // Listados
```

### Espaciado
```css
/* Padding */
p-4: 16px
p-6: 24px
p-8: 32px

/* Margin */
mb-2: 8px
mb-4: 16px
mb-6: 24px
mb-8: 32px

/* Gap */
gap-2: 8px
gap-3: 12px
gap-4: 16px
gap-6: 24px
```

### Border Radius
```css
rounded-lg: 8px  (inputs, botones)
rounded-xl: 12px (cards, modales)
rounded-full: 9999px (badges, avatares)
```

---

## 🎭 MODO OSCURO

### Implementación
```tsx
// En el className, siempre especificar ambos modos:
className="bg-white dark:bg-slate-900/40"
className="text-slate-900 dark:text-white"
className="border-slate-200 dark:border-slate-800"
```

### Reglas
1. **Siempre** usar `dark:` prefix para el modo oscuro
2. **Mantener contraste** suficiente en ambos modos
3. **Usar opacidad** en fondos oscuros (bg-slate-900/40)
4. **Ajustar hover states** para ambos modos

---

## 🔍 ICONOS

### Material Symbols Outlined
```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet"/>
```

### Uso
```tsx
<span className="material-symbols-outlined text-xl">visibility</span>
<span className="material-symbols-outlined text-2xl">error</span>
<span className="material-symbols-outlined text-4xl">mark_email_unread</span>
```

### Configuración CSS
```css
.material-symbols-outlined {
  font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
}
```

---

## 📱 RESPONSIVE DESIGN

### Breakpoints
```css
sm: 640px   // Móvil grande
md: 768px   // Tablet
lg: 1024px  // Desktop pequeño
xl: 1280px  // Desktop grande
2xl: 1536px // Desktop extra grande
```

### Patrones Comunes
```tsx
// Stack en móvil, row en desktop
className="flex flex-col md:flex-row gap-4"

// Texto más pequeño en móvil
className="text-2xl md:text-3xl lg:text-4xl"

// Padding responsive
className="px-4 sm:px-6 lg:px-8"

// Ocultar en móvil, mostrar en desktop
className="hidden md:flex"
```

---

## ✨ ANIMACIONES Y TRANSICIONES

### Transiciones Básicas
```css
transition-all     // Animar todas las propiedades
transition-colors  // Solo colores
transition-opacity // Solo opacidad
```

### Hover States
```tsx
// Botones
hover:bg-[#0d59f2]/90
hover:shadow-xl

// Links
hover:text-[#0d59f2]
hover:text-slate-900 dark:hover:text-white

// Bordes
hover:border-slate-400 dark:hover:border-slate-600
```

### Loading
```tsx
// Spinner
<span className="material-symbols-outlined animate-spin">progress_activity</span>

// Pulse
className="animate-pulse"
```

---

## 📦 ESTRUCTURA DE ARCHIVOS

### Páginas de Autenticación
```
frontend/app/
├── login/
│   └── page.tsx
├── register/
│   └── page.tsx
└── recuperar-password/
    └── page.tsx
```

### Componentes Reutilizables
```tsx
// Ejemplo: AlertMessage.tsx
export function AlertMessage({ type, message }: { type: 'error' | 'success' | 'info', message: string }) {
  const styles = {
    error: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400",
    success: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900 text-green-700 dark:text-green-400",
    info: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400"
  }
  
  return (
    <div className={`p-4 border rounded-lg ${styles[type]}`}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}
```

---

## 🎨 PALETA COMPLETA

```css
/* Primarios */
--primary: #0d59f2;
--primary-hover: rgba(13, 89, 242, 0.9);

/* Backgrounds */
--bg-light: #f5f6f8;
--bg-dark: #101622;
--surface-light: #ffffff;
--surface-dark: rgba(30, 41, 59, 0.4);

/* Slate Scale */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-400: #94a3b8;
--slate-500: #64748b;
--slate-600: #475569;
--slate-700: #334155;
--slate-800: #1e293b;
--slate-900: #0f172a;

/* States */
--success: #28a745;
--error: #dc3545;
--warning: #ffc107;
--info: #0d59f2;
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

Al crear una nueva página o componente:

- [ ] Usar color primario `#0d59f2`
- [ ] Implementar modo claro y oscuro con `dark:`
- [ ] Usar tipografía Inter
- [ ] Aplicar border-radius correcto (lg o xl)
- [ ] Incluir estados hover y focus
- [ ] Validar responsive (móvil, tablet, desktop)
- [ ] Usar Material Symbols para iconos
- [ ] Incluir transiciones suaves
- [ ] Mantener contraste adecuado
- [ ] Seguir espaciado consistente

---

## 🔗 PÁGINAS ACTUALIZADAS

1. ✅ `/login` - Login de buyers
2. ✅ `/register` - Registro con OTP
3. ✅ `/recuperar-password` - Recuperación de contraseña

---

**Autor:** Jules + Claude  
**Fecha:** 10 de Noviembre, 2025  
**Basado en:** Diseños de referencia en `backend/src/Desing/Users login and info diseño/`

