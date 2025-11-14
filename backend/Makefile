# 🛠️ Makefile para Grada Negra API
# Simplifica comandos comunes de desarrollo y deployment

.PHONY: help install dev deploy deploy-prod verify test clean logs shell

# Variables del proyecto
PROJECT_ID := gradanegra-api-350907539319
SERVICE_NAME := gradanegra-api
REGION := us-central1
BACKEND_DIR := .
NODE_ENV := development

# Colores para output
RED := \033[0;31m
GREEN := \033[0;32m
YELLOW := \033[1;33m
BLUE := \033[0;34m
NC := \033[0m

# Ayuda - Mostrar comandos disponibles
help:
	@echo "$(BLUE)🚀 Grada Negra API - Comandos Disponibles$(NC)"
	@echo "======================================"
	@echo ""
	@echo "$(GREEN)Desarrollo:$(NC)"
	@echo "  install    - Instalar dependencias"
	@echo "  dev        - Ejecutar en modo desarrollo"
	@echo "  test       - Ejecutar tests"
	@echo ""
	@echo "$(GREEN)Deployment:$(NC)"
	@echo "  deploy     - Deployment local robusto"
	@echo "  deploy-prod - Deployment automático con Cloud Build"
	@echo "  verify     - Verificar deployment"
	@echo ""
	@echo "$(GREEN)Monitoreo:$(NC)"
	@echo "  logs       - Ver logs del servicio"
	@echo "  shell      - Abrir shell en container"
	@echo "  status     - Ver estado del servicio"
	@echo ""
	@echo "$(GREEN)Mantenimiento:$(NC)"
	@echo "  clean      - Limpiar dependencias y archivos temporales"
	@echo "  secrets    - Verificar secretos"
	@echo ""

# Instalación de dependencias
install:
	@echo "$(BLUE)📦 Instalando dependencias...$(NC)"
	npm ci
	@echo "$(GREEN)✅ Dependencias instaladas$(NC)"

# Modo desarrollo
dev:
	@echo "$(BLUE)🛠️ Iniciando en modo desarrollo...$(NC)"
	@export NODE_ENV=development && npm start

# Deployment local robusto
deploy:
	@echo "$(BLUE)🚀 Iniciando deployment robusto...$(NC)"
	chmod +x deploy-robust.sh
	./deploy-verify.sh
	@echo "$(GREEN)✅ Deployment completado$(NC)"

# Deployment automático a producción
deploy-prod:
	@echo "$(BLUE)🌐 Iniciando deployment automático...$(NC)"
	@if [ ! -f ".gcloudignore" ]; then echo "$(RED)❌ No se encontró .gcloudignore$(NC)"; exit 1; fi
	@echo "$(YELLOW)⚠️  Esto iniciará un build automático con Cloud Build$(NC)"
	@read -p "¿Continuar? (y/n) " confirm && [ "$$confirm" = "y" ]
	gcloud builds submit --config cloudbuild.yaml .
	@echo "$(GREEN)✅ Deployment automático completado$(NC)"

# Verificación post-deployment
verify:
	@echo "$(BLUE)🔍 Verificando deployment...$(NC)"
	chmod +x verify-deployment.sh
	./verify-deployment.sh

# Tests
test:
	@echo "$(BLUE)🧪 Ejecutando tests...$(NC)"
	npm test
	@echo "$(GREEN)✅ Tests completados$(NC)"

# Ver logs
logs:
	@echo "$(BLUE)📋 Mostrando logs...$(NC)"
	gcloud run services logs read $(SERVICE_NAME) --project=$(PROJECT_ID) --region=$(REGION) --limit=50

# Estado del servicio
status:
	@echo "$(BLUE)📊 Estado del servicio:$(NC)"
	gcloud run services describe $(SERVICE_NAME) --project=$(PROJECT_ID) --region=$(REGION) --format="export"

# Limpiar archivos temporales
clean:
	@echo "$(BLUE)🧹 Limpiando archivos temporales...$(NC)"
	rm -rf node_modules/
	rm -f *.log
	rm -rf logs/
	rm -rf tmp/
	@echo "$(GREEN)✅ Archivos limpiados$(NC)"

# Verificar secretos
secrets:
	@echo "$(BLUE)🔐 Verificando secretos...$(NC)"
	gcloud secrets versions list --project=$(PROJECT_ID)

# Abrir shell en container (solo local)
shell:
	@echo "$(BLUE)🐳 Abriendo shell en container...$(NC)"
	docker run -it --rm -v $$(pwd):/app -w /app node:20-alpine /bin/bash

# Health check rápido
health:
	@echo "$(BLUE)❤️  Verificando health check...$(NC)"
	@curl -f -s https://$(SERVICE_NAME)-$(PROJECT_ID).$(REGION).run.app/health || echo "$(RED)❌ Servicio no disponible$(NC)"

# Información del proyecto
info:
	@echo "$(BLUE)📋 Información del Proyecto:$(NC)"
	@echo "  Proyecto ID: $(PROJECT_ID)"
	@echo "  Servicio: $(SERVICE_NAME)"
	@echo "  Región: $(REGION)"
	@echo "  Ambiente: $(NODE_ENV)"
	@echo ""
	@echo "$(BLUE)🌐 URLs:$(NC)"
	@echo "  Backend: https://$(SERVICE_NAME)-$(PROJECT_ID).$(REGION).run.app"
	@echo "  Frontend: https://gradanegra-frontend-$(PROJECT_ID).$(REGION).run.app"

# Setup inicial
setup:
	@echo "$(BLUE)⚙️  Setup inicial del proyecto...$(NC)"
	@echo "$(YELLOW)Verificando herramientas...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)❌ Node.js no está instalado$(NC)"; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)❌ npm no está instalado$(NC)"; exit 1; }
	@command -v gcloud >/dev/null 2>&1 || { echo "$(RED)❌ gcloud CLI no está instalado$(NC)"; exit 1; }
	@echo "$(GREEN)✅ Herramientas verificadas$(NC)"
	@echo "$(YELLOW)Configurando gcloud...$(NC)"
	@read -p "Email de gcloud: " email && gcloud config set account $$email
	@echo "$(GREEN)✅ Setup completado$(NC)"