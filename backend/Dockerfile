# Dockerfile para Grada Negra API
# Node.js 20 LTS
FROM node:20-alpine

# Metadata
LABEL maintainer="masterticketsas@gmail.com"
LABEL version="1.0.0"
LABEL description="Grada Negra - Sistema de Ticketing Multi-tenant"

# Crear directorio de la app
WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar código de la aplicación
COPY . .

# Crear directorio de logs
RUN mkdir -p logs

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=8080

# Exponer puerto
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Usuario no-root para seguridad
USER node

# Comando de inicio
CMD ["node", "src/index.js"]
