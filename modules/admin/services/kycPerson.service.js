'use strict';

const { v4: uuidv4 } = require('uuid');
const userRepository = require('../../../shared/repositories/user.repository');
const personRepository = require('../../../shared/repositories/person.repository');
const personContactRepository = require('../../../shared/repositories/personContact.repository');
const roleRepository = require('../../../shared/repositories/role.repository');
const CognitoUtil = require('../../../shared/utils/cognito.util');
const KycSharedUtil = require('../../../shared/utils/kycShared.util');
const EmailUtil = require('../utils/email.util');
const AppError = require('../../../shared/utils/appError.util');
const { logger } = require('../../../shared/utils/logger.util');
const PaginationHelper = require('../../../shared/utils/paginationHelper.util');
const { sequelize } = require('../../../shared/models');

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
} = require('../dtos/kycPerson.dto');

class KycPersonService {
  
  // ==================== MÉTODOS PÚBLICOS - CONSULTA ====================
  
  /**
   * Lista usuarios con paginación, filtros y búsqueda
   * Retorna: { data: UserListItemDto[], metadata: MetadataDto }
   */
  async list(query) {
    const paginationParams = PaginationHelper.getPaginationParams(query);
    const filters = PaginationHelper.buildFilters(query, ['isActive', 'roleId']);
    const searchTerm = query.search || null;

    const { rows, count } = await userRepository.findAllPaginated(
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
   */
  async getById(userId) {
    const user = await userRepository.findById(userId, {
      include: userRepository.constructor.INCLUDES.full
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
   * ✅ Arquitectura: Cognito primero, BD después (con rollback de Cognito si falla BD)
   */
  async create(userData, auditContext) {
    const transaction = await sequelize.transaction();
    let cognitoCreated = false;
    let cognitoUsername = null;
    
    try {
      const role = await roleRepository.findById(userData.roleId);
      if (!role) {
        throw AppError.notFound('Rol no encontrado');
      }

      KycSharedUtil.validateNationalIdByRole(userData.nationalId, role);

      const existingPerson = await personRepository.findByNationalId(userData.nationalId);
      if (existingPerson) {
        throw AppError.conflict('El National ID ya está registrado');
      }

      const existingContact = await personContactRepository.findByEmail(userData.email);
      if (existingContact) {
        throw AppError.conflict('El email ya está en uso');
      }

      const temporaryPassword = KycSharedUtil.generateSecurePassword();

      // ✅ Generar username único para Cognito (nunca cambia)
      cognitoUsername = `user_${uuidv4()}`;

      // ✅ 1. Crear en Cognito PRIMERO
      const cognitoData = await CognitoUtil.createUser({
        username: cognitoUsername,
        email: userData.email,
        password: temporaryPassword
      });
      cognitoCreated = true;

      // ✅ 2. Crear en BD DESPUÉS
      const person = await personRepository.create({
        first_name: userData.firstName,
        last_name: userData.lastName,
        national_id: userData.nationalId,
        birth_date: userData.birthDate || null,
        gender_id: userData.genderId || null,
        country_id: userData.countryId || null,
      }, { transaction });

      await personContactRepository.create({
        person_id: person.person_id,
        email: userData.email,
        email_verified_at: new Date(),
      }, { transaction });

      const user = await userRepository.create({
        username: userData.nationalId,           // ✅ Username visible para el usuario
        cognito_username: cognitoUsername,       // ✅ Username de Cognito (fijo, interno)
        person_id: person.person_id,
        role_id: userData.roleId,
        password: temporaryPassword,
        cognito_sub: cognitoData.sub
      }, { transaction });

      await transaction.commit();

      setImmediate(() => {
        EmailUtil.sendWelcomeEmail(userData.email, userData.firstName, temporaryPassword)
          .catch(err => logger.error('Error sending welcome email', { error: err.message }));
      });

      logger.info('User created successfully by admin', { 
        userId: user.user_id, 
        adminId: auditContext.adminUserId 
      });

      const fullUser = await userRepository.findById(user.user_id, {
        include: userRepository.constructor.INCLUDES.full
      });

      return new CreateUserDto(fullUser, temporaryPassword);
      
    } catch (error) {
      await transaction.rollback();
      
      // ✅ Rollback de Cognito si falla BD
      await CognitoUtil.deleteUser(cognitoUsername);
      
      logger.error('Error creating user', { error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - ACTIVACIÓN/DESACTIVACIÓN ====================
  
  /**
   * Activa/Desactiva un usuario
   * ✅ Solo BD (Cognito no requiere cambios)
   */
  async toggleUserStatus(userId, action, auditContext) {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const isActivating = action === 'activate';
      
      if (user.is_active === isActivating) {
        throw AppError.badRequest(`El usuario ya está ${isActivating ? 'activo' : 'inactivo'}`);
      }

      await userRepository.setActiveStatus(userId, isActivating, { transaction });

      await KycSharedUtil.logChange({
        userId: user.user_id,
        changedByUserId: auditContext.adminUserId,
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
   * ✅ Arquitectura: BD primero, Cognito después
   */
  async resetPassword(userId, auditContext) {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await userRepository.findById(userId, {
        include: [
          { 
            association: 'person', 
            include: [{ association: 'contact' }] 
          }
        ]
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const temporaryPassword = KycSharedUtil.generateSecurePassword();

      // ✅ 1. Actualizar BD primero
      await userRepository.update(userId, { 
        password: temporaryPassword 
      }, { transaction });

      await KycSharedUtil.logChange({
        userId: user.user_id,
        changedByUserId: auditContext.adminUserId,
        changedByRole: 'admin',
        changeType: 'password',
        previousValue: 'old_password',
        newValue: 'new_password',
        changeReason: 'Contraseña reseteada por administrador',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      // ✅ 2. Actualizar Cognito después
      await CognitoUtil.changeUserPassword(user.cognito_username, temporaryPassword);

      const email = user.person.contact.email;
      const firstName = user.person.first_name;

      setImmediate(() => {
        EmailUtil.sendPasswordResetEmail(email, firstName, temporaryPassword)
          .catch(err => logger.error('Error sending password reset email', { error: err.message }));
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
   * ✅ Arquitectura: BD primero, Cognito después
   */
  async changeEmail(userId, newEmail, auditContext) {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await userRepository.findById(userId, {
        include: [
          { 
            association: 'person', 
            include: [{ association: 'contact' }] 
          }
        ]
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const oldEmail = user.person.contact.email;

      if (oldEmail === newEmail) {
        throw AppError.badRequest('El nuevo email es igual al actual');
      }

      const existingContact = await personContactRepository.findByEmail(newEmail);
      if (existingContact) {
        throw AppError.conflict('El email ya está en uso por otro usuario');
      }

      // ✅ 1. Actualizar BD primero
      await personContactRepository.update(user.person.contact.person_contact_id, {
        email: newEmail,
        email_verified_at: new Date()
      }, { transaction });

      await KycSharedUtil.logChange({
        userId: user.user_id,
        changedByUserId: auditContext.adminUserId,
        changedByRole: 'admin',
        changeType: 'email',
        previousValue: oldEmail,
        newValue: newEmail,
        changeReason: 'Email actualizado por administrador',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      // ✅ 2. Actualizar Cognito después
      await CognitoUtil.updateEmail(user.cognito_username, newEmail);

      setImmediate(() => {
        EmailUtil.sendEmailChangeNotification(oldEmail, user.person.first_name, newEmail)
          .catch(err => logger.error('Error sending email change notification', { error: err.message }));
        
        EmailUtil.sendEmailChangeConfirmation(newEmail, user.person.first_name)
          .catch(err => logger.error('Error sending email change confirmation', { error: err.message }));
      });

      logger.info('Email changed successfully', { 
        userId, 
        oldEmail, 
        newEmail, 
        adminId: auditContext.adminUserId 
      });

      return new ChangeEmailDto(user, oldEmail, newEmail);
      
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Error changing email', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - CAMBIO DE NATIONAL ID ====================
  
  /**
   * Cambia el national_id de un usuario (admin)
   * ✅ Arquitectura SIMPLIFICADA: Solo actualizar atributo custom en Cognito + BD
   * ✅ NO requiere eliminar/recrear usuario en Cognito
   */
  async changeNationalId(userId, newNationalId, auditContext) {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await userRepository.findById(userId, {
        include: [
          { 
            association: 'person',
            include: [{ association: 'contact' }]
          },
          { association: 'role' }
        ]
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const oldNationalId = user.person.national_id;

      if (oldNationalId === newNationalId) {
        throw AppError.badRequest('El nuevo National ID es igual al actual');
      }

      KycSharedUtil.validateNationalIdByRole(newNationalId, user.role);

      const existingPerson = await personRepository.findByNationalId(newNationalId);
      if (existingPerson) {
        throw AppError.conflict('El National ID ya está registrado');
      }

      // ✅ 1. Actualizar BD primero
      await personRepository.update(user.person.person_id, {
        national_id: newNationalId
      }, { transaction });

      await KycSharedUtil.logChange({
        userId: user.user_id,
        changedByUserId: auditContext.adminUserId,
        changedByRole: 'admin',
        changeType: 'national_id',
        previousValue: oldNationalId,
        newValue: newNationalId,
        changeReason: 'National ID actualizado por administrador',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      const email = user.person.contact?.email;
      if (email) {
        setImmediate(() => {
          EmailUtil.sendNationalIdChangedEmail(email, user.person.first_name, oldNationalId, newNationalId)
            .catch(err => logger.error('Error sending national_id change email', { error: err.message }));
        });
      }

      logger.info('National ID changed successfully', { 
        userId, 
        oldNationalId, 
        newNationalId, 
        adminId: auditContext.adminUserId 
      });

      return new ChangeNationalIdDto(user, oldNationalId, newNationalId);
      
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Error changing national_id', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - DESHABILITAR MFA ====================
  
  /**
   * Desactiva el MFA (TOTP) de un usuario (admin)
   * ✅ Arquitectura: BD primero, Cognito después
   */
  async disableMFA(userId, auditContext) {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await userRepository.findById(userId, {
        include: [
          { 
            association: 'person', 
            include: [{ association: 'contact' }] 
          }
        ]
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      if (!user.totp_enabled) {
        throw AppError.badRequest('El usuario no tiene MFA habilitado');
      }

      // ✅ 1. Actualizar BD primero
      await userRepository.update(userId, { 
        totp_enabled: false,
        totp_secret: null 
      }, { transaction });

      await KycSharedUtil.logChange({
        userId: user.user_id,
        changedByUserId: auditContext.adminUserId,
        changedByRole: 'admin',
        changeType: 'mfa_status',
        previousValue: 'enabled',
        newValue: 'disabled',
        changeReason: 'MFA desactivado por administrador',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      await transaction.commit();

      // ✅ 2. Desactivar en Cognito después
      await CognitoUtil.disableTOTPMFA(user.cognito_username);

      const email = user.person.contact?.email;
      if (email) {
        setImmediate(() => {
          EmailUtil.sendMFADisabledEmail(email, user.person.first_name)
            .catch(err => logger.error('Error sending MFA disabled email', { error: err.message }));
        });
      }

      logger.info('MFA disabled successfully', { userId, adminId: auditContext.adminUserId });

      user.totp_enabled = false;
      return new DisableMFADto(user);
      
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
      logger.error('Error disabling MFA', { userId, error: error.message });
      throw error;
    }
  }

  // ==================== MÉTODOS PÚBLICOS - CAMBIO DE ROL ====================
  
  /**
   * Cambia el rol de un usuario (admin)
   * ✅ Solo BD (Cognito no requiere cambios)
   */
  async changeRole(userId, newRoleId, auditContext) {
    const transaction = await sequelize.transaction();
    
    try {
      const user = await userRepository.findById(userId, {
        include: [{ association: 'role' }]
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      if (user.role.name === 'admin') {
        throw AppError.badRequest('El usuario ya tiene este rol');
      }

      const newRole = await roleRepository.findById(newRoleId);
      if (!newRole) {
        throw AppError.notFound('Rol no encontrado');
      }

      if (user.role_id === newRoleId) {
        throw AppError.badRequest('El usuario ya tiene este rol');
      }

      const oldRole = user.role;

      await userRepository.update(userId, { role_id: newRoleId }, { transaction });

      await KycSharedUtil.logChange({
        userId: user.user_id,
        changedByUserId: auditContext.adminUserId,
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
   * ✅ Arquitectura: BD primero, Cognito después
   */
  async deleteAccount(userId, currentPassword, auditContext) {
    const transaction = await sequelize.transaction();

    try {
      // 1. Validar contraseña del admin
      const isValidPassword = await userRepository.verifyPassword(currentPassword, auditContext.passwordHash);
      if (!isValidPassword) {
        throw AppError.unauthorized('Contraseña de administrador incorrecta');
      }

      // 2. Obtener información completa del usuario a eliminar
      const user = await userRepository.findById(userId, {
        include: [
          { association: 'person', include: [{ association: 'contact' }] }
        ],
        transaction
      });

      if (!user) {
        throw AppError.notFound('Usuario no encontrado');
      }

      const nationalId = user.person.national_id;
      const personId = user.person.person_id;
      const personContact = user.person.contact;
      const email = personContact.email;
      const firstName = user.person.first_name;
      const cognitoUsername = user.cognito_username;

      const eliminatedDate = new Date().toISOString().split('T')[0];

      // 3. Actualizar national_id en tabla person
      const newNationalId = `eliminated_${eliminatedDate}_${nationalId}`;
      await personRepository.update(personId, {
        national_id: newNationalId
      }, { transaction });

      // 4. Actualizar username y desactivar usuario
      const newUsername = `eliminated_${eliminatedDate}_${user.username}`;
      await userRepository.update(userId, {
        username: newUsername,
        is_active: false
      }, { transaction });

      // 5. Actualizar email y teléfonos
      const contactUpdates = {
        email: `eliminated_${eliminatedDate}_${personContact.email}`,
      };

      if (personContact.phone_primary) {
        contactUpdates.phone_primary = `eliminated_${eliminatedDate}_${personContact.phone_primary}`;
      }

      if (personContact.phone_secondary) {
        contactUpdates.phone_secondary = `eliminated_${eliminatedDate}_${personContact.phone_secondary}`;
      }

      await personContactRepository.update(personContact.person_contact_id, contactUpdates, { transaction });

      // 6. Registrar cambio en auditoría
      await KycSharedUtil.logChange({
        userId: user.user_id,
        changedByUserId: auditContext.adminUserId,
        changedByRole: 'admin',
        changeType: 'account_status',
        previousValue: 'active',
        newValue: 'eliminated',
        changeReason: 'Cuenta eliminada por administrador',
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
      }, { transaction });

      // 7. Commit BD
      await transaction.commit();

      // 8. ✅ Eliminar de Cognito DESPUÉS
      await CognitoUtil.deleteUser(cognitoUsername);

      // 9. Enviar email de notificación
      if (email) {
        setImmediate(() => {
          EmailUtil.sendAccountDeletionEmail(email, firstName)
            .catch(err => logger.error('Error sending account deletion email', { 
              userId,
              error: err.message 
            }));
        });
      }

      logger.info('Account deleted successfully by admin', { 
        userId, 
        adminId: auditContext.adminUserId,
        nationalId: newNationalId 
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

module.exports = new KycPersonService();