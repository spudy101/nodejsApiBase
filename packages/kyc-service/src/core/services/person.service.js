'use strict';

const { v4: uuidv4 } = require('uuid');
const ProfileBaseService = require('./profileBase.service');
const RoleRepository = require('../../infrastructure/database/repositories/role.repository');
const { CognitoUtil } = require('@abundbank/shared');
const KycSharedUtil = require('../../utils/kycShared.util');
const { AppError } = require('@abundbank/shared');
const { logger } = require('@abundbank/shared');
const { PaginationHelper } = require('@abundbank/shared');
const db = require('../../infrastructure/database');

const {
  UserDto,
  UserListItemDto,
  CreateUserDto,
  ResetPasswordDto,
  ChangeEmailDto,
  ChangeNationalIdDto,
  ToggleUserStatusDto,
  DisableMFADto,
  ChangeRoleDto,
  MetadataDto
} = require('../../api/dtos/person.dto');

/**
 * PersonService - Operaciones de ADMIN sobre usuarios
 * Extiende ProfileBaseService para reutilizar lógica común con ProfileService
 */
class PersonService extends ProfileBaseService {
  constructor() {
    super();
    // Repository adicional para admin
    this.roleRepository = new RoleRepository(db.Role, db);
  }

  // ==================== MÉTODOS PÚBLICOS - CONSULTA ====================

  /**
   * Lista usuarios con paginación, filtros y búsqueda
   * @param {Object} query - Query params (page, limit, search, filters)
   * @returns {Promise<{ data: UserListItemDto[], metadata: MetadataDto }>}
   */
  async list(query) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const filters = PaginationHelper.buildFilters(query, ['isActive', 'roleId']);
    const searchTerm = query.search || null;

    // ✅ Usar método actualizado con búsqueda en campos relacionados
    const { rows, count } = await this.userRepository.findAllPaginatedWithSearch(
      filters,
      paginationParams,
      searchTerm
    );

    const paginationMetadata = PaginationHelper.buildMetadata(
      count,
      paginationParams.page,
      paginationParams.limit,
      searchTerm ? { search: searchTerm, ...filters } : filters,
      { field: paginationParams.sortBy, order: paginationParams.order }
    );

    logger.info('Users listed successfully', { 
      totalItems: count, 
      page: paginationParams.page 
    });

    const data = rows.map(user => new UserListItemDto(user));
    
    const metadata = new MetadataDto({
      pagination: paginationMetadata.pagination,
      sort: paginationMetadata.sort,
      filters: paginationMetadata.filters || {}
    });

    return { data, metadata };
  }

  /**
   * Obtiene un usuario por ID
   * @param {string} userId - UUID del usuario
   * @returns {Promise<UserDto>}
   */
  async getById(userId) {
    // ✅ UNA SOLA QUERY con include full
    const user = await this.userRepository.findById(userId, {
      include: this.userRepository.INCLUDES.full
    });

    if (!user) {
      throw AppError.notFound('Usuario no encontrado');
    }

    logger.info('User retrieved successfully', { userId });
    return new UserDto(user);
  }

  // ==================== MÉTODOS PÚBLICOS - CREACIÓN ====================

  /**
   * Crea un nuevo usuario (operación de admin)
   * @param {Object} userData - Datos del usuario a crear
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Promise<CreateUserDto>}
   */
  async create(userData, auditContext) {
    const transaction = await db.sequelize.transaction();
    let cognitoCreated = false;
    let cognitoUsername = null;
    
    try {
      // Validar rol
      const role = await this.roleRepository.findById(userData.roleId);
      if (!role) {
        throw AppError.notFound('Rol no encontrado');
      }

      // Validar national_id según rol
      KycSharedUtil.validateNationalIdByRole(userData.nationalId, role);

      // Validar unicidad
      await this.validateNationalIdUnique(userData.nationalId);
      await this.validateEmailUnique(userData.email);

      // Generar contraseña temporal y username único para Cognito
      const temporaryPassword = KycSharedUtil.generateSecurePassword();
      cognitoUsername = `user_${uuidv4()}`;

      // ✅ 1. Crear en Cognito PRIMERO
      const cognitoData = await CognitoUtil.createUser({
        username: cognitoUsername,
        email: userData.email,
        password: temporaryPassword
      });
      cognitoCreated = true;

      // ✅ 2. Crear en BD DESPUÉS
      const person = await this.personRepository.create({
        first_name: userData.firstName,
        last_name: userData.lastName,
        national_id: userData.nationalId,
        birth_date: userData.birthDate || null,
        gender_id: userData.genderId || null,
        country_id: userData.countryId || null,
      }, { transaction });

      await this.personContactRepository.create({
        person_id: person.id,
        email: userData.email,
        email_verified_at: new Date(),
      }, { transaction });

      const user = await this.userRepository.create({
        username: userData.nationalId,
        cognito_username: cognitoUsername,
        person_id: person.id,
        role_id: userData.roleId,
        password_hash: temporaryPassword, // El repository hashea automáticamente
        cognito_sub: cognitoData.sub
      }, { transaction });

      await transaction.commit();

      // Enviar notificación async
      setImmediate(() => {
        this.enviarNotificacion('USUARIO_CREADO_ADMIN', user.id, {
          nombre: userData.firstName,
          email: userData.email,
          passwordTemporal: temporaryPassword
        }).catch(err => logger.error('Error sending welcome email', { error: err.message }));
      });

      logger.info('User created successfully by admin', { 
        userId: user.id, 
        adminId: auditContext.adminUserId 
      });

      // ✅ Query final con include full
      const fullUser = await this.userRepository.findById(user.id, {
        include: this.userRepository.INCLUDES.full
      });

      return new CreateUserDto(fullUser, temporaryPassword);
      
    } catch (error) {
      await transaction.rollback();
      
      // ✅ Rollback de Cognito si fue creado
      if (cognitoCreated) {
        await CognitoUtil.deleteUser(cognitoUsername);
        logger.info('Cognito user deleted during rollback', { cognitoUsername });
      }
      
      logger.error('Error creating user', { error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - ACTIVACIÓN/DESACTIVACIÓN ====================

  /**
   * Activa/Desactiva un usuario
   * @param {string} userId - UUID del usuario
   * @param {string} action - 'activate' | 'deactivate'
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Promise<ToggleUserStatusDto>}
   */
  async toggleUserStatus(userId, action, auditContext) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // ✅ Query ligera: solo validar existencia y estado
      const user = await this.userRepository.findById(userId, {
        attributes: ['id', 'is_active'],
        include: [
          {
            model: db.Person,
            as: 'person',
            attributes: ['id']
          }
        ]
      });
      
      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const isActivating = action === 'activate';
      
      if (user.is_active === isActivating) {
        throw AppError.badRequest(`El usuario ya está ${isActivating ? 'activo' : 'inactivo'}`);
      }

      // Actualizar estado
      await this.userRepository.setActiveStatus(userId, isActivating, { transaction });

      // Registrar cambio en audit log
      await this.logChange({
        personId: user.person.id,
        changedByPersonId: auditContext.adminPersonId,
        changedByRole: 'admin',
        changeType: 'account_status',
        previousValue: isActivating ? 'inactive' : 'active',
        newValue: isActivating ? 'active' : 'inactive',
        changeReason: `Usuario ${isActivating ? 'activado' : 'desactivado'} por administrador`,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info(`User ${action}d successfully`, { userId, adminId: auditContext.adminUserId });

      user.is_active = isActivating;
      return new ToggleUserStatusDto(user, action);
      
    } catch (error) {
      await transaction.rollback();
      logger.error(`Error ${action}ing user`, { userId, error: error.message });
      throw error;
    }
  }

  async activate(userId, auditContext) {
    return this.toggleUserStatus(userId, 'activate', auditContext);
  }

  async deactivate(userId, auditContext) {
    return this.toggleUserStatus(userId, 'deactivate', auditContext);
  }

  // ==================== MÉTODOS PÚBLICOS - RESET PASSWORD ====================

  /**
   * Resetea la contraseña de un usuario (admin)
   * @param {string} userId - UUID del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Promise<ResetPasswordDto>}
   */
  async resetPassword(userId, auditContext) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // ✅ Query optimizada: solo datos necesarios
      const user = await this.userRepository.findById(userId, {
        include: [
          { 
            model: db.Person,
            as: 'person',
            attributes: ['id', 'first_name']
          }
        ],
        attributes: ['id', 'cognito_username']
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const temporaryPassword = KycSharedUtil.generateSecurePassword();

      // Usar lógica base para actualizar contraseña
      await this.updatePasswordLogic({
        userId: user.id,
        personId: user.person.id,
        newPassword: temporaryPassword,
        changedByPersonId: auditContext.adminPersonId,
        changedByRole: 'admin',
        changeReason: 'Contraseña reseteada por administrador',
        auditContext,
        transaction,
        cognitoUsername: user.cognito_username
      });

      await transaction.commit();

      const firstName = user.person.first_name;

      // Enviar notificación async
      setImmediate(() => {
        this.enviarNotificacion('PASSWORD_RESET_ADMIN', user.id, {
          nombre: firstName,
          passwordTemporal: temporaryPassword
        }).catch(err => logger.error('Error sending notification', { error: err.message }));
      });

      logger.info('Password reset successfully', { userId, adminId: auditContext.adminUserId });

      return new ResetPasswordDto(user);
      
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Error resetting password', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - CAMBIO DE EMAIL ====================

  /**
   * Cambia el email de un usuario (admin)
   * @param {string} userId - UUID del usuario
   * @param {string} newEmail - Nuevo email
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Promise<ChangeEmailDto>}
   */
  async changeEmail(userId, newEmail, auditContext) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // ✅ Query optimizada: solo person + contact
      const user = await this.userRepository.findById(userId, {
        include: [
          { 
            model: db.Person,
            as: 'person',
            attributes: ['id', 'first_name'],
            include: [
              { 
                model: db.PersonContact,
                as: 'contact',
                attributes: ['id', 'email']
              }
            ] 
          }
        ],
        attributes: ['id', 'cognito_username']
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const oldEmail = user.person.contact.email;

      // Usar lógica base para actualizar email
      await this.updateEmailLogic({
        personId: user.person.id,
        newEmail,
        changedByPersonId: auditContext.adminPersonId,
        changedByRole: 'admin',
        changeReason: 'Email actualizado por administrador',
        auditContext,
        transaction,
        cognitoUsername: user.cognito_username
      });

      await transaction.commit();

      // Enviar notificaciones async
      setImmediate(() => {
        // Al email antiguo
        this.enviarNotificacionDirecta('EMAIL_CAMBIADO_NOTIFICACION', oldEmail, {
          nombre: user.person.first_name,
          emailAntiguo: oldEmail,
          emailNuevo: newEmail
        }).catch(err => logger.error('Error sending old email notification', { error: err.message }));

        // Al email nuevo
        this.enviarNotificacion('EMAIL_CAMBIADO_CONFIRMACION', user.id, {
          nombre: user.person.first_name,
          emailNuevo: newEmail
        }).catch(err => logger.error('Error sending new email notification', { error: err.message }));
      });

      logger.info('Email changed successfully', { userId, adminId: auditContext.adminUserId });

      return new ChangeEmailDto(user, oldEmail, newEmail);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error changing email', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - CAMBIO DE NATIONAL ID ====================

  /**
   * Cambia el national_id de un usuario (admin)
   * @param {string} userId - UUID del usuario
   * @param {string} newNationalId - Nuevo national ID
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Promise<ChangeNationalIdDto>}
   */
  async changeNationalId(userId, newNationalId, auditContext) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // ✅ Query optimizada: solo person
      const user = await this.userRepository.findById(userId, {
        include: [
          { 
            model: db.Person,
            as: 'person',
            attributes: ['id', 'national_id', 'first_name']
          }
        ],
        attributes: ['id']
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const oldNationalId = user.person.national_id;

      // Usar lógica base para actualizar national_id
      await this.updateNationalIdLogic({
        userId: user.id,
        personId: user.person.id,
        newNationalId,
        changedByPersonId: auditContext.adminPersonId,
        changedByRole: 'admin',
        changeReason: 'National ID actualizado por administrador',
        auditContext,
        transaction
      });

      await transaction.commit();

      logger.info('National ID changed successfully', { userId, adminId: auditContext.adminUserId });

      // Enviar notificación async
      setImmediate(() => {
        this.enviarNotificacion('NATIONAL_ID_CAMBIADO', user.id, {
          nombre: user.person.first_name,
          nationalIdAntiguo: oldNationalId,
          nationalIdNuevo: newNationalId
        }).catch(err => logger.error('Error sending notification', { error: err.message }));
      });

      return new ChangeNationalIdDto(user, oldNationalId, newNationalId);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error changing national_id', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - DESHABILITAR MFA ====================

  /**
   * Deshabilita MFA de un usuario (admin)
   * @param {string} userId - UUID del usuario
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Promise<DisableMFADto>}
   */
  async disableMFA(userId, auditContext) {
    const transaction = await db.sequelize.transaction();
    
    try {
      const user = await this.userRepository.findById(userId, {
        include: [
          { 
            model: db.Person,
            as: 'person',
            attributes: ['id', 'first_name']
          }
        ],
        attributes: ['id', 'cognito_username', 'totp_enabled']
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      if (!user.totp_enabled) {
        throw AppError.badRequest('El usuario no tiene MFA habilitado');
      }

      // Deshabilitar en Cognito
      await CognitoUtil.disableTOTPMFA(user.cognito_username);

      // Actualizar en BD
      await this.userRepository.updateTOTPStatus(userId, false, { transaction });

      // Registrar cambio en audit log
      await this.logChange({
        personId: user.person.id,
        changedByPersonId: auditContext.adminPersonId,
        changedByRole: 'admin',
        changeType: 'mfa_status',
        previousValue: 'enabled',
        newValue: 'disabled',
        changeReason: 'MFA deshabilitado por administrador',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('MFA disabled successfully', { userId, adminId: auditContext.adminUserId });

      // Enviar notificación async
      setImmediate(() => {
        this.enviarNotificacion('MFA_DESHABILITADO', user.id, {
          nombre: user.person.first_name
        }).catch(err => logger.error('Error sending notification', { error: err.message }));
      });

      return new DisableMFADto(user);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error disabling MFA', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - CAMBIAR ROL ====================

  /**
   * Cambia el rol de un usuario (admin)
   * @param {string} userId - UUID del usuario
   * @param {string} newRoleId - UUID del nuevo rol
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Promise<ChangeRoleDto>}
   */
  async changeRole(userId, newRoleId, auditContext) {
    const transaction = await db.sequelize.transaction();
    
    try {
      // ✅ Query optimizada con person y role
      const user = await this.userRepository.findById(userId, {
        include: [
          { 
            model: db.Person,
            as: 'person',
            attributes: ['id', 'first_name']
          },
          {
            model: db.Role,
            as: 'role',
            attributes: ['id', 'name', 'description']
          }
        ],
        attributes: ['id', 'role_id']
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      if (user.role.name === 'admin') {
        throw AppError.badRequest('No se puede cambiar el rol de un administrador');
      }

      const newRole = await this.roleRepository.findById(newRoleId);
      if (!newRole) {
        throw AppError.notFound('Rol no encontrado');
      }

      if (user.role_id === newRoleId) {
        throw AppError.badRequest('El usuario ya tiene este rol');
      }

      const oldRole = user.role;

      // Actualizar rol
      await this.userRepository.update(userId, { role_id: newRoleId }, { transaction });

      // Registrar cambio en audit log
      await this.logChange({
        personId: user.person.id,
        changedByPersonId: auditContext.adminPersonId,
        changedByRole: 'admin',
        changeType: 'role',
        previousValue: oldRole.name,
        newValue: newRole.name,
        changeReason: 'Rol actualizado por administrador',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      logger.info('Role changed successfully', { 
        userId, 
        oldRole: oldRole.name, 
        newRole: newRole.name, 
        adminId: auditContext.adminUserId 
      });

      // Enviar notificación async
      setImmediate(() => {
        this.enviarNotificacion('ROL_CHANGE', user.id, {
          nombre: user.person.first_name,
          nuevo_rol: newRole.name,
          permisos_descripcion: newRole.description
        }).catch(err => logger.error('Error sending role change notification', { error: err.message }));
      });

      user.role = newRole;
      return new ChangeRoleDto(user, oldRole, newRole);
      
    } catch (error) {
      await transaction.rollback();
      logger.error('Error changing role', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - ELIMINAR CUENTA ====================

  /**
   * Elimina la cuenta de un usuario (admin)
   * @param {string} userId - UUID del usuario
   * @param {string} currentPassword - Contraseña del admin
   * @param {Object} auditContext - Contexto de auditoría con passwordHash del admin
   * @returns {Promise<null>}
   */
  async deleteAccount(userId, currentPassword, auditContext) {
    const transaction = await db.sequelize.transaction();

    try {
      // 1. Validar contraseña del admin
      await this.validateCurrentPassword(auditContext.passwordHash, currentPassword);

      // 2. ✅ Query optimizada: solo campos necesarios
      const user = await this.userRepository.findById(userId, {
        include: [
          { 
            model: db.Person,
            as: 'person',
            attributes: ['id', 'first_name']
          }
        ],
        attributes: ['id', 'cognito_username']
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      // 3. Usar lógica base para eliminar cuenta
      const { email, firstName } = await this.deleteAccountLogic({
        userId: user.id,
        personId: user.person.id,
        changedByPersonId: auditContext.adminPersonId,
        changedByRole: 'admin',
        auditContext,
        transaction,
        cognitoUsername: user.cognito_username
      });

      await transaction.commit();

      // 4. Enviar notificación async
      if (email) {
        setImmediate(() => {
          this.enviarNotificacionDirecta('CUENTA_ELIMINADA', email, {
            nombre: firstName
          }).catch(err => logger.error('Error sending account deletion email', { 
            userId,
            error: err.message 
          }));
        });
      }

      logger.info('Account deleted successfully by admin', { 
        userId, 
        adminId: auditContext.adminUserId
      });

      return null;
      
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
        logger.info('Database transaction rolled back by admin action', { 
          userId,
          adminId: auditContext.adminUserId 
        });
      }

      logger.error('Error deleting account by admin', { 
        userId, 
        adminId: auditContext.adminUserId, 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  }
}

module.exports = new PersonService();