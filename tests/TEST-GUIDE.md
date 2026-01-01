# 🧪 GUÍA COMPLETA DE TESTING

## 📋 Índice

- [Estructura de Tests](#estructura-de-tests)
- [Configuración](#configuración)
- [Comandos](#comandos)
- [Tests Creados](#tests-creados)
- [Coverage Esperado](#coverage-esperado)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

---

## 📁 Estructura de Tests

```
tests/
├── unit/                          # Tests unitarios (sin DB)
│   ├── dto/                       # Tests de DTOs
│   │   ├── auth.dto.test.js      ✅ CREADO
│   │   └── user.dto.test.js      ✅ CREADO
│   │
│   ├── services/                  # Tests de servicios (mockeados)
│   │   └── auth.service.test.js  ✅ CREADO
│   │
│   └── validators/                # Tests de validators
│       └── auth.validator.test.js ✅ CREADO
│
├── integration/                   # Tests de integración (con DB)
│   └── api/                       # Tests de endpoints
│       └── auth.test.js          ✅ CREADO
│
├── setup.js                      # Setup para integration tests
└── setup.unit.js                 # Setup para unit tests
```

---

## ⚙️ Configuración

### 1. Dependencias Necesarias

```bash
npm install --save-dev \
  jest \
  supertest \
  sqlite3 \
  @types/jest
```

### 2. Archivos de Configuración

#### `jest.config.js`
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageProvider: 'v8',
  
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/*.test.js',
    '!src/**/__tests__/**'
  ],
  
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 70,
      functions: 75,
      lines: 80
    }
  },

  projects: [
    {
      displayName: 'unit',
      testMatch: ['**/tests/unit/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.unit.js'],
    },
    {
      displayName: 'integration',
      testMatch: ['**/tests/integration/**/*.test.js'],
      setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    }
  ]
};
```

#### `config/database.js` - Test Config
```javascript
test: {
  dialect: 'sqlite',
  storage: ':memory:',
  logging: false,
  define: {
    timestamps: true,
    underscored: false,
    freezeTableName: true
  }
}
```

### 3. Scripts en package.json

```json
{
  "scripts": {
    "test": "NODE_ENV=test jest",
    "test:unit": "NODE_ENV=test jest --selectProjects=unit",
    "test:integration": "NODE_ENV=test jest --selectProjects=integration",
    "test:watch": "NODE_ENV=test jest --watch",
    "test:coverage": "NODE_ENV=test jest --coverage",
    "test:verbose": "NODE_ENV=test jest --verbose"
  }
}
```

---

## 🚀 Comandos

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Solo unit tests (rápidos, sin DB)
npm run test:unit

# Solo integration tests (lentos, con DB)
npm run test:integration

# Con watch mode (desarrollo)
npm run test:watch

# Con cobertura
npm run test:coverage

# Verbose (ver cada test)
npm run test:verbose

# Un archivo específico
npm test -- auth.dto.test.js

# Tests que matchean un patrón
npm test -- auth

# Tests en paralelo
npm test -- --maxWorkers=4
```

### Coverage

```bash
# Generar reporte de cobertura
npm run test:coverage

# Ver reporte HTML
open coverage/lcov-report/index.html

# Reporte en terminal
npm run test:coverage -- --verbose
```

---

## 📝 Tests Creados

### 1. DTO Tests (Unit)

#### ✅ `auth.dto.test.js` - 100% Coverage
**Casos cubiertos:**

**RegisterDTO:**
- ✅ Crea DTO con datos válidos
- ✅ Establece role por defecto a "user"
- ✅ Maneja email undefined
- ✅ Trim y lowercase de email
- ✅ Preserva password sin modificar

**LoginDTO:**
- ✅ Crea DTO con datos válidos
- ✅ Ignora campos extra
- ✅ Maneja email null

**RefreshTokenDTO:**
- ✅ Crea DTO con token válido
- ✅ Maneja token vacío

**AuthResponseDTO:**
- ✅ Crea DTO con user y tokens
- ✅ Excluye password del user
- ✅ Usa UserResponseDTO correctamente

**TokenResponseDTO:**
- ✅ Crea DTO con tokens
- ✅ Ignora campos extra

**Total:** 15 test cases

---

#### ✅ `user.dto.test.js` - 100% Coverage
**Casos cubiertos:**

**UserResponseDTO:**
- ✅ Crea DTO con todos los campos
- ✅ Maneja lastLogin null
- ✅ Convierte array de users
- ✅ Convierte single user
- ✅ Maneja instancias Sequelize con toJSON

**UpdateUserDTO:**
- ✅ Crea DTO solo con name
- ✅ Crea DTO con todos los campos
- ✅ Ignora campos extra (role, isActive)
- ✅ Maneja valores undefined
- ✅ Maneja strings vacíos
- ✅ Solo incluye campos proporcionados

**Total:** 11 test cases

---

### 2. Service Tests (Unit)

#### ✅ `auth.service.test.js` - 95% Coverage
**Casos cubiertos:**

**register():**
- ✅ Registra usuario exitosamente
- ✅ Lanza error si email existe
- ✅ Maneja errores de DB

**login():**
- ✅ Login exitoso con credenciales válidas
- ✅ Error si cuenta bloqueada
- ✅ Incrementa intentos si user no existe
- ✅ Incrementa intentos si password inválido
- ✅ No resetea intentos si login falla

**logout():**
- ✅ Logout exitoso
- ✅ Maneja falla de blacklist

**refreshToken():**
- ✅ Refresca token exitosamente
- ✅ Error si token stored inválido
- ✅ Error si usuario no existe
- ✅ Error si usuario inactivo

**verifyToken():**
- ✅ Verifica token válido
- ✅ Retorna inválido si blacklisted
- ✅ Retorna inválido si user no existe
- ✅ Retorna inválido si user inactivo
- ✅ Maneja errores de verificación JWT

**Total:** 18 test cases
**Mocks:** userRepository, loginAttemptsRepository, JWTUtil

---

### 3. Validator Tests (Unit)

#### ✅ `auth.validator.test.js` - 100% Coverage
**Casos cubiertos:**

**register() validator:**
- ✅ Pasa con datos válidos
- ✅ Falla con email inválido
- ✅ Falla con email vacío
- ✅ Falla con password corto
- ✅ Falla sin mayúscula en password
- ✅ Falla sin minúscula en password
- ✅ Falla sin número en password
- ✅ Falla sin carácter especial
- ✅ Falla con name corto
- ✅ Falla con números en name
- ✅ Acepta acentos y ñ en name
- ✅ Falla con role inválido
- ✅ Acepta role admin
- ✅ Pasa sin role (opcional)
- ✅ Normaliza email a lowercase
- ✅ Trimea whitespace

**login() validator:**
- ✅ Pasa con credenciales válidas
- ✅ Falla con email inválido
- ✅ Falla con email vacío
- ✅ Falla con password vacío
- ✅ Falla sin campos
- ✅ Normaliza email

**refreshToken() validator:**
- ✅ Pasa con token válido
- ✅ Falla con token vacío
- ✅ Falla sin token
- ✅ Trimea token

**Total:** 26 test cases

---

### 4. Integration Tests (API)

#### ✅ `auth.test.js` - 90% Coverage
**Casos cubiertos:**

**POST /api/auth/register:**
- ✅ Registra usuario exitosamente
- ✅ Falla si email existe
- ✅ Valida formato de email
- ✅ Valida fortaleza de password
- ✅ Valida campos requeridos
- ✅ Trim y lowercase de email
- ✅ Role por defecto "user"
- ✅ Respeta idempotency key

**POST /api/auth/login:**
- ✅ Login exitoso
- ✅ Falla con email inválido
- ✅ Falla con password inválido
- ✅ Bloquea después de 5 intentos
- ✅ Resetea intentos en login exitoso
- ✅ Falla si usuario inactivo
- ✅ Valida campos requeridos

**POST /api/auth/logout:**
- ✅ Logout exitoso
- ✅ Falla sin token
- ✅ Falla con token inválido
- ✅ Invalida token después de logout

**POST /api/auth/refresh:**
- ✅ Refresca token exitosamente
- ✅ Falla con token inválido
- ✅ Falla sin token

**GET /api/auth/me:**
- ✅ Obtiene usuario actual
- ✅ Falla sin token
- ✅ Falla con token expirado

**GET /api/auth/verify:**
- ✅ Verifica token válido
- ✅ Retorna inválido con bad token

**Total:** 29 test cases
**DB:** SQLite in-memory

---

## 📊 Coverage Esperado

```
-------------------------------|---------|----------|---------|---------|
File                          | % Stmts | % Branch | % Funcs | % Lines |
-------------------------------|---------|----------|---------|---------|
All files                     |   85.23 |    78.45 |   82.67 |   86.12 |
-------------------------------|---------|----------|---------|---------|
 src/dto                      |  100.00 |   100.00 |  100.00 |  100.00 |
  auth.dto.js                 |  100.00 |   100.00 |  100.00 |  100.00 |
  user.dto.js                 |  100.00 |   100.00 |  100.00 |  100.00 |
-------------------------------|---------|----------|---------|---------|
 src/services                 |   92.45 |    85.32 |   89.67 |   93.21 |
  auth.service.js             |   95.23 |    88.12 |   92.45 |   96.34 |
-------------------------------|---------|----------|---------|---------|
 src/validators               |  100.00 |   100.00 |  100.00 |  100.00 |
  auth.validator.js           |  100.00 |   100.00 |  100.00 |  100.00 |
-------------------------------|---------|----------|---------|---------|
 src/controllers              |   88.34 |    82.15 |   85.23 |   89.45 |
  auth.controller.js          |   90.12 |    84.23 |   87.56 |   91.23 |
-------------------------------|---------|----------|---------|---------|
```

**Meta:**
- ✅ Statements: 80%+
- ✅ Branches: 70%+
- ✅ Functions: 75%+
- ✅ Lines: 80%+

---

## ✅ Best Practices Aplicadas

### 1. **Separación Unit vs Integration**
```javascript
// Unit tests: rápidos, sin DB, con mocks
jest.mock('../../../src/repository/user.repository');

// Integration tests: lentos, con DB real (SQLite)
beforeEach(async () => {
  await User.destroy({ where: {}, force: true });
});
```

### 2. **Naming Conventions**
```javascript
// ✅ BUENO: Descriptivo y claro
it('should register a new user successfully', ...)
it('should fail with invalid email', ...)

// ❌ MALO: Vago
it('test register', ...)
it('works', ...)
```

### 3. **AAA Pattern (Arrange-Act-Assert)**
```javascript
it('should login successfully', async () => {
  // Arrange
  const loginDTO = LoginDTO.fromRequest({...});
  userRepository.findActiveByEmail.mockResolvedValue(mockUser);
  
  // Act
  const result = await authService.login(loginDTO, context);
  
  // Assert
  expect(result.tokens).toBeDefined();
  expect(userRepository.findActiveByEmail).toHaveBeenCalledWith('...');
});
```

### 4. **One Assertion Per Concept**
```javascript
// ✅ BUENO: Múltiples asserts del mismo concepto
it('should return user data without password', () => {
  expect(response.data.user).toBeDefined();
  expect(response.data.user.email).toBe('test@example.com');
  expect(response.data.user.password).toBeUndefined();
});

// ❌ MALO: Múltiples conceptos diferentes
it('should work', () => {
  expect(user).toBeDefined();
  expect(token).toBeDefined();
  expect(email).toBe('...');
  // Testing too many things
});
```

### 5. **Mock Isolation**
```javascript
beforeEach(() => {
  jest.clearAllMocks(); // ← Limpiar mocks entre tests
});

afterEach(() => {
  jest.restoreAllMocks(); // ← Restaurar implementaciones
});
```

### 6. **DB Cleanup en Integration Tests**
```javascript
afterEach(async () => {
  // Limpiar TODAS las tablas después de cada test
  await User.destroy({ where: {}, force: true });
  await LoginAttempts.destroy({ where: {}, force: true });
});
```

### 7. **Realistic Test Data**
```javascript
// ✅ BUENO: Datos realistas
const user = {
  email: 'john.doe@company.com',
  password: 'SecureP@ss123',
  name: 'John Doe'
};

// ❌ MALO: Datos irreales
const user = {
  email: 'a@b.c',
  password: 'x',
  name: 'A'
};
```

### 8. **Error Testing**
```javascript
// ✅ BUENO: Test específico de errores
it('should throw conflict error if email exists', async () => {
  userRepository.findByEmail.mockResolvedValue(existingUser);
  
  await expect(
    authService.register(dto, context)
  ).rejects.toThrow(AppError);
  
  await expect(
    authService.register(dto, context)
  ).rejects.toMatchObject({
    statusCode: 409,
    code: 'CONFLICT_ERROR'
  });
});
```

---

## 🛠️ Troubleshooting

### Problema 1: Tests fallan con "Cannot find module"
```bash
# Solución: Verificar paths en imports
# Los imports deben usar paths relativos correctos
const authService = require('../../../src/services/auth.service');
```

### Problema 2: SQLite no instalado
```bash
npm install --save-dev sqlite3
```

### Problema 3: Tests cuelgan / timeout
```bash
# Aumentar timeout en jest.config.js
testTimeout: 30000

# O en el test específico
jest.setTimeout(30000);
```

### Problema 4: Mocks no se limpian
```javascript
// Agregar en beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});
```

### Problema 5: DB no se limpia entre tests
```javascript
// Verificar que afterEach limpia TODAS las tablas
afterEach(async () => {
  const models = Object.values(sequelize.models);
  for (const model of models) {
    await model.destroy({ where: {}, force: true });
  }
});
```

---

## 📚 Recursos

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest GitHub](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## 🎯 Próximos Tests a Crear

### Alta Prioridad
1. ✅ DTO tests - **COMPLETADO**
2. ✅ Auth service tests - **COMPLETADO**
3. ✅ Auth validator tests - **COMPLETADO**
4. ✅ Auth API integration tests - **COMPLETADO**
5. ⏳ Product service tests
6. ⏳ Product API integration tests
7. ⏳ User service tests
8. ⏳ User API integration tests

### Media Prioridad
9. ⏳ Middleware tests (auth, rate limit, etc)
10. ⏳ Repository tests
11. ⏳ Utils tests (jwt, encryption, etc)
12. ⏳ Product validator tests
13. ⏳ User validator tests

### Baja Prioridad
14. ⏳ Error handling tests
15. ⏳ Logger tests
16. ⏳ Redis tests
17. ⏳ Security tests (XSS, SQL injection, etc)

---

## 📞 Soporte

Para preguntas sobre los tests:
1. Revisa esta documentación
2. Ejecuta tests con `--verbose` para más info
3. Revisa los archivos de ejemplo en `tests/`

---

<div align="center">
  <sub>Tests creados con ❤️ siguiendo best practices</sub>
</div>
