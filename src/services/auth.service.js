// src/services/auth.service.js
const userRepository = require('../repository/user.repository');
const loginAttemptsRepository = require('../repository/loginAttempts.repository');
const JWTUtil = require('../utils/jwt');
const DeviceFingerprint = require('../utils/deviceFingerprint');
const AppError = require('../utils/AppError');
const { AuthResponseDTO } = require('../dto/auth.dto');
const { logger, logAudit } = require('../utils/logger');
const { ERRORS, SUCCESS } = require('../constants/messages');
const { AUDIT_ACTIONS } = require('../constants');

class AuthService {
  /**
   * Genera device fingerprint desde auditContext
   * @private
   */
  _getDeviceFingerprint(auditContext) {
    // Construye un objeto req-like desde auditContext
    const pseudoReq = {
      headers: {
        'user-agent': auditContext.userAgent || 'unknown'
      },
      ip: auditContext.ip || 'unknown',
      connection: {
        remoteAddress: auditContext.ip || 'unknown'
      }
    };
    
    return DeviceFingerprint.generate(pseudoReq);
  }

  /**
   * Genera metadata del dispositivo desde auditContext
   * @private
   */
  _getDeviceMetadata(auditContext) {
    const { browser, os } = DeviceFingerprint.parseUserAgent(
      auditContext.userAgent || 'unknown'
    );
    
    return {
      ip: auditContext.ip || 'unknown',
      browser,
      os,
      userAgent: auditContext.userAgent || 'unknown'
    };
  }

  /**
   * Register new user
   */
  async register(registerDTO, auditContext) {
    const existingUser = await userRepository.findByEmail(registerDTO.email);
    
    if (existingUser) {
      throw AppError.conflict(ERRORS.USER_ALREADY_EXISTS);
    }

    const user = await userRepository.create({
      email: registerDTO.email,
      password: registerDTO.password,
      name: registerDTO.name,
      role: registerDTO.role
    });

    const deviceFingerprint = this._getDeviceFingerprint(auditContext);
    const deviceMetadata = this._getDeviceMetadata(auditContext);
    
    const tokens = await JWTUtil.generateTokenPair(user, deviceFingerprint, deviceMetadata);

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
   */
  async login(loginDTO, auditContext) {
    const { email, password } = loginDTO;
    const ipAddress = auditContext.ip;

    const existingUser = await userRepository.findByEmail(email);
    
    if (!existingUser) {
      throw AppError.conflict(ERRORS.USER_NOT_FOUND);
    }

    const isBlocked = await loginAttemptsRepository.isBlocked(email);
    
    if (isBlocked) {
      const remainingTime = await loginAttemptsRepository.getRemainingBlockTime(email);
      throw AppError.tooManyRequests(
        `${ERRORS.ACCOUNT_BLOCKED}. Tiempo restante: ${Math.ceil(remainingTime / 60)} minutos`
      );
    }

    const user = await userRepository.findActiveByEmail(email);

    if (!user) {
      await loginAttemptsRepository.incrementAttempts(email, ipAddress);
      throw AppError.unauthorized(ERRORS.INVALID_CREDENTIALS);
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      await loginAttemptsRepository.incrementAttempts(email, ipAddress);
      throw AppError.unauthorized(ERRORS.INVALID_CREDENTIALS);
    }

    await loginAttemptsRepository.resetAttempts(email);
    await userRepository.updateLastLogin(user.id);

    const deviceFingerprint = this._getDeviceFingerprint(auditContext);
    const deviceMetadata = this._getDeviceMetadata(auditContext);
    
    const tokens = await JWTUtil.generateTokenPair(user, deviceFingerprint, deviceMetadata);

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
   */
  async logout(userId, accessToken, refreshTokenDTO, auditContext) {
    const { refreshToken } = refreshTokenDTO;

    await JWTUtil.blacklistToken(accessToken);

    const deviceFingerprint = this._getDeviceFingerprint(auditContext);
    await JWTUtil.invalidateRefreshToken(refreshToken, deviceFingerprint);

    logAudit(AUDIT_ACTIONS.USER_LOGOUT, userId, {}, auditContext);

    logger.info('User logged out successfully', { userId });

    return { message: SUCCESS.LOGOUT_SUCCESS };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenDTO, auditContext) {
    const { refreshToken } = refreshTokenDTO;

    const decoded = JWTUtil.verifyRefreshToken(refreshToken);

    const deviceFingerprint = this._getDeviceFingerprint(auditContext);
    const isValid = await JWTUtil.verifyStoredRefreshToken(refreshToken, deviceFingerprint);

    if (!isValid) {
      throw AppError.unauthorized(ERRORS.TOKEN_INVALID);
    }

    const user = await userRepository.findById(decoded.id);

    if (!user || !user.isActive) {
      throw AppError.unauthorized(ERRORS.USER_NOT_FOUND);
    }

    await JWTUtil.invalidateRefreshToken(refreshToken, deviceFingerprint);

    const deviceMetadata = this._getDeviceMetadata(auditContext);
    const tokens = await JWTUtil.generateTokenPair(user, deviceFingerprint, deviceMetadata);

    logger.info('Token refreshed successfully', { userId: user.id });

    return AuthResponseDTO.fromData(user, tokens);
  }

  /**
   * Get active sessions
   */
  async getActiveSessions(userId, auditContext) {
    const sessions = await JWTUtil.getActiveSessions(userId);
    
    const currentFingerprint = this._getDeviceFingerprint(auditContext);
    
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionId === currentFingerprint
    }));

    logger.info('Active sessions retrieved', { userId, count: sessions.length });

    return sessionsWithCurrent;
  }

  /**
   * Logout specific session
   */
  async logoutSession(userId, sessionId, auditContext) {
    const deleted = await JWTUtil.invalidateSession(userId, sessionId);
    
    if (!deleted) {
      throw AppError.notFound('Sesión no encontrada');
    }

    logAudit(AUDIT_ACTIONS.USER_LOGOUT, userId, { sessionId }, auditContext);

    logger.info('Session logged out', { userId, sessionId });

    return { message: 'Sesión cerrada exitosamente' };
  }

  /**
   * Logout all sessions
   */
  async logoutAllSessions(userId, auditContext) {
    const count = await JWTUtil.invalidateAllSessions(userId);

    logAudit(AUDIT_ACTIONS.USER_LOGOUT, userId, { allSessions: true, count }, auditContext);

    logger.info('All sessions logged out', { userId, count });

    return { message: `${count} sesiones cerradas exitosamente` };
  }
}

module.exports = new AuthService();