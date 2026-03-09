'use strict';

const EventEmitter  = require('events');
const { logger }    = require('../../../../shared/utils/logger.util');

class NotificationEmitter extends EventEmitter {
  constructor() {
    super();
    this.useRedis          = false;
    this.subscriberClient  = null;
    this.publisherClient   = null;
    this.CHANNEL_NAME      = 'notification:count-updated';
    this.initialized       = false;
  }

  /**
   * Inicializa Redis Pub/Sub — llamar DESPUÉS de conectar Redis
   */
  async initialize() {
    if (this.initialized) return;

    try {
      const redisClient = require('../../../shared/utils/redis.util');

      if (redisClient.isAvailable()) {
        this.publisherClient  = redisClient.getClient();
        this.subscriberClient = redisClient.getClient().duplicate();

        await this.subscriberClient.connect();

        await this.subscriberClient.subscribe(this.CHANNEL_NAME, (message) => {
          try {
            const data = JSON.parse(message);
            super.emit('count-updated', data);
          } catch (error) {
            logger.error('Error parsing Redis pub/sub message', { error: error.message });
          }
        });

        this.useRedis    = true;
        this.initialized = true;
        logger.info('✓ NotificationEmitter: Redis Pub/Sub habilitado');
      } else {
        logger.info('⚠ NotificationEmitter: Redis no disponible, usando EventEmitter local');
        this.initialized = true;
      }
    } catch (error) {
      logger.error('Error initializing Redis Pub/Sub, using local EventEmitter', {
        error: error.message,
      });
      this.useRedis    = false;
      this.initialized = true;
    }
  }

  /**
   * Emite evento de actualización de contador
   */
  emit(event, data) {
    if (event !== 'count-updated') {
      return super.emit(event, data);
    }

    try {
      if (this.useRedis && this.publisherClient) {
        this.publisherClient.publish(this.CHANNEL_NAME, JSON.stringify(data));
        logger.debug('Event published to Redis', { event, userId: data.userId });
      } else {
        super.emit(event, data);
        logger.debug('Event emitted locally', { event, userId: data.userId });
      }
    } catch (error) {
      logger.error('Error emitting notification event', { error: error.message });
      super.emit(event, data);
    }
  }

  /**
   * Cleanup al cerrar la aplicación
   */
  async close() {
    try {
      if (this.subscriberClient) {
        await this.subscriberClient.unsubscribe(this.CHANNEL_NAME);
        await this.subscriberClient.quit();
      }
      logger.info('NotificationEmitter closed successfully');
    } catch (error) {
      logger.error('Error closing NotificationEmitter', { error: error.message });
    }
  }
}

// Singleton
const notificationEmitter = new NotificationEmitter();

// Cleanup on process exit
process.on('SIGTERM', async () => { await notificationEmitter.close(); });
process.on('SIGINT',  async () => { await notificationEmitter.close(); });

module.exports = notificationEmitter;