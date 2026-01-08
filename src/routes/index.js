// src/routes/index.js
const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const productRoutes = require('./product.routes');
const redisClient = require('../utils/redis');
const db = require('../models');

// 🔥 Health check mejorado (valida servicios críticos)
router.get('/health', async (req, res) => {
  const healthCheck = {
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      redis: 'unknown'
    }
  };

  // Check Redis
  healthCheck.services.redis = redisClient.isAvailable() ? 'connected' : 'disconnected';

  // Check Database
  try {
    await db.sequelize.authenticate();
    healthCheck.services.database = 'connected';
  } catch (error) {
    healthCheck.services.database = 'disconnected';
    healthCheck.status = 'degraded';
    healthCheck.success = false;
  }

  // 🔥 Retorna 503 si algún servicio crítico falla
  const statusCode = healthCheck.success ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// API routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);

module.exports = router;