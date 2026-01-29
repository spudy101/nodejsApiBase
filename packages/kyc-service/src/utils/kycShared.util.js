'use strict';

/**
 * Utilidades compartidas entre Profile y Person services
 * 
 * IMPORTANTE: Este archivo contiene SOLO funciones puras (sin llamadas a repositories)
 * Las operaciones con BD deben hacerse directamente en los services
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
    // Asegurar al menos un caracter de cada tipo
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Completar el resto de caracteres
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Mezclar caracteres aleatoriamente
    return password.split('').sort(() => Math.random() - 0.5).join('');
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
    const AppError = require('./appError.util');
    
    const isAdmin = role.name.toLowerCase() === 'admin';

    if (isAdmin) {
      // Para admin: validación más flexible
      if (!nationalId || typeof nationalId !== 'string') {
        throw AppError.badRequest('National ID debe ser un texto válido');
      }
      
      const validPattern = /^[a-zA-Z0-9_-]+$/;
      if (!validPattern.test(nationalId)) {
        throw AppError.badRequest('National ID solo puede contener letras, números, guiones y guiones bajos');
      }
    } else {
      // Para usuarios normales: validación estricta
      if (!nationalId || typeof nationalId !== 'string') {
        throw AppError.badRequest('National ID es requerido');
      }
    }

    return true;
  }

  /**
   * Sanitiza email (convierte a lowercase y trim)
   * @param {string} email - Email a sanitizar
   * @returns {string} Email sanitizado
   */
  static sanitizeEmail(email) {
    if (!email || typeof email !== 'string') {
      return email;
    }
    return email.toLowerCase().trim();
  }

  /**
   * Valida formato de email
   * @param {string} email - Email a validar
   * @returns {boolean} true si es válido
   */
  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Valida formato de teléfono (números y opcionalmente +)
   * @param {string} phone - Teléfono a validar
   * @returns {boolean} true si es válido
   */
  static isValidPhone(phone) {
    const phoneRegex = /^\+?[0-9]+$/;
    return phoneRegex.test(phone);
  }

  /**
   * Genera username único basado en timestamp y random
   * @param {string} prefix - Prefijo (ej: 'user', 'admin')
   * @returns {string} Username único
   */
  static generateUniqueUsername(prefix = 'user') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Formatea national ID para eliminación
   * @param {string} nationalId - National ID original
   * @returns {string} National ID formateado para eliminación
   */
  static formatDeletedNationalId(nationalId) {
    const eliminatedDate = Date.now();
    return `eliminated_${eliminatedDate}_${nationalId}`;
  }

  /**
   * Formatea email para eliminación
   * @param {string} email - Email original
   * @returns {string} Email formateado para eliminación
   */
  static formatDeletedEmail(email) {
    const eliminatedDate = Date.now();
    return `eliminated_${eliminatedDate}_${email}`;
  }

  /**
   * Formatea username para eliminación
   * @param {string} username - Username original
   * @returns {string} Username formateado para eliminación
   */
  static formatDeletedUsername(username) {
    const eliminatedDate = Date.now();
    return `eliminated_${eliminatedDate}_${username}`;
  }

  /**
   * Formatea teléfono para eliminación
   * @param {string} phone - Teléfono original
   * @returns {string} Teléfono formateado para eliminación
   */
  static formatDeletedPhone(phone) {
    const eliminatedDate = Date.now();
    return `eliminated_${eliminatedDate}_${phone}`;
  }

  /**
   * Extrae el ID de persona desde un objeto user
   * @param {Object} user - Objeto usuario
   * @returns {string|null} ID de persona
   */
  static extractPersonId(user) {
    return user?.person?.id || user?.person_id || null;
  }

  /**
   * Extrae el nombre completo de una persona
   * @param {Object} person - Objeto persona
   * @returns {string} Nombre completo
   */
  static getFullName(person) {
    if (!person) return 'Usuario';
    const firstName = person.first_name || '';
    const lastName = person.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Usuario';
  }

  /**
   * Construye objeto de cambio para audit log
   * @param {Object} params - Parámetros del cambio
   * @returns {Object} Datos formateados para PersonChangeLog
   */
  static buildChangeLogData(params) {
    const {
      personId,
      changedByPersonId,
      changedByRole,
      changeType,
      previousValue,
      newValue,
      changeReason,
      ipAddress,
      userAgent
    } = params;

    return {
      person_id: personId,
      changed_by_person_id: changedByPersonId,
      changed_by_role: changedByRole,
      change_type: changeType,
      previous_value: previousValue,
      new_value: newValue,
      change_reason: changeReason,
      ip_address: ipAddress,
      user_agent: userAgent
    };
  }

  /**
   * Valida fuerza de contraseña
   * @param {string} password - Contraseña a validar
   * @returns {Object} { valid: boolean, message: string, strength: string }
   */
  static validatePasswordStrength(password) {
    if (!password || password.length < 8) {
      return {
        valid: false,
        message: 'La contraseña debe tener al menos 8 caracteres',
        strength: 'weak'
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const criteriasMet = [hasUppercase, hasLowercase, hasNumber, hasSymbol].filter(Boolean).length;

    if (criteriasMet < 3) {
      return {
        valid: false,
        message: 'La contraseña debe contener mayúsculas, minúsculas, números y símbolos',
        strength: 'weak'
      };
    }

    if (criteriasMet === 3) {
      return {
        valid: true,
        message: 'Contraseña válida',
        strength: 'medium'
      };
    }

    return {
      valid: true,
      message: 'Contraseña segura',
      strength: 'strong'
    };
  }
}

module.exports = KycSharedUtil;