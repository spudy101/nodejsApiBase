const db = require('../models');

/**
 * Estructura estándar para servicios con transacciones y rollback
 * @param {Object} inputData - Datos de entrada
 * @param {Function} businessLogic - Lógica de negocio a ejecutar
 * @param {string} operationName - Nombre de la operación para logs
 * @returns {Object} Resultado estandarizado
 */
const executeWithTransaction = async (inputData, businessLogic, operationName) => {
  const transaction = await db.sequelize.transaction();
  const startTime = Date.now();
  
  try {
    console.log(`[${operationName}] Iniciando operación`, {
      timestamp: new Date().toISOString(),
      input: inputData
    });
    
    // Ejecutar lógica de negocio dentro de la transacción
    const result = await businessLogic(inputData, transaction);
    
    // Commit si todo sale bien
    await transaction.commit();
    
    const executionTime = Date.now() - startTime;
    console.log(`[${operationName}] Operación completada exitosamente`, {
      timestamp: new Date().toISOString(),
      executionTime: `${executionTime}ms`,
      result: result
    });
    
    return {
      success: true,
      data: result,
      message: `${operationName} completada exitosamente`,
      executionTime
    };
  } catch (error) {
    // Rollback automático en caso de error
    await transaction.rollback();
    
    const executionTime = Date.now() - startTime;
    console.error(`[${operationName}] Error en operación`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      input: inputData,
      executionTime: `${executionTime}ms`
    });
    
    return {
      success: false,
      data: null,
      message: error.message || `Error en ${operationName}`,
      errorCode: error.code || 'INTERNAL_ERROR',
      executionTime
    };
  }
};

/**
 * Estructura estándar para consultas de solo lectura (SELECT)
 * @param {Object} queryParams - Parámetros de la consulta
 * @param {Function} queryLogic - Lógica de consulta a ejecutar
 * @param {string} queryName - Nombre de la consulta para logs
 * @returns {Object} Resultado estandarizado
 */
const executeQuery = async (queryParams, queryLogic, queryName) => {
  const startTime = Date.now();
  
  try {
    console.log(`[${queryName}] Iniciando consulta`, {
      timestamp: new Date().toISOString(),
      params: queryParams
    });
    
    // Ejecutar lógica de consulta (sin transacción)
    const result = await queryLogic(queryParams);
    
    const executionTime = Date.now() - startTime;
    console.log(`[${queryName}] Consulta completada exitosamente`, {
      timestamp: new Date().toISOString(),
      executionTime: `${executionTime}ms`,
      resultCount: Array.isArray(result) ? result.length : (result ? 1 : 0),
      hasData: !!result
    });
    
    return {
      success: true,
      data: result,
      message: `${queryName} completada exitosamente`,
      count: Array.isArray(result) ? result.length : (result ? 1 : 0),
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`[${queryName}] Error en consulta`, {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      params: queryParams,
      executionTime: `${executionTime}ms`
    });
    
    return {
      success: false,
      data: null,
      message: error.message || `Error en ${queryName}`,
      errorCode: error.code || 'QUERY_ERROR',
      count: 0,
      executionTime
    };
  }
};

/**
 * Función helper para validar conexión antes de operaciones críticas
 * @returns {boolean} true si la conexión está activa
 */
const validateConnection = async () => {
  try {
    await db.sequelize.authenticate();
    return true;
  } catch (error) {
    console.error('❌ Error de conexión a BD:', error.message);
    return false;
  }
};

/**
 * Función para obtener estadísticas del pool de conexiones
 * @returns {Object} Estadísticas del pool
 */
const getPoolStats = () => {
  try {
    const pool = db.sequelize.connectionManager?.pool;
    if (pool) {
      return {
        size: pool.size || 0,
        available: pool.available || 0,
        using: pool.using || 0,
        waiting: pool.pending || 0
      };
    }
    return { message: 'Pool no disponible' };
  } catch (error) {
    return { error: 'Error obteniendo estadísticas del pool' };
  }
};

module.exports = {
  executeWithTransaction,
  executeQuery,
  validateConnection,
  getPoolStats
};