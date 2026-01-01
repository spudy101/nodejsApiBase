# 🚀 Enterprise Node.js REST API

> Production-ready REST API with Node.js, Express, PostgreSQL, Redis, and JWT authentication

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-v4-blue.svg)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v14+-blue.svg)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-v7+-red.svg)](https://redis.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Stack Tecnológico](#️-stack-tecnológico)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#️-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Seguridad](#-seguridad)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Buenas Prácticas](#-buenas-prácticas)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🔐 **Autenticación y Autorización**
- JWT (Access + Refresh tokens) con blacklist
- Rate limiting en endpoints críticos
- Login attempts tracking con bloqueo automático
- Roles y permisos (user, admin)
- Middleware de autenticación reutilizable

### 🛡️ **Seguridad Empresarial**
- Helmet.js para headers de seguridad
- CORS configurado con whitelist
- Input sanitization (previene SQL/NoSQL injection)
- HTTP Parameter Pollution prevention
- Bcrypt para hashing de passwords
- Request locking (previene requests duplicados)
- Idempotency keys para operaciones críticas

### 📊 **Performance y Escalabilidad**
- Redis para caching y rate limiting
- Fallback automático a memoria si Redis falla
- Response compression (gzip)
- Query optimization con Sequelize
- Repository pattern para abstracción de datos

### 📝 **Logging y Auditoría**
- Winston para logging estructurado
- HTTP request logging (Morgan)
- Audit trails completos con contexto
- Logs por niveles (error, warn, info, debug)
- No expone información sensible en logs

### 🏗️ **Arquitectura Limpia**
- Separación en capas (Controller → Service → Repository → Model)
- DTOs para input/output
- Error handling centralizado
- Validators reutilizables
- Constants y configuración externa

### 🧪 **Testing y Calidad**
- Tests unitarios e integración
- Mocking de dependencias
- Cobertura de código
- Linting con ESLint

---

## 🏛️ Arquitectura

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│         Middlewares Layer           │
│  (Security, Auth, Rate Limit, etc)  │
└──────────────┬──────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│         Controllers Layer            │
│    (Request/Response handling)       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│          Services Layer              │
│      (Business logic)                │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│        Repositories Layer            │
│       (Data access logic)            │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│          Models Layer                │
│     (Database entities)              │
└──────────────────────────────────────┘
```

### Flujo de Datos

```
Request → Middlewares → Controller → Service → Repository → Model → DB
                                                                      ↓
Response ← Controller ← Service ← Repository ← Model ← DB
```

---

## 🛠️ Stack Tecnológico

### Backend Core
- **Node.js** v18+ - Runtime de JavaScript
- **Express.js** v4 - Framework web minimalista
- **Sequelize** v6 - ORM para PostgreSQL
- **PostgreSQL** v14+ - Base de datos relacional
- **Redis** v7+ - Cache y rate limiting

### Seguridad
- **helmet** - Security headers
- **cors** - Cross-Origin Resource Sharing
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT tokens
- **express-validator** - Input validation
- **express-rate-limit** - Rate limiting
- **rate-limit-redis** - Distributed rate limiting

### Utilities
- **winston** - Logging
- **morgan** - HTTP logging
- **dotenv** - Environment variables
- **compression** - Response compression
- **ioredis** - Redis client

### Development
- **nodemon** - Auto-restart en desarrollo
- **eslint** - Code linting
- **jest** - Testing framework
- **supertest** - HTTP testing

---

## 📦 Requisitos Previos

Antes de instalar, asegúrate de tener:

- **Node.js** v18 o superior ([Descargar](https://nodejs.org/))
- **PostgreSQL** v14 o superior ([Descargar](https://www.postgresql.org/download/))
- **Redis** v7 o superior ([Descargar](https://redis.io/download/)) - *Opcional pero recomendado*
- **npm** o **yarn** - Gestor de paquetes

---

## 🚀 Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/tu-repo.git
cd tu-repo
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` con tus credenciales (ver sección [Configuración](#️-configuración))

### 4. Crear base de datos

```bash
# Conectarse a PostgreSQL
psql -U postgres

# Crear base de datos
CREATE DATABASE api_database;
CREATE DATABASE api_database_test; -- Para tests
```

### 5. Ejecutar migraciones

```bash
npm run migrate
```

### 6. (Opcional) Ejecutar seeders

```bash
npm run seed
```

---

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto:

```bash
# Server
NODE_ENV=development
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=api_database
DB_USER=postgres
DB_PASSWORD=your_password
DB_DIALECT=postgres

# Redis (opcional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
# O usar URL completa:
# REDIS_URL=redis://localhost:6379

# JWT Secrets (CAMBIAR EN PRODUCCIÓN)
JWT_ACCESS_SECRET=your-super-secret-access-key-min-32-chars
JWT_REFRESH_SECRET=your-different-refresh-key-min-32-chars

# CORS (separar múltiples con comas)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

### ⚠️ Importante para Producción

1. **Cambiar JWT secrets** por valores aleatorios y seguros (mínimo 32 caracteres)
2. **Usar contraseñas fuertes** para PostgreSQL y Redis
3. **Configurar CORS_ORIGINS** solo con dominios permitidos
4. **Habilitar HTTPS** (la aplicación respeta `trust proxy`)
5. **Configurar variables de entorno** en tu servidor (no usar archivo .env)

---

## 💻 Uso

### Desarrollo

```bash
# Iniciar en modo desarrollo (con hot-reload)
npm run dev

# Iniciar sin hot-reload
npm start
```

### Producción

```bash
# Build (si tienes TypeScript)
npm run build

# Iniciar en producción
NODE_ENV=production npm start
```

### Testing

```bash
# Ejecutar todos los tests
npm test

# Tests con cobertura
npm run test:coverage

# Tests en modo watch
npm run test:watch
```

### Linting

```bash
# Revisar código
npm run lint

# Auto-fix problemas
npm run lint:fix
```

---

## 📁 Estructura del Proyecto

```
project/
├── src/
│   ├── config/               # Configuraciones
│   │   ├── config.js        # Config de Sequelize
│   │   └── jwt.config.js    # Config y validación de JWT
│   │
│   ├── constants/            # Constantes globales
│   │   ├── index.js         # HTTP status, códigos de error, etc.
│   │   └── messages.js      # Mensajes de respuesta
│   │
│   ├── controllers/          # Controladores (manejo de req/res)
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   └── product.controller.js
│   │
│   ├── dto/                  # Data Transfer Objects
│   │   ├── auth.dto.js      # DTOs de autenticación
│   │   ├── user.dto.js
│   │   └── product.dto.js
│   │
│   ├── middlewares/          # Middlewares
│   │   ├── auth.middleware.js         # Autenticación JWT
│   │   ├── security.middleware.js     # Headers, sanitización
│   │   ├── rateLimit.middleware.js    # Rate limiting
│   │   ├── error.middleware.js        # Error handling
│   │   ├── idempotency.middleware.js  # Idempotency
│   │   ├── requestLock.middleware.js  # Request locking
│   │   └── audit.middleware.js        # Audit context
│   │
│   ├── models/               # Modelos de Sequelize
│   │   ├── index.js         # Inicialización y asociaciones
│   │   ├── User.js
│   │   ├── Product.js
│   │   └── LoginAttempts.js
│   │
│   ├── repository/           # Capa de acceso a datos
│   │   ├── base.repository.js          # Repo base (CRUD genérico)
│   │   ├── user.repository.js
│   │   ├── product.repository.js
│   │   └── loginAttempts.repository.js
│   │
│   ├── routes/               # Definición de rutas
│   │   ├── index.js         # Router principal
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   └── product.routes.js
│   │
│   ├── services/             # Lógica de negocio
│   │   ├── auth.service.js
│   │   ├── user.service.js
│   │   └── product.service.js
│   │
│   ├── utils/                # Utilidades
│   │   ├── AppError.js      # Custom error class
│   │   ├── response.js      # Response formatter
│   │   ├── logger.js        # Winston logger
│   │   ├── redis.js         # Redis client wrapper
│   │   ├── jwt.js           # JWT utils
│   │   ├── encryption.js    # Hash utils
│   │   ├── validators.js    # Validation middleware
│   │   └── sanitizeAuditBody.js
│   │
│   ├── validators/           # Express-validator schemas
│   │   ├── common.validator.js      # UUID, pagination
│   │   ├── auth.validator.js
│   │   ├── user.validator.js
│   │   └── product.validator.js
│   │
│   ├── app.js                # Configuración de Express
│   └── server.js             # Entry point
│
├── config/                   # Config de DB para migrations
│   └── config.js
│
├── migrations/               # Migraciones de DB
│   └── YYYYMMDDHHMMSS-create-users.js
│
├── seeders/                  # Seeds de DB
│   └── YYYYMMDDHHMMSS-demo-users.js
│
├── tests/                    # Tests
│   ├── unit/
│   │   ├── services/
│   │   └── repositories/
│   └── integration/
│       └── api/
│
├── logs/                     # Logs (ignorado en git)
├── .env                      # Variables de entorno (ignorado en git)
├── .env.example              # Ejemplo de variables
├── .gitignore
├── .eslintrc.json            # Config de ESLint
├── package.json
└── README.md
```

---

## 🔌 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Autenticación

| Method | Endpoint | Descripción | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Registrar nuevo usuario | No |
| POST | `/auth/login` | Iniciar sesión | No |
| POST | `/auth/logout` | Cerrar sesión | Sí |
| POST | `/auth/refresh` | Renovar access token | No |
| GET | `/auth/me` | Obtener usuario actual | Sí |
| GET | `/auth/verify` | Verificar token | No |

### Usuarios

| Method | Endpoint | Descripción | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/users` | Listar usuarios | Sí | admin |
| GET | `/users/:id` | Obtener usuario | Sí | - |
| PUT | `/users/:id` | Actualizar usuario | Sí | owner/admin |
| DELETE | `/users/:id` | Eliminar usuario | Sí | owner/admin |
| GET | `/users/me/profile` | Ver mi perfil | Sí | - |
| PUT | `/users/me/profile` | Actualizar mi perfil | Sí | - |

### Productos

| Method | Endpoint | Descripción | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/products` | Listar productos | No | - |
| GET | `/products/:id` | Obtener producto | No | - |
| POST | `/products` | Crear producto | Sí | - |
| PUT | `/products/:id` | Actualizar producto | Sí | owner/admin |
| DELETE | `/products/:id` | Eliminar producto | Sí | owner/admin |
| GET | `/products/categories` | Listar categorías | No | - |
| GET | `/products/me` | Mis productos | Sí | - |
| GET | `/products/statistics` | Estadísticas | Sí | admin |

### Ejemplo de Request

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Password123!",
    "name": "Juan Pérez"
  }'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "Password123!"
  }'

# Get my profile (con token)
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Create product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Idempotency-Key: unique-key-123" \
  -d '{
    "name": "Laptop Dell XPS 15",
    "description": "Laptop de alto rendimiento",
    "price": 1500.00,
    "stock": 10,
    "category": "electronics"
  }'
```

### Formato de Respuesta

#### Éxito
```json
{
  "success": true,
  "message": "Usuario registrado exitosamente",
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@example.com",
      "name": "Juan Pérez",
      "role": "user"
    },
    "tokens": {
      "accessToken": "eyJhbGc...",
      "refreshToken": "eyJhbGc..."
    }
  }
}
```

#### Error
```json
{
  "success": false,
  "message": "Email ya registrado",
  "code": "CONFLICT_ERROR",
  "details": null
}
```

#### Errores de Validación
```json
{
  "success": false,
  "message": "Errores de validación",
  "code": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "Debe ser un email válido",
      "value": "not-an-email"
    }
  ]
}
```

---

## 🔒 Seguridad

### Implementaciones de Seguridad

✅ **Headers de Seguridad (Helmet)**
- Content Security Policy
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- HSTS (HTTP Strict Transport Security)

✅ **Rate Limiting**
- 100 requests por 15 minutos (general)
- 10 requests por 15 minutos (autenticación)
- Distribuido con Redis

✅ **Input Sanitization**
- Previene SQL injection
- Previene NoSQL injection
- Elimina objetos anidados peligrosos
- HTTP Parameter Pollution prevention

✅ **Authentication & Authorization**
- JWT con Access (15min) y Refresh tokens (7 días)
- Blacklist de tokens en logout
- Login attempts tracking (5 intentos → bloqueo 15min)
- Role-based access control (RBAC)

✅ **Password Security**
- Bcrypt con 10 rounds
- Validación de complejidad (mayúscula, minúscula, número, especial)
- Mínimo 8 caracteres

✅ **Request Protection**
- Idempotency keys (previene duplicados)
- Request locking (previene race conditions)
- CORS con whitelist

✅ **Logging Seguro**
- No loguea passwords, tokens, ni datos sensibles
- Sanitización automática en audit logs
- Diferentes niveles por ambiente

### Checklist de Producción

- [ ] Cambiar JWT_ACCESS_SECRET y JWT_REFRESH_SECRET
- [ ] Configurar CORS_ORIGINS con dominios reales
- [ ] Usar HTTPS (certificado SSL/TLS)
- [ ] Configurar firewall (solo puertos necesarios)
- [ ] Usar contraseñas fuertes en DB y Redis
- [ ] Habilitar Redis para rate limiting distribuido
- [ ] Configurar log rotation
- [ ] Implementar monitoring (Datadog, New Relic, etc.)
- [ ] Backups automáticos de PostgreSQL
- [ ] Configurar variables de entorno en servidor (no .env)

---

## 🧪 Testing

### Estructura de Tests

```
tests/
├── unit/                     # Tests unitarios
│   ├── services/            # Tests de servicios
│   ├── repositories/        # Tests de repositorios
│   └── utils/               # Tests de utilidades
│
└── integration/             # Tests de integración
    └── api/                 # Tests de endpoints
        ├── auth.test.js
        ├── users.test.js
        └── products.test.js
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Tests unitarios
npm run test:unit

# Tests de integración
npm run test:integration

# Con cobertura
npm run test:coverage

# Watch mode
npm run test:watch
```

### Ejemplo de Test

```javascript
// tests/integration/api/auth.test.js
describe('POST /api/auth/register', () => {
  it('debe registrar un nuevo usuario', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.tokens).toHaveProperty('accessToken');
  });

  it('debe rechazar email duplicado', async () => {
    // Crear usuario primero
    await createUser({ email: 'test@example.com' });

    // Intentar duplicar
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      });

    expect(response.status).toBe(409);
    expect(response.body.success).toBe(false);
  });
});
```

---

## 🚢 Deployment

### Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "src/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: api_database
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Deployment en AWS

```bash
# Ejemplo con PM2
npm install -g pm2

# Iniciar aplicación
pm2 start src/server.js --name api

# Ver logs
pm2 logs api

# Reiniciar
pm2 restart api

# Guardar configuración
pm2 save
pm2 startup
```

---

## 📚 Buenas Prácticas

### Código

- ✅ Usar `async/await` en vez de callbacks
- ✅ Manejo de errores con try-catch y middleware centralizado
- ✅ DTOs para sanitizar input/output
- ✅ Validators para cada endpoint
- ✅ Repository pattern para abstracción de DB
- ✅ Service layer para lógica de negocio
- ✅ Constants para valores hardcoded
- ✅ Logging estructurado (Winston)

### Seguridad

- ✅ Nunca exponer secrets en código
- ✅ Validar TODO input del usuario
- ✅ Sanitizar output (no exponer stack traces)
- ✅ Usar HTTPS en producción
- ✅ Rate limiting en todos los endpoints
- ✅ Audit logs para acciones críticas

### Performance

- ✅ Usar indexes en DB
- ✅ Cachear con Redis cuando sea posible
- ✅ Pagination en listados grandes
- ✅ Compression de respuestas
- ✅ Evitar N+1 queries (usar includes)

### Testing

- ✅ Cobertura mínima 80%
- ✅ Tests de integración para flujos críticos
- ✅ Mock de servicios externos
- ✅ Tests de seguridad (SQL injection, XSS, etc.)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Convenciones de Código

- Usar **ES6+** syntax
- Seguir **ESLint** rules
- Escribir **JSDoc** para funciones complejas
- Commits siguiendo **Conventional Commits**

---

## 📄 Licencia

Este proyecto está bajo la licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👥 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- LinkedIn: [Tu Perfil](https://linkedin.com/in/tu-perfil)
- Email: tu-email@example.com

---

## 🙏 Agradecimientos

- [Express.js](https://expressjs.com/)
- [Sequelize](https://sequelize.org/)
- [Winston](https://github.com/winstonjs/winston)
- [Helmet](https://helmetjs.github.io/)

---

## 📞 Soporte

Si tienes preguntas o problemas:

1. Revisa la [documentación](#)
2. Busca en [Issues](https://github.com/tu-usuario/tu-repo/issues)
3. Abre un [nuevo issue](https://github.com/tu-usuario/tu-repo/issues/new)

---

<div align="center">
  <sub>Built with ❤️ by [Tu Nombre]</sub>
</div>
