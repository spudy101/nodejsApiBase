// src/utils/deviceFingerprint.js
const EncryptionUtil = require('./encryption');

class DeviceFingerprint {
  /**
   * Genera un fingerprint único basado en User-Agent e IP
   */
  static generate(req) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    
    // 🔥 Usa EncryptionUtil en lugar de crypto directo
    return EncryptionUtil.generateHash(`${userAgent}:${ip}`, 'sha256').substring(0, 16);
  }

  /**
   * Parse metadata del User-Agent
   */
  static parseUserAgent(userAgent) {
    // Detecta browser
    let browser = 'Unknown';
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';

    // Detecta OS
    let os = 'Unknown';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iOS') || userAgent.includes('iPhone')) os = 'iOS';

    return { browser, os };
  }
}

module.exports = DeviceFingerprint;