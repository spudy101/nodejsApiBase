// shared/src/utils/logger.util.js
const winston = require('winston');
const path = require('path');
const DailyRotateFile = require('winston-daily-rotate-file');

class LoggerUtil {
  constructor() {
    this.logger = null;
    this.initialized = false;
  }

  /**
   * Inicializa el logger con la configuración del servicio
   * @param {object} loggingConfig - { level }
   * @param {object} serverConfig - { nodeEnv }
   */
  initialize(loggingConfig, serverConfig) {
    if (this.initialized) {
      throw new Error('LoggerUtil already initialized');
    }

    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...metadata }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(metadata).length > 0) {
          msg += ` ${JSON.stringify(metadata)}`;
        }
        return msg;
      })
    );

    const transports = [
      new winston.transports.Console({
        format: consoleFormat,
        level: loggingConfig.level || 'info' 
      }),
      new DailyRotateFile({
        filename: path.join('logs', 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
      }),
      new DailyRotateFile({
        filename: path.join('logs', 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '14d',
        zippedArchive: true
      })
    ];

    this.logger = winston.createLogger({
      level: loggingConfig.level || 'info',
      format: logFormat,
      transports,
      exitOnError: false
    });

    this.serverConfig = serverConfig;
    this.initialized = true;
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new Error('LoggerUtil not initialized. Call initialize(config.logging, config.server) in server.js first.');
    }
  }

  info(message, metadata = {}) {
    this._checkInitialized();
    this.logger.info(message, metadata);
  }

  warn(message, metadata = {}) {
    this._checkInitialized();
    this.logger.warn(message, metadata);
  }

  error(message, metadata = {}) {
    this._checkInitialized();
    this.logger.error(message, metadata);
  }

  debug(message, metadata = {}) {
    this._checkInitialized();
    this.logger.debug(message, metadata);
  }

  /**
   * Simplificado: Una sola función de auditoría
   */
  logAudit(action, userId, details = {}, context = {}) {
    this._checkInitialized();
    this.logger.info('AUDIT_LOG', {
      action,
      userId,
      timestamp: new Date().toISOString(),
      details,
      ...context
    });
  }

  /**
   * HTTP logger con Correlation ID
   */
  httpLogger(req, res, next) {
    this._checkInitialized();
    
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      const logData = {
        correlationId: req.correlationId,
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?.userId
      };

      if (res.statusCode >= 400) {
        this.logger.warn('HTTP Request', logData);
      } else {
        this.logger.info('HTTP Request', logData);
      }
    });

    next();
  }
}

const loggerUtil = new LoggerUtil();

module.exports = {
  logger: loggerUtil,
  logAudit: (action, userId, details, context) => loggerUtil.logAudit(action, userId, details, context),
  httpLogger: (req, res, next) => loggerUtil.httpLogger(req, res, next)
};