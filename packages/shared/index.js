// packages/shared/index.js - Main entry point for @abundbank/shared

// ========== Config ==========
const { createSequelizeInstance } = require('./src/config/sequelizeFactory');

// ========== Constants ==========
const constants = require('./src/constants');

// ========== Repositories ==========
const BaseRepository = require('./src/repositories/base.repository');

// ========== Utils (Singletons - ya inicializados) ==========
const AppError = require('./src/utils/appError.util');
const ApiResponse = require('./src/utils/response.util');
const cognitoUtil = require('./src/utils/cognito.util'); // ← instancia singleton
const encryptionUtil = require('./src/utils/encryption.util'); // ← instancia singleton
const DeviceFingerprint = require('./src/utils/deviceFingerprint.util');
const s3Util = require('./src/utils/S3.util'); // ← instancia singleton
const ValidatorUtil = require('./src/utils/validators.util');
const PaginationHelper = require('./src/utils/paginationHelper.util');
const { logger, logAudit, httpLogger } = require('./src/utils/logger.util');
const { sanitizeAuditBody, sanitizeErrorContext, _instance: sanitizeUtil } = require('./src/utils/sanitizeAuditBody.util');
const redisClient = require('./src/utils/redis.util');
const localCache = require('./src/utils/cache.util');
const SessionCacheUtil = require('./src/utils/sessionCache.util');
const {
  parseIntEnv,
  parseBoolEnv,
  getRequiredEnv,
  getOptionalEnv,
  validateConfig
} = require('./src/utils/configValidator.util');

// ========== Middlewares ==========
const AuthMiddleware = require('./src/middlewares/auth.middleware');
const AuditMiddleware = require('./src/middlewares/audit.middleware');
const CorrelationMiddleware = require('./src/middlewares/correlation.middleware');
const ErrorMiddleware = require('./src/middlewares/error.middleware');
const RateLimitMiddleware = require('./src/middlewares/rateLimit.middleware');
const RequestLockMiddleware = require('./src/middlewares/requestLock.middleware');
const SecurityMiddleware = require('./src/middlewares/security.middleware');
const SessionMiddleware = require('./src/middlewares/session.middleware');
const UploadMiddleware = require('./src/middlewares/upload.middleware');

// ========== Exports ==========
module.exports = {
  // Config
  createSequelizeInstance,
  
  // Constants
  ...constants,

  BaseRepository,
  
  // Utils (instancias singleton con minúscula para consistencia)
  AppError,
  ApiResponse,
  cognitoUtil,        // ← minúscula (instancia)
  encryptionUtil,     // ← minúscula (instancia)
  s3Util,             // ← minúscula (instancia)
  DeviceFingerprint,
  ValidatorUtil,
  PaginationHelper,
  logger,             // ← ya es instancia
  logAudit,
  httpLogger,
  sanitizeAuditBody,
  sanitizeErrorContext,
  sanitizeUtil,       // ← agregado para usar en server.js
  redisClient,        // ← ya es instancia
  localCache,         // ← ya es instancia
  SessionCacheUtil,

  // Config validators
  parseIntEnv,
  parseBoolEnv,
  getRequiredEnv,
  getOptionalEnv,
  validateConfig,
  
  // Middlewares
  AuthMiddleware,
  AuditMiddleware,
  CorrelationMiddleware,
  ErrorMiddleware,
  RateLimitMiddleware,
  RequestLockMiddleware,
  SecurityMiddleware,
  SessionMiddleware,
  UploadMiddleware
};