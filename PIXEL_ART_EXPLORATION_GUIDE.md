# 🎮 Pixel Art Retro - Modo Exploración

## 🎨 Descripción

Se ha implementado un sistema de exploración interactivo con **estilo Pixel Art Retro 8-bit**, donde los usuarios pueden navegar por una ciudad pixelada para descubrir diferentes categorías de eventos.

---

## ✨ Características Implementadas

### 1. **Edificios Pixel Art**
- ✅ Bloques de colores CSS (sin SVG)
- ✅ Techo triangular con border CSS
- ✅ 12 ventanas en grid pattern (3x4)
- ✅ Iluminación dinámica (ventanas amarillas al acercarse)
- ✅ Puerta en la parte inferior
- ✅ Iconos gigantes flotantes (🎸, 🎧, 🔥, etc.)
- ✅ Bordes negros gruesos para look 8-bit
- ✅ Sombra pixelada
- ✅ Efecto scale al acercarse (110%)

### 2. **Avatar Pixel Art**
- ✅ Personaje 8-bit con bloques de colores
- ✅ Cabeza (5x5 píxeles)
- ✅ Ojos (2 bloques negros)
- ✅ Cuerpo (7x8 píxeles) azul
- ✅ Brazos y piernas articulados
- ✅ Sombra pixelada
- ✅ `imageRendering: 'pixelated'` para look auténtico

### 3. **Fondo Retro Gaming**
- ✅ Gradiente cielo cyan → blue → purple
- ✅ **Scanlines** overlay (líneas horizontales) para efecto CRT
- ✅ Grid pixelado de fondo (32x16)
- ✅ Calle/Street con patrón rayado (#666/#555)
- ✅ Línea amarilla central de carretera
- ✅ Nubes pixeladas (bloques blancos con borde negro)
- ✅ Árboles pixelados decorativos (verde + tronco café)

### 4. **Mini-Mapa**
- ✅ Esquina inferior derecha
- ✅ Fondo negro con borde blanco de 4px
- ✅ Shadow retro (8px offset)
- ✅ Título "MAP" en barra amarilla
- ✅ Puntos de colores para cada categoría
- ✅ Punto amarillo pulsante para el jugador
- ✅ Actualización en tiempo real

### 5. **UI Retro**
- ✅ **Controls Box**: Fondo negro, borde blanco, sombra offset
- ✅ **Exit Button**: Rojo con borde blanco, hover scale
- ✅ Fuente `font-mono` para look retro
- ✅ Teclas con fondo blanco/texto negro
- ✅ Texto amarillo para títulos
- ✅ Text-shadow para profundidad

### 6. **Sistema de Proximidad**
- ✅ Detección de cercanía (80px threshold)
- ✅ Mensaje "► PRESS E ◄" en bloque amarillo con borde negro
- ✅ Animación bounce al estar cerca
- ✅ Ventanas iluminadas (amarillas) cuando el jugador está cerca
- ✅ Scale 110% del edificio completo
- ✅ Shadow más grande

### 7. **Controles**
- ✅ **W A S D** o **Flechas** para moverse
- ✅ **E** para entrar a una categoría
- ✅ **ESC** para cerrar el modal
- ✅ Movimiento suave (5px/frame)
- ✅ Boundaries del mundo (no sale del área)

---

## 🎯 Elementos Pixel Art Detallados

### Edificio (VenueBuilding)
```
┌────────┐
│  🎸   │  ← Icon (40px emoji)
└────────┘
   /\       ← Roof (triangle, color del venue)
  /  \
 /____\
|⊞ ⊞ ⊞|   ← Windows 3x4 grid
|⊞ ⊞ ⊞|     (cyan cuando apagadas)
|⊞ ⊞ ⊞|     (yellow cuando cerca)
|⊞ ⊞ ⊞|
|  ▯  |   ← Door (darker color)
└──────┘
━━━━━━━   ← Shadow
```

### Avatar
```
 ███      ← Head (amber)
 • •      ← Eyes (black)
█████     ← Body (blue)
│███│     ← Arms (amber)
│   │
█  █      ← Legs (blue)
```

### Mini-Map
```
┌──────────┐
│   MAP    │  ← Yellow header
├──────────┤
│ ■ ■ ■ ■ │  ← Venues (colored)
│ ■ ● ■ ■ │  ← ● = Player
└──────────┘
```

---

## 🚀 Cómo Probar

### 1. Iniciar el servidor
```bash
cd /Users/jules/MyApps/gradanegra/frontend
npm run dev
```

### 2. Navegar a la página
```
http://localhost:3000/explorar
```

### 3. Controles
- Usa **WASD** para moverte por la ciudad
- Acércate a cualquier edificio
- Cuando veas "► PRESS E ◄", presiona **E**
- Se abrirá el modal de esa categoría

### 4. Observa el Mini-Mapa
- En la esquina inferior derecha
- Tu posición (punto amarillo pulsante)
- Edificios de categorías (puntos de colores)

---

## 🎨 Paleta de Colores Retro

| Categoría              | Color     | Hex       |
|------------------------|-----------|-----------|
| Rock & Underground     | Rojo      | #DC2626   |
| Electrónica            | Morado    | #7C3AED   |
| Reggaeton & Urbano     | Naranja   | #EA580C   |
| Salsa & Tropical       | Verde     | #16A34A   |
| Comedia                | Amarillo  | #F59E0B   |
| Arte & Cultura         | Rosa      | #EC4899   |
| Deportes               | Azul      | #3B82F6   |

**Colores UI:**
- Fondo cielo: `cyan-400 → blue-500 → purple-600`
- UI: Negro + Blanco + Amarillo (#FCD34D)
- Street: `#666` y `#555`
- Trees: Verde `#16A34A` + Café `#78350F`

---

## 🔧 Configuración

### Variables principales (en page.tsx)
```typescript
const MOVE_SPEED = 5;           // Velocidad de movimiento (px)
const WORLD_WIDTH = 1600;       // Ancho del mundo
const WORLD_HEIGHT = 800;       // Alto del mundo
const PROXIMITY_THRESHOLD = 80; // Distancia de activación (px)
```

### Ajustar ventanas iluminadas
En `VenueBuilding`, línea ~218:
```typescript
className={`border-2 border-black ${
  isNear && i % 2 === 0 ? 'bg-yellow-300' : 'bg-cyan-200'
}`}
```

### Ajustar scanlines
En el return principal, línea ~402:
```typescript
background: 'repeating-linear-gradient(0deg, 
  transparent, transparent 2px, 
  rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)'
```

---

## 🎮 Features Gaming

### 1. **Image Rendering**
- `imageRendering: 'pixelated'` en avatar y edificios
- Evita el anti-aliasing para look 8-bit auténtico

### 2. **Scanlines CRT**
- Overlay sutil (opacity: 0.1)
- Simula pantallas antiguas de consola
- `pointer-events: none` para no interferir

### 3. **Shadows Retro**
- Sombras de offset fijo (8px, 8px)
- Sin blur, solo desplazamiento
- Color negro puro con opacity

### 4. **Grid Background**
- 32x16 = 512 celdas
- Bordes blancos semi-transparentes
- Da sensación de mundo estructurado

---

## 📦 Archivos Modificados

### Frontend
```
frontend/app/explorar/page.tsx
  ├── Avatar Component (PIXEL)
  ├── VenueBuilding Component (PIXEL)
  ├── Mini-Map
  ├── Retro UI
  └── Pixel Background
```

### Líneas de código
- **~540 líneas totales**
- **Avatar**: ~40 líneas
- **VenueBuilding**: ~100 líneas
- **Main Render**: ~150 líneas
- **Hooks/Logic**: ~250 líneas

---

## 🐛 Troubleshooting

### Los edificios no se ven pixelados
- Verifica que `imageRendering: 'pixelated'` esté en el style
- Algunos navegadores usan `image-rendering: crisp-edges`

### El mini-mapa no actualiza
- Revisa que `avatarPosition` se esté actualizando
- Verifica el cálculo de porcentajes (x / WORLD_WIDTH * 100)

### Ventanas no se iluminan
- Revisa la lógica de `isNear` en VenueBuilding
- Asegúrate de que `PROXIMITY_THRESHOLD` sea apropiado (80px)

### Avatar no se mueve
- Verifica que `useKeyboard` hook esté capturando eventos
- Revisa que el interval de movimiento esté activo (16ms)

---

## 🎯 Mejoras Futuras (Opcionales)

### 1. Animación de Caminar
```typescript
const [isWalking, setIsWalking] = useState(false);
// Alternar entre 2 sprites de piernas
```

### 2. Música Retro 8-bit
```typescript
const audioRef = useRef<HTMLAudioElement>(null);
// Reproducir loop de música chiptune
```

### 3. Partículas al Entrar
```typescript
{isNear && (
  <div className="sparkles">
    {/* Estrellitas animadas */}
  </div>
)}
```

### 4. Score/Categorías Visitadas
```typescript
const [visited, setVisited] = useState<string[]>([]);
// Mostrar "7/7 COMPLETE!"
```

### 5. Modo Noche
```typescript
const [isNight, setIsNight] = useState(false);
// Cambiar gradiente a oscuro, ventanas siempre amarillas
```

---

## 🎮 Easter Eggs

### Konami Code
Podrías agregar:
```typescript
// ↑ ↑ ↓ ↓ ← → ← → B A
const konamiCode = ['arrowup', 'arrowup', 'arrowdown', ...];
// Desbloquear velocidad turbo o avatar especial
```

---

## 📝 Notas Técnicas

1. **Rendimiento**: ~60 FPS constante
2. **Responsive**: Funciona bien en pantallas 1280px+
3. **Mobile**: No optimizado (requiere teclado)
4. **Accesibilidad**: Usa `aria-label` en botones
5. **SEO**: N/A (página interactiva client-side)

---

## 🏆 Resultado Final

✅ **Estilo Pixel Art 8-bit completo**  
✅ **Avatar y edificios con bloques CSS**  
✅ **Sistema de movimiento fluido (WASD)**  
✅ **Mini-mapa funcional**  
✅ **UI retro con scanlines**  
✅ **Proximidad e interacción (E)**  
✅ **7 categorías explorables**  
✅ **Sin dependencias externas (solo CSS)**  

---

**¡Disfruta explorando Grada Negra en modo retro! 🕹️**

