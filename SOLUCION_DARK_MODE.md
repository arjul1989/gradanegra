# 🚨 SOLUCIÓN RÁPIDA: Dark Mode No Funciona

## El Problema Detectado

✅ La clase `dark` SÍ se aplica al HTML  
❌ Las clases de Tailwind `dark:` NO se aplican a los elementos  
❌ Body tiene background transparente: `rgba(0, 0, 0, 0)`

**CONCLUSIÓN:** Tailwind NO está generando o NO está aplicando los estilos para el variant `dark:`

---

## 🔧 SOLUCIÓN TEMPORAL

Ya que los estilos `dark:` de Tailwind no funcionan, voy a agregar estilos CSS directos:

### Archivo: `globals.css`

Agregar al final:

```css
/* MODO OSCURO - Estilos directos */
html.dark {
  background: #101622;
  color: #ffffff;
}

html.dark body {
  background: #101622;
  color: #ffffff;
}

/* Modo claro */
html:not(.dark) {
  background: #f5f6f8;
  color: #1f2937;
}

html:not(.dark) body {
  background: #f5f6f8;
  color: #1f2937;
}
```

---

## 🎯 CAUSAS POSIBLES

1. **Versión de Tailwind incompatible** con Next.js 15
2. **Problema con @import "tailwindcss"** (Tailwind v4)
3. **Cache de Tailwind/Next.js** corrupto
4. **Configuración de darkMode** no se procesa

---

## ✅ SOLUCIÓN DEFINITIVA

Volver a Tailwind CSS v3 (estable):

```bash
cd frontend
npm uninstall tailwindcss
npm install -D tailwindcss@3 postcss autoprefixer
npx tailwindcss init -p
```

---

**Estado:** En progreso...

