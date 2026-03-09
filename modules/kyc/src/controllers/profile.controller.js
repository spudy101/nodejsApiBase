'use strict';

const ProfileService   = require('../services/profile.service');
const ApiResponse      = require('../../../../shared/utils/app-response.util');
const { asyncHandler } = require('../../../../shared/middlewares/error.middleware');

class ProfileController {

  /** GET /profile */
  getProfile = asyncHandler(async (req, res) => {
    const result = await ProfileService.getProfile(req.user.userId);
    return ApiResponse.success(res, 'Perfil obtenido exitosamente', result);
  });

  /** GET /profile/full */
  getFullProfile = asyncHandler(async (req, res) => {
    const result = await ProfileService.getFullProfile(req.user.userId);
    return ApiResponse.success(res, 'Perfil completo obtenido exitosamente', result);
  });

  /** PATCH /profile */
  updateProfile = asyncHandler(async (req, res) => {
    const result = await ProfileService.updateProfile(req.body, req.user.userId);
    return ApiResponse.success(res, 'Perfil actualizado exitosamente', result);
  });

  /** PUT /profile/email */
  updateEmail = asyncHandler(async (req, res) => {
    const result = await ProfileService.updateEmail(req.body, {
      userId:          req.user.userId,
      cognitoUsername: req.user.cognitoUsername,
    });
    return ApiResponse.success(res, 'Email actualizado exitosamente', result);
  });

  /** PUT /profile/phone */
  updatePhone = asyncHandler(async (req, res) => {
    const result = await ProfileService.updatePhone(req.body, req.user.userId);
    return ApiResponse.success(res, 'Teléfono actualizado exitosamente', result);
  });

  /** PUT /profile/password */
  updatePassword = asyncHandler(async (req, res) => {
    await ProfileService.updatePassword(req.body, {
      userId:          req.user.userId,
      cognitoUsername: req.user.cognitoUsername,
    });
    return ApiResponse.success(res, 'Contraseña actualizada exitosamente');
  });

  /** PUT /profile/national-id */
  updateNationalId = asyncHandler(async (req, res) => {
    const result = await ProfileService.updateNationalId(req.body, {
      userId:          req.user.userId,
      cognitoUsername: req.user.cognitoUsername,
    });
    return ApiResponse.success(res, 'Documento actualizado exitosamente', result);
  });

  /** DELETE /profile */
  deleteAccount = asyncHandler(async (req, res) => {
    await ProfileService.deleteAccount(req.body, {
      userId:          req.user.userId,
      cognitoUsername: req.user.cognitoUsername,
    });
    return ApiResponse.noContent(res);
  });
}

module.exports = new ProfileController();