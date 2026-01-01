// src/services/auth.service.js
const userRepository = require('../repository/user.repository');
const loginAttemptsRepository = require('../repository/loginAttempts.repository');
const JWTUtil = require('../utils/jwt');
const AppError = require('../utils/AppError');
const { AuthResponseDTO } = require('../dto/auth.dto');
const { logger, logAudit } = require('../utils/logger');
const { ERRORS, SUCCESS } = require('../constants/messages');
const { AUDIT_ACTIONS } = require('../constants');

class AuthService {
  /**
   * Register new user
   * @param {RegisterDTO} registerDTO - DTO con datos de registro
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {AuthResponseDTO} Usuario y tokens
   */
  async register(registerDTO, auditContext) {
    // Validación de negocio: Check if email already exists
    const existingUser = await userRepository.findByEmail(registerDTO.email);
    
    if (existingUser) {
      throw AppError.conflict(ERRORS.USER_ALREADY_EXISTS);
    }

    // Create user
    const user = await userRepository.create({
      email: registerDTO.email,
      password: registerDTO.password,
      name: registerDTO.name,
      role: registerDTO.role
    });

    // Generate tokens
    const tokens = await JWTUtil.generateTokenPair(user);

    // Audit log
    logAudit(AUDIT_ACTIONS.USER_REGISTER, user.id, {
      email: user.email,
      role: user.role
    }, auditContext);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email
    });

    return AuthResponseDTO.fromData(user, tokens);
  }

  /**
   * Login user
   * @param {LoginDTO} loginDTO - DTO con credenciales
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {AuthResponseDTO} Usuario y tokens
   */
  async login(loginDTO, auditContext) {
    const { email, password } = loginDTO;
    const ipAddress = auditContext.ip;

    // Validación de negocio: Check if account is blocked
    const isBlocked = await loginAttemptsRepository.isBlocked(email);
    
    if (isBlocked) {
      const remainingTime = await loginAttemptsRepository.getRemainingBlockTime(email);
      throw AppError.tooManyRequests(
        `${ERRORS.ACCOUNT_BLOCKED}. Tiempo restante: ${Math.ceil(remainingTime / 60)} minutos`
      );
    }

    // Validación de negocio: Find user
    const user = await userRepository.findActiveByEmail(email);

    if (!user) {
      await loginAttemptsRepository.incrementAttempts(email, ipAddress);
      throw AppError.unauthorized(ERRORS.INVALID_CREDENTIALS);
    }

    // Validación de negocio: Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await loginAttemptsRepository.incrementAttempts(email, ipAddress);
      throw AppError.unauthorized(ERRORS.INVALID_CREDENTIALS);
    }

    // Reset login attempts on successful login
    await loginAttemptsRepository.resetAttempts(email);

    // Update last login
    await userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await JWTUtil.generateTokenPair(user);

    // Audit log
    logAudit(AUDIT_ACTIONS.USER_LOGIN, user.id, {
      email: user.email,
      ipAddress
    }, auditContext);

    logger.info('User logged in successfully', {
      userId: user.id,
      email: user.email
    });

    return AuthResponseDTO.fromData(user, tokens);
  }

  /**
   * Logout user
   * @param {string} userId - ID del usuario
   * @param {string} token - Access token a invalidar
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {Object} Mensaje de confirmación
   */
  async logout(userId, token, auditContext) {
    // Blacklist access token
    await JWTUtil.blacklistToken(token);

    // Invalidate refresh token
    await JWTUtil.invalidateRefreshToken(userId);

    // Audit log
    logAudit(AUDIT_ACTIONS.USER_LOGOUT, userId, {}, auditContext);

    logger.info('User logged out successfully', { userId });

    return { message: SUCCESS.LOGOUT_SUCCESS };
  }

  /**
   * Refresh access token
   * @param {RefreshTokenDTO} refreshTokenDTO - DTO con refresh token
   * @param {Object} auditContext - Contexto de auditoría
   * @returns {AuthResponseDTO} Usuario y nuevos tokens
   */
  async refreshToken(refreshTokenDTO, auditContext) {
    const { refreshToken } = refreshTokenDTO;

    // Verify refresh token
    const decoded = JWTUtil.verifyRefreshToken(refreshToken);

    // Verify stored refresh token
    const isValid = await JWTUtil.verifyStoredRefreshToken(decoded.id, refreshToken);

    if (!isValid) {
      throw AppError.unauthorized(ERRORS.TOKEN_INVALID);
    }

    // Get user
    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      throw AppError.unauthorized(ERRORS.USER_NOT_FOUND);
    }

    // Generate new token pair
    const tokens = await JWTUtil.generateTokenPair(user);

    logger.info('Token refreshed successfully', { userId: user.id });

    return AuthResponseDTO.fromData(user, tokens);
  }

  /**
   * Verify token validity
   * @param {string} token - Token a verificar
   * @returns {Object} Resultado de validación
   */
  async verifyToken(token) {
    try {
      // Check if blacklisted
      const isBlacklisted = await JWTUtil.isTokenBlacklisted(token);
      
      if (isBlacklisted) {
        return { valid: false, reason: 'Token blacklisted' };
      }

      // Verify token
      const decoded = JWTUtil.verifyAccessToken(token);

      // Check user exists and is active
      const user = await userRepository.findById(decoded.id);

      if (!user || !user.isActive) {
        return { valid: false, reason: 'User not found or inactive' };
      }

      return { valid: true, user: user.toJSON() };
    } catch (error) {
      return { valid: false, reason: error.message };
    }
  }
}

module.exports = new AuthService();
