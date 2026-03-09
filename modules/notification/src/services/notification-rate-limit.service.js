'use strict';

const { logger } = require('../../../../shared/utils/logger.util');

class NotificationRateLimitService {

  /**
   * Rate limiting para SNS
   * @param {Object} cache - Redis cache instance
   */
  async checkSNSRateLimit(cache) {
    const now    = Date.now();
    const minute = Math.floor(now / 60000);
    const key    = `aws_sns_rate:${minute}`;

    const current = await cache.get(key);
    const count   = current ? parseInt(current) : 0;

    // Límite: 300 mensajes por minuto
    if (count >= 300) {
      const waitTime = 60000 - (now % 60000);
      logger.warn(`Rate limit SNS alcanzado, esperando ${waitTime}ms`);
      await this._sleep(waitTime);
    }

    await cache.set(key, count + 100, 120); // TTL 2 minutos
  }

  /**
   * Rate limiting para SES
   * @param {Object} cache - Redis cache instance
   */
  async checkSESRateLimit(cache) {
    const now    = Date.now();
    const minute = Math.floor(now / 60000);
    const key    = `aws_ses_rate:${minute}`;

    const current = await cache.get(key);
    const count   = current ? parseInt(current) : 0;

    // Límite: 200 emails por minuto
    if (count >= 200) {
      const waitTime = 60000 - (now % 60000);
      logger.warn(`Rate limit SES alcanzado, esperando ${waitTime}ms`);
      await this._sleep(waitTime);
    }

    await cache.set(key, count + 50, 120); // TTL 2 minutos
  }

  /** @private */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = new NotificationRateLimitService();