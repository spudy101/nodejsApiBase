'use strict';

const userRepository = require('../repositories/user.repository');
const userLoginAttemptRepository = require('../repositories/userLoginAttempt.repository');
const { LoginResponseDTO, MFARequiredResponseDTO } = require('../dtos/auth.dto');
const { Op } = require('sequelize');
const SessionCacheUtil = require('../utils/sessionCache.util');
const CognitoUtil = require('../utils/cognito.util');
const AppError = require('../utils/appError.util');
const { logger } = require('../utils/logger.util');
const { loginAttempts } = require('../constants');

class AuthService {
  async login(data, auditContext) {
    const { nationalId, password } = data;
    const { ip, userAgent, device_fingerprint } = auditContext;

    await this._checkAccountBlock(nationalId);

    const user = await this._getUserForLogin(nationalId);
    
    const isValid = await userRepository.verifyPassword(password, user.password_hash);
    if (!isValid) {
      await this._handleFailedLogin(user, nationalId, user.cognito_username, { ip, userAgent, device_fingerprint }, 'Contraseña inválida');
    }

    const authResult = await this._authenticateWithCognito(user, nationalId, user.cognito_username, password, { ip, userAgent, device_fingerprint });

    if (authResult.challengeName) {
      logger.info('MFA required for user', { 
        userId: user.user_id, 
        challengeType: authResult.challengeName 
      });

      return new MFARequiredResponseDTO({
        username: authResult.username,
        session: authResult.session,
        challengeType: authResult.challengeName,
      });
    }

    return await this._completeSuccessfulLogin(user, nationalId, user.cognito_username, device_fingerprint, authResult, auditContext);
  }

  async verifyMFA(data, auditContext) {
    const { nationalId, totpCode, session } = data;
    const { ip, userAgent, device_fingerprint } = auditContext;

    await this._checkAccountBlock(nationalId);
    
    const user = await this._getUserForLogin(nationalId);

    let tokens;
    try {
      tokens = await CognitoUtil.respondToTOTPChallenge(user.cognito_username, totpCode, session);
    } catch (error) {
      await userLoginAttemptRepository.recordAttempt({
        user_id: user.user_id,
        username_attempt: user.cognito_username,
        national_id: nationalId,
        ip_address: ip,
        user_agent: userAgent,
        device_fingerprint,
        success: false,
        failure_reason: 'Código TOTP incorrecto',
      });

      throw error;
    }

    return await this._completeSuccessfulLogin(user, nationalId, user.cognito_username, device_fingerprint, tokens, auditContext);
  }

  async refreshToken(refreshToken, nationalId, deviceFingerprint) {
    const user = await userRepository.findByNationalId(nationalId);

    if (!user) {
      throw AppError.unauthorized('Usuario no encontrado');
    }

    const tokens = await CognitoUtil.refreshAccessToken(refreshToken, user.cognito_username);

    await SessionCacheUtil.storeSession(
      user.user_id,
      deviceFingerprint,
      { ...tokens, refreshToken },
      tokens.expiresIn
    ).catch(err => logger.error('Error updating cache on refresh', { error: err.message }));

    return {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      expiresIn: tokens.expiresIn,
    };
  }

  async logout(userId, deviceFingerprint) {
    await SessionCacheUtil.deleteSession(userId, deviceFingerprint);
    await userLoginAttemptRepository.clearSessionCacheKey(userId, deviceFingerprint);
    
    logger.info('Session closed', { userId, deviceFingerprint });
    return null;
  }

  async logoutAll(userId) {
    const deletedCount = await SessionCacheUtil.deleteAllUserSessions(userId);
    await userLoginAttemptRepository.clearAllSessionCacheKeys(userId);
    
    logger.info('All sessions closed', { userId, count: deletedCount });
    return { count: deletedCount };
  }

  async getActiveSessions(userId, currentDeviceFingerprint) {
    const loginAttempts = await userLoginAttemptRepository.findAll(
      { user_id: userId, success: true, session_cache_key: { [Op.ne]: null } },
      { order: [['attempted_at', 'DESC']] }
    );

    const validSessions = await this._filterValidSessions(loginAttempts, userId, currentDeviceFingerprint);

    return { sessions: validSessions, totalActive: validSessions.length };
  }

  async logoutDevice(userId, targetDeviceFingerprint) {
    const session = await SessionCacheUtil.getSession(userId, targetDeviceFingerprint);
    
    if (!session) {
      throw AppError.notFound('Sesión no encontrada o ya expirada');
    }

    await SessionCacheUtil.deleteSession(userId, targetDeviceFingerprint);
    await userLoginAttemptRepository.clearSessionCacheKey(userId, targetDeviceFingerprint);

    logger.info('Device session closed', { userId, device: targetDeviceFingerprint });
    return null;
  }

  async _checkAccountBlock(nationalId) {
    const blockStatus = await userLoginAttemptRepository.checkIfBlocked(nationalId);
    
    if (blockStatus?.blocked) {
      throw AppError.forbidden(
        `Cuenta bloqueada temporalmente. Intenta nuevamente en ${blockStatus.remainingMinutes} minutos`
      );
    }
  }

  async _getUserForLogin(nationalId) {
    const user = await userRepository.findByUsernameAndNationalId(nationalId);

    if (!user) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Cuenta inactiva o suspendida');
    }

    return user;
  }

  async _handleFailedLogin(user, nationalId, cognitoUsername, auditContext, reason) {
    const failedAttempts = await userLoginAttemptRepository.countFailedAttempts(nationalId);
    const newAttemptCount = failedAttempts + 1;
    const MAX_LOGIN_ATTEMPTS = loginAttempts.maxAttempts;
    const BLOCK_DURATION_MINUTES = loginAttempts.blockDurationMinutes;

    console.log(MAX_LOGIN_ATTEMPTS);
    console.log(BLOCK_DURATION_MINUTES);

    let blockedUntil = null;
    if (newAttemptCount >= MAX_LOGIN_ATTEMPTS) {
      blockedUntil = new Date(Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000);
    }

    await userLoginAttemptRepository.recordAttempt({
      user_id: user.user_id,
      username_attempt: cognitoUsername,
      national_id: nationalId,
      ip_address: auditContext.ip,
      user_agent: auditContext.userAgent,
      device_fingerprint: auditContext.device_fingerprint,
      success: false,
      failure_reason: reason,
      blocked_until: blockedUntil,
    });

    const remainingAttempts = Math.max(0, MAX_LOGIN_ATTEMPTS - newAttemptCount);

    if (newAttemptCount >= MAX_LOGIN_ATTEMPTS) {
      throw AppError.forbidden(
        `Cuenta bloqueada por ${BLOCK_DURATION_MINUTES} minutos debido a múltiples intentos fallidos`
      );
    }

    throw AppError.unauthorized(`Contraseña incorrecta. Te quedan ${remainingAttempts} intentos`);
  }

  async _authenticateWithCognito(user, nationalId, cognitoUsername, password, auditContext) {
    try {
      return await CognitoUtil.authenticateUser(cognitoUsername, password);
    } catch (error) {
      await userLoginAttemptRepository.recordAttempt({
        user_id: user.user_id,
        username_attempt: cognitoUsername,
        national_id: nationalId,
        ip_address: auditContext.ip,
        user_agent: auditContext.userAgent,
        device_fingerprint: auditContext.device_fingerprint,
        success: false,
        failure_reason: 'Error en Cognito',
      });

      throw AppError.serverError('Error al autenticar usuario');
    }
  }

  async _manageSession(userId, deviceFingerprint, tokens) {
    const existingSession = await SessionCacheUtil.getSession(userId, deviceFingerprint);
    if (existingSession) {
      await SessionCacheUtil.deleteSession(userId, deviceFingerprint);
    }

    return await SessionCacheUtil.storeSession(
      userId,
      deviceFingerprint,
      tokens,
      tokens.expiresIn
    ).catch(err => {
      logger.error('Error storing session in cache', { error: err.message });
      return null;
    });
  }

  async _completeSuccessfulLogin(user, nationalId, cognitoUsername, deviceFingerprint, tokens, auditContext) {
    const sessionKey = await this._manageSession(user.user_id, deviceFingerprint, tokens);

    const loginAttempt = await userLoginAttemptRepository.recordAttempt({
      user_id: user.user_id,
      username_attempt: cognitoUsername,
      national_id: nationalId,
      ip_address: auditContext.ip,
      user_agent: auditContext.userAgent,
      device_fingerprint: deviceFingerprint,
      success: true,
      session_cache_key: sessionKey,
    });

    await userLoginAttemptRepository.invalidatePreviousDeviceSession(
      user.user_id,
      deviceFingerprint,
      loginAttempt.user_login_attempt_id
    );

    logger.info('Login completed successfully', { 
      userId: user.user_id, 
      nationalId, 
      cognitoUsername 
    });

    return new LoginResponseDTO({ user, tokens });
  }

  async _filterValidSessions(loginAttempts, userId, currentDeviceFingerprint) {
    const validSessions = [];

    for (const attempt of loginAttempts) {
      const sessionInCache = await SessionCacheUtil.getSession(userId, attempt.device_fingerprint);

      if (sessionInCache) {
        validSessions.push({
          attemptId: attempt.user_login_attempt_id,
          deviceFingerprint: attempt.device_fingerprint,
          ipAddress: attempt.ip_address,
          lastActivity: sessionInCache.createdAt,
          loginTime: attempt.attempted_at,
          isCurrent: attempt.device_fingerprint === currentDeviceFingerprint,
        });
      } else {
        await userLoginAttemptRepository.clearSessionCacheKey(userId, attempt.device_fingerprint);
      }
    }

    return validSessions;
  }
}

module.exports = new AuthService();