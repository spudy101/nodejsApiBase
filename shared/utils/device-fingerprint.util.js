'use strict';

const crypto = require('crypto');

/**
 * DeviceFingerprintUtil
 *
 * Genera un hash estable del dispositivo basado SOLO en User-Agent normalizado.
 * Sin IP — así el fingerprint no cambia si el usuario cambia de red.
 *
 * También genera un nombre legible para mostrar al usuario.
 */
class DeviceFingerprintUtil {

  /**
   * Genera SHA-256 del User-Agent normalizado.
   * Estable entre sesiones del mismo navegador/dispositivo.
   *
   * @param {string} userAgent
   * @returns {string} hex de 64 caracteres
   */
  static generateHash(userAgent) {
    const normalized = DeviceFingerprintUtil._normalize(userAgent);
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Genera un nombre legible desde el User-Agent.
   * Ejemplos: "Chrome en Windows", "Safari en iPhone", "Firefox en macOS"
   *
   * @param {string} userAgent
   * @returns {string}
   */
  static generateDeviceName(userAgent) {
    if (!userAgent) return 'Dispositivo desconocido';

    const browser = DeviceFingerprintUtil._detectBrowser(userAgent);
    const os      = DeviceFingerprintUtil._detectOS(userAgent);

    if (browser && os) return `${browser} en ${os}`;
    if (browser)       return browser;
    if (os)            return os;
    return 'Dispositivo desconocido';
  }

  /**
   * Genera hash desde el objeto req de Express.
   * Atajo para usar en middlewares.
   *
   * @param {Object} req - Express request
   * @returns {string}
   */
  static generateFromRequest(req) {
    const userAgent = req.headers?.['user-agent'] || '';
    return DeviceFingerprintUtil.generateHash(userAgent);
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /**
   * Normaliza el User-Agent eliminando ruido de versiones de build
   * para que el hash sea estable entre actualizaciones menores.
   * @private
   */
  static _normalize(userAgent) {
    if (!userAgent) return 'unknown';

    return userAgent
      .toLowerCase()
      .trim()
      // Eliminar versiones de build específicas (ej: Chrome/120.0.6099.129 → Chrome/120)
      .replace(/(\w+)\/[\d]+\.[\d]+\.[\d]+\.[\d]+/g, '$1')
      // Eliminar espacios múltiples
      .replace(/\s+/g, ' ');
  }

  /** @private */
  static _detectBrowser(ua) {
    const u = ua.toLowerCase();

    if (u.includes('edg/') || u.includes('edge/'))  return 'Edge';
    if (u.includes('opr/') || u.includes('opera'))  return 'Opera';
    if (u.includes('chrome') && !u.includes('chromium')) return 'Chrome';
    if (u.includes('chromium'))                     return 'Chromium';
    if (u.includes('firefox') || u.includes('fxios')) return 'Firefox';
    if (u.includes('safari') && !u.includes('chrome')) return 'Safari';
    if (u.includes('msie') || u.includes('trident')) return 'Internet Explorer';
    if (u.includes('samsungbrowser'))               return 'Samsung Browser';

    return null;
  }

  /** @private */
  static _detectOS(ua) {
    const u = ua.toLowerCase();

    if (u.includes('iphone'))                       return 'iPhone';
    if (u.includes('ipad'))                         return 'iPad';
    if (u.includes('android'))                      return 'Android';
    if (u.includes('windows nt'))                   return 'Windows';
    if (u.includes('macintosh') || u.includes('mac os x')) return 'macOS';
    if (u.includes('linux'))                        return 'Linux';
    if (u.includes('cros'))                         return 'ChromeOS';

    return null;
  }
}

module.exports = DeviceFingerprintUtil;