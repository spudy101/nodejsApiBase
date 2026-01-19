// config/swagger/schemas/index.js
/**
 * Centralizar todos los schemas
 * Exporta los schemas de forma plana para que puedan ser referenciados con $ref
 */

const authClientSchemas = require('./authClient.schemas');
const verificationClientSchemas = require('./verificationClient.schemas');

const kycPersonAdminSchemas = require('./kycPersonAdmin.schemas');
const notificationTypeAdminSchemas = require('./notificationTypeAdmin.schemas');

const authSharedSchemas = require('./authShared.schemas');
const coreMaintainersSharedSchemas = require('./coreMaintainersShared.schemas');
const kycMFASharedSchemas = require('./kycMFAShared.schemas');
const kycNotificationPreferenceSharedSchemas = require('./kycNotificationPreferenceShared.schemas');
const kycProfileSharedSchemas = require('./kycProfileShared.schemas');
const notificationSharedSchemas = require('./notificationShared.schemas');

const commonSchemas = require('./common.schemas');

const getAllSchemas = () => {
  return {
    // Common Schemas
    ...commonSchemas,
    
    // Client Schemas
    ...authClientSchemas,
    ...verificationClientSchemas,

    // Shared Schemas
    ...authSharedSchemas,
    ...coreMaintainersSharedSchemas,
    ...kycMFASharedSchemas,
    ...kycNotificationPreferenceSharedSchemas,
    ...kycProfileSharedSchemas,
    ...notificationSharedSchemas,

    // Admin Schemas
    ...kycPersonAdminSchemas,
    ...notificationTypeAdminSchemas
  };
};

module.exports = getAllSchemas;