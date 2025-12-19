const { Sequelize } = require('sequelize');
const logger = require('./logger');

/**
 * Ejecuta lógica de negocio dentro de una transacción con manejo robusto
 * @param {Object} inputData - Datos de entrada
 * @param {Function} businessLogic - Función async (data, transaction, sequelize) => result
 * @param {String} operationName - Nombre de la operación para logs
 * @param {Object} options - Opciones adicionales
 * @returns {Object} { success, data, message, executionTime }
 */
const executeWithTransaction = async (
  inputData,
  businessLogic,
  operationName,
  options = {}
) => {
  const {
    sequelize,
    isolationLevel = Sequelize.Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    logInput = false // No loguear datos sensibles por defecto
  } = options;

  if (!sequelize) {
    throw new Error('Se requiere instancia de Sequelize');
  }

  const transaction = await sequelize.transaction({ isolationLevel });
  const startTime = Date.now();
  const transactionId = transaction.id;

  try {
    logger.info(`[${operationName}] Iniciando transacción`, {
      transactionId,
      ...(logInput && { input: inputData })
    });

    const result = await businessLogic(inputData, transaction, sequelize);

    // Verificar rollback explícito
    if (result && result._rollback) {
      await transaction.rollback();

      const executionTime = Date.now() - startTime;
      logger.warn(`[${operationName}] Rollback solicitado`, {
        transactionId,
        executionTime: `${executionTime}ms`,
        reason: result.message || 'Rollback explícito'
      });

      // Eliminar el flag interno antes de devolver
      delete result._rollback;

      return {
        success: false,
        data: result.data || null,
        message: result.message || `${operationName} requirió rollback`,
        executionTime
      };
    }

    await transaction.commit();

    const executionTime = Date.now() - startTime;
    logger.info(`[${operationName}] Transacción completada`, {
      transactionId,
      executionTime: `${executionTime}ms`
    });

    return {
      success: true,
      data: result,
      message: `${operationName} completada exitosamente`,
      executionTime
    };

  } catch (error) {
    await transaction.rollback();

    const executionTime = Date.now() - startTime;

    logger.error(`[${operationName}] Error en transacción`, {
      transactionId,
      error: error.message,
      errorCode: error.code,
      executionTime: `${executionTime}ms`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });

    // Lanzar error para que el controller lo maneje
    throw {
      message: error.message || `Error en ${operationName}`,
      code: error.code || 'TRANSACTION_ERROR',
      originalError: error
    };
  }
};

/**
 * Ejecuta consultas sin transacción (para operaciones de solo lectura)
 * @param {Function} queryLogic - Función async (sequelize) => result
 * @param {String} operationName - Nombre de la operación
 * @param {Object} sequelize - Instancia de Sequelize
 * @returns {Object} { success, data, message, executionTime }
 */
const executeQuery = async (queryLogic, operationName, sequelize) => {
  if (!sequelize) {
    throw new Error('Se requiere instancia de Sequelize');
  }

  const startTime = Date.now();

  try {
    logger.debug(`[${operationName}] Ejecutando consulta`);

    const result = await queryLogic(sequelize);

    const executionTime = Date.now() - startTime;
    logger.debug(`[${operationName}] Consulta completada`, {
      executionTime: `${executionTime}ms`
    });

    return {
      success: true,
      data: result,
      message: `${operationName} completada exitosamente`,
      executionTime
    };

  } catch (error) {
    const executionTime = Date.now() - startTime;

    logger.error(`[${operationName}] Error en consulta`, {
      error: error.message,
      executionTime: `${executionTime}ms`,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });

    throw {
      message: error.message || `Error en ${operationName}`,
      code: error.code || 'QUERY_ERROR',
      originalError: error
    };
  }
};

module.exports = {
  executeWithTransaction,
  executeQuery
};