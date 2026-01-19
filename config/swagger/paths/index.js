// config/swagger/paths/index.js
/**
 * Centralizar todos los paths
 * Combina todos los paths de diferentes módulos en un solo objeto
 */

const authClientPaths = require('./authClient.paths');
const verificationClientPaths = require('./verificationClient.paths');

const getAllPaths = () => {
  return {
    ...authClientPaths,
    ...verificationClientPaths
    // Aquí puedes agregar más paths de otros módulos:
    // ...authSharedPaths,
    // ...adminPaths,
    // etc.
  };
};

module.exports = getAllPaths;