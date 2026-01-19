'use strict';

class RegisterResponseDTO {
  constructor({ user, person, personContact, tokens }) {
    this.user = {
      id: user.user_id,
      username: user.username,
      isActive: user.is_active,
      roleId: user.role_id,
      createdAt: user.created_at,
    };

    this.person = {
      id: person.person_id,
      firstName: person.first_name,
      lastName: person.last_name,
      nationalId: person.national_id,
      genderId: person.gender_id,
      countryId: person.country_id,
    };

    this.contact = {
      id: personContact.person_contact_id,
      email: personContact.email,
      emailVerifiedAt: personContact.email_verified_at,
    };

    this.tokens = {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

class LoginResponseDTO {
  constructor({ user, tokens }) {
    this.user = {
      userId: user.user_id,
      username: user.username,
      isActive: user.is_active,
      mfaEnabled: user.totp_enabled || false,
    };

    if (user.person) {
      this.user.person = {
        personId: user.person.person_id,
        firstName: user.person.first_name,
        lastName: user.person.last_name,
        nationalId: user.person.national_id,
        birthDate: user.person.birth_date,
        genderId: user.person.gender_id,
        countryId: user.person.country_id,
      };
    }

    if (user.role) {
      this.user.role = {
        roleId: user.role.role_id,
        name: user.role.name,
        description: user.role.description,
      };
    }

    if (user.avatar) {
      this.user.avatar = {
        avatarId: user.avatar.avatar_id,
        url: user.avatar.url,
      };
    }

    this.tokens = {
      accessToken: tokens.accessToken,
      idToken: tokens.idToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    };
  }
}

class RefreshTokenResponseDTO {
  constructor({ accessToken, idToken, expiresIn }) {
    this.accessToken = accessToken;
    this.idToken = idToken;
    this.expiresIn = expiresIn;
  }
}

class ProfileResponseDTO {
  constructor(user) {
    this.userId = user.user_id;
    this.username = user.username;
    this.isActive = user.is_active;
    this.mfaEnabled = user.totp_enabled || false;

    if (user.person) {
      this.person = {
        personId: user.person.person_id,
        firstName: user.person.first_name,
        lastName: user.person.last_name,
        nationalId: user.person.national_id,
        birthDate: user.person.birth_date,
        genderId: user.person.gender_id,
        countryId: user.person.country_id,
      };
    }

    if (user.role) {
      this.role = {
        roleId: user.role.role_id,
        name: user.role.name,
        description: user.role.description,
      };
    }

    if (user.avatar) {
      this.avatar = {
        avatarId: user.avatar.avatar_id,
        url: user.avatar.url,
      };
    }
  }
}

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

class ActiveSessionsResponseDTO {
  constructor({ sessions, totalActive }) {
    this.sessions = sessions.map(session => new ActiveSessionDTO(session));
    this.totalActive = totalActive;
  }
}

class LogoutResponseDTO {
  constructor({ message, count }) {
    this.message = message;
    if (count !== undefined) {
      this.sessionsClosedCount = count;
    }
  }
}

class MFARequiredResponseDTO {
  constructor({ username, session, challengeType }) {
    this.requiresMFA = true;
    this.challengeType = challengeType;
    this.session = session;
  }
}

module.exports = {
  RegisterResponseDTO,
  LoginResponseDTO,
  RefreshTokenResponseDTO,
  ProfileResponseDTO,
  ActiveSessionDTO,
  ActiveSessionsResponseDTO,
  LogoutResponseDTO,
  MFARequiredResponseDTO
};