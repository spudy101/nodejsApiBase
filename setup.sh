#!/bin/bash

# 🚀 Script de Setup Automático - Abundbank Microservices
# Este script configura todo el proyecto desde cero

set -e  # Salir si hay algún error

echo "================================"
echo "🏦 Abundbank Microservices Setup"
echo "================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Verificar que pnpm esté instalado
echo -e "${BLUE}[1/6]${NC} Verificando pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠️  pnpm no está instalado. Instalando...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✅ pnpm instalado${NC}"
echo ""

# 2. Limpiar instalaciones previas (opcional)
echo -e "${BLUE}[2/6]${NC} ¿Quieres limpiar instalaciones previas? (y/n)"
read -r clean_choice
if [ "$clean_choice" = "y" ]; then
    echo "🧹 Limpiando node_modules..."
    rm -rf node_modules packages/*/node_modules
    echo -e "${GREEN}✅ Limpieza completada${NC}"
fi
echo ""

# 3. Instalar dependencias
echo -e "${BLUE}[3/6]${NC} Instalando dependencias de todos los packages..."
pnpm install
echo -e "${GREEN}✅ Dependencias instaladas${NC}"
echo ""

# 4. Verificar archivos .env
echo -e "${BLUE}[4/6]${NC} Verificando archivos de configuración..."

check_env_file() {
    local service=$1
    local path=$2
    
    if [ ! -f "$path/.env" ]; then
        if [ -f "$path/.env.example" ]; then
            echo -e "${YELLOW}⚠️  Copiando .env.example a .env en $service${NC}"
            cp "$path/.env.example" "$path/.env"
        else
            echo -e "${YELLOW}⚠️  No existe .env ni .env.example en $service${NC}"
        fi
    else
        echo -e "${GREEN}✅ .env existe en $service${NC}"
    fi
}

check_env_file "raíz" "."
check_env_file "kyc-service" "packages/kyc-service"
check_env_file "notifications-service" "packages/notifications-service"
check_env_file "admin-gateway" "packages/admin-gateway"
check_env_file "client-gateway" "packages/client-gateway"
echo ""

# 5. Ejecutar migraciones (opcional)
echo -e "${BLUE}[5/6]${NC} ¿Quieres ejecutar las migraciones de base de datos? (y/n)"
read -r migrate_choice
if [ "$migrate_choice" = "y" ]; then
    echo "🗄️  Ejecutando migraciones..."
    pnpm db:migrate
    echo -e "${GREEN}✅ Migraciones completadas${NC}"
else
    echo -e "${YELLOW}⏭️  Migraciones omitidas${NC}"
fi
echo ""

# 6. Mostrar siguiente paso
echo -e "${BLUE}[6/6]${NC} Setup completado!"
echo ""
echo "================================"
echo -e "${GREEN}✨ ¡Todo listo para desarrollo!${NC}"
echo "================================"
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
echo ""
echo -e "Para más comandos, revisa ${YELLOW}COMANDOS.md${NC}"
echo ""
echo "🚀 Para empezar: pnpm dev"