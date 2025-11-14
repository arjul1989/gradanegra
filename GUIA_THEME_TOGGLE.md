# 🌓 GUÍA: Toggle de Tema Claro/Oscuro

**Fecha:** 10 de Noviembre, 2025  
**Estado:** ✅ Implementado

---

## 🎯 QUÉ SE AGREGÓ

Un **botón flotante** en la esquina inferior derecha de todas las páginas que permite cambiar entre modo claro y oscuro con un solo click.

---

## 📍 UBICACIÓN

El botón aparece en:
- **Posición:** Esquina inferior derecha
- **Flotante:** `fixed bottom-6 right-6`
- **Visible en:** TODAS las páginas (login, registro, home, etc.)

---

## 🎨 DISEÑO DEL BOTÓN

### Aspecto Visual:
```
┌─────────────┐
│             │
│      🌙     │  ← Modo Oscuro (icono de luna)
│             │
└─────────────┘

┌─────────────┐
│             │
│      ☀️      │  ← Modo Claro (icono de sol)
│             │
└─────────────┘
```

### Estilos:
- **Tamaño:** 56px × 56px (w-14 h-14)
- **Forma:** Circular (`rounded-full`)
- **Color del fondo:**
  - Modo Claro: Blanco (`bg-white`)
  - Modo Oscuro: `#282e39` (`bg-[#282e39]`)
- **Borde:**
  - Modo Claro: `border-slate-300`
  - Modo Oscuro: `border-white/10`
- **Sombra:** `shadow-lg` con `hover:shadow-xl`
- **Icono:** Color azul primario `#0d59f2`
- **Hover:** Escala del icono `scale-110`

---

## 🔧 FUNCIONALIDAD

### Al Hacer Click:

1. **Cambia la clase del `<html>`:**
   ```javascript
   // Modo Oscuro
   document.documentElement.classList.add('dark')
   
   // Modo Claro
   document.documentElement.classList.remove('dark')
   ```

2. **Guarda la preferencia:**
   ```javascript
   localStorage.setItem('theme', 'dark') // o 'light'
   ```

3. **Actualiza el icono:**
   - Modo Oscuro → Muestra luna 🌙
   - Modo Claro → Muestra sol ☀️

---

## 💾 PERSISTENCIA

El tema seleccionado se guarda en `localStorage` y persiste entre sesiones:

```javascript
// Al cargar la página
const savedTheme = localStorage.getItem('theme')

// Si no hay tema guardado, usa la preferencia del sistema
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
```

---

## 🧪 CÓMO PROBARLO

### Paso 1: Abre cualquier página
```
http://localhost:3000/login
http://localhost:3000/register
http://localhost:3000/
```

### Paso 2: Busca el botón
- **Ubicación:** Esquina inferior derecha
- **Aspecto:** Botón circular flotante

### Paso 3: Click en el botón
- Primera vez: Cambia a modo claro (si estaba en oscuro)
- Segunda vez: Vuelve a modo oscuro

### Paso 4: Verifica los cambios

#### En Modo Claro (☀️):
- ✅ Fondo: `#f5f6f8` (gris claro)
- ✅ Card: Blanca con `white/95`
- ✅ Texto: Oscuro (`slate-900`)
- ✅ Inputs: Fondo `slate-50`

#### En Modo Oscuro (🌙):
- ✅ Fondo: `#101622` (azul oscuro)
- ✅ Card: `white/5` con glassmorphism
- ✅ Texto: Blanco
- ✅ Inputs: Fondo `#1b1f27` oscuro
- ✅ Bordes: `white/10` (sutiles)

### Paso 5: Refresca la página
- ✅ El tema debe mantenerse (guardado en localStorage)

---

## 🎬 COMPORTAMIENTO

### Al Cargar la Página:

1. **Revisa localStorage:**
   ```javascript
   const savedTheme = localStorage.getItem('theme')
   ```

2. **Si no hay tema guardado:**
   - Usa la preferencia del sistema operativo
   - `prefers-color-scheme: dark` → Modo oscuro
   - `prefers-color-scheme: light` → Modo claro

3. **Aplica el tema inmediatamente:**
   - Sin parpadeo (evita hydration mismatch)

### Al Cambiar de Página:

- ✅ El toggle permanece visible
- ✅ El tema se mantiene
- ✅ No se pierde la selección

---

## 📱 RESPONSIVE

El botón es responsive:

```tsx
// Mobile
fixed bottom-6 right-6  // 24px desde abajo y derecha

// Tablet & Desktop
fixed bottom-6 right-6  // Igual posición

// Siempre visible y accesible
z-50  // Por encima de todo
```

---

## ♿ ACCESIBILIDAD

```tsx
<button
  aria-label="Toggle theme"
  // Descripción clara para screen readers
>
```

- ✅ Label descriptivo
- ✅ Indicador visual claro (icono)
- ✅ Feedback al hover
- ✅ Teclado accesible (Tab + Enter)

---

## 🎨 ANIMACIONES

### Transiciones Suaves:

```tsx
// Botón
transition-all  // Todas las propiedades

// Icono
group-hover:scale-110 transition-transform  // Escala al hover
```

### Efectos:

- **Hover:** Sombra más grande + escala del icono
- **Active:** Cambio instantáneo de tema
- **Smooth:** Sin parpadeos ni flashes

---

## 🔍 DEBUGGING

### Si no ves cambios:

1. **Verifica que el botón esté visible:**
   ```
   Abre DevTools → Elements
   Busca: <button class="fixed bottom-6 right-6"
   ```

2. **Revisa la clase 'dark' en <html>:**
   ```html
   <html class="dark">  ← Debe estar presente en modo oscuro
   <html class="">      ← Debe estar ausente en modo claro
   ```

3. **Verifica localStorage:**
   ```javascript
   // En la consola del navegador:
   console.log(localStorage.getItem('theme'))
   // Debe mostrar: "dark" o "light"
   ```

4. **Hard refresh:**
   - `Ctrl + Shift + R` (Windows/Linux)
   - `Cmd + Shift + R` (Mac)

---

## 📦 ARCHIVOS MODIFICADOS

1. **`components/ThemeToggle.tsx`** (NUEVO)
   - Componente del toggle
   - Lógica de cambio de tema
   - Persistencia en localStorage

2. **`app/layout.tsx`** (MODIFICADO)
   - Importa `ThemeToggle`
   - Lo renderiza globalmente

---

## 🎯 EJEMPLO DE USO

```typescript
// El usuario abre la página en modo claro del sistema
1. Carga → Detecta preferencia del sistema → Modo claro

// El usuario prefiere modo oscuro
2. Click en botón → Cambia a modo oscuro
3. localStorage.setItem('theme', 'dark')

// El usuario refresca la página
4. Carga → Lee localStorage → Modo oscuro ✅

// El usuario va a otra página
5. Navigate → Toggle visible → Tema se mantiene ✅
```

---

## ✅ CHECKLIST DE VERIFICACIÓN

- [ ] Botón visible en esquina inferior derecha
- [ ] Click cambia el tema
- [ ] Icono cambia (luna ↔ sol)
- [ ] Background cambia de color
- [ ] Texto cambia de color
- [ ] Inputs cambian de estilo
- [ ] Tema persiste al refrescar
- [ ] Tema persiste al cambiar de página
- [ ] Funciona en modo incógnito
- [ ] Animación smooth al hover

---

## 🎉 RESULTADO

Ahora puedes:
- ✅ Cambiar de tema con un click
- ✅ Ver los estilos en ambos modos
- ✅ Persistir tu preferencia
- ✅ Verificar que el diseño funciona correctamente

---

## 🚀 PRÓXIMOS PASOS

1. **Abre la página:**
   ```
   http://localhost:3000/register
   ```

2. **Busca el botón flotante** (esquina inferior derecha)

3. **Click para cambiar de tema**

4. **Verifica que todo se ve bien en ambos modos**

---

**Autor:** Jules + Claude  
**Fecha:** 10 de Noviembre, 2025  
**Componente:** `ThemeToggle.tsx`

