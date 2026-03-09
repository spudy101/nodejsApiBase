'use strict';

const PersonService    = require('../services/person.service');
const ApiResponse      = require('../../../../shared/utils/app-response.util');
const { asyncHandler } = require('../../../../shared/middlewares/error.middleware');

class PersonController {

  /** GET /persons */
  list = asyncHandler(async (req, res) => {
    const result = await PersonService.list(req.query);
    return ApiResponse.success(res, 'Usuarios obtenidos exitosamente', result.data, result.metadata);
  });

  /** GET /persons/:userId */
  getById = asyncHandler(async (req, res) => {
    const result = await PersonService.getById(req.params.userId);
    return ApiResponse.success(res, 'Usuario obtenido exitosamente', result);
  });

  /** POST /persons */
  create = asyncHandler(async (req, res) => {
    const result = await PersonService.create(req.body, {
      adminUserId:    req.user.userId,
      adminFirstName: req.user.firstName,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });
    return ApiResponse.created(res, 'Usuario creado exitosamente', result);
  });

  /** PATCH /persons/:userId/activate */
  activate = asyncHandler(async (req, res) => {
    const result = await PersonService.activate(req.params.userId, {
      adminUserId:    req.user.userId,
      adminFirstName: req.user.firstName,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });
    return ApiResponse.success(res, 'Usuario activado exitosamente', result);
  });

  /** PATCH /persons/:userId/deactivate */
  deactivate = asyncHandler(async (req, res) => {
    const result = await PersonService.deactivate(req.params.userId, {
      adminUserId:    req.user.userId,
      adminFirstName: req.user.firstName,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });
    return ApiResponse.success(res, 'Usuario desactivado exitosamente', result);
  });

  /** POST /persons/:userId/reset-password */
  resetPassword = asyncHandler(async (req, res) => {
    const result = await PersonService.resetPassword(req.params.userId, {
      adminUserId:    req.user.userId,
      adminFirstName: req.user.firstName,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });
    return ApiResponse.success(res, 'Contraseña reseteada exitosamente', result);
  });

  /** PUT /persons/:userId/email */
  changeEmail = asyncHandler(async (req, res) => {
    const result = await PersonService.changeEmail(
      req.params.userId,
      req.body.newEmail,
      {
        adminUserId:    req.user.userId,
        adminFirstName: req.user.firstName,
        ipAddress:      req.ip,
        userAgent:      req.headers['user-agent'],
      }
    );
    return ApiResponse.success(res, 'Email actualizado exitosamente', result);
  });

  /** PUT /persons/:userId/national-id */
  changeNationalId = asyncHandler(async (req, res) => {
    const result = await PersonService.changeNationalId(
      req.params.userId,
      req.body.newNationalId,
      {
        adminUserId:    req.user.userId,
        adminFirstName: req.user.firstName,
        ipAddress:      req.ip,
        userAgent:      req.headers['user-agent'],
      }
    );
    return ApiResponse.success(res, 'Documento actualizado exitosamente', result);
  });

  /** PATCH /persons/:userId/disable-mfa */
  disableMFA = asyncHandler(async (req, res) => {
    const result = await PersonService.disableMFA(req.params.userId, {
      adminUserId:    req.user.userId,
      adminFirstName: req.user.firstName,
      ipAddress:      req.ip,
      userAgent:      req.headers['user-agent'],
    });
    return ApiResponse.success(res, 'MFA deshabilitado exitosamente', result);
  });

  /** PUT /persons/:userId/role */
  changeRole = asyncHandler(async (req, res) => {
    const result = await PersonService.changeRole(
      req.params.userId,
      req.body.newRoleId,
      {
        adminUserId:    req.user.userId,
        adminFirstName: req.user.firstName,
        ipAddress:      req.ip,
        userAgent:      req.headers['user-agent'],
      }
    );
    return ApiResponse.success(res, 'Rol actualizado exitosamente', result);
  });

  /** DELETE /persons/:userId */
  deleteAccount = asyncHandler(async (req, res) => {
    await PersonService.deleteAccount(
      req.params.userId,
      req.body.currentPassword,
      {
        adminUserId:    req.user.userId,
        adminFirstName: req.user.firstName,
        passwordHash:   req.user.passwordHash,
        ipAddress:      req.ip,
        userAgent:      req.headers['user-agent'],
      }
    );
    return ApiResponse.noContent(res);
  });
}

module.exports = new PersonController();
