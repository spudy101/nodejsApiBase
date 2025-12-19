const { User, LoginAttempts } = require('../models');
const { sequelize } = require('../models');
const { executeWithTransaction, executeQuery } = require('../utils/transactionWrapper');
const { generateToken } = require('../utils/jwtHelper');
const logger = require('../utils/logger');

class AuthService {
  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    return executeWithTransaction(
      userData,
      async (data, transaction) => {
        // Crear usuario (el hook beforeCreate hasheará la password)
        const user = await User.create({
          email: data.email,
          password: data.password,
          name: data.name,
          role: data.role || 'user'
        }, { transaction });

        logger.info('Usuario registrado exitosamente', { 
          userId: user.id, 
          email: user.email 
        });

        // Generar token
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role
        });

        // Retornar usuario sin password
        const userJson = user.toJSON();

        return {
          user: userJson,
          token
        };
      },
      'registerUser',
      { sequelize }
    );
  }

  /**
   * Login de usuario
   */
  async login(email, password) {
    return executeQuery(
      async () => {
        // Verificar intentos de login
        let loginAttempt = await LoginAttempts.findOne({ where: { email } });

        if (loginAttempt && loginAttempt.blockedUntil && new Date() < new Date(loginAttempt.blockedUntil)) {
             const timeLeft = Math.ceil((new Date(loginAttempt.blockedUntil) - new Date()) / 60000);
             throw new Error(`Cuenta bloqueada temporalmente. Intenta nuevamente en ${timeLeft} minutos.`);
        }

        // Buscar usuario por email
        const user = await User.findOne({ 
          where: { email }
        });

        if (!user) {
          // Registrar intento fallido si el usuario no existe (para evitar enumeración, o simplemente trackear por email)
          await this.handleFailedAttempt(email, loginAttempt);
          logger.warn('Intento de login con email no registrado', { email });
          throw new Error('Credenciales inválidas');
        }

        // Verificar si está activo
        if (!user.isActive) {
          logger.warn('Intento de login con usuario inactivo', { 
            userId: user.id, 
            email 
          });
          throw new Error('Usuario inactivo');
        }

        // Verificar contraseña
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
          await this.handleFailedAttempt(email, loginAttempt);
          logger.warn('Intento de login con contraseña incorrecta', { 
            userId: user.id, 
            email 
          });
          throw new Error('Credenciales inválidas');
        }

        // Login exitoso: resetear intentos
        if (loginAttempt) {
            loginAttempt.attempts = 0;
            loginAttempt.blockedUntil = null;
            await loginAttempt.save();
        }

        // Actualizar último login
        user.lastLogin = new Date();
        await user.save();

        logger.info('Usuario inició sesión exitosamente', { 
          userId: user.id, 
          email 
        });

        // Generar token
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.role
        });

        // Retornar usuario sin password
        const userJson = user.toJSON();

        return {
          user: userJson,
          token
        };
      },
      'loginUser',
      sequelize
    );
  }

  /**
   * Obtener perfil de usuario
   */
  async getProfile(userId) {
    return executeQuery(
      async () => {
        const user = await User.findByPk(userId, {
          attributes: { exclude: ['password'] }
        });

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        logger.debug('Perfil obtenido', { userId });

        return user.toJSON();
      },
      'getProfile',
      sequelize
    );
  }

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(userId, updateData) {
    return executeWithTransaction(
      { userId, ...updateData },
      async (data, transaction) => {
        const user = await User.findByPk(data.userId, { transaction });

        if (!user) {
          return {
            _rollback: true,
            message: 'Usuario no encontrado',
            data: null
          };
        }

        // Actualizar campos permitidos
        if (data.name) user.name = data.name;
        if (data.email) user.email = data.email;

        await user.save({ transaction });

        logger.info('Perfil actualizado', { 
          userId: user.id, 
          email: user.email 
        });

        return user.toJSON();
      },
      'updateProfile',
      { sequelize }
    );
  }

  /**
   * Cambiar contraseña
   */
  async changePassword(userId, currentPassword, newPassword) {
    return executeWithTransaction(
      { userId, currentPassword, newPassword },
      async (data, transaction) => {
        const user = await User.findByPk(data.userId, { transaction });

        if (!user) {
          return {
            _rollback: true,
            message: 'Usuario no encontrado',
            data: null
          };
        }

        // Verificar contraseña actual
        const isCurrentPasswordValid = await user.comparePassword(data.currentPassword);

        if (!isCurrentPasswordValid) {
          logger.warn('Intento de cambio de contraseña con contraseña actual incorrecta', { 
            userId: user.id 
          });

          return {
            _rollback: true,
            message: 'La contraseña actual es incorrecta',
            data: null
          };
        }

        // Actualizar contraseña (el hook beforeUpdate hasheará la nueva password)
        user.password = data.newPassword;
        await user.save({ transaction });

        logger.info('Contraseña cambiada exitosamente', { userId: user.id });

        return { message: 'Contraseña actualizada exitosamente' };
      },
      'changePassword',
      { sequelize }
    );
  }

  /**
   * Desactivar usuario (soft delete)
   */
  async deactivateUser(userId) {
    return executeWithTransaction(
      { userId },
      async (data, transaction) => {
        const user = await User.findByPk(data.userId, { transaction });

        if (!user) {
          return {
            _rollback: true,
            message: 'Usuario no encontrado',
            data: null
          };
        }

        user.isActive = false;
        await user.save({ transaction });

        logger.info('Usuario desactivado', { userId: user.id });

        return { message: 'Usuario desactivado exitosamente' };
      },
      'deactivateUser',
      { sequelize }
    );
  }

  /**
   * Activar usuario
   */
  async activateUser(userId) {
    return executeWithTransaction(
      { userId },
      async (data, transaction) => {
        const user = await User.findByPk(data.userId, { transaction });

        if (!user) {
          return {
            _rollback: true,
            message: 'Usuario no encontrado',
            data: null
          };
        }

        user.isActive = true;
        await user.save({ transaction });

        logger.info('Usuario activado', { userId: user.id });

        return { message: 'Usuario activado exitosamente' };
      },
      'activateUser',
      { sequelize }
    );
  }

  /**
   * Manejar intento fallido
   */
  async handleFailedAttempt(email, loginAttempt) {
    const MAX_ATTEMPTS = 5;
    const BLOCK_DURATION_MINUTES = 15;

    if (!loginAttempt) {
        await LoginAttempts.create({
            email,
            attempts: 1,
            ipAddress: null // Podría pasarse si se modifica la firma
        });
    } else {
        loginAttempt.attempts += 1;
        
        if (loginAttempt.attempts >= MAX_ATTEMPTS) {
            const blockedUntil = new Date();
            blockedUntil.setMinutes(blockedUntil.getMinutes() + BLOCK_DURATION_MINUTES);
            loginAttempt.blockedUntil = blockedUntil;
        }
        
        await loginAttempt.save();
    }
  }
}

module.exports = new AuthService();