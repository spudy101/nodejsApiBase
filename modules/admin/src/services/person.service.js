'use strict';

const { v4: uuidv4 }   = require('uuid');
const { sequelize }    = require('../../../../shared/models');
const userRepository   = require('../../../kyc/repositories/user.repository');
const personRepository = require('../../../kyc/repositories/person.repository');
const personContactRepository    = require('../../../kyc/repositories/person-contact.repository');
const roleRepository             = require('../../../kyc/repositories/role.repository');
const verificationCodeRepository = require('../../../kyc/repositories/verification-code.repository');
const CognitoUtil      = require('../../../../shared/utils/cognito.util');
const KycSharedUtil    = require('../../../kyc/utils/kyc.util');
const NotificationUtil = require('../../../notification/src/services/notification-creation.service');
const AppError         = require('../../../../shared/utils/app-error.util');
const { logger }       = require('../../../../shared/utils/logger.util');
const PaginationHelper = require('../../../../shared/utils/pagination.util');
const { MetadataDTO }  = require('../../../../shared/dtos/components.dto'); // ← import faltante corregido
const bcrypt           = require('bcryptjs');

const {
  UserDTO,
  UserListItemDTO,
  CreateUserDTO,
  ResetPasswordDTO,
  ChangeEmailDTO,
  ChangeNationalIdDTO,
  ToggleUserStatusDTO,
  DisableMFADTO,
  ChangeRoleDTO,
} = require('../dtos/person.dto');

class PersonService {

  // ============================================================
  // QUERIES
  // ============================================================

  /**
   * Lista usuarios con paginación, filtros y búsqueda
   */
  async list(query) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const filters          = PaginationHelper.buildFilters(query, ['isActive', 'roleId']);
    const searchTerm       = query.search || null;

    const { rows, count } = await userRepository.findAllPaginated(
      filters,
      paginationParams,
      searchTerm
    );

    const metadata = MetadataDTO.build({
      totalItems: count,
      page:       paginationParams.page,
      limit:      paginationParams.limit,
      sortBy:     paginationParams.sortBy,
      order:      paginationParams.order,
      filters:    searchTerm ? { search: searchTerm, ...filters } : filters,
    });

    logger.info('Users listed successfully', { totalItems: count, page: paginationParams.page });

    return {
      data: rows.map(user => new UserListItemDTO(user)),
      metadata,
    };
  }

  /**
   * Obtiene un usuario por ID
   */
  async getById(userId) {
    const user = await userRepository.findByUserId(userId, 'full');
    if (!user) throw AppError.notFound('Usuario no encontrado');

    logger.info('User retrieved successfully', { userId });
    return new UserDTO(user);
  }

  // ============================================================
  // CREACIÓN
  // ============================================================

  /**
   * Crea un nuevo usuario (operación de admin).
   *
   * Orden de operaciones:
   *   1. Crear en Cognito primero  ← cognitoCreated = true
   *   2. Crear en BD
   *   3. Commit  ← transactionFinished = true, cognitoCreated = false (ya no hay rollback)
   *   4. Actualizar custom attributes en Cognito
   *
   * Si falla antes del commit, se elimina el usuario de Cognito.
   * Si falla después del commit, Cognito ya está sincronizado — no hay rollback necesario.
   */
  async create(userData, auditContext) {
    const transaction       = await sequelize.transaction();
    let cognitoCreated      = false;
    let cognitoUsername     = null;
    let transactionFinished = false;

    try {
      const role = await roleRepository.findById(userData.roleId);
      if (!role) throw AppError.notFound('Rol no encontrado');

      KycSharedUtil.validateNationalIdByRole(userData.nationalId, role);

      const existingNationalId = await userRepository.findByNationalId(userData.nationalId);
      if (existingNationalId) throw AppError.conflict('El National ID ya está registrado');

      const existingEmail = await personContactRepository.findByEmail(userData.email);
      if (existingEmail)   throw AppError.conflict('El email ya está en uso por otro usuario');

      const temporaryPassword = KycSharedUtil.generateSecurePassword();
      cognitoUsername         = `user_${uuidv4()}`;

      // 1. Cognito primero
      const cognitoData = await CognitoUtil.createUser({
        username: cognitoUsername,
        email:    userData.email,
        password: temporaryPassword,
      });
      cognitoCreated = true;

      // 2. BD después
      const person = await personRepository.create({
        first_name:  userData.firstName,
        last_name:   userData.lastName,
        national_id: userData.nationalId,
        birth_date:  userData.birthDate  || null,
        gender_id:   userData.genderId   || null,
        country_id:  userData.countryId  || null,
      }, { transaction });

      await personContactRepository.create({
        person_id:         person.id,
        email:             userData.email,
        email_verified_at: new Date(),
      }, { transaction });

      const user = await userRepository.create({
        username:         userData.nationalId,
        cognito_username: cognitoUsername,
        person_id:        person.id,
        role_id:          userData.roleId,
        password:         temporaryPassword,
        cognito_sub:      cognitoData.sub,
      }, { transaction });

      // 3. Commit — a partir de aquí no hay rollback de Cognito
      await transaction.commit();
      transactionFinished = true;
      cognitoCreated      = false;

      logger.info('User created successfully by admin', {
        userId:  user.id,
        adminId: auditContext.adminUserId,
      });

      setImmediate(() => {
        this._enviarNotificacion('USUARIO_CREADO_ADMIN', user.id, {
          nombre:           userData.firstName,
          email:            userData.email,
          passwordTemporal: temporaryPassword,
        }).catch(err => logger.error('Error sending welcome notification', { error: err.message }));

        this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
          nombre:  auditContext.adminFirstName,
          accion:  'crear',
          user_id: user.id,
        }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
      });

      const fullUser = await userRepository.findByUserId(user.id, 'full');
      return new CreateUserDTO(fullUser, temporaryPassword);

    } catch (error) {
      if (!transactionFinished) {
        await transaction.rollback();

        if (cognitoCreated) {
          await CognitoUtil.deleteUser(cognitoUsername)
            .catch(err => logger.error('Error reverting Cognito user', { error: err.message }));
        }
      }
      throw error;
    }
  }

  // ============================================================
  // ACTIVACIÓN / DESACTIVACIÓN
  // ============================================================

  async toggleUserStatus(userId, action, auditContext) {
    const transaction = await sequelize.transaction();

    try {
      const user = await userRepository.findById(userId, {
        include: [{
          association: 'person',
          attributes:  ['first_name'],
          include: [{ association: 'contact', attributes: ['email'] }],
        }],
        attributes: ['id', 'is_active'],
      });

      if (!user) throw AppError.notFound('Usuario no encontrado');

      const isActivating = action === 'activate';

      if (user.is_active === isActivating) {
        throw AppError.badRequest(`El usuario ya está ${isActivating ? 'activo' : 'inactivo'}`);
      }

      await userRepository.setActiveStatus(userId, isActivating, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: auditContext.adminUserId,
        changedByRole:   'admin',
        changeType:      'account_status',
        previousValue:   isActivating ? 'inactive' : 'active',
        newValue:        isActivating ? 'active'   : 'inactive',
        changeReason:    `Usuario ${isActivating ? 'activado' : 'desactivado'} por administrador`,
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info(`User ${action}d successfully`, { userId, adminId: auditContext.adminUserId });

      const affectedNombre = user.person?.first_name || 'Usuario';
      const affectedEmail  = user.person?.contact?.email;

      setImmediate(() => {
        const tipoUsuario = isActivating ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED';
        this._enviarNotificacion(tipoUsuario, userId, {
          nombre: affectedNombre,
          email:  affectedEmail,
        }).catch(err => logger.error('Error sending status notification to user', { error: err.message }));

        this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
          nombre:  auditContext.adminFirstName,
          accion:  action,
          user_id: userId,
        }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
      });

      user.is_active = isActivating;
      return new ToggleUserStatusDTO(user, action);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async activate(userId, auditContext) {
    return this.toggleUserStatus(userId, 'activate', auditContext);
  }

  async deactivate(userId, auditContext) {
    return this.toggleUserStatus(userId, 'deactivate', auditContext);
  }

  // ============================================================
  // RESET PASSWORD
  // ============================================================

  /**
   * Resetea la contraseña de un usuario (admin).
   *
   * Orden de operaciones:
   *   1. Cognito primero — actualiza la contraseña  ← cognitoUpdated = true
   *   2. BD después — si falla, se loguea como CRITICAL
   *
   * No revertimos Cognito si falla BD porque no tenemos la contraseña anterior.
   * El usuario puede entrar con la nueva contraseña — solo la BD quedó desincronizada.
   * Se loguea como CRITICAL para intervención manual.
   */
  async resetPassword(userId, auditContext) {
    const user = await userRepository.findById(userId, {
      include: [{
        association: 'person',
        attributes:  ['first_name'],
        include: [{ association: 'contact', attributes: ['email'] }],
      }],
      attributes: ['id', 'cognito_username'],
    });

    if (!user) throw AppError.notFound('Usuario no encontrado');

    const temporaryPassword = KycSharedUtil.generateSecurePassword();

    // 1. Cognito primero
    await CognitoUtil.changeUserPassword(user.cognito_username, temporaryPassword);

    // 2. BD después
    const transaction = await sequelize.transaction();
    try {
      await userRepository.update(userId, { password: temporaryPassword }, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: auditContext.adminUserId,
        changedByRole:   'admin',
        changeType:      'password',
        previousValue:   'hidden',
        newValue:        'hidden',
        changeReason:    'Contraseña reseteada por administrador',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      // No revertimos Cognito — no tenemos la contraseña anterior
      logger.error('CRITICAL: Password updated in Cognito but BD update failed', {
        userId,
        adminId: auditContext.adminUserId,
        error:   error.message,
      });
      throw AppError.internal('Error al resetear la contraseña. Contacta soporte');
    }

    logger.info('Password reset successfully', { userId, adminId: auditContext.adminUserId });

    const affectedNombre = user.person?.first_name || 'Usuario';
    const affectedEmail  = user.person?.contact?.email;

    setImmediate(() => {
      this._enviarNotificacion('PASSWORD_RESET_ADMIN', userId, {
        nombre:           affectedNombre,
        email:            affectedEmail,
        passwordTemporal: temporaryPassword,
      }).catch(err => logger.error('Error sending password reset notification', { error: err.message }));

      this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
        nombre:  auditContext.adminFirstName,
        accion:  'reset_password',
        user_id: userId,
      }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
    });

    return new ResetPasswordDTO(user);
  }

  // ============================================================
  // CAMBIO DE EMAIL
  // ============================================================

  /**
   * Cambia el email de un usuario (admin).
   * El admin NO requiere verificación previa del email.
   *
   * Orden de operaciones:
   *   1. BD + audit log dentro de transacción
   *   2. Commit
   *   3. Cognito después del commit — si falla, revertir BD
   */
  async changeEmail(userId, newEmail, auditContext) {
    const user = await userRepository.findById(userId, {
      include: [{
        association: 'person',
        attributes:  ['id', 'first_name'],
        include: [{ association: 'contact', attributes: ['id', 'email'] }],
      }],
      attributes: ['id', 'cognito_username'],
    });

    if (!user) throw AppError.notFound('Usuario no encontrado');

    const personId  = user.person.id;
    const firstName = user.person.first_name;
    const oldEmail  = user.person.contact.email;

    if (oldEmail === newEmail) {
      throw AppError.badRequest('El nuevo email es igual al actual');
    }

    const existingContact = await personContactRepository.findByEmail(newEmail);
    if (existingContact && existingContact.person_id !== personId) {
      throw AppError.conflict('El email ya está en uso por otro usuario');
    }

    // 1. BD primero
    const transaction = await sequelize.transaction();
    try {
      await user.person.contact.update(
        { email: newEmail, email_verified_at: new Date() },
        { transaction }
      );

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: auditContext.adminUserId,
        changedByRole:   'admin',
        changeType:      'email',
        previousValue:   oldEmail,
        newValue:        newEmail,
        changeReason:    'Email actualizado por administrador',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // 2. Cognito después del commit — si falla, revertir BD
    try {
      await CognitoUtil.updateUserEmail(user.cognito_username, newEmail);
    } catch (cognitoError) {
      logger.error('Cognito email update failed after BD commit — reverting BD', {
        userId,
        adminId: auditContext.adminUserId,
        error:   cognitoError.message,
      });

      await personContactRepository.update(
        { email: oldEmail, email_verified_at: null },
        { where: { person_id: personId } }
      ).catch(revertError => logger.error('CRITICAL: BD revert failed after Cognito error', {
        userId,
        error: revertError.message,
      }));

      throw AppError.internal('Error al actualizar el email. Intenta nuevamente');
    }

    logger.info('Email changed successfully by admin', {
      userId, oldEmail, newEmail, adminId: auditContext.adminUserId,
    });

    setImmediate(() => {
      NotificationUtil.crearNotificacionDirecta({
        tipo_notificacion: 'EMAIL_CHANGED_OLD',
        email:             oldEmail,
        metadata:          { nombre: firstName, email: oldEmail },
      }).catch(err => logger.error('Error sending old email change notification', { error: err.message }));

      this._enviarNotificacion('EMAIL_CHANGED_NEW', userId, {
        nombre: firstName,
        email:  newEmail,
      }).catch(err => logger.error('Error sending new email change notification', { error: err.message }));

      this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
        nombre:  auditContext.adminFirstName,
        accion:  'cambiar_email',
        user_id: userId,
      }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
    });

    return new ChangeEmailDTO(user, oldEmail, newEmail);
  }

  // ============================================================
  // CAMBIO DE NATIONAL ID
  // ============================================================

  /**
   * Cambia el national_id de un usuario (admin).
   *
   * Orden de operaciones:
   *   1. Cognito primero — actualiza custom attribute  ← cognitoUpdated = true
   *   2. BD después — si falla, revertir Cognito
   */
  async changeNationalId(userId, newNationalId, auditContext) {
    const user = await userRepository.findById(userId, {
      include: [
        {
          association: 'person',
          attributes:  ['id', 'national_id', 'first_name'],
          include: [{ association: 'contact', attributes: ['email'] }],
        },
        { association: 'role', attributes: ['id', 'name'] },
      ],
      attributes: ['id', 'cognito_username'],
    });

    if (!user) throw AppError.notFound('Usuario no encontrado');

    const personId      = user.person.id;
    const firstName     = user.person.first_name;
    const affectedEmail = user.person?.contact?.email;
    const oldNationalId = user.person.national_id;

    if (oldNationalId === newNationalId) {
      throw AppError.badRequest('El nuevo National ID es igual al actual');
    }

    KycSharedUtil.validateNationalIdByRole(newNationalId, user.role);

    const existing = await userRepository.findByNationalId(newNationalId);
    if (existing && existing.id !== userId) {
      throw AppError.conflict('El National ID ya está registrado');
    }

    // Bandera: solo true si Cognito llegó a actualizarse
    let cognitoUpdated = false;
    const transaction  = await sequelize.transaction();

    try {
      // 1. Cognito primero
      await CognitoUtil.updateUserCustomAttributes(user.cognito_username, { nationalId: newNationalId });
      cognitoUpdated = true;

      // 2. BD después
      await user.person.update({ national_id: newNationalId }, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: auditContext.adminUserId,
        changedByRole:   'admin',
        changeType:      'national_id',
        previousValue:   oldNationalId,
        newValue:        newNationalId,
        changeReason:    'National ID actualizado por administrador',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();

      // Revertir Cognito solo si llegó a actualizarse
      if (cognitoUpdated) {
        await CognitoUtil.updateUserCustomAttributes(user.cognito_username, { nationalId: oldNationalId })
          .catch(err => logger.error('CRITICAL: Cognito nationalId rollback failed', {
            userId,
            error: err.message,
          }));
      }

      throw error;
    }

    logger.info('National ID changed successfully by admin', {
      userId, oldNationalId, newNationalId, adminId: auditContext.adminUserId,
    });

    setImmediate(() => {
      this._enviarNotificacion('NATIONAL_ID_CHANGED', userId, {
        nombre: firstName,
        email:  affectedEmail,
      }).catch(err => logger.error('Error sending national id change notification', { error: err.message }));

      this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
        nombre:  auditContext.adminFirstName,
        accion:  'cambiar_national_id',
        user_id: userId,
      }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
    });

    return new ChangeNationalIdDTO(user, oldNationalId, newNationalId);
  }

  // ============================================================
  // DESHABILITAR MFA
  // ============================================================

  /**
   * Desactiva el MFA (TOTP) de un usuario (admin).
   *
   * Orden de operaciones:
   *   1. Cognito primero — deshabilitar TOTP  ← cognitoDisabled = true
   *   2. BD después — si falla, revertir Cognito
   */
  async disableMFA(userId, auditContext) {
    const user = await userRepository.findById(userId, {
      include: [{
        association: 'person',
        attributes:  ['first_name'],
        include: [{ association: 'contact', attributes: ['email'] }],
      }],
      attributes: ['id', 'cognito_username', 'totp_enabled'],
    });

    if (!user) throw AppError.notFound('Usuario no encontrado');

    if (!user.totp_enabled) {
      throw AppError.badRequest('El usuario no tiene MFA habilitado');
    }

    // Bandera: solo true si Cognito llegó a deshabilitarse
    let cognitoDisabled = false;
    const transaction   = await sequelize.transaction();

    try {
      // 1. Cognito primero
      await CognitoUtil.disableTOTPMFA(user.cognito_username);
      cognitoDisabled = true;

      // 2. BD después
      await userRepository.update(userId, {
        totp_enabled: false,
        totp_secret:  null,
      }, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: auditContext.adminUserId,
        changedByRole:   'admin',
        changeType:      'mfa_status',
        previousValue:   'enabled',
        newValue:        'disabled',
        changeReason:    'MFA desactivado por administrador',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();

      // Revertir Cognito solo si llegó a deshabilitarse
      if (cognitoDisabled) {
        await CognitoUtil.enableTOTPMFA(user.cognito_username)
          .catch(err => logger.error('CRITICAL: Cognito MFA rollback failed on admin disable', {
            userId,
            error: err.message,
          }));
      }

      throw error;
    }

    logger.info('MFA disabled successfully by admin', { userId, adminId: auditContext.adminUserId });

    const affectedNombre = user.person?.first_name || 'Usuario';
    const affectedEmail  = user.person?.contact?.email;

    setImmediate(() => {
      this._enviarNotificacion('RESET_MFA', userId, {
        nombre: affectedNombre,
        email:  affectedEmail,
      }).catch(err => logger.error('Error sending MFA reset notification', { error: err.message }));

      this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
        nombre:  auditContext.adminFirstName,
        accion:  'deshabilitar_mfa',
        user_id: userId,
      }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
    });

    user.totp_enabled = false;
    return new DisableMFADTO(user);
  }

  // ============================================================
  // CAMBIO DE ROL
  // ============================================================

  /**
   * Cambia el rol de un usuario (admin).
   * No involucra Cognito — el rol se actualiza solo en BD.
   */
  async changeRole(userId, newRoleId, auditContext) {
    const transaction = await sequelize.transaction();

    try {
      const user = await userRepository.findById(userId, {
        include: [
          {
            association: 'person',
            attributes:  ['first_name'],
            include: [{ association: 'contact', attributes: ['email'] }],
          },
          { association: 'role', attributes: ['id', 'name', 'description'] },
        ],
        attributes: ['id', 'role_id'],
      });

      if (!user) throw AppError.notFound('Usuario no encontrado');

      if (user.role.name === 'admin') {
        throw AppError.badRequest('No se puede cambiar el rol de un administrador');
      }

      const newRole = await roleRepository.findById(newRoleId);
      if (!newRole) throw AppError.notFound('Rol no encontrado');

      if (user.role_id === newRoleId) {
        throw AppError.badRequest('El usuario ya tiene este rol');
      }

      const oldRole = user.role;

      await userRepository.update(userId, { role_id: newRoleId }, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: auditContext.adminUserId,
        changedByRole:   'admin',
        changeType:      'role',
        previousValue:   oldRole.name,
        newValue:        newRole.name,
        changeReason:    'Rol actualizado por administrador',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('Role changed successfully', {
        userId,
        oldRole:  oldRole.name,
        newRole:  newRole.name,
        adminId:  auditContext.adminUserId,
      });

      const affectedNombre = user.person?.first_name || 'Usuario';
      const affectedEmail  = user.person?.contact?.email;

      setImmediate(() => {
        this._enviarNotificacion('ROL_CHANGE', userId, {
          nombre:               affectedNombre,
          email:                affectedEmail,
          nuevo_rol:            newRole.name,
          permisos_descripcion: newRole.description,
        }).catch(err => logger.error('Error sending role change notification', { error: err.message }));

        this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
          nombre:  auditContext.adminFirstName,
          accion:  'cambiar_rol',
          user_id: userId,
        }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
      });

      user.role = newRole;
      return new ChangeRoleDTO(user, oldRole, newRole);

    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // ============================================================
  // ELIMINAR CUENTA
  // ============================================================

  /**
   * Elimina la cuenta de un usuario (admin).
   * El admin valida SU PROPIA contraseña antes de proceder.
   *
   * Orden de operaciones:
   *   1. BD primero (soft delete + ofuscación de datos sensibles)
   *   2. Cognito después del commit — best-effort, se loguea si falla
   */
  async deleteAccount(userId, currentPassword, auditContext) {
    await this._validatePassword(auditContext.passwordHash, currentPassword);

    const user = await userRepository.findById(userId, {
      include: [{
        association: 'person',
        attributes:  ['id', 'national_id', 'first_name'],
        include: [{ association: 'contact', attributes: ['id', 'email', 'phone_primary', 'phone_secondary'] }],
      }],
      attributes: ['id', 'username', 'cognito_username'],
    });

    if (!user) throw AppError.notFound('Usuario no encontrado');

    const personId   = user.person.id;
    const nationalId = user.person.national_id;
    const firstName  = user.person.first_name;
    const email      = user.person.contact.email;
    const username   = user.username;

    const newNationalId = KycSharedUtil.formatDeletedNationalId(nationalId);
    const newUsername   = KycSharedUtil.formatDeletedUsername(username);
    const newEmail      = KycSharedUtil.formatDeletedEmail(email);

    const contactUpdates = { email: newEmail };
    if (user.person.contact.phone_primary) {
      contactUpdates.phone_primary = KycSharedUtil.formatDeletedPhone(user.person.contact.phone_primary);
    }
    if (user.person.contact.phone_secondary) {
      contactUpdates.phone_secondary = KycSharedUtil.formatDeletedPhone(user.person.contact.phone_secondary);
    }

    // 1. BD primero (soft delete + ofuscación)
    const transaction = await sequelize.transaction();
    try {
      await personRepository.update(personId, { national_id: newNationalId }, { transaction });

      await userRepository.update(userId, {
        username:   newUsername,
        is_active:  false,
        deleted_at: new Date(),
      }, { transaction });

      await personContactRepository.update(user.person.contact.id, contactUpdates, { transaction });

      await KycSharedUtil.logChange({
        userId,
        changedByUserId: auditContext.adminUserId,
        changedByRole:   'admin',
        changeType:      'account_status',
        previousValue:   'active',
        newValue:        'eliminated',
        changeReason:    'Cuenta eliminada por administrador',
        ipAddress:       auditContext.ipAddress,
        userAgent:       auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    // 2. Cognito después del commit — best-effort
    await CognitoUtil.deleteUser(user.cognito_username)
      .catch(err => logger.error('CRITICAL: Account deleted in BD but Cognito deletion failed', {
        userId,
        cognitoUsername: user.cognito_username,
        adminId:         auditContext.adminUserId,
        error:           err.message,
      }));

    logger.info('Account deleted successfully by admin', {
      userId,
      adminId:           auditContext.adminUserId,
      deletedNationalId: newNationalId,
    });

    setImmediate(() => {
      NotificationUtil.crearNotificacionDirecta({
        tipo_notificacion: 'CUENTA_ELIMINADA',
        email,
        metadata: { nombre: firstName, email },
      }).catch(err => logger.error('Error sending account deletion notification', {
        userId,
        error: err.message,
      }));

      this._enviarNotificacion('PERSON_ADMIN_ACTION', auditContext.adminUserId, {
        nombre:  auditContext.adminFirstName,
        accion:  'eliminar_cuenta',
        user_id: userId,
      }).catch(err => logger.error('Error sending admin action notification', { error: err.message }));
    });

    return null;
  }

  // ============================================================
  // PRIVATE
  // ============================================================

  /** @private */
  async _validatePassword(passwordHash, plainPassword) {
    const isValid = await bcrypt.compare(plainPassword, passwordHash);
    if (!isValid) throw AppError.unauthorized('Contraseña incorrecta');
  }

  /**
   * Envía una notificación al usuario de forma segura.
   * Los errores se loguean pero no propagan — las notificaciones nunca deben
   * interrumpir el flujo principal.
   * @private
   */
  async _enviarNotificacion(tipo, userId, metadata) {
    try {
      await NotificationUtil.crearNotificacion({
        tipo_notificacion: tipo,
        user_id:           userId,
        related_entity:    null,
        metadata,
      });
      logger.info('Notificación enviada', { userId, tipo });
    } catch (error) {
      logger.error('Error al enviar notificación', { error: error.message, userId, tipo });
    }
  }
}

module.exports = new PersonService();