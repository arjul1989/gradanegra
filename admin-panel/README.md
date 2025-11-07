# 🎯 Panel de Administrador - GradaNegra

Panel de administración para gestionar comercios, configurar planes personalizados y generar reportes financieros.

## 🚀 Características

- ✅ Dashboard con métricas en tiempo real
- ✅ Gestión completa de comercios
- ✅ Configuración de planes personalizados (custom overrides)
- ✅ Sistema de permisos por roles (super_admin, finance_admin, support_admin)
- ✅ Reportes financieros con exportación CSV
- ✅ Auditoría completa de acciones
- ✅ Responsive design

## 📋 Requisitos Previos

- Node.js 18+ 
- NPM o Yarn
- Backend de GradaNegra corriendo en http://localhost:8080
- Usuario administrador creado con custom claims en Firebase

## 🔧 Instalación

\`\`\`bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Edita .env.local con tus credenciales de Firebase

# 3. Crear usuario administrador (en el backend)
cd ../backend
node scripts/create-admin-user.js tu@email.com super_admin
\`\`\`

## 🏃 Ejecución

\`\`\`bash
# Desarrollo
npm run dev

# Build producción
npm run build
npm start
\`\`\`

La aplicación estará en http://localhost:3000

## 🔑 Roles y Permisos

- **super_admin**: Acceso total
- **finance_admin**: Solo reportes
- **support_admin**: Gestión comercios (sin planes/comisiones)

## 📱 Páginas

- `/login` - Autenticación
- `/dashboard` - Métricas y gráficas
- `/comercios` - Lista con filtros
- `/comercios/[id]` - Detalle + configuración custom
- `/reportes` - Reportes financieros

## 🎯 Uso del Modal de Configuración Custom

1. Login como super_admin
2. Ir a Comercios > Seleccionar comercio
3. Click en ⚙️ Configuración
4. Activar toggles para límites custom
5. Configurar valores (-1 = ilimitado)
6. **Escribir motivo** (obligatorio)
7. Guardar

## 📊 Estructura

\`\`\`
src/
├── app/
│   ├── (dashboard)/         # Rutas protegidas
│   │   ├── dashboard/
│   │   ├── comercios/
│   │   └── reportes/
│   ├── login/
│   └── layout.tsx           # AuthProvider
├── components/
│   └── CustomPlanModal.tsx
└── lib/
    ├── firebase.ts
    ├── AuthContext.tsx
    └── api.ts
\`\`\`

## 🐛 Troubleshooting

### No tienes permisos
\`\`\`bash
cd ../backend
node scripts/create-admin-user.js tu@email.com super_admin
# Logout y login nuevamente
\`\`\`

### Error al cargar datos
- Verificar backend en puerto 8080
- Verificar NEXT_PUBLIC_API_URL en .env.local

## 🚀 Deploy

### Vercel
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

Configura variables de entorno en Vercel Dashboard

---

**Versión:** 1.0.0  
**GradaNegra Team**
