'use strict';

const KycNotificationPreferenceService = require('../services/kycNotificationPreference.service');
const ApiResponse = require('../utils/response.util');

class KycNotificationPreferenceController {
  /**
   * Get all notification preferences
   * GET /kyc-notification-preference/preferences
   */
  async getPreferences(req, res, next) {
    try {
      const result = await KycNotificationPreferenceService.getPreferences(req.user);
      return ApiResponse.success(res, 'Preferencias de notificación obtenidas exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update global notification preference
   * PUT /kyc-notification-preference/global
   */
  async updateGlobalPreference(req, res, next) {
    try {
      const result = await KycNotificationPreferenceService.updateGlobalPreference(req.body, req.user);
      return ApiResponse.success(res, 'Preferencia global actualizada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update notification type preference
   * PUT /kyc-notification-preference/type
   */
  async updateTypePreference(req, res, next) {
    try {
      const result = await KycNotificationPreferenceService.updateTypePreference(req.body, req.user);
      return ApiResponse.success(res, 'Preferencia de tipo actualizada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete notification type preference
   * DELETE /kyc-notification-preference/type
   */
  async deleteTypePreference(req, res, next) {
    try {
      const result = await KycNotificationPreferenceService.deleteTypePreference(req.body, req.user);
      return ApiResponse.success(res, 'Preferencia de tipo eliminada exitosamente', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch update notification type preferences
   * PUT /kyc-notification-preference/batch
   */
  async batchUpdateTypePreferences(req, res, next) {
    try {
      const result = await KycNotificationPreferenceService.batchUpdateTypePreferences(req.body, req.user);
      return ApiResponse.success(res, 'Preferencias actualizadas exitosamente en lote', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new KycNotificationPreferenceController();