'use strict';

const UserRepository = require('../../infrastructure/database/repositories/user.repository');
const LoginAttemptRepository = require('../../infrastructure/database/repositories/loginAttempt.repository');
const { LoginResponseDTO, MFARequiredResponseDTO } = require('../../api/dtos/auth.dto');
const { SessionCacheUtil } = require('@abundbank/shared');
const { cognitoUtil } = require('@abundbank/shared');
const { AppError } = require('@abundbank/shared');
const { logger } = require('@abundbank/shared');
const db = require('../../infrastructure/database');
const { SECURITY } = require('@abundbank/shared');

// Instanciar repositories
const userRepository = new UserRepository(db.User, db);
const loginAttemptRepository = new LoginAttemptRepository(db.LoginAttempt, db);

class AuthService {
  /**
   * Inicia sesión de usuario con credenciales
   * @param {Object} data - { nationalId, password }
   * @param {Object} auditContext - { ip, userAgent, device_fingerprint }
   */
  async login(data, auditContext) {
    const { nationalId, password } = data;
    const { ip, userAgent, device_fingerprint } = auditContext;

    await this._checkAccountBlock(nationalId);

    // ✅ UNA SOLA QUERY: Trae user + person + role + avatar en un solo hit
    const user = await this._getUserForLogin(nationalId);
    
    const isValid = await userRepository.verifyPassword(password, user.password_hash);
    if (!isValid) {
      await this._handleFailedLogin(
        user, 
        nationalId, 
        user.cognito_username, 
        { ip, userAgent, device_fingerprint }, 
        'Contraseña inválida'
      );
    }

    const authResult = await this._authenticateWithCognito(
      user, 
      nationalId, 
      user.cognito_username, 
      password, 
      { ip, userAgent, device_fingerprint }
    );

    if (authResult.challengeName) {
      logger.info('MFA required for user', { 
        userId: user.id, 
        challengeType: authResult.challengeName 
      });

      return new MFARequiredResponseDTO({
        username: authResult.username,
        session: authResult.session,
        challengeType: authResult.challengeName,
      });
    }

    return await this._completeSuccessfulLogin(
      user, 
      nationalId, 
      user.cognito_username, 
      device_fingerprint, 
      authResult, 
      auditContext
    );
  }

  /**
   * Verifica código MFA (TOTP)
   * @param {Object} data - { nationalId, totpCode, session }
   * @param {Object} auditContext - { ip, userAgent, device_fingerprint }
   */
  async verifyMFA(data, auditContext) {
    const { nationalId, totpCode, session } = data;
    const { ip, userAgent, device_fingerprint } = auditContext;

    await this._checkAccountBlock(nationalId);
    
    // ✅ UNA SOLA QUERY con include 'basic'
    const user = await this._getUserForLogin(nationalId);

    let tokens;
    try {
      tokens = await cognitoUtil.respondToTOTPChallenge(user.cognito_username, totpCode, session);
    } catch (error) {
      await loginAttemptRepository.recordAttempt({
        person_id: user.person.id, // ✅ Ya viene incluido desde el query anterior
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

    return await this._completeSuccessfulLogin(
      user, 
      nationalId, 
      user.cognito_username, 
      device_fingerprint, 
      tokens, 
      auditContext
    );
  }

  /**
   * Refresca el access token usando refresh token
   * @param {string} refreshToken
   * @param {string} nationalId
   * @param {string} deviceFingerprint
   */
  async refreshToken(refreshToken, nationalId, deviceFingerprint) {
    // ✅ Consulta ligera: solo trae id y cognito_username
    const user = await userRepository.findByUsernameAndNationalId(nationalId, 'minimal');

    if (!user) {
      throw AppError.unauthorized('Usuario no encontrado');
    }

    const tokens = await cognitoUtil.refreshToken(refreshToken, user.cognito_username);

    await SessionCacheUtil.storeSession(
      user.id,
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

  /**
   * Cierra sesión en un dispositivo específico
   * @param {string} userId - ID del usuario
   * @param {string} deviceFingerprint - Fingerprint del dispositivo
   */
  async logout(userId, deviceFingerprint) {
    await SessionCacheUtil.deleteSession(userId, deviceFingerprint);
    await loginAttemptRepository.clearSessionCacheKey(userId, deviceFingerprint);
    
    logger.info('Session closed', { userId, deviceFingerprint });
    return null;
  }

  /**
   * Cierra todas las sesiones del usuario
   * @param {string} userId - ID del usuario
   */
  async logoutAll(userId) {
    const deletedCount = await SessionCacheUtil.deleteAllUserSessions(userId);
    await loginAttemptRepository.clearAllSessionCacheKeys(userId);
    
    logger.info('All sessions closed', { userId, count: deletedCount });
    return { count: deletedCount };
  }

  /**
   * Obtiene todas las sesiones activas del usuario
   * @param {string} userId - ID del usuario
   * @param {string} currentDeviceFingerprint - Fingerprint del dispositivo actual
   */
  async getActiveSessions(userId, currentDeviceFingerprint) {
    // ✅ Optimizado: usar el método específico del repository
    const loginAttempts = await loginAttemptRepository.getActiveSessionAttempts(userId);

    const validSessions = await this._filterValidSessions(
      loginAttempts, 
      userId, 
      currentDeviceFingerprint
    );

    return { sessions: validSessions, totalActive: validSessions.length };
  }

  /**
   * Cierra sesión en un dispositivo específico
   * @param {string} userId - ID del usuario
   * @param {string} targetDeviceFingerprint - Fingerprint del dispositivo a cerrar
   */
  async logoutDevice(userId, targetDeviceFingerprint) {
    const session = await SessionCacheUtil.getSession(userId, targetDeviceFingerprint);
    
    if (!session) {
      throw AppError.notFound('Sesión no encontrada o ya expirada');
    }

    await SessionCacheUtil.deleteSession(userId, targetDeviceFingerprint);
    await loginAttemptRepository.clearSessionCacheKey(userId, targetDeviceFingerprint);

    logger.info('Device session closed', { userId, device: targetDeviceFingerprint });
    return null;
  }

  // ==================== MÉTODOS PRIVADOS ====================

  /**
   * Verifica si la cuenta está bloqueada por intentos fallidos
   * @private
   */
  async _checkAccountBlock(nationalId) {
    const blockStatus = await loginAttemptRepository.checkIfBlocked(nationalId);
    
    if (blockStatus?.blocked) {
      throw AppError.forbidden(
        `Cuenta bloqueada temporalmente. Intenta nuevamente en ${blockStatus.remainingMinutes} minutos`
      );
    }
  }

  /**
   * Obtiene usuario para login (valida existencia y estado)
   * ✅ OPTIMIZADO: Usa include 'basic' que trae person, role, avatar en UNA SOLA QUERY
   * @private
   */
  async _getUserForLogin(nationalId) {
    // ✅ UNA SOLA CONSULTA trae: User + Person + Gender + Country + Role + Avatar + AvatarTheme
    const user = await userRepository.findByUsernameAndNationalId(nationalId, 'basic');

    if (!user) {
      throw AppError.unauthorized('Credenciales inválidas');
    }

    if (!user.is_active) {
      throw AppError.forbidden('Cuenta inactiva o suspendida');
    }

    return user;
  }

  /**
   * Maneja un intento de login fallido
   * @private
   */
  async _handleFailedLogin(user, nationalId, cognitoUsername, auditContext, reason) {
    const failedAttempts = await loginAttemptRepository.countFailedAttempts(nationalId);
    const newAttemptCount = failedAttempts + 1;
    const MAX_LOGIN_ATTEMPTS = SECURITY.LOGIN_ATTEMPTS.MAX_ATTEMPTS;
    const BLOCK_DURATION_MINUTES = SECURITY.LOGIN_ATTEMPTS.BLOCK_DURATION_MINUTES;

    let blockedUntil = null;
    if (newAttemptCount >= MAX_LOGIN_ATTEMPTS) {
      blockedUntil = new Date(Date.now() + BLOCK_DURATION_MINUTES * 60 * 1000);
    }

    await loginAttemptRepository.recordAttempt({
      person_id: user.person.id, // ✅ Ya viene incluido
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

  /**
   * Autentica con Cognito Y actualiza custom attributes
   * @private
   */
  async _authenticateWithCognito(user, nationalId, cognitoUsername, password, auditContext) {
    try {
      // 1. Autenticar con Cognito usando el cognito_username (UUID único)
      const authResult = await cognitoUtil.authenticateUser(cognitoUsername, password);
      
      // 2. NUEVO: Actualizar custom attributes en Cognito
      // Esto hace que el PRÓXIMO refresh tenga los datos actualizados
      try {
        await cognitoUtil.updateUserCustomAttributes(cognitoUsername, user);
        logger.info('Custom attributes updated in Cognito', {
          cognitoUsername,
          userId: user.id,
        });
      } catch (attrError) {
        // No fallar el login si falla la actualización de attributes
        logger.warn('Failed to update custom attributes, continuing with login', {
          cognitoUsername,
          error: attrError.message,
        });
      }
      
      // 3. Si NO hay MFA challenge, hacer refresh para obtener token con custom attributes
      if (!authResult.challengeName) {
        try {
          const refreshedTokens = await cognitoUtil.refreshToken(
            authResult.refreshToken, 
            cognitoUsername
          );
          
          return {
            accessToken: refreshedTokens.accessToken,
            idToken: refreshedTokens.idToken,
            refreshToken: authResult.refreshToken, // El refresh token no cambia
            expiresIn: refreshedTokens.expiresIn,
          };
        } catch (refreshError) {
          logger.warn('Failed to refresh token after login, using original tokens', {
            error: refreshError.message,
          });
          // Si falla el refresh, devolver los tokens originales
          return authResult;
        }
      }
      
      // Si hay MFA challenge, devolver el authResult original
      return authResult;
      
    } catch (error) {
      await loginAttemptRepository.recordAttempt({
        person_id: user.person.id,
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

  /**
   * Maneja la sesión (reemplaza si existe)
   * @private
   */
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

  /**
   * Completa un login exitoso (registra intento, crea sesión, retorna DTO)
   * @private
   */
  async _completeSuccessfulLogin(user, nationalId, cognitoUsername, deviceFingerprint, tokens, auditContext) {
    const sessionKey = await this._manageSession(user.id, deviceFingerprint, tokens);

    const loginAttempt = await loginAttemptRepository.recordAttempt({
      person_id: user.person.id, // ✅ Ya viene incluido desde el query inicial
      username_attempt: cognitoUsername,
      national_id: nationalId,
      ip_address: auditContext.ip,
      user_agent: auditContext.userAgent,
      device_fingerprint: deviceFingerprint,
      success: true,
      session_cache_key: sessionKey,
    });

    await loginAttemptRepository.invalidatePreviousDeviceSession(
      user.id,
      deviceFingerprint,
      loginAttempt.id
    );

    logger.info('Login completed successfully', { 
      userId: user.id, 
      nationalId, 
      cognitoUsername 
    });

    return new LoginResponseDTO({ user, tokens });
  }

  /**
   * Filtra sesiones válidas desde Redis
   * @private
   */
  async _filterValidSessions(loginAttempts, userId, currentDeviceFingerprint) {
    const validSessions = [];

    for (const attempt of loginAttempts) {
      const sessionInCache = await SessionCacheUtil.getSession(userId, attempt.device_fingerprint);

      if (sessionInCache) {
        validSessions.push({
          attemptId: attempt.id,
          deviceFingerprint: attempt.device_fingerprint,
          ipAddress: attempt.ip_address,
          lastActivity: sessionInCache.createdAt,
          loginTime: attempt.attempted_at,
          isCurrent: attempt.device_fingerprint === currentDeviceFingerprint,
        });
      } else {
        // Limpiar registros de sesiones expiradas
        await loginAttemptRepository.clearSessionCacheKey(userId, attempt.device_fingerprint);
      }
    }

    return validSessions;
  }
}

module.exports = new AuthService();