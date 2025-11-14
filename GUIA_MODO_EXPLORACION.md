# 🎮 Guía: Modo Exploración Gamificado

## 📋 Descripción General

El **Modo Exploración** es una forma interactiva y divertida de descubrir eventos en Grada Negra. Los usuarios pueden controlar un avatar y explorar diferentes categorías representadas como edificios en un mundo 2D.

---

## 🚀 Características

### 1. **Avatar Controlable**
- Personaje animado que el usuario puede mover libremente
- Controles intuitivos: WASD o flechas del teclado
- Animaciones suaves y feedback visual

### 2. **Categorías como Edificios**
- 7 edificios, uno por cada categoría de eventos:
  - 🎸 Rock & Underground (Rojo)
  - 🎧 Electrónica (Morado)
  - 🔥 Reggaeton & Urbano (Naranja)
  - 🎺 Salsa & Tropical (Verde)
  - 😂 Comedia (Amarillo)
  - 🎨 Arte & Cultura (Rosa)
  - ⚽ Deportes (Azul)

### 3. **Sistema de Proximidad**
- Al acercarse a un edificio, aparece el indicador "Presiona E para explorar"
- Detección automática de cercanía
- Feedback visual con animaciones

### 4. **Modal de Categoría**
- Diseño profesional con colores temáticos
- Descripción de la categoría
- Botón para ver todos los eventos
- Navegación integrada con el sistema de rutas

---

## 🎮 Controles

| Tecla | Acción |
|-------|--------|
| W / ↑ | Mover arriba |
| S / ↓ | Mover abajo |
| A / ← | Mover izquierda |
| D / → | Mover derecha |
| E | Entrar a la categoría (cuando estás cerca) |
| ESC | Cerrar modal / Volver |

---

## 🎨 Mejoras Implementadas

### Respecto al Código Original:

1. **✅ Integración con Grada Negra**
   - Usa las categorías reales de la plataforma
   - Navegación a páginas de eventos existentes
   - Autenticación requerida

2. **✅ Diseño Mejorado**
   - Dark mode completo
   - Colores coherentes con la marca
   - Animaciones más fluidas
   - Sombras y efectos visuales profesionales

3. **✅ Avatar Mejorado**
   - Diseño más detallado del personaje
   - Mejor animación de rebote
   - Sombras realistas

4. **✅ Edificios Mejorados**
   - Ventanas iluminadas
   - Diseño arquitectónico más realista
   - Íconos emoji grandes y claros
   - Carteles con nombres

5. **✅ UX Optimizada**
   - Instrucciones claras en pantalla
   - Botón de "Volver al Inicio"
   - Modal con mejor jerarquía visual
   - Transiciones suaves

6. **✅ Rendimiento**
   - Código optimizado para 60 FPS
   - Transiciones CSS en lugar de JS cuando es posible
   - Límites de mundo bien definidos

---

## 📁 Estructura del Código

```
/app/explorar/page.tsx
├── Types (Position, CategoryVenue)
├── Configuration (tamaños, velocidad, etc.)
├── Custom Hooks
│   ├── useKeyboard()
│   └── useProximity()
├── Components
│   ├── Avatar
│   ├── VenueBuilding
│   └── CategoryModal
└── Main Component (ExplorarPage)
```

---

## 🔧 Personalización

### Agregar Nueva Categoría:

```typescript
{
  id: '8',
  name: 'Nueva Categoría',
  slug: 'nueva-categoria',
  position: { x: 400, y: 600 },
  color: '#COLOR_HEX',
  icon: '🎭',
  description: 'Descripción de la categoría'
}
```

### Ajustar Velocidad de Movimiento:

```typescript
const MOVE_SPEED = 6; // Aumentar para más velocidad
```

### Cambiar Distancia de Proximidad:

```typescript
const PROXIMITY_THRESHOLD = 120; // En píxeles
```

---

## 🎯 Casos de Uso

1. **Descubrimiento Lúdico**
   - Los usuarios pueden explorar categorías de forma divertida
   - Ideal para primeros usuarios o usuarios jóvenes

2. **Engagement**
   - Aumenta el tiempo de permanencia en la plataforma
   - Gamificación de la búsqueda de eventos

3. **Diferenciación**
   - Característica única que no tienen otras plataformas de ticketing
   - Memorable y compartible en redes sociales

---

## 🚀 Acceso

- **URL Directa**: `http://localhost:3000/explorar`
- **Desde el Home**: Botón "🎮 Modo Exploración" en el header
- **Requiere**: Usuario autenticado

---

## 📊 Métricas Sugeridas

- Tiempo promedio en modo exploración
- Categorías más visitadas
- Tasa de conversión (exploración → evento)
- Usuarios que usan vs. no usan el modo

---

## 🔮 Futuras Mejoras Posibles

1. **Multijugador**
   - Ver avatares de otros usuarios en tiempo real
   - Chat en el mundo

2. **Misiones y Logros**
   - "Visita todas las categorías"
   - "Compra tu primer boleto desde el modo exploración"

3. **Personalización del Avatar**
   - Diferentes colores, outfits
   - Avatares desbloqueables

4. **Mundo Expandido**
   - Más áreas (ciudades, eventos especiales)
   - Mini-juegos en cada edificio

5. **Mobile Touch Controls**
   - Joystick virtual
   - Swipe gestures

6. **Sonidos y Música**
   - Música de fondo temática
   - Efectos de sonido

---

## 📝 Notas Técnicas

- **Framework**: Next.js 15 + React
- **Styling**: Tailwind CSS + Inline Styles
- **Performance**: ~60 FPS con requestAnimationFrame
- **Responsive**: Optimizado para desktop (requiere teclado)
- **Accesibilidad**: Labels ARIA, controles de teclado

---

**Creado para Grada Negra** 🎟️

