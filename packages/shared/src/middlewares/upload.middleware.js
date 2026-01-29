'use strict';

const multer = require('multer');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');

class UploadMiddleware {
  static storage = multer.memoryStorage();

  static ALLOWED_IMAGE_TYPES = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/gif', 
    'image/webp'
  ];
  
  static ALLOWED_DOC_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];

  static MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
  static MAX_DOCUMENT_SIZE = 50 * 1024 * 1024; // 50MB

  /**
   * Filtro genérico que acepta imágenes y documentos
   */
  static fileFilter = (req, file, cb) => {
    const allowedTypes = [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_DOC_TYPES];
    
    if (allowedTypes.includes(file.mimetype)) {
      logger.debug('Archivo aceptado', {
        fieldname: file.fieldname,
        mimetype: file.mimetype,
        originalname: file.originalname
      });
      return cb(null, true);
    }

    logger.warn('Tipo de archivo rechazado', {
      fieldname: file.fieldname,
      mimetype: file.mimetype,
      originalname: file.originalname
    });

    cb(
      AppError.badRequest(
        `Tipo de archivo no permitido: ${file.mimetype}`,
        { field: file.fieldname, allowedTypes }
      ),
      false
    );
  };

  /**
   * Middleware para múltiples campos
   * @param {Array} fields - Array de objetos { name, maxCount }
   * @param {Object} options - Opciones de configuración
   * @param {number} options.maxFileSize - Tamaño máximo por archivo
   * @param {boolean} options.imagesOnly - Solo permitir imágenes
   */
  static uploadFields(fields, options = {}) {
    const {
      maxFileSize = this.MAX_IMAGE_SIZE,
      imagesOnly = false
    } = options;

    // Filtro específico para solo imágenes si se requiere
    const fileFilter = imagesOnly 
      ? (req, file, cb) => {
          if (this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            return cb(null, true);
          }
          cb(AppError.badRequest(`Solo se permiten imágenes en ${file.fieldname}`), false);
        }
      : this.fileFilter;

    return multer({
      storage: this.storage,
      fileFilter,
      limits: {
        fileSize: maxFileSize,
        files: fields.reduce((sum, field) => sum + field.maxCount, 0),
      },
    }).fields(fields);
  }

  /**
   * Manejo de errores de multer
   */
  static handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      const errorMessages = {
        'LIMIT_FILE_SIZE': 'El archivo excede el tamaño máximo permitido',
        'LIMIT_FILE_COUNT': 'Se excedió el número máximo de archivos',
        'LIMIT_UNEXPECTED_FILE': `Campo de archivo inesperado: ${err.field}`,
        'LIMIT_PART_COUNT': 'Demasiadas partes en la solicitud',
        'LIMIT_FIELD_KEY': 'Nombre de campo demasiado largo',
        'LIMIT_FIELD_VALUE': 'Valor de campo demasiado largo',
        'LIMIT_FIELD_COUNT': 'Demasiados campos en la solicitud',
      };

      logger.warn('Error de Multer', {
        code: err.code,
        field: err.field,
        message: err.message,
      });

      return next(
        AppError.badRequest(
          errorMessages[err.code] || `Error al procesar archivo: ${err.message}`,
          { code: err.code, field: err.field }
        )
      );
    }

    if (err.isOperational) {
      return next(err);
    }

    logger.error('Error desconocido en upload', { 
      error: err.message,
      stack: err.stack 
    });
    
    next(AppError.internal('Error al procesar archivos'));
  };
}

module.exports = UploadMiddleware;