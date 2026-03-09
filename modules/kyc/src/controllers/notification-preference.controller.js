'use strict';

const NotificationPreferenceService = require('../services/notification-preference.service');
const ApiResponse      = require('../../../../shared/utils/app-response.util');
const { asyncHandler } = require('../../../../shared/middlewares/error.middleware');

class NotificationPreferenceController {

  /** GET /notification-preferences */
  getPreferences = asyncHandler(async (req, res) => {
    const result = await NotificationPreferenceService.getPreferences(req.user.userId);
    return ApiResponse.success(res, 'Preferencias de notificación obtenidas exitosamente', result);
  });

  /** PATCH /notification-preferences/global */
  updateGlobalPreference = asyncHandler(async (req, res) => {
    const result = await NotificationPreferenceService.updateGlobalPreference(
      req.body,
      req.user.userId
    );
    return ApiResponse.success(res, 'Preferencia global actualizada exitosamente', result);
  });

  /** PATCH /notification-preferences/type */
  updateTypePreference = asyncHandler(async (req, res) => {
    const result = await NotificationPreferenceService.updateTypePreference(
      req.body,
      req.user.userId
    );
    return ApiResponse.success(res, 'Preferencia de tipo actualizada exitosamente', result);
  });

  /** DELETE /notification-preferences/type/:notificationTypeCode */
  deleteTypePreference = asyncHandler(async (req, res) => {
    await NotificationPreferenceService.deleteTypePreference(
      req.params.notificationTypeCode,
      req.user.userId
    );
    return ApiResponse.noContent(res);
  });

  /** PATCH /notification-preferences/batch */
  batchUpdateTypePreferences = asyncHandler(async (req, res) => {
    const result = await NotificationPreferenceService.batchUpdateTypePreferences(
      req.body,
      req.user.userId
    );
    return ApiResponse.success(res, 'Preferencias actualizadas exitosamente', result);
  });
}

module.exports = new NotificationPreferenceController();
