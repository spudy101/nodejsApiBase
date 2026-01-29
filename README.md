# 🏦 Abundbank Microservices

Arquitectura de microservicios para Abundbank - Migración desde monolito a servicios independientes escalables.

## 📋 Índice

- [Arquitectura](#-arquitectura)
- [Servicios](#-servicios)
- [Setup Inicial](#-setup-inicial)
- [Desarrollo](#-desarrollo)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Documentación](#-documentación)

---

## 🏗️ Arquitectura

Este proyecto utiliza un **monorepo** con múltiples microservicios independientes que comparten utilidades comunes.

```
abundbank-microservices/
├── packages/
│   ├── shared/                 # Utilidades compartidas
│   ├── kyc-service/           # Servicio KYC (autenticación, perfil)
│   ├── notifications-service/ # Servicio de Notificaciones
│   ├── admin-gateway/         # Gateway Admin
│   └── client-gateway/        # Gateway Cliente
└── infrastructure/            # Configs de Docker, AWS, etc.
```

### Stack Tecnológico

- **Runtime:** Node.js 18+
- **Framework:** Express 5
- **ORM:** Sequelize 6
- **Database:** PostgreSQL 14+ (múltiples schemas)
- **Cache:** Redis 7+
- **Auth:** AWS Cognito
- **Storage:** AWS S3
- **Notifications:** AWS SES + SNS
- **Messaging:** Redis Pub/Sub
- **Logging:** Winston
- **Testing:** Jest + Supertest

---

## 🎯 Servicios

### 📦 Shared
Paquete compartido con middlewares, utilidades, configuraciones y constantes reutilizables.

### 🔐 KYC Service
- Autenticación de usuarios (login, registro, reset password)
- Gestión de perfiles
- Validación de identidad
- MFA (Multi-Factor Authentication)
- Preferencias de notificaciones de usuario

**Puerto:** 4001  
**Schema:** `kyc_schema`

### 🔔 Notifications Service
- Envío de emails (AWS SES)
- Envío de push notifications (AWS SNS)
- Notificaciones in-app
- Notificaciones globales
- Gestión de preferencias de notificaciones

**Puerto:** 4002  
**Schema:** `notifications_schema`

### 🚪 Admin Gateway
API Gateway para el panel administrativo.

**Puerto:** 4100

### 🚪 Client Gateway
API Gateway para la aplicación cliente.

**Puerto:** 4200

---

## 🚀 Setup Inicial

### Prerrequisitos

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 7
- npm >= 9.0.0 (o pnpm recomendado)

### Instalación

1. **Clonar el repositorio**
   ```bash
   git clone https://github.com/abundbank/microservices.git
   cd abundbank-microservices
   ```

2. **Instalar dependencias**
   ```bash
   # Con npm
   npm run bootstrap

   # Con pnpm (recomendado)
   pnpm install
   ```

3. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Editar .env con tus credenciales
   ```

4. **Configurar base de datos**
   ```bash
   # Crear schemas
   npm run db:migrate

   # Poblar datos iniciales
   npm run db:seed
   ```

---

## 💻 Desarrollo

### Iniciar todos los servicios

```bash
# Con npm
npm run dev

# Con pnpm
pnpm dev
```

### Iniciar servicios individuales

```bash
# KYC Service
npm run dev:kyc

# Notifications Service
npm run dev:notifications

# Admin Gateway
npm run dev:admin

# Client Gateway
npm run dev:client
```

### URLs de desarrollo

- **KYC Service:** http://localhost:4001
  - Docs: http://localhost:4001/docs
  - Health: http://localhost:4001/health

- **Notifications Service:** http://localhost:4002
  - Docs: http://localhost:4002/docs
  - Health: http://localhost:4002/health

- **Admin Gateway:** http://localhost:4100
  - Docs: http://localhost:4100/docs

- **Client Gateway:** http://localhost:4200
  - Docs: http://localhost:4200/docs

---

## 🧪 Testing

### Ejecutar todos los tests

```bash
npm test
```

### Tests por servicio

```bash
# KYC Service
npm run test:kyc

# Notifications Service
npm run test:notifications
```

### Tests con coverage

```bash
npm run test:coverage
```

### Tests en modo watch

```bash
npm run test:watch
```

---

## 🐳 Docker

### Desarrollo local con Docker

```bash
# Levantar todos los servicios
npm run docker:up

# Ver logs
npm run docker:logs

# Detener servicios
npm run docker:down

# Limpiar todo (contenedores + volúmenes)
npm run docker:clean
```

---

## 📊 Base de Datos

### Estructura de Schemas

```sql
abundbank_db
├── common_schema           # Mantenedores compartidos (READ-ONLY)
├── kyc_schema             # Tablas de KYC Service
└── notifications_schema   # Tablas de Notifications Service
```

### Migraciones

```bash
# Ejecutar todas las migraciones
npm run db:migrate

# Revertir última migración
npm run db:migrate:undo

# Revertir todas las migraciones
npm run db:migrate:undo:all

# Reset completo (undo all + migrate + seed)
npm run db:reset
```

### Seeders

```bash
# Ejecutar todos los seeders
npm run db:seed

# Revertir todos los seeders
npm run db:seed:undo
```

---

## 🚢 Deployment

### AWS App Runner

```bash
# Deploy KYC Service
npm run deploy:kyc

# Deploy Notifications Service
npm run deploy:notifications

# Deploy todos los servicios
npm run deploy:all
```

Ver guía completa en [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 📚 Documentación

- [Arquitectura Completa](ARQUITECTURA_COMPLETA.md)
- [Guía de Migración](MIGRATION_CHECKLIST.md)
- [Contexto de Refactoring](CONTEXTO_REFACTORING.md)
- [Convenciones de API](docs/API_CONVENTIONS.md)
- [Guía de Desarrollo](docs/DEVELOPMENT.md)
- [Guía de Deployment](docs/DEPLOYMENT.md)

---

## 🔄 Comunicación entre Servicios

Los servicios se comunican mediante **eventos** usando Redis Pub/Sub:

```javascript
// KYC Service publica evento
await UserPublisher.userRegistered({ userId, email });

// Notifications Service escucha evento
UserSubscriber.onUserRegistered(async (data) => {
  await NotificationService.sendWelcomeEmail(data.userId);
});
```

**Eventos disponibles:**
- `kyc.user.registered` - Usuario registrado
- `kyc.user.verified` - Usuario verificado
- `kyc.completed` - KYC completado
- `notifications.sent` - Notificación enviada

---

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📝 Licencia

Este proyecto es privado y propiedad de Abundbank.

---

## 👥 Equipo

- **Arquitectura:** Camilo Santander
- **Backend Lead:** TBD
- **DevOps:** TBD

---

## 📞 Soporte

Para soporte, contactar a: [support@abundbank.com](mailto:support@abundbank.com)

---

**Versión:** 1.0.0  
**Última actualización:** 2025-01-28
