// src/services/user.service.js
const userRepository = require('../repository/user.repository');
const AppError = require('../utils/AppError');
const { UserResponseDTO } = require('../dto/user.dto');
const { logger, logAudit } = require('../utils/logger');
const { ERRORS } = require('../constants/messages');
const { AUDIT_ACTIONS } = require('../constants');

class UserService {
  /**
   * Get user profile
   * @param {string} userId - ID del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {UserResponseDTO}
   */
  async getProfile(userId, auditContext) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw AppError.notFound(ERRORS.USER_NOT_FOUND);
    }

    // Audit log
    logAudit(AUDIT_ACTIONS.USER_VIEW_PROFILE, userId, {}, auditContext);

    logger.info('User profile retrieved', { userId });

    return UserResponseDTO.fromJSON(user.toJSON());
  }

  /**
   * Update user profile
   * @param {string} userId - ID del usuario
   * @param {UpdateProfileDTO} updateDTO - Datos a actualizar
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {UserResponseDTO}
   */
  async updateProfile(userId, updateDTO, auditContext) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw AppError.notFound(ERRORS.USER_NOT_FOUND);
    }

    // Validación de negocio: If updating email, check if new email already exists
    if (updateDTO.email && updateDTO.email !== user.email) {
      const emailExists = await userRepository.emailExistsExcluding(updateDTO.email, userId);
      
      if (emailExists) {
        throw AppError.conflict(ERRORS.USER_ALREADY_EXISTS);
      }
    }

    // Validación de negocio: If updating password, verify current password
    if (updateDTO.password) {
      if (!updateDTO.currentPassword) {
        throw AppError.badRequest('La contraseña actual es requerida');
      }

      const isPasswordValid = await user.comparePassword(updateDTO.currentPassword);

      if (!isPasswordValid) {
        throw AppError.unauthorized('Contraseña actual incorrecta');
      }

      // Remove currentPassword from update data (no debe guardarse)
      delete updateDTO.currentPassword;
    }

    // Update user
    const updatedUser = await userRepository.update(userId, updateDTO);

    // Audit log
    logAudit(AUDIT_ACTIONS.USER_UPDATE_PROFILE, userId, {
      updatedFields: Object.keys(updateDTO)
    }, auditContext);

    logger.info('User profile updated', {
      userId,
      updatedFields: Object.keys(updateDTO)
    });

    return UserResponseDTO.fromJSON(updatedUser.toJSON());
  }

  /**
   * Get user by ID (admin only)
   * @param {string} userId - ID del usuario a buscar
   * @param {string} requesterId - ID del usuario que solicita
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {UserResponseDTO}
   */
  async getUserById(userId, requesterId, auditContext) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw AppError.notFound(ERRORS.USER_NOT_FOUND);
    }

    logger.info('User retrieved by admin', {
      userId,
      requesterId
    });

    return UserResponseDTO.fromJSON(user.toJSON());
  }

  /**
   * Deactivate user account
   * @param {string} userId - ID del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Object} Mensaje de confirmación
   */
  async deactivateAccount(userId, auditContext) {
    const user = await userRepository.deactivate(userId);

    if (!user) {
      throw AppError.notFound(ERRORS.USER_NOT_FOUND);
    }

    logger.info('User account deactivated', { userId });

    return { message: 'Cuenta desactivada exitosamente' };
  }
}

module.exports = new UserService();
