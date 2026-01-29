#!/bin/bash

# 🚀 Script de Setup Automático - Abundbank Microservices
# Este script configura todo el proyecto desde cero

# Configuración de logs
LOG_FILE="setup-$(date +%Y%m%d-%H%M%S).log"
ERROR_LOG="setup-errors-$(date +%Y%m%d-%H%M%S).log"

# Función para logging
log() {
    echo "$1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "$1" | tee -a "$LOG_FILE" | tee -a "$ERROR_LOG"
}

# Función para manejar errores
handle_error() {
    local exit_code=$?
    local line_number=$1
    log_error ""
    log_error "❌ ERROR en línea $line_number (código: $exit_code)"
    log_error "⚠️  El script falló. Revisa los logs:"
    log_error "   - Log completo: $LOG_FILE"
    log_error "   - Solo errores: $ERROR_LOG"
    log_error ""
    exit $exit_code
}

# Capturar errores
trap 'handle_error $LINENO' ERR
set -e  # Salir si hay algún error

# Iniciar log
log "================================"
log "🏦 Abundbank Microservices Setup"
log "================================"
log "Inicio: $(date)"
log ""

echo "================================"
echo "🏦 Abundbank Microservices Setup"
echo "================================"
echo ""
echo "📝 Generando logs en: $LOG_FILE"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar que pnpm esté instalado
echo -e "${BLUE}[1/7]${NC} Verificando pnpm..."
log "[1/7] Verificando pnpm..."

if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm no está instalado. Instalando...${NC}"
    log "⚠️  pnpm no está instalado. Instalando..."
    npm install -g pnpm 2>&1 | tee -a "$LOG_FILE"
fi

echo -e "${GREEN}✅ pnpm instalado${NC}"
log "✅ pnpm instalado (versión: $(pnpm --version))"
echo ""

# 2. Limpiar instalaciones previas (opcional)
echo -e "${BLUE}[2/7]${NC} ¿Quieres limpiar instalaciones previas? (y/n)"
read -r clean_choice
log "[2/7] Limpieza de instalaciones previas: $clean_choice"

if [ "$clean_choice" = "y" ]; then
    echo "🧹 Limpiando node_modules..."
    log "🧹 Limpiando node_modules..."
    rm -rf node_modules packages/*/node_modules 2>&1 | tee -a "$LOG_FILE"
    echo -e "${GREEN}✅ Limpieza completada${NC}"
    log "✅ Limpieza completada"
fi
echo ""

# 3. Instalar dependencias
echo -e "${BLUE}[3/7]${NC} Instalando dependencias de todos los packages..."
log "[3/7] Instalando dependencias..."

if pnpm install 2>&1 | tee -a "$LOG_FILE"; then
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
    log "✅ Dependencias instaladas correctamente"
else
    log_error "❌ Error instalando dependencias"
    exit 1
fi
echo ""

# 4. Verificar archivos .env
echo -e "${BLUE}[4/7]${NC} Verificando archivos de configuración..."
log "[4/7] Verificando archivos .env..."

check_env_file() {
    local service=$1
    local path=$2
    
    log "Verificando .env en $service ($path)..."
    
    if [ ! -f "$path/.env" ]; then
        if [ -f "$path/.env.example" ]; then
            echo -e "${YELLOW}⚠️  Copiando .env.example a .env en $service${NC}"
            log "⚠️  Copiando .env.example a .env en $service"
            cp "$path/.env.example" "$path/.env"
            log "✅ Archivo .env creado desde .env.example en $service"
        else
            echo -e "${YELLOW}⚠️  No existe .env ni .env.example en $service${NC}"
            log_error "⚠️  No existe .env ni .env.example en $service"
        fi
    else
        echo -e "${GREEN}✅ .env existe en $service${NC}"
        log "✅ .env existe en $service"
    fi
}

check_env_file "raíz" "."
check_env_file "kyc-service" "packages/kyc-service"
check_env_file "notifications-service" "packages/notifications-service"
check_env_file "admin-gateway" "packages/admin-gateway"
check_env_file "client-gateway" "packages/client-gateway"
echo ""

# 5. Ejecutar migraciones (opcional)
echo -e "${BLUE}[5/7]${NC} ¿Quieres ejecutar las migraciones de base de datos? (y/n)"
read -r migrate_choice
log "[5/7] Ejecutar migraciones: $migrate_choice"

if [ "$migrate_choice" = "y" ]; then
    echo "🗄️  Ejecutando migraciones..."
    log "🗄️  Ejecutando migraciones..."
    
    if pnpm db:migrate 2>&1 | tee -a "$LOG_FILE"; then
        echo -e "${GREEN}✅ Migraciones completadas${NC}"
        log "✅ Migraciones completadas correctamente"
    else
        log_error "❌ Error ejecutando migraciones"
        echo -e "${RED}❌ Error en migraciones. Revisa $ERROR_LOG${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Migraciones omitidas${NC}"
    log "⏭️  Migraciones omitidas por el usuario"
fi
echo ""

# 6. Ejecutar seeders (opcional)
echo -e "${BLUE}[6/7]${NC} ¿Quieres ejecutar los seeders de base de datos? (y/n)"
read -r seed_choice
log "[6/7] Ejecutar seeders: $seed_choice"

if [ "$seed_choice" = "y" ]; then
    echo "🌱 Ejecutando seeders..."
    log "🌱 Ejecutando seeders..."
    
    if pnpm db:seed 2>&1 | tee -a "$LOG_FILE"; then
        echo -e "${GREEN}✅ Seeders completados${NC}"
        log "✅ Seeders completados correctamente"
    else
        log_error "❌ Error ejecutando seeders"
        echo -e "${RED}❌ Error en seeders. Revisa $ERROR_LOG${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⏭️  Seeders omitidos${NC}"
    log "⏭️  Seeders omitidos por el usuario"
fi
echo ""

# 7. Mostrar siguiente paso
echo -e "${BLUE}[7/7]${NC} Setup completado!"
log "[7/7] Setup completado exitosamente"
log "Fin: $(date)"
echo ""

echo "================================"
echo -e "${GREEN}✨ ¡Todo listo para desarrollo!${NC}"
echo "================================"
echo ""
echo "📝 Logs guardados en:"
echo -e "   ${BLUE}$LOG_FILE${NC}"
if [ -f "$ERROR_LOG" ]; then
    echo -e "   ${YELLOW}$ERROR_LOG${NC} (errores)"
fi
echo ""
echo "Comandos disponibles:"
echo ""
echo -e "  ${BLUE}pnpm dev${NC}              - Levantar todos los servicios"
echo -e "  ${BLUE}pnpm dev:kyc${NC}          - Solo KYC service"
echo -e "  ${BLUE}pnpm dev:notifications${NC} - Solo Notifications service"
echo -e "  ${BLUE}pnpm dev:services${NC}     - Solo microservicios (sin gateways)"
echo -e "  ${BLUE}pnpm dev:gateways${NC}     - Solo gateways"
echo ""
echo -e "  ${BLUE}pnpm test${NC}             - Ejecutar tests"
echo -e "  ${BLUE}pnpm lint${NC}             - Linter"
echo -e "  ${BLUE}pnpm db:migrate${NC}       - Ejecutar migraciones"
echo -e "  ${BLUE}pnpm db:seed${NC}          - Ejecutar seeders"
echo ""
echo -e "Para más comandos, revisa ${YELLOW}COMANDOS.md${NC}"
echo ""
echo "🚀 Para empezar: pnpm dev"