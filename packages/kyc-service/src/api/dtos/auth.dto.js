'use strict';

const { UserBaseDTO } = require('./base.dto');

/**
 * DTO para respuesta de login
 */
class LoginResponseDTO {
  constructor({ user, tokens }) {
    // ✅ Reutilizar builder completo
    this.user = UserBaseDTO.buildUserComplete(user);
    this.tokens = UserBaseDTO.buildTokens(tokens);
  }
}

/**
 * DTO para respuesta de registro
 */
class RegisterResponseDTO {
  constructor({ user, person, personContact, tokens }) {
    this.user = {
      id: user.user_id || user.id,
      username: user.username,
      isActive: user.is_active,
      roleId: user.role_id,
      createdAt: user.created_at || user.createdAt,
    };

    this.person = UserBaseDTO.buildPersonBasic(person);

    this.contact = {
      id: personContact.person_contact_id || personContact.id,
      email: personContact.email,
      emailVerifiedAt: personContact.email_verified_at,
    };

    this.tokens = UserBaseDTO.buildTokens(tokens);
  }
}

/**
 * DTO para refresh token
 */
class RefreshTokenResponseDTO {
  constructor({ accessToken, idToken, expiresIn }) {
    this.accessToken = accessToken;
    this.idToken = idToken;
    this.expiresIn = expiresIn;
  }
}

/**
 * DTO para sesión activa
 */
class ActiveSessionDTO {
  constructor(session) {
    this.attemptId = session.attemptId;
    this.deviceFingerprint = session.deviceFingerprint;
    this.ipAddress = session.ipAddress;
    this.lastActivity = session.lastActivity;
    this.loginTime = session.loginTime;
    this.isCurrent = session.isCurrent;
    
    if (session.deviceInfo) {
      this.deviceInfo = session.deviceInfo;
    }
  }
}

/**
 * DTO para lista de sesiones activas
 */
class ActiveSessionsResponseDTO {
  constructor({ sessions, totalActive }) {
    this.sessions = sessions.map(session => new ActiveSessionDTO(session));
    this.totalActive = totalActive;
  }
}

/**
 * DTO para respuesta de logout
 */
class LogoutResponseDTO {
  constructor({ message, count }) {
    this.message = message;
    if (count !== undefined) {
      this.sessionsClosedCount = count;
    }
  }
}

/**
 * DTO para requerimiento de MFA
 */
class MFARequiredResponseDTO {
  constructor({ username, session, challengeType }) {
    this.requiresMFA = true;
    this.challengeType = challengeType;
    this.session = session;
  }
}

module.exports = {
  LoginResponseDTO,
  RegisterResponseDTO,
  RefreshTokenResponseDTO,
  ActiveSessionDTO,
  ActiveSessionsResponseDTO,
  LogoutResponseDTO,
  MFARequiredResponseDTO,
};