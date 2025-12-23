/**
 * Centralizar todos los paths
 */

const authPaths = require('./auth.paths');
const productPaths = require('./products.paths');
// const orderPaths = require('./orders.paths');
// const paymentPaths = require('./payments.paths');

const getAllPaths = () => {
  return {
    ...authPaths,
    ...productPaths,
    // ...orderPaths,
    // ...paymentPaths
  };
};

module.exports = getAllPaths;