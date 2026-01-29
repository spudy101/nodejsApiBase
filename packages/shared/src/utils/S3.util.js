// shared/src/utils/S3.util.js
'use strict';

const { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } = require('@aws-sdk/client-s3');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('./logger.util');
const AppError = require('./appError.util');

class S3Util {
  constructor() {
    this.s3Client = null;
    this.bucketName = null;
    this.region = null;
    this.initialized = false;
  }

  /**
   * Inicializa S3 con la configuración del servicio
   * @param {object} awsConfig - { region, accessKeyId, secretAccessKey, s3BucketName }
   */
  initialize(awsConfig) {
    if (this.initialized) {
      throw new Error('S3Util already initialized');
    }

    if (!awsConfig?.region || !awsConfig?.accessKeyId || !awsConfig?.secretAccessKey) {
      throw new Error('AWS config (region, accessKeyId, secretAccessKey) is required');
    }

    if (!awsConfig?.s3BucketName) {
      throw new Error('S3 bucket name is required');
    }

    this.s3Client = new S3Client({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });

    this.bucketName = awsConfig.s3BucketName;
    this.region = awsConfig.region;
    this.initialized = true;
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new Error('S3Util not initialized. Call initialize(config.aws) in server.js first.');
    }
  }

  /**
   * Sube una imagen a S3 con compresión
   * @param {Buffer|string} imageBuffer - Buffer de la imagen o base64
   * @param {string} folder - Carpeta dentro del bucket (ej: 'publications', 'profiles')
   * @param {Object} options - Opciones de compresión
   * @returns {Promise<string>} URL de la imagen subida
   */
  async uploadImage(imageBuffer, folder = 'images', options = {}) {
    this._checkInitialized();
    
    try {
      // Validar que se proporcione un buffer
      if (!imageBuffer) {
        throw AppError.badRequest('No se proporcionó ninguna imagen');
      }

      // Convertir base64 a buffer si es necesario
      let buffer = imageBuffer;
      if (typeof imageBuffer === 'string' && imageBuffer.includes('base64')) {
        const base64Data = imageBuffer.split(',')[1] || imageBuffer;
        buffer = Buffer.from(base64Data, 'base64');
      }

      // Configuración por defecto para compresión
      const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 80,
        format = 'jpeg',
      } = options;

      // Comprimir la imagen usando sharp
      const compressedBuffer = await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .toFormat(format, { quality })
        .toBuffer();

      // Generar nombre único
      const fileName = `archivos_empresas/${folder}/${uuidv4()}.${format}`;

      // Subir a S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: compressedBuffer,
        ContentType: `image/${format}`,
      });

      await this.s3Client.send(command);

      const imageUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${fileName}`;

      logger.info('✅ Imagen subida a S3', {
        fileName,
        originalSize: buffer.length,
        compressedSize: compressedBuffer.length,
        reduction: `${(((buffer.length - compressedBuffer.length) / buffer.length) * 100).toFixed(2)}%`,
      });

      return imageUrl;
    } catch (error) {
      logger.error('❌ Error subiendo imagen a S3', {
        error: error.message,
        folder,
      });

      // Si ya es un AppError, re-lanzarlo
      if (error.isOperational) {
        throw error;
      }

      // Errores específicos de Sharp
      if (error.message.includes('Input buffer') || error.message.includes('unsupported')) {
        throw AppError.badRequest('Formato de imagen no válido', { originalError: error.message });
      }

      // Errores de S3
      if (error.name === 'NoSuchBucket') {
        throw AppError.serverError('Configuración de almacenamiento incorrecta');
      }

      if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
        throw AppError.serverError('Error de autenticación con el servicio de almacenamiento');
      }

      // Error genérico
      throw AppError.internal('Error al subir la imagen', { originalError: error.message });
    }
  }

  /**
   * Sube un documento a S3 sin compresión
   * @param {Buffer|string} fileBuffer - Buffer del archivo o base64
   * @param {string} fileName - Nombre original del archivo
   * @param {string} folder - Carpeta dentro del bucket
   * @param {string} contentType - Tipo MIME del archivo
   * @returns {Promise<string>} URL del documento subido
   */
  async uploadDocument(fileBuffer, fileName, folder = 'documents', contentType = 'application/pdf') {
    this._checkInitialized();
    
    try {
      // Validaciones
      if (!fileBuffer) {
        throw AppError.badRequest('No se proporcionó ningún archivo');
      }

      if (!fileName) {
        throw AppError.badRequest('Nombre de archivo requerido');
      }

      // Convertir base64 a buffer si es necesario
      let buffer = fileBuffer;
      if (typeof fileBuffer === 'string' && fileBuffer.includes('base64')) {
        const base64Data = fileBuffer.split(',')[1] || fileBuffer;
        buffer = Buffer.from(base64Data, 'base64');
      }

      // Extraer extensión del archivo
      const extension = fileName.split('.').pop();
      const uniqueFileName = `archivos_empresas/${folder}/${uuidv4()}.${extension}`;

      // Subir a S3
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uniqueFileName,
        Body: buffer,
        ContentType: contentType,
      });

      await this.s3Client.send(command);

      const documentUrl = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${uniqueFileName}`;

      logger.info('✅ Documento subido a S3', {
        fileName: uniqueFileName,
        originalFileName: fileName,
        size: buffer.length,
        contentType,
      });

      return documentUrl;
    } catch (error) {
      logger.error('❌ Error subiendo documento a S3', {
        error: error.message,
        fileName,
        folder,
      });

      // Si ya es un AppError, re-lanzarlo
      if (error.isOperational) {
        throw error;
      }

      // Errores de S3
      if (error.name === 'NoSuchBucket') {
        throw AppError.serverError('Configuración de almacenamiento incorrecta');
      }

      if (error.name === 'InvalidAccessKeyId' || error.name === 'SignatureDoesNotMatch') {
        throw AppError.serverError('Error de autenticación con el servicio de almacenamiento');
      }

      // Error genérico
      throw AppError.internal('Error al subir el documento', { originalError: error.message });
    }
  }

  /**
   * Elimina un archivo de S3
   * @param {string} fileUrl - URL completa del archivo a eliminar
   * @returns {Promise<boolean>} True si se eliminó correctamente
   */
  async deleteFile(fileUrl) {
    this._checkInitialized();
    
    try {
      if (!fileUrl) {
        throw AppError.badRequest('URL de archivo requerida');
      }

      // Extraer el key del archivo desde la URL
      const urlParts = fileUrl.split('.amazonaws.com/');
      if (urlParts.length < 2) {
        throw AppError.badRequest('URL de S3 inválida', { url: fileUrl });
      }

      const fileKey = urlParts[1];

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      logger.info('✅ Archivo eliminado de S3', { fileKey });

      return true;
    } catch (error) {
      logger.error('❌ Error eliminando archivo de S3', {
        error: error.message,
        fileUrl,
      });

      // Si ya es un AppError, re-lanzarlo
      if (error.isOperational) {
        throw error;
      }

      // Errores de S3
      if (error.name === 'NoSuchBucket') {
        throw AppError.serverError('Configuración de almacenamiento incorrecta');
      }

      if (error.name === 'NoSuchKey') {
        throw AppError.notFound('Archivo no encontrado en el almacenamiento');
      }

      // Error genérico
      throw AppError.internal('Error al eliminar el archivo', { originalError: error.message });
    }
  }

  /**
   * Verifica si un archivo existe en S3
   * @param {string} fileUrl - URL completa del archivo
   * @returns {Promise<boolean>} True si existe
   */
  async fileExists(fileUrl) {
    this._checkInitialized();
    
    try {
      if (!fileUrl) {
        return false;
      }

      const urlParts = fileUrl.split('.amazonaws.com/');
      if (urlParts.length < 2) {
        return false;
      }

      const fileKey = urlParts[1];

      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.name === 'NoSuchKey') {
        return false;
      }

      logger.error('❌ Error verificando existencia de archivo en S3', {
        error: error.message,
        fileUrl,
      });

      // Para fileExists, no lanzar error, solo retornar false
      return false;
    }
  }

  /**
   * Sube múltiples imágenes a S3
   * @param {Array} images - Array de buffers o base64
   * @param {string} folder - Carpeta de destino
   * @param {Object} options - Opciones de compresión
   * @returns {Promise<Array<string>>} Array de URLs
   */
  async uploadMultipleImages(images, folder = 'images', options = {}) {
    this._checkInitialized();
    
    try {
      if (!Array.isArray(images) || images.length === 0) {
        throw AppError.badRequest('Se requiere un array de imágenes');
      }

      const uploadPromises = images
        .filter((img) => img) // Filtrar nulls/undefined
        .map((image) => this.uploadImage(image, folder, options));

      const urls = await Promise.all(uploadPromises);

      logger.info('✅ Múltiples imágenes subidas a S3', {
        count: urls.length,
        folder,
      });

      return urls;
    } catch (error) {
      logger.error('❌ Error subiendo múltiples imágenes a S3', {
        error: error.message,
        folder,
      });

      // Si ya es un AppError, re-lanzarlo
      if (error.isOperational) {
        throw error;
      }

      throw AppError.internal('Error al subir las imágenes', { originalError: error.message });
    }
  }

  /**
   * Elimina múltiples archivos de S3
   * @param {Array<string>} fileUrls - Array de URLs a eliminar
   * @returns {Promise<boolean>} True si todos se eliminaron
   */
  async deleteMultipleFiles(fileUrls) {
    this._checkInitialized();
    
    try {
      if (!Array.isArray(fileUrls) || fileUrls.length === 0) {
        throw AppError.badRequest('Se requiere un array de URLs');
      }

      const deletePromises = fileUrls
        .filter((url) => url) // Filtrar nulls/undefined
        .map((url) => this.deleteFile(url));

      await Promise.all(deletePromises);

      logger.info('✅ Múltiples archivos eliminados de S3', {
        count: fileUrls.length,
      });

      return true;
    } catch (error) {
      logger.error('❌ Error eliminando múltiples archivos de S3', {
        error: error.message,
      });

      // Si ya es un AppError, re-lanzarlo
      if (error.isOperational) {
        throw error;
      }

      throw AppError.internal('Error al eliminar los archivos', { originalError: error.message });
    }
  }
}

// Exportar singleton
module.exports = new S3Util();