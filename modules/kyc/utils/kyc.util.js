'use strict';

const userChangeLogRepository = require('../repositories/user-change-log.repository');

/**
 * Utilidades compartidas entre KycPerson y KycProfile services
 * 
 * Este archivo contiene funciones comunes que son utilizadas por:
 * - kycPerson_service.js (operaciones de admin sobre usuarios)
 * - kycProfile_service.js (operaciones del usuario sobre su propio perfil)
 */
class KycSharedUtil {

  /**
   * Genera contraseña segura aleatoria
   * Formato: 12 caracteres con mayúsculas, minúsculas, números y símbolos
   * 
   * @returns {string} Contraseña generada
   */
  static generateSecurePassword() {
    const length = 12;
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    const allChars = uppercase + lowercase + numbers + symbols;
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Registra cambio en audit log
   * 
   * @param {Object} logData - Datos del cambio
   * @param {Object} options - Opciones (transaction, etc.)
   * @returns {Promise<Object>} Log creado
   */
  static async logChange(logData, options = {}) {
    return await userChangeLogRepository.createLog(logData, options);
  }

  /**
   * Valida national_id según el rol
   * 
   * @param {string} nationalId - National ID a validar
   * @param {Object} role - Objeto del rol con propiedad 'name'
   * @throws {AppError} Si la validación falla
   * @returns {boolean} true si es válido
   */
  static validateNationalIdByRole(nationalId, role) {
    const AppError = require('../../../shared/utils/appError.util');
    
    const isAdmin = role.name.toLowerCase() === 'admin';

    if (isAdmin) {
      if (!nationalId || typeof nationalId !== 'string') {
        throw AppError.badRequest('National ID debe ser un texto válido');
      }
      
      const validPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validPattern.test(nationalId)) {
        throw AppError.badRequest('National ID solo puede contener letras, números, guiones y guiones bajos');
      }
    } else {
      if (!nationalId || typeof nationalId !== 'string') {
        throw AppError.badRequest('National ID es requerido');
      }
    }

    return true;
  }
}

module.exports = KycSharedUtil;