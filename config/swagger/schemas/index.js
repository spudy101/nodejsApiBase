/**
 * Centralizar todos los schemas
 */

const commonSchemas = require('./common');
const authSchemas = require('./auth');
const productSchemas = require('./products');
// const orderSchemas = require('./orders');
// const paymentSchemas = require('./payments');

const getAllSchemas = () => {
  return {
    ...commonSchemas,
    ...authSchemas,
    ...productSchemas,
    // ...orderSchemas,
    // ...paymentSchemas
  };
};

module.exports = getAllSchemas;