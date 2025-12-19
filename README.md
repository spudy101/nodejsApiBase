📚 RESUMEN COMPLETO DEL PROYECTO
Proyecto: API RESTful con Node.js + Express + PostgreSQL

🎯 Objetivo del Proyecto
Crear una API RESTful robusta y escalable con las mejores prácticas de la industria, incluyendo:

Autenticación JWT
CRUD completo
Sistema de transacciones
Validaciones
Documentación
Seguridad

📂 Estructura Final del Proyecto
nodejsBase/
├── config/ # Configuración de Sequelize CLI
│ └── config.js # Config por ambiente (dev, test, prod)
│
├── migrations/ # Migraciones de base de datos (versionado)
│ ├── XXXXX-create-users.js
│ └── XXXXX-create-products.js
│
├── seeders/ # Datos de prueba
│ ├── XXXXX-demo-users.js
│ └── XXXXX-demo-products.js
│
├── logs/ # Archivos de logs (gitignored)
│ ├── error.log
│ └── combined.log
│
├── scripts/ # Scripts de utilidad/demos
│ ├── testCrypto.js
│ ├── testUtils.js
│ ├── testModel.js
│ └── generateEncryptionKey.js
│
├── src/ # Código fuente de la aplicación
│ ├── config/ # Configuraciones
│ │ ├── database.js # Conexión a PostgreSQL
│ │ └── swagger.js # Configuración de Swagger
│ │
│ ├── models/ # Modelos de Sequelize
│ │ ├── index.js # Inicialización y asociaciones
│ │ ├── User.js # Modelo de Usuario
│ │ └── Product.js # Modelo de Producto
│ │
│ ├── controllers/ # Controladores (request/response)
│ │ ├── index.js
│ │ ├── authController.js # Login, registro, perfil
│ │ ├── userController.js # Gestión de usuarios (admin)
│ │ └── productController.js # CRUD de productos
│ │
│ ├── services/ # Lógica de negocio
│ │ ├── index.js
│ │ ├── authService.js # Lógica de autenticación
│ │ ├── userService.js # Lógica de usuarios
│ │ └── productService.js # Lógica de productos
│ │
│ ├── routes/ # Definición de endpoints
│ │ ├── index.js # Enrutador principal
│ │ ├── authRoutes.js # Rutas de auth
│ │ ├── userRoutes.js # Rutas de users (admin)
│ │ └── productRoutes.js # Rutas de products
│ │
│ ├── middlewares/ # Middlewares personalizados
│ │ ├── index.js
│ │ ├── errorHandler.js # Manejo de errores centralizado
│ │ ├── rateLimiter.js # Límite de peticiones
│ │ ├── requestLock.js # Prevenir peticiones duplicadas
│ │ ├── authMiddleware.js # Autenticación y autorización JWT
│ │ └── validateRequest.js # Validación de requests
│ │
│ ├── validators/ # Esquemas de validación
│ │ ├── index.js
│ │ ├── authValidator.js # Validaciones de auth
│ │ ├── productValidator.js # Validaciones de productos
│ │ └── commonValidator.js # Validaciones comunes
│ │
│ ├── utils/ # Utilidades reutilizables
│ │ ├── logger.js # Winston logger
│ │ ├── responseHandler.js # Respuestas estandarizadas
│ │ ├── transactionWrapper.js # Manejo de transacciones
│ │ ├── jwtHelper.js # Generación/verificación JWT
│ │ └── cryptoHelper.js # Encriptación/desencriptación
│ │
│ └── app.js # Configuración de Express
│
├── test/ # Tests (estructura lista)
│ ├── unit/
│ └── integration/
│
├── .env # Variables de entorno (gitignored)
├── .env.example # Ejemplo de variables de entorno
├── .gitignore # Archivos ignorados por Git
├── .sequelizerc # Configuración de Sequelize CLI
├── package.json # Dependencias y scripts
├── server.js # Punto de entrada de la aplicación
├── USAGE.md # Guía de uso de la API
└── README.md # Documentación del proyecto

🚀 FASE 1: Inicialización y Configuración Base
Paso 1.1: Instalación de dependencias
Comando ejecutado:
bashnpm install express pg pg-hstore sequelize dotenv bcryptjs jsonwebtoken
npm install express-rate-limit express-validator helmet cors
npm install winston swagger-jsdoc swagger-ui-express
npm install --save-dev nodemon sequelize-cli jest supertest
¿Qué hace?

Instala todas las librerías necesarias para el proyecto
Separa dependencias de desarrollo (--save-dev)

Dependencias principales:

express - Framework web
pg y pg-hstore - Driver de PostgreSQL
sequelize - ORM para manejar la BD
bcryptjs - Hash de contraseñas
jsonwebtoken - Tokens JWT
express-rate-limit - Límite de peticiones
winston - Sistema de logs
swagger-jsdoc y swagger-ui-express - Documentación

Paso 1.2: Estructura de carpetas
Comando ejecutado:
bashmkdir -p src/{config,models,controllers,services,routes,middlewares,utils,validators}
mkdir -p test/{unit,integration}
mkdir -p migrations seeders
mkdir logs
mkdir scripts
¿Qué hace?

Crea toda la estructura de carpetas del proyecto
Organiza el código en capas (MVC con Services)

Paso 1.3: Variables de entorno
Archivos creados:

.env - Variables reales (no se sube a Git)
.env.example - Ejemplo de configuración

Variables configuradas:
env# Server
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database

DB_HOST=localhost
DB_PORT=5432
DB_NAME=tu_base_datos
DB_USER=tu_usuario
DB_PASSWORD=tu_password
DB_DIALECT=postgres

# JWT

JWT_SECRET=tu_secret_super_seguro
JWT_EXPIRES_IN=24h

# Rate Limiting

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Encryption

ENCRYPTION_KEY=clave_generada_aleatoriamente

# CORS

CORS_ORIGIN=\*

# Logs

LOG_LEVEL=debug
¿Para qué sirve cada variable?

PORT - Puerto donde corre el servidor
DB*\* - Credenciales de PostgreSQL
JWT_SECRET - Clave secreta para firmar tokens
ENCRYPTION_KEY - Clave para encriptar datos sensibles
RATE_LIMIT*\* - Configuración de límites de peticiones

Paso 1.4: Configuración de Sequelize
Archivos creados:

src/config/database.js

Conexión a PostgreSQL
Pool de conexiones
Logging configurado

.sequelizerc

Le dice a Sequelize CLI dónde están las carpetas

javascript module.exports = {
'config': path.resolve('config', 'config.js'),
'models-path': path.resolve('src', 'models'),
'seeders-path': path.resolve('seeders'),
'migrations-path': path.resolve('migrations')
};

config/config.js

Configuración por ambiente (development, test, production)
Usa variables de .env

Comando para probar conexión:
bashnode src/config/testConnection.js

🗄️ FASE 2: Modelos, Migraciones y Seeders
Paso 2.1: Modelo User
Archivos creados:

Migración: migrations/XXXXX-create-users.js

javascript // Define la estructura de la tabla Users en la BD

- id (UUID, PK)
- email (String, unique)
- password (String, hasheada)
- name (String)
- role (ENUM: 'user', 'admin')
- isActive (Boolean)
- lastLogin (Date, nullable)
- createdAt, updatedAt (Timestamps)

Modelo: src/models/User.js

javascript // Define el modelo de Sequelize

- Validaciones (isEmail, len, notEmpty)
- Hooks (beforeCreate, beforeUpdate) para hashear password
- Método comparePassword() para verificar password
- Método toJSON() para ocultar password en respuestas
  Comandos ejecutados:
  bash# Generar migración
  npx sequelize-cli migration:generate --name create-users

# Ejecutar migración (crea la tabla en BD)

npm run db:migrate

# Ver estado de migraciones

npx sequelize-cli db:migrate:status
¿Qué hace db:migrate?

Lee las migraciones pendientes
Ejecuta el método up() de cada migración
Crea las tablas en PostgreSQL
Registra en tabla SequelizeMeta qué migraciones se ejecutaron

Paso 2.2: Seeder de Users
Archivo creado: seeders/XXXXX-demo-users.js
Usuarios de prueba creados:

admin@example.com - Role: admin, Active: true
user@example.com - Role: user, Active: true
inactive@example.com - Role: user, Active: false

Password de todos: password123 (hasheada con bcrypt)
Comando ejecutado:
bash# Ejecutar seeder
npm run db:seed
¿Qué hace db:seed?

Ejecuta todos los seeders en la carpeta seeders/
Inserta datos de prueba en la BD
Importante: Los seeders NO tienen historial como las migraciones

Modificación para hacerlos idempotentes:
javascript// Verificar si ya existen antes de insertar
const existingUsers = await queryInterface.sequelize.query(
'SELECT email FROM "Users" WHERE email IN (:emails)',
{ replacements: { emails: [...] } }
);

if (existingUsers.length > 0) {
console.log('⚠️ Usuarios ya existen, saltando...');
return;
}

Paso 2.3: Modelo Product
Archivos creados:

Migración: migrations/XXXXX-create-products.js

javascript - id (UUID, PK)

- name (String)
- description (Text, nullable)
- price (Decimal)
- stock (Integer)
- category (String, nullable)
- isActive (Boolean)
- createdBy (UUID, FK a Users)
- createdAt, updatedAt

Modelo: src/models/Product.js

javascript - Validaciones de precios y stock

- Relación belongsTo con User (createdBy)

Seeder: seeders/XXXXX-demo-products.js

5 productos de ejemplo

Comandos ejecutados:
bashnpm run db:migrate
npm run db:seed

Paso 2.4: Índice de modelos
Archivo: src/models/index.js
¿Qué hace?

Importa la conexión de Sequelize
Carga todos los modelos
Configura las asociaciones (relaciones) entre modelos
Exporta un objeto con sequelize y todos los modelos

javascriptdb.User = require('./User')(sequelize);
db.Product = require('./Product')(sequelize);

// Configurar asociaciones
Object.keys(db).forEach(modelName => {
if (db[modelName].associate) {
db[modelName].associate(db);
}
});

🛠️ FASE 3: Utilidades Core
Paso 3.1: Logger (Winston)
Archivo: src/utils/logger.js
¿Qué hace?

Crea un sistema de logging profesional
Diferentes niveles: error, warn, info, http, debug
Colores en desarrollo
JSON en producción
Guarda logs en archivos rotativos

Niveles de log:

error - Errores graves
warn - Advertencias
info - Información general
http - Peticiones HTTP
debug - Información de debugging

Archivos de log:

logs/error.log - Solo errores
logs/combined.log - Todos los logs

Uso:
javascriptconst logger = require('./utils/logger');

logger.info('Usuario registrado', { userId: '123' });
logger.error('Error en BD', { error: err.message });

Paso 3.2: Response Handler
Archivo: src/utils/responseHandler.js
¿Qué hace?

Estandariza todas las respuestas de la API
Formato consistente en todos los endpoints

Funciones:

successResponse(res, data, message, statusCode)

javascript // Respuesta exitosa
{
success: true,
message: "Operación exitosa",
data: {...},
timestamp: "2025-12-18T20:00:00.000Z"
}

errorResponse(res, message, statusCode, errors)

javascript // Respuesta de error
{
success: false,
message: "Error en la operación",
timestamp: "2025-12-18T20:00:00.000Z"
}

validationErrorResponse(res, errors)

javascript // Errores de validación
{
success: false,
message: "Errores de validación",
errors: [
{ field: "email", message: "El email es requerido" }
]
}

paginatedResponse(res, data, page, limit, total)

javascript // Respuesta paginada
{
success: true,
data: [...],
pagination: {
page: 1,
limit: 10,
total: 100,
totalPages: 10,
hasNextPage: true,
hasPrevPage: false
}
}

Paso 3.3: Transaction Wrapper
Archivo: src/utils/transactionWrapper.js
¿Qué hace?

Envuelve operaciones de BD en transacciones
Manejo automático de commit/rollback
Logging detallado
Métricas de rendimiento

Funciones principales:

executeWithTransaction(inputData, businessLogic, operationName, options)

javascript // Para operaciones de escritura (INSERT, UPDATE, DELETE)
const result = await executeWithTransaction(
userData,
async (data, transaction, sequelize) => {
const user = await User.create(data, { transaction });
return user;
},
'createUser',
{ sequelize }
);
¿Qué hace internamente?

Inicia una transacción
Ejecuta la lógica de negocio
Si todo sale bien → COMMIT
Si hay error → ROLLBACK
Registra métricas de tiempo
Maneja rollback explícito con \_rollback: true

executeQuery(queryLogic, operationName, sequelize)

javascript // Para operaciones de solo lectura (SELECT)
const result = await executeQuery(
async (sequelize) => {
return await User.findAll();
},
'listUsers',
sequelize
);
Rollback explícito:
javascript// En lógica de negocio, puedes forzar rollback
if (user.balance < amount) {
return {
\_rollback: true,
message: 'Saldo insuficiente',
data: { currentBalance: user.balance }
};
}

Paso 3.4: JWT Helper
Archivo: src/utils/jwtHelper.js
¿Qué hace?

Genera tokens JWT
Verifica tokens
Decodifica tokens

Funciones:

generateToken(payload, expiresIn)

javascript // Genera token con datos mínimos
const token = generateToken({
id: user.id,
email: user.email,
role: user.role
});

// Resultado: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
¿Qué incluye el token?

Solo: id, email, role
NO incluir: password, datos sensibles
Firmado con JWT_SECRET
Expira en 24 horas (configurable)

verifyToken(token)

javascript // Verifica y decodifica token
const decoded = verifyToken(token);
// decoded = { id, email, role, iat, exp }
Excepciones que lanza:

TokenExpiredError → "Token expirado"
JsonWebTokenError → "Token inválido"

generateRefreshToken(payload)

Token de larga duración (7 días)
Para renovar tokens sin volver a hacer login

Paso 3.5: Crypto Helper
Archivo: src/utils/cryptoHelper.js
¿Qué hace?

Encripta/desencripta datos sensibles
Hash de una sola vía
Genera tokens aleatorios seguros

Funciones principales:

encrypt(data) y decrypt(encryptedData)

javascript // Encriptar datos sensibles
const encrypted = encrypt({ cardNumber: '4532-1234-5678-9010' });
// encrypted = "salt:iv:tag:encryptedData"

// Desencriptar
const original = decrypt(encrypted);
// original = { cardNumber: '4532-1234-5678-9010' }
Usa: AES-256-GCM (muy seguro)
Para qué usarlo:

Tokens de API de terceros
Números de tarjeta
Datos personales sensibles

hash(data, salt) y verifyHash(data, hash, salt)

javascript // Hash de una sola vía (NO reversible)
const { hash, salt } = hash('MiPassword123');

// Verificar
const isValid = verifyHash('MiPassword123', hash, salt);
Para qué usarlo:

Passwords (aunque bcrypt es mejor)
Tokens de verificación

generateSecureToken(length)

javascript // Token aleatorio seguro
const token = generateSecureToken(32);
// token = "a1b2c3d4e5f6..."
Para qué usarlo:

Tokens de reseteo de password
Tokens de verificación de email
Session IDs

generateUUID()

javascript const uuid = generateUUID();
// uuid = "123e4567-e89b-12d3-a456-426614174000"
Comando para generar clave de encriptación:
bashnode scripts/generateEncryptionKey.js

🛡️ FASE 4: Middlewares
Paso 4.1: Error Handler
Archivo: src/middlewares/errorHandler.js
¿Qué hace?

Captura todos los errores de la aplicación
Los formatea de manera consistente
Log de errores con Winston

Funciones:

errorHandler(err, req, res, next)

Maneja errores de Sequelize (validación, unique, FK)
Maneja errores de JWT (expirado, inválido)
Maneja errores de transacciones
Devuelve respuesta formateada

notFoundHandler(req, res, next)

Maneja rutas 404 (no encontradas)

Tipos de errores que maneja:

SequelizeValidationError → 400
SequelizeUniqueConstraintError → 409
TokenExpiredError → 401
TransactionError → 500
Errores genéricos → 500

Paso 4.2: Rate Limiter
Archivo: src/middlewares/rateLimiter.js
¿Qué hace?

Limita la cantidad de peticiones por IP
Previene ataques de fuerza bruta
Protege contra DDoS

Limitadores creados:

generalLimiter

100 peticiones por 15 minutos
Aplica a toda la API

authLimiter

5 intentos por 15 minutos
Solo para login/register
Previene fuerza bruta

createLimiter

20 creaciones por hora
Para crear recursos

¿Cómo funciona?
javascript// En memoria (desarrollo)
// En producción: usar Redis

const generalLimiter = rateLimit({
windowMs: 15 _ 60 _ 1000, // 15 minutos
max: 100, // 100 requests
message: 'Demasiadas peticiones'
});

Paso 4.3: Request Lock
Archivo: src/middlewares/requestLock.js
¿Qué hace?

Previene peticiones duplicadas simultáneas
Evita double-submit en formularios
Protege operaciones críticas

Cómo funciona:
javascript// Genera hash único por: userId + método + ruta + body
const key = MD5(userId + POST + /products + {name:"X"})

// Si existe una petición con ese hash en proceso → rechazar
// Si no existe → registrar y procesar
Uso:
javascriptrouter.post(
'/products',
requestLock({ timeout: 5000 }), // 5 segundos
createProduct
);
Limpia automáticamente:

Cuando la request termina
Después del timeout
Cada 5 minutos (garbage collection)

Paso 4.4: Auth Middleware
Archivo: src/middlewares/authMiddleware.js
¿Qué hace?

Verifica tokens JWT
Valida que el usuario existe y está activo
Autoriza por roles

Funciones:

authenticate(req, res, next)

javascript // Verifica JWT en header: Authorization: Bearer {token}
// Decodifica token
// Busca usuario en BD
// Agrega req.user = { id, email, role }
Uso:
javascript router.get('/profile', authenticate, getProfile);

authorize(...allowedRoles)

javascript // Verifica que req.user.role esté en allowedRoles
Uso:
javascript router.get('/users', authenticate, authorize('admin'), listUsers);

authorizeOwnerOrAdmin(paramName)

javascript // Verifica que:
// - El usuario sea el dueño del recurso, O
// - El usuario sea admin
Uso:
javascript router.put('/users/:userId',
authenticate,
authorizeOwnerOrAdmin('userId'),
updateUser
);

optionalAuth(req, res, next)

javascript // Si hay token → autenticar
// Si no hay token → continuar sin autenticar
Uso en rutas públicas que mejoran con auth:
javascript router.get('/products', optionalAuth, listProducts);
// Usuario anónimo: ve solo productos activos
// Usuario autenticado: ve productos + info adicional

Paso 4.5: Validate Request
Archivo: src/middlewares/validateRequest.js
¿Qué hace?

Ejecuta validaciones de express-validator
Formatea errores de validación
Devuelve respuesta con errores

Uso:
javascriptrouter.post(
'/register',
registerValidation, // Define las reglas
validateRequest, // Ejecuta validación
authController.register // Si pasa, ejecuta controller
);

✅ FASE 5: Validators
Paso 5.1: Auth Validators
Archivo: src/validators/authValidator.js
Validadores creados:

registerValidation

javascript - email: required, isEmail, unique en BD

- password: required, min 6, mayúscula+minúscula+número
- name: required, min 2, max 100, solo letras
- role: optional, enum ['user', 'admin']

loginValidation

javascript - email: required, isEmail

- password: required

updateProfileValidation

javascript - name: optional, min 2, max 100

- email: optional, isEmail, unique (excepto el mismo usuario)

changePasswordValidation

javascript - currentPassword: required

- newPassword: required, min 6, validaciones
- confirmPassword: required, debe coincidir con newPassword

Paso 5.2: Product Validators
Archivo: src/validators/productValidator.js
Validadores creados:

createProductValidation

javascript - name: required, min 3, max 200, unique

- description: optional, max 1000
- price: required, >= 0
- stock: required, >= 0, integer
- category: optional, max 100
- isActive: optional, boolean

updateProductValidation

javascript - id: required, UUID

- Mismos campos que create pero todos opcionales

listProductsValidation

javascript - page: optional, integer >= 1

- limit: optional, integer 1-100
- category: optional, string
- isActive: optional, boolean
- minPrice, maxPrice: optional, >= 0
- search: optional, min 2

updateStockValidation

javascript - id: required, UUID

- quantity: required, integer
- operation: required, enum ['add', 'subtract', 'set']

Paso 5.3: Common Validators
Archivo: src/validators/commonValidator.js
Validadores reutilizables:

uuidParamValidation(paramName)

javascript // Valida que :id sea UUID válido
router.get('/:id', uuidParamValidation('id'), ...)

paginationValidation

javascript // Valida page y limit en query params
router.get('/', paginationValidation, ...)

sortValidation(allowedFields)

javascript // Valida sortBy y sortOrder
router.get('/', sortValidation(['name', 'price']), ...)

searchValidation

javascript // Valida término de búsqueda

dateRangeValidation

javascript // Valida startDate y endDate

💼 FASE 6: Services (Lógica de negocio)
Paso 6.1: Auth Service
Archivo: src/services/authService.js
Métodos:

register(userData)

javascript // - Crea usuario en BD (dentro de transacción)
// - Genera token JWT
// - Retorna usuario + token

login(email, password)

javascript // - Busca usuario por email
// - Verifica que esté activo
// - Compara password con bcrypt
// - Actualiza lastLogin
// - Genera token JWT
// - Retorna usuario + token

getProfile(userId)

javascript // - Busca usuario por ID
// - Retorna sin password

updateProfile(userId, updateData)

javascript // - Actualiza name y/o email
// - Dentro de transacción

changePassword(userId, currentPassword, newPassword)

javascript // - Verifica password actual
// - Actualiza a nueva password
// - Hook de Sequelize hashea automáticamente

deactivateUser(userId) y activateUser(userId)

javascript // - Cambia isActive
// - Soft delete

Paso 6.2: User Service
Archivo: src/services/userService.js
Métodos:

listUsers(filters)

javascript // - Paginación
// - Filtros: role, isActive, search
// - Retorna users + pagination info

getUserById(userId)

javascript // - Busca por PK

getUserByEmail(email)

javascript // - Busca por email

updateUserRole(userId, newRole)

javascript // - Solo admin puede cambiar roles
// - Dentro de transacción

deleteUser(userId)

javascript // - Hard delete
// - Elimina permanentemente

getUserStats()

javascript // - Query SQL con estadísticas
// - Total, activos, inactivos, admins, users

Paso 6.3: Product Service
Archivo: src/services/productService.js
Métodos:

createProduct(productData, userId)

javascript // - Crea producto
// - Guarda createdBy
// - Dentro de transacción

listProducts(filters)

javascript // - Paginación
// - Filtros: category, isActive, price range, search
// - Ordenamiento configurable
// - Include creator (User)

getProductById(productId)

javascript // - Busca por PK
// - Include creator

updateProduct(productId, updateData, userId)

javascript // - Actualiza campos permitidos
// - Dentro de transacción

updateStock(productId, quantity, operation)

javascript // - Operaciones: add, subtract, set
// - Validación de stock suficiente
// - Lock pesimista (SERIALIZABLE)
// - Previene race conditions

```

   **Ejemplo de race condition prevenido:**
```

Usuario A: lee stock = 10
Usuario B: lee stock = 10
Usuario A: resta 8 → stock = 2
Usuario B: resta 8 → stock = 2 (debería ser -6!)

Con lock SERIALIZABLE:
Usuario A: lock → lee 10 → resta 8 → commit → unlock
Usuario B: espera → lee 2 → error "stock insuficiente"

deleteProduct(productId)

javascript // - Soft delete (isActive = false)

permanentlyDeleteProduct(productId)

javascript // - Hard delete

getProductsByCategory(category)

javascript // - Filtra por categoría
// - Solo activos

getProductStats()

javascript // - Estadísticas de productos
// - Total, activos, sin stock, precio promedio

🎮 FASE 7: Controllers
¿Qué hacen los Controllers?
Los controllers son la capa de presentación:

Reciben el request HTTP
Extraen datos de req.body, req.params, req.query
Llaman al service correspondiente
Formatean la respuesta con responseHandler
Manejan errores y pasan al next()

Paso 7.1: Auth Controller
Archivo: src/controllers/authController.js
Métodos:

register(req, res, next)

javascript // 1. Extrae { email, password, name, role } de req.body
// 2. Llama a authService.register()
// 3. Si success → successResponse() con status 201
// 4. Si error → pasa a errorHandler con next(error)

login(req, res, next)

javascript // 1. Extrae { email, password } de req.body
// 2. Llama a authService.login()
// 3. Si success → successResponse()
// 4. Si error (credenciales) → errorResponse() 401

getProfile(req, res, next)

javascript // 1. Obtiene userId de req.user (seteado por authenticate)
// 2. Llama a authService.getProfile()
// 3. successResponse() con datos del usuario

```

4. **`updateProfile(req, res, next)`**
5. **`changePassword(req, res, next)`**
6. **`deactivateAccount(req, res, next)`**

---

### Paso 7.2: User Controller

**Archivo:** `src/controllers/userController.js`

Todos los métodos son similares:
- Extraen datos del request
- Llaman al service
- Formatean respuesta

**Métodos:**
1. `listUsers` - GET con query params
2. `getUserById` - GET con :id param
3. `updateUserRole` - PUT con :id y body
4. `activateUser` - PUT con :id
5. `deactivateUser` - PUT con :id
6. `deleteUser` - DELETE con :id
7. `getUserStats` - GET sin params

---

### Paso 7.3: Product Controller

**Archivo:** `src/controllers/productController.js`

**Métodos:**
1. `createProduct` - POST con body + req.user.id
2. `listProducts` - GET con múltiples query params
3. `getProductById` - GET con :id
4. `updateProduct` - PUT con :id + body
5. `updateStock` - PATCH con :id + { quantity, operation }
6. `deleteProduct` - DELETE con :id
7. `permanentlyDeleteProduct` - DELETE con :id/permanent
8. `getProductsByCategory` - GET con :category
9. `getProductStats` - GET sin params

---

## 🛣️ FASE 8: Routes

### ¿Qué son las Routes?

Las routes **conectan URLs con controllers** y aplican **middleware chain**:
```

Request → Route → Middleware1 → Middleware2 → Controller → Response
Paso 8.1: Auth Routes
Archivo: src/routes/authRoutes.js
Endpoints definidos:
javascriptPOST /api/v1/auth/register
↓
authLimiter (5 intentos/15min)
↓
registerValidation (valida email, password, name)
↓
validateRequest (ejecuta validaciones)
↓
authController.register

POST /api/v1/auth/login
↓
authLimiter
↓
loginValidation
↓
validateRequest
↓
authController.login

GET /api/v1/auth/profile
↓
authenticate (verifica JWT)
↓
authController.getProfile

PUT /api/v1/auth/profile
↓
authenticate
↓
updateProfileValidation
↓
validateRequest
↓
authController.updateProfile

PUT /api/v1/auth/change-password
↓
authenticate
↓
changePasswordValidation
↓
validateRequest
↓
authController.changePassword

DELETE /api/v1/auth/account
↓
authenticate
↓
authController.deactivateAccount

Paso 8.2: User Routes (Admin)
Archivo: src/routes/userRoutes.js
Todos los endpoints requieren: authenticate + authorize('admin')
javascriptGET /api/v1/users/stats
GET /api/v1/users
GET /api/v1/users/:id
PUT /api/v1/users/:id/role
PUT /api/v1/users/:id/activate
PUT /api/v1/users/:id/deactivate
DELETE /api/v1/users/:id
Nota importante sobre orden:
javascript// ❌ MAL - /stats se confunde con /:id
router.get('/:id', ...)
router.get('/stats', ...)

// ✅ BIEN - Rutas específicas primero
router.get('/stats', ...)
router.get('/:id', ...)

Paso 8.3: Product Routes
Archivo: src/routes/productRoutes.js
Endpoints públicos:
javascriptGET /api/v1/products
GET /api/v1/products/:id
GET /api/v1/products/category/:category
Endpoints privados (Admin):
javascriptPOST /api/v1/products
↓
authenticate
↓
authorize('admin')
↓
createLimiter (20 creaciones/hora)
↓
requestLock (prevenir duplicados)
↓
createProductValidation
↓
validateRequest
↓
productController.createProduct

PUT /api/v1/products/:id
PATCH /api/v1/products/:id/stock
DELETE /api/v1/products/:id
DELETE /api/v1/products/:id/permanent
GET /api/v1/products/stats

Paso 8.4: Index Routes
Archivo: src/routes/index.js
Enrutador principal que agrupa todas las rutas:
javascriptconst router = express.Router();

// Health check
router.get('/health', healthController);

// Rutas por recurso
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);

module.exports = router;

⚙️ FASE 9: Configuración de Express
Paso 9.1: app.js
Archivo: src/app.js
Configuración del servidor Express:
javascriptconst app = express();

// ==================== SECURITY ====================
app.use(helmet()); // Headers de seguridad
app.use(cors(corsOptions)); // CORS configurado

// ==================== MIDDLEWARE ====================
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // HTTP logger
app.use(generalLimiter); // Rate limiting

// Trust proxy (para obtener IP real)
app.set('trust proxy', 1);

// ==================== ROUTES ====================
app.use('/api/v1', routes);

// ==================== ERROR HANDLING ====================
app.use(notFoundHandler); // 404
app.use(errorHandler); // Errores

module.exports = app;
Middleware aplicados en orden:

helmet() - Configura headers de seguridad HTTP
cors() - Permite peticiones cross-origin
express.json() - Parse JSON en body
morgan() - Log de peticiones HTTP
generalLimiter - Límite de 100 req/15min
Routes - Rutas de la API
notFoundHandler - Captura 404
errorHandler - Captura todos los errores

Paso 9.2: server.js
Archivo: server.js (raíz del proyecto)
Punto de entrada de la aplicación:
javascriptconst app = require('./src/app');
const { sequelize } = require('./src/models');

const startServer = async () => {
// 1. Verificar conexión a BD
await sequelize.authenticate();

// 2. Iniciar servidor HTTP
const server = app.listen(PORT, () => {
console.log(`Servidor en puerto ${PORT}`);
});

// 3. Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
};

startServer();
Graceful shutdown:
javascript// Cuando se recibe señal de terminación:
// 1. Dejar de aceptar nuevas conexiones
// 2. Terminar requests en proceso
// 3. Cerrar conexión a BD
// 4. Salir del proceso

📚 FASE 10: Documentación con Swagger
Paso 10.1: Configuración
Archivo: src/config/swagger.js
¿Qué hace?

Configura Swagger/OpenAPI 3.0
Define schemas reutilizables
Configura autenticación JWT
Genera documentación automática

Elementos configurados:

Info básica:

javascript info: {
title: 'API Node.js + Express + PostgreSQL',
version: '1.0.0',
description: '...'
}

Servers:

javascript servers: [
{ url: 'http://localhost:3000/api/v1' },
{ url: 'https://tu-dominio.com/api/v1' }
]

Security Schemes:

javascript securitySchemes: {
bearerAuth: {
type: 'http',
scheme: 'bearer',
bearerFormat: 'JWT'
}
}

Schemas reutilizables:

javascript schemas: {
User: { ... },
Product: { ... },
SuccessResponse: { ... },
ErrorResponse: { ... },
ValidationErrorResponse: { ... },
PaginatedResponse: { ... }
}

Tags:

javascript tags: [
{ name: 'Auth', description: '...' },
{ name: 'Users', description: '...' },
{ name: 'Products', description: '...' }
]

Paso 10.2: Documentar endpoints
En cada archivo de routes se agregan comentarios JSDoc:
javascript/\*\*

- @swagger
- /auth/register:
- post:
-     summary: Registrar nuevo usuario
-     tags: [Auth]
-     requestBody:
-       required: true
-       content:
-         application/json:
-           schema:
-             type: object
-             properties:
-               email:
-                 type: string
-                 example: usuario@example.com
-     responses:
-       201:
-         description: Usuario registrado
-       400:
-         description: Error de validación
  \*/
  router.post('/register', ...);
  Swagger parsea estos comentarios y genera la UI interactiva.

Paso 10.3: Integrar en Express
En src/app.js:
javascriptconst swaggerDocs = require('./config/swagger');

// Después de definir routes
swaggerDocs(app);

```

**Endpoints generados:**
- `GET /api/v1/docs` - UI de Swagger
- `GET /api/v1/docs.json` - Spec en JSON

---

### Paso 10.4: Usar Swagger UI

**Abrir en navegador:**
```

http://localhost:3000/api/v1/docs

```

**Funcionalidades:**
1. Ver todos los endpoints organizados por tags
2. Ver request/response schemas
3. Probar endpoints directamente
4. Configurar autenticación (botón "Authorize")
5. Ver ejemplos de uso
6. Descargar spec OpenAPI

**Flujo de prueba:**
```

1. Ir a /docs
2. Expandir POST /auth/login
3. Click "Try it out"
4. Editar el body JSON
5. Click "Execute"
6. Ver respuesta con token
7. Click "Authorize" (arriba)
8. Pegar token: Bearer {token}
9. Ahora puedes probar endpoints protegidos

📋 Scripts de package.json
Archivo: package.json
json{
"scripts": {
// Desarrollo
"dev": "nodemon server.js",
"start": "node server.js",

    // Testing
    "test": "jest --coverage",
    "test:watch": "jest --watch",

    // Base de datos
    "db:migrate": "sequelize-cli db:migrate",
    "db:migrate:undo": "sequelize-cli db:migrate:undo",
    "db:seed": "sequelize-cli db:seed:all",
    "db:seed:undo": "sequelize-cli db:seed:undo:all",
    "db:reset": "sequelize-cli db:migrate:undo:all && sequelize-cli db:migrate && sequelize-cli db:seed:all"

}
}

```

**¿Qué hace cada script?**

1. **`npm run dev`**
   - Inicia servidor con nodemon (auto-reload)
   - Para desarrollo

2. **`npm start`**
   - Inicia servidor sin auto-reload
   - Para producción

3. **`npm run db:migrate`**
   - Ejecuta migraciones pendientes
   - Crea/modifica tablas en BD

4. **`npm run db:migrate:undo`**
   - Revierte última migración
   - Ejecuta método `down()`

5. **`npm run db:seed`**
   - Ejecuta todos los seeders
   - Inserta datos de prueba

6. **`npm run db:seed:undo`**
   - Revierte todos los seeders
   - Borra datos de prueba

7. **`npm run db:reset`**
   - Borra todo
   - Recrea tablas
   - Inserta datos de prueba
   - **Útil para empezar desde cero**

8. **`npm test`**
   - Ejecuta tests con Jest
   - Genera reporte de cobertura

---

## 🔄 Flujo Completo de una Petición

### Ejemplo: POST /api/v1/auth/register
```

1. REQUEST
   ↓
   POST http://localhost:3000/api/v1/auth/register
   Body: { email: "test@example.com", password: "Pass123", name: "Test" }
2. EXPRESS MIDDLEWARE CHAIN
   ↓
   helmet() → Agrega headers de seguridad
   ↓
   cors() → Verifica origen permitido
   ↓
   express.json() → Parsea body JSON
   ↓
   morgan() → Log: "POST /api/v1/auth/register 200"
   ↓
   generalLimiter → Verifica límite de requests (100/15min)
3. ROUTE MATCHING
   ↓
   Busca route: /api/v1 → /auth → /register (POST)
4. ROUTE MIDDLEWARES
   ↓
   authLimiter → Verifica límite estricto (5/15min)
   ↓
   registerValidation → Define reglas de validación
   ↓
   validateRequest → Ejecuta validaciones
   Si hay errores → return validationErrorResponse()
5. CONTROLLER
   ↓
   authController.register(req, res, next)
   - Extrae { email, password, name } de req.body
6. SERVICE
   ↓
   authService.register(userData)
7. TRANSACTION WRAPPER
   ↓
   executeWithTransaction(
   userData,
   async (data, transaction) => {
8. MODEL + BD
   ↓
   User.create(data, { transaction })
   ↓
   beforeCreate hook → bcrypt.hash(password)
   ↓
   INSERT INTO "Users" ...
   ↓
   PostgreSQL ejecuta query
9. TOKEN GENERATION
   ↓
   generateToken({ id, email, role })
   ↓
   jwt.sign(payload, JWT_SECRET)
10. RESPONSE
    ↓
    return { user, token }
    },
    'registerUser'
    )
    ↓
    Si éxito → COMMIT
    Si error → ROLLBACK

11. CONTROLLER RESPONSE
    ↓
    successResponse(res, result.data, 'Usuario registrado', 201)
12. RESPONSE JSON
    ↓
    {
    "success": true,
    "message": "Usuario registrado exitosamente",
    "data": {
    "user": {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test",
    "role": "user"
    },
    "token": "eyJhbG..."
    },
    "timestamp": "2025-12-18T20:00:00.000Z"
    }
13. LOGS
    ↓
    logger.info('Usuario registrado', { userId: 'uuid' })
    ↓
    Guardado en logs/combined.log

```

---

## 🗄️ Arquitectura de Capas
```

┌─────────────────────────────────────────┐
│ HTTP REQUEST │
│ POST /api/v1/products │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ ROUTES LAYER │
│ - Define endpoints │
│ - Aplica middlewares │
│ - Conecta con controllers │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ MIDDLEWARES LAYER │
│ - authenticate (JWT) │
│ - authorize (roles) │
│ - rateLimiter │
│ - requestLock │
│ - validators │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ CONTROLLERS LAYER │
│ - Recibe request │
│ - Extrae datos │
│ - Llama a services │
│ - Formatea response │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ SERVICES LAYER │
│ - Lógica de negocio │
│ - Validaciones complejas │
│ - Orquesta operaciones │
│ - Usa transaction wrapper │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ MODELS LAYER │
│ - Sequelize models │
│ - Validaciones de BD │
│ - Hooks (beforeCreate, etc) │
│ - Métodos de instancia │
└─────────────────────────────────────────┘
↓
┌─────────────────────────────────────────┐
│ DATABASE │
│ PostgreSQL │
└─────────────────────────────────────────┘
Separación de responsabilidades:

Routes: Qué endpoints existen
Middlewares: Validaciones, autenticación, seguridad
Controllers: Manejo de HTTP (request/response)
Services: Lógica de negocio
Models: Estructura de datos y validaciones de BD
Utils: Funciones reutilizables

🔒 Características de Seguridad Implementadas

1. Autenticación JWT
   javascript// Token contiene solo: id, email, role
   // Firmado con JWT_SECRET
   // Expira en 24 horas
   // Verificado en cada request protegido
2. Contraseñas Hasheadas
   javascript// bcrypt con salt de 10 rounds
   // Hasheado automático en hooks de Sequelize
   // Método comparePassword() para verificar
3. Rate Limiting
   javascript// General: 100 req/15min
   // Auth: 5 intentos/15min
   // Create: 20 creaciones/hora
   // Previene fuerza bruta y DDoS
4. Request Lock
   javascript// Previene peticiones duplicadas simultáneas
   // Basado en hash de: user + método + ruta + body
   // Timeout configurable
5. Helmet.js
   javascript// Configura headers HTTP seguros:
   // - X-Content-Type-Options: nosniff
   // - X-Frame-Options: DENY
   // - X-XSS-Protection: 1; mode=block
   // - Strict-Transport-Security
6. CORS
   javascript// Origen configurado
   // Métodos permitidos
   // Headers específicos
7. Validaciones Exhaustivas
   javascript// express-validator en cada endpoint
   // Validaciones de formato, tipo, longitud
   // Validaciones asíncronas (unicidad en BD)
8. SQL Injection Protection
   javascript// Sequelize usa prepared statements
   // Parámetros escapados automáticamente
   // No hay concatenación de strings en queries
9. Transacciones
   javascript// Operaciones atómicas
   // ROLLBACK automático en errores
   // Isolation levels configurables
10. Logging
    javascript// Todos los eventos registrados
    // Errores con stack traces
    // IPs y acciones de usuarios
    // Rotación de archivos

📊 Base de Datos
Tablas Creadas

1. Users
   sqlCREATE TABLE "Users" (
   id UUID PRIMARY KEY,
   email VARCHAR(255) UNIQUE NOT NULL,
   password VARCHAR(255) NOT NULL,
   name VARCHAR(100) NOT NULL,
   role VARCHAR(10) CHECK (role IN ('user', 'admin')),
   "isActive" BOOLEAN DEFAULT true,
   "lastLogin" TIMESTAMP,
   "createdAt" TIMESTAMP,
   "updatedAt" TIMESTAMP
   );

CREATE INDEX idx_users_email ON "Users"(email);
CREATE INDEX idx_users_role ON "Users"(role);
CREATE INDEX idx_users_isActive ON "Users"("isActive"); 2. Products
sqlCREATE TABLE "Products" (
id UUID PRIMARY KEY,
name VARCHAR(200) NOT NULL,
description TEXT,
price DECIMAL(10,2) NOT NULL,
stock INTEGER NOT NULL,
category VARCHAR(100),
"isActive" BOOLEAN DEFAULT true,
"createdBy" UUID REFERENCES "Users"(id),
"createdAt" TIMESTAMP,
"updatedAt" TIMESTAMP
);

CREATE INDEX idx_products_name ON "Products"(name);
CREATE INDEX idx_products_category ON "Products"(category);
CREATE INDEX idx_products_isActive ON "Products"("isActive");
CREATE INDEX idx_products_createdBy ON "Products"("createdBy"); 3. SequelizeMeta
sqlCREATE TABLE "SequelizeMeta" (
name VARCHAR(255) PRIMARY KEY
);
-- Guarda qué migraciones se ejecutaron

```

---

### Relaciones
```

Users 1───N Products
└─── createdBy

Un usuario puede crear muchos productos
Un producto es creado por un usuario

```

---

## 🧪 Testing (Pendiente)

**Estructura preparada:**
```

test/
├── unit/
│ ├── utils/
│ │ ├── cryptoHelper.test.js
│ │ ├── jwtHelper.test.js
│ │ └── transactionWrapper.test.js
│ └── services/
│ ├── authService.test.js
│ └── productService.test.js
└── integration/
└── routes/
├── authRoutes.test.js
└── productRoutes.test.js
Framework: Jest + Supertest

📖 Documentación Creada

1. Swagger UI

URL: http://localhost:3000/api/v1/docs
Interactiva
Prueba de endpoints
Autenticación integrada

2. USAGE.md

Guía de uso
Ejemplos con curl
Usuarios de prueba
Códigos HTTP

3. README.md (pendiente)

Descripción del proyecto
Instalación
Configuración
Deployment

🚀 Comandos para Iniciar el Proyecto
Primera vez (setup completo):
bash# 1. Instalar dependencias
npm install

# 2. Configurar .env

cp .env.example .env

# Editar .env con tus credenciales de PostgreSQL

# 3. Crear base de datos (en PostgreSQL)

createdb tu_base_datos

# 4. Ejecutar migraciones

npm run db:migrate

# 5. Insertar datos de prueba

npm run db:seed

# 6. Iniciar servidor

npm run dev
Reiniciar desde cero:
bash# Borra todo y recrea
npm run db:reset

# Inicia servidor

npm run dev
Desarrollo normal:
bash# Inicia con auto-reload
npm run dev

```

---

## 🌐 Endpoints Disponibles

### Auth (Público)
```

POST /api/v1/auth/register
POST /api/v1/auth/login
GET /api/v1/auth/profile (requiere JWT)
PUT /api/v1/auth/profile (requiere JWT)
PUT /api/v1/auth/change-password (requiere JWT)
DELETE /api/v1/auth/account (requiere JWT)

```

### Users (Admin)
```

GET /api/v1/users
GET /api/v1/users/stats
GET /api/v1/users/:id
PUT /api/v1/users/:id/role
PUT /api/v1/users/:id/activate
PUT /api/v1/users/:id/deactivate
DELETE /api/v1/users/:id

```

### Products
```

GET /api/v1/products (público)
GET /api/v1/products/:id (público)
GET /api/v1/products/category/:category (público)
POST /api/v1/products (admin)
PUT /api/v1/products/:id (admin)
PATCH /api/v1/products/:id/stock (admin)
DELETE /api/v1/products/:id (admin)
DELETE /api/v1/products/:id/permanent (admin)
GET /api/v1/products/stats (admin)

```

### Utility
```

GET /api/v1/health
GET /api/v1/docs
GET /api/v1/docs.json

🎓 Conceptos Aprendidos

1. Arquitectura MVC con Services

Separación de capas
Responsabilidad única
Código mantenible

2. ORM (Sequelize)

Modelos vs Migraciones
Hooks
Asociaciones
Transacciones

3. Autenticación y Autorización

JWT
Bcrypt
Roles
Middlewares de auth

4. Validaciones

express-validator
Validaciones síncronas y asíncronas
Sanitización

5. Seguridad

Rate limiting
Request locking
Helmet
CORS
SQL Injection prevention

6. Logging

Winston
Niveles de log
Rotación de archivos

7. Documentación

Swagger/OpenAPI
JSDoc
Markdown

8. Base de Datos

PostgreSQL
Migraciones versionadas
Seeders
Índices

9. Transacciones

ACID
Isolation levels
Rollback explícito
Race conditions

10. Mejores Prácticas

Variables de entorno
Estructura de proyecto
Error handling
Response standardization

✅ Checklist Final

Estructura de proyecto
Configuración de BD
Modelos (User, Product)
Migraciones
Seeders
Utilidades (Logger, ResponseHandler, TransactionWrapper, JWT, Crypto)
Middlewares (Auth, RateLimit, RequestLock, ErrorHandler, Validators)
Validators (Auth, Product, Common)
Services (Auth, User, Product)
Controllers (Auth, User, Product)
Routes (Auth, User, Product)
Swagger Documentation
Health check endpoint
Graceful shutdown
Tests (Jest) - Pendiente
README.md completo - Pendiente
Deployment guide - Pendiente

🎉 ¡Proyecto Completo!
Has creado una API RESTful profesional con:

✅ 20+ endpoints funcionales
✅ Autenticación JWT
✅ Sistema de roles
✅ CRUD completo
✅ Validaciones robustas
✅ Seguridad multi-capa
✅ Logging profesional
✅ Documentación interactiva
✅ Transacciones atómicas
✅ Arquitectura escalable
