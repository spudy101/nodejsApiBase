'use strict';

const { body } = require('express-validator');

class KycSocialNetworkValidator {

  /**
   * Validation for adding a social network
   * POST /<admin>o<client>/api/kyc/social-networks
   */
  static addSocialNetwork() {
    return [
      body('social_network_provider_id')
        .notEmpty().withMessage('El ID del proveedor de red social es requerido')
        .isUUID().withMessage('El social_network_provider_id debe ser un UUID válido'),
      
      body('username_handle')
        .notEmpty().withMessage('El nombre de usuario/handle es requerido')
        .isString().withMessage('El nombre de usuario debe ser una cadena de texto')
        .isLength({ min: 1, max: 100 }).withMessage('El nombre de usuario debe tener entre 1 y 100 caracteres')
        .trim(),
      
      body('profile_url')
        .optional()
        .isURL().withMessage('Debe proporcionar una URL válida')
        .isLength({ max: 255 }).withMessage('La URL no puede exceder 255 caracteres')
    ];
  }

  /**
   * Validation for updating a social network
   * PUT /<admin>o<client>/api/kyc/social-networks
   */
  static updateSocialNetwork() {
    return [
      body('person_social_network_id')
        .notEmpty().withMessage('El ID de la red social es requerido')
        .isUUID().withMessage('El person_social_network_id debe ser un UUID válido'),
      
      body('username_handle')
        .optional()
        .isString().withMessage('El nombre de usuario debe ser una cadena de texto')
        .isLength({ min: 1, max: 100 }).withMessage('El nombre de usuario debe tener entre 1 y 100 caracteres')
        .trim(),
      
      body('profile_url')
        .optional()
        .custom((value) => {
          if (value === null || value === undefined || value === '') {
            return true;
          }
          const urlRegex = /^https?:\/\/.+/;
          if (!urlRegex.test(value)) {
            throw new Error('Debe proporcionar una URL válida');
          }
          if (value.length > 255) {
            throw new Error('La URL no puede exceder 255 caracteres');
          }
          return true;
        })
    ];
  }

  /**
   * Validation for deleting a social network
   * DELETE /<admin>o<client>/api/kyc/social-networks
   */
  static deleteSocialNetwork() {
    return [
      body('person_social_network_id')
        .notEmpty().withMessage('El ID de la red social es requerido')
        .isUUID().withMessage('El person_social_network_id debe ser un UUID válido')
    ];
  }
}

module.exports = KycSocialNetworkValidator;