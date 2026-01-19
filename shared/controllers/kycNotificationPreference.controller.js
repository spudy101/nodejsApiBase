'use strict';

const KycNotificationPreferenceService = require('../services/kycNotificationPreference.service');
const ApiResponse = require('../utils/response.util');

class KycNotificationPreferenceController {
  /**
   * Get all notification preferences
   * GET /<admin>o<client>/api/kyc/notification-preferences
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
   * PUT /<admin>o<client>/api/kyc/notification-preferences/global
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
   * PUT /<admin>o<client>/api/kyc/notification-preferences/type
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
   * DELETE /<admin>o<client>/api/kyc/notification-preferences/type
   */
  async deleteTypePreference(req, res, next) {
    try {
      await KycNotificationPreferenceService.deleteTypePreference(req.body, req.user);
      return ApiResponse.success(res, 'Preferencia de tipo eliminada exitosamente');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Batch update notification type preferences
   * PUT /<admin>o<client>/api/kyc/notification-preferences/batch
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