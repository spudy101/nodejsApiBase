# Node.js API Base

API base construida con Node.js, Express, Sequelize y PostgreSQL. Incluye autenticación JWT, seguridad con Helmet, documentación Swagger y estructura modular.

## Requisitos Previos

- Node.js (v14 o superior)
- PostgreSQL
- npm

## Instalación

1.  Clonar el repositorio:

    ```bash
    git clone <url-del-repositorio>
    cd nodejsbase
    ```

2.  Instalar dependencias:
    ```bash
    npm install
    ```

## Configuración

### Variables de Entorno (.env)

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`. Configura las siguientes variables:

```ini
# ==============================================
# SERVER
# ==============================================
NODE_ENV=development           # development | production | test
PORT=4000
HOST=localhost

# ==============================================
# CORS
# ==============================================
CORS_ORIGIN=*
# ⚠️  En producción usar orígenes explícitos:
# CORS_ORIGIN=https://tuapp.com,https://admin.tuapp.com

# ==============================================
# DATABASE — PostgreSQL [REQUERIDO]
# ==============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=
DB_DIALECT=postgres
DB_SCHEMA=aerolinea
DB_LOGGING=false
# Nota: todas las tablas llegan a este esquema.
# En el futuro se puede seccionar por esquema para simular microservicios.

# ==============================================
# REDIS CACHE [OPCIONAL]
# Si no se configura, el sistema usa caché en memoria local
# ==============================================
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_URL=

# ==============================================
# ENCRYPTION [REQUERIDO]
# Para generar claves: node ./shared/utils/generateKeys.util.js
# ==============================================
AES_KEY=
AES_IV=
ENCRYPTION_ALGORITHM=aes-256-cbc
EXTERNAL_API_KEYS=

# ==============================================
# AWS [REQUERIDO]
# ==============================================
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
BUCKET_NAME=

# ==============================================
# COGNITO [REQUERIDO]
# ==============================================
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=

# ==============================================
# FRONTEND URLs [REQUERIDO]
# ==============================================
FRONTEND_RESET_URL=http://localhost:3000/auth/reset

# ==============================================
# NOTIFICATIONS [OPCIONAL]
# El sistema funciona sin estas variables, solo no notificará
# ==============================================
SNS_PLATFORM_ARN_IOS=
SNS_PLATFORM_ARN_ANDROID=
SES_FROM_EMAIL=
LOGO_URL=
ADMIN_EMAIL=

# ==============================================
# LOGGING
# ==============================================
LOG_LEVEL=info                 # debug | info | warn | error

# ==============================================
# WORKERS
# ==============================================
ENABLE_WORKERS=true

```

## Base de Datos

Comandos disponibles para gestionar la base de datos con Sequelize:

- **Migrar base de datos:**

  ```bash
  npm run db:migrate
  ```

- **Deshacer última migración:**

  ```bash
  npm run db:migrate:undo
  ```

- **Poblar base de datos (Seeds):**

  ```bash
  npm run db:seed
  ```

- **Resetear base de datos (Undo all + Migrate + Seed):**
  ```bash
  npm run db:reset
  ```

## Ejecución

### Desarrollo

Arranca el servidor con `nodemon` para reinicio automático ante cambios.

```bash
npm run dev
```

### Producción

Arranca el servidor con `node`.

```bash
npm start
```

## Testing

Ejecutar la suite de pruebas con Jest. (Pruebas de integración realizadas con SQLite en memoria)

```bash
npm test
```

## Documentación API

La API se sirve bajo el prefijo configurado (por defecto `/api/v1`).

### Swagger

La documentación interactiva generado con Swagger está disponible en:
`http://localhost:3000/api/v1/docs`

### Endpoints Principales

## Estructura del Proyecto

