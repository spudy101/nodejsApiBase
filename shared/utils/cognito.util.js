'use strict';

const {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} = require('amazon-cognito-identity-js');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const {
  CognitoIdentityProviderClient,
  AdminConfirmSignUpCommand,
  AdminDeleteUserCommand,
  AssociateSoftwareTokenCommand,
  VerifySoftwareTokenCommand,
  SetUserMFAPreferenceCommand,
  AdminSetUserMFAPreferenceCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
} = require('@aws-sdk/client-cognito-identity-provider');
const AppError = require('./app-error.util');
const { logger } = require('./logger.util');
const { cognito, aws } = require('../constants');

const USER_POOL_ID = cognito.userPoolId;

class CognitoUtil {
  static poolData = {
    UserPoolId: cognito.userPoolId,
    ClientId: cognito.clientId,
  };

  static userPool = new CognitoUserPool(this.poolData);

  static adminClient = new CognitoIdentityProviderClient({
    region: aws.region,
    credentials: {
      accessKeyId: aws.accessKeyId,
      secretAccessKey: aws.secretAccessKey,
    },
  });

  // Verifica el ID Token (no el Access Token) para leer custom attributes
  static idTokenVerifier = CognitoJwtVerifier.create({
    userPoolId: cognito.userPoolId,
    tokenUse: 'id',
    clientId: cognito.clientId,
  });

  static jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: cognito.userPoolId,
    tokenUse: 'access',
    clientId: cognito.clientId,
  });

  static ERROR_CODES = {
    UsernameExistsException: () => AppError.conflict('El usuario ya existe'),
    InvalidPasswordException: () => AppError.badRequest('La contraseña no cumple los requisitos de seguridad'),
    InvalidParameterException: (msg) => AppError.badRequest(`Parámetros inválidos: ${msg}`),
    NotAuthorizedException: () => AppError.unauthorized('Credenciales inválidas'),
    UserNotFoundException: () => AppError.unauthorized('Usuario no encontrado'),
    UserNotConfirmedException: () => AppError.forbidden('Usuario no confirmado'),
  };

  // ============================================================
  // AUTH
  // ============================================================

  /**
   * Crea usuario en Cognito, lo confirma y le asigna custom attributes
   * @param {{ username, email, password, userId, personId, role }} params
   * @returns {Promise<{ sub, username, email }>}
   */
  static async createUser({ username, email, password, userId, personId, role }) {
    try {
      const userSub = await this._signUp(username, email, password);
      await this._confirmUser(username);

      // Asignar custom attributes con los IDs internos y rol
      await this.updateUserCustomAttributes(username, { userId, personId, role });

      logger.info('User created and confirmed in Cognito', { username, sub: userSub });
      return { sub: userSub, username, email };
    } catch (error) {
      await this.deleteUser(username).catch(() => { });
      throw error;
    }
  }

  /**
   * Autentica usuario y retorna tokens o challenge MFA
   * @returns {Promise<tokens | challenge>}
   */
  static async authenticateUser(cognitoUsername, password) {
    const cognitoUser = this._getCognitoUser(cognitoUsername);
    const authDetails = new AuthenticationDetails({ Username: cognitoUsername, Password: password });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          resolve(this._extractTokens(session));
        },
        onFailure: (err) => {
          logger.error('Cognito authentication failed', { error: err.message, code: err.code });
          reject(this._handleError(err));
        },
        totpRequired: () => {
          logger.info('TOTP MFA required', { username: cognitoUsername });
          resolve({
            challengeName: 'SOFTWARE_TOKEN_MFA',
            session: cognitoUser.Session,
            username: cognitoUsername,
          });
        },
        mfaRequired: () => {
          logger.info('SMS MFA required', { username: cognitoUsername });
          resolve({
            challengeName: 'SMS_MFA',
            session: cognitoUser.Session,
            username: cognitoUsername,
          });
        },
      });
    });
  }

  /**
   * Responde al challenge TOTP
   * @returns {Promise<tokens>}
   */
  static async respondToTOTPChallenge(cognitoUsername, totpCode, session) {
    const cognitoUser = this._getCognitoUser(cognitoUsername);
    cognitoUser.Session = session;

    return new Promise((resolve, reject) => {
      cognitoUser.sendMFACode(
        totpCode,
        {
          onSuccess: (sess) => {
            logger.info('TOTP MFA verification successful', { cognitoUsername });
            resolve(this._extractTokens(sess));
          },
          onFailure: (err) => {
            logger.error('TOTP MFA verification failed', { cognitoUsername, error: err.message });
            if (err.code === 'CodeMismatchException') return reject(AppError.badRequest('Código TOTP incorrecto'));
            if (err.code === 'NotAuthorizedException') return reject(AppError.unauthorized('Código TOTP inválido o expirado'));
            reject(this._handleError(err, 'Error al verificar código TOTP'));
          },
        },
        'SOFTWARE_TOKEN_MFA'
      );
    });
  }

  /**
   * Refresca access token
   * @returns {Promise<{ accessToken, idToken, expiresIn }>}
   */
  static async refreshAccessToken(refreshToken, cognitoUsername) {
    const cognitoUser = this._getCognitoUser(cognitoUsername);
    const { CognitoRefreshToken } = require('amazon-cognito-identity-js');
    const refreshTokenObj = new CognitoRefreshToken({ RefreshToken: refreshToken });

    return new Promise((resolve, reject) => {
      cognitoUser.refreshSession(refreshTokenObj, (err, session) => {
        if (err) {
          logger.error('Error refreshing tokens', { error: err.message });
          return reject(this._handleError(err, 'Refresh token inválido o expirado'));
        }
        const { accessToken, idToken, expiresIn } = this._extractTokens(session);
        resolve({ accessToken, idToken, expiresIn });
      });
    });
  }

  // ============================================================
  // TOKEN VERIFICATION
  // ============================================================

  /**
   * Verifica el Access Token (para auth middleware)
   * Retorna sub + username del payload
   */
  static async verifyToken(accessToken) {
    try {
      const payload = await this.jwtVerifier.verify(accessToken);
      return {
        sub: payload.sub,
        username: payload.username,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch (error) {
      logger.warn('Invalid or expired JWT', { error: error.message });
      if (error.message?.includes('expired')) throw AppError.unauthorized('Token expirado');
      throw AppError.unauthorized('Token inválido');
    }
  }

  /**
   * Verifica el ID Token y extrae custom attributes
   * Usar en el auth middleware para leer userId, personId y role
   * sin consultar la base de datos.
   *
   * @param {string} idToken
   * @returns {Promise<{
   *   sub: string,
   *   username: string,
   *   email: string,
   *   userId: string,   // custom:userId → users.id
   *   personId: string,     // custom:personId   → persons.id
   *   role: string,         // custom:role       → role name
   *   exp: number,
   *   iat: number,
   * }>}
   */
  static async verifyIdToken(idToken) {
    try {
      const payload = await this.idTokenVerifier.verify(idToken);

      const userId = payload['custom:userId'];
      const personId = payload['custom:personId'];
      const roleId = payload['custom:roleId'];
      const firstName = payload['custom:firstName'];
      const lastName = payload['custom:lastName'];
      const nationalId = payload['custom:nationalId'];

      return {
        sub: payload.sub,
        username: payload['cognito:username'],
        email: payload.email,
        userId,
        personId,
        roleId,
        firstName,
        lastName,
        nationalId,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch (error) {
      logger.warn('Invalid or expired ID Token', { error: error.message });
      if (error.message?.includes('expired')) throw AppError.unauthorized('Token expirado');
      throw AppError.unauthorized('Token inválido');
    }
  }

  // ============================================================
  // CUSTOM ATTRIBUTES
  // ============================================================

  /**
   * Actualiza custom attributes del usuario en Cognito
   * Llamar después de crear usuario o cuando cambia el rol
   *
   * @param {string} username - cognito_username
   * @param {{ userId?, personId?, role? }} attrs
   */
  static async updateUserCustomAttributes(username, attrs = {}) {
    const userAttributes = [];

    if (attrs.userId) userAttributes.push({ Name: 'custom:userId', Value: attrs.userId });
    if (attrs.personId) userAttributes.push({ Name: 'custom:personId', Value: attrs.personId });
    if (attrs.roleId) userAttributes.push({ Name: 'custom:roleId', Value: attrs.roleId });
    if (attrs.firstName) userAttributes.push({ Name: 'custom:firstName', Value: attrs.firstName });
    if (attrs.lastName) userAttributes.push({ Name: 'custom:lastName', Value: attrs.lastName });
    if (attrs.nationalId) userAttributes.push({ Name: 'custom:nationalId', Value: attrs.nationalId });

    if (userAttributes.length === 0) return;

    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: userAttributes,
      });
      await this.adminClient.send(command);
      logger.info('Custom attributes updated in Cognito', { username, attrs: Object.keys(attrs) });
    } catch (error) {
      logger.error('Error updating custom attributes', { username, error: error.message });
      throw this._handleError(error, 'Error al actualizar atributos del usuario');
    }
  }

  // ============================================================
  // USER MANAGEMENT
  // ============================================================

  static async deleteUser(username) {
    try {
      const command = new AdminDeleteUserCommand({ UserPoolId: USER_POOL_ID, Username: username });
      await this.adminClient.send(command);
      logger.info('User deleted from Cognito', { username });
    } catch (error) {
      logger.error('Error deleting user from Cognito', { username, error: error.message });
      throw this._handleError(error, 'Error al eliminar usuario de Cognito');
    }
  }

  static async changeUserPassword(username, newPassword, permanent = true) {
    try {
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: newPassword,
        Permanent: permanent,
      });
      await this.adminClient.send(command);
      logger.info('Password changed successfully', { username });
    } catch (error) {
      logger.error('Error changing user password', { username, error: error.message });
      throw this._handleError(error, 'Error al cambiar la contraseña del usuario');
    }
  }

  static async updateUserEmail(username, newEmail) {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: [
          { Name: 'email', Value: newEmail },
          { Name: 'email_verified', Value: 'true' },
        ],
      });
      await this.adminClient.send(command);
      logger.info('User email updated in Cognito', { username, newEmail });
    } catch (error) {
      logger.error('Error updating user email in Cognito', { username, error: error.message });
      throw this._handleError(error, 'Error al actualizar email en Cognito');
    }
  }

  static async associateSoftwareToken(accessToken) {
    try {
      const command = new AssociateSoftwareTokenCommand({ AccessToken: accessToken });
      const response = await this.adminClient.send(command);
      logger.info('Software token associated successfully');
      return { secretCode: response.SecretCode };
    } catch (error) {
      logger.error('Error associating software token', { error: error.message });
      throw this._handleError(error, 'Error al asociar token TOTP');
    }
  }

  static async verifySoftwareToken(accessToken, totpCode) {
    try {
      const command = new VerifySoftwareTokenCommand({ AccessToken: accessToken, UserCode: totpCode });
      const response = await this.adminClient.send(command);
      logger.info('Software token verified', { status: response.Status });
      return { status: response.Status, session: response.Session };
    } catch (error) {
      logger.error('Error verifying software token', { error: error.message });
      if (error.name === 'EnableSoftwareTokenMFAException') throw AppError.badRequest('Código TOTP inválido');
      if (error.name === 'CodeMismatchException') throw AppError.badRequest('Código TOTP incorrecto');
      throw this._handleError(error, 'Error al verificar código TOTP');
    }
  }

  static async enableTOTPMFA(accessToken) {
    try {
      const command = new SetUserMFAPreferenceCommand({
        AccessToken: accessToken,
        SoftwareTokenMfaSettings: { Enabled: true, PreferredMfa: true },
      });
      await this.adminClient.send(command);
      logger.info('TOTP MFA enabled successfully');
    } catch (error) {
      logger.error('Error enabling TOTP MFA', { error: error.message });
      throw this._handleError(error, 'Error al activar MFA TOTP');
    }
  }

  static async disableTOTPMFA(username) {
    try {
      const command = new AdminSetUserMFAPreferenceCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        SoftwareTokenMfaSettings: { Enabled: false, PreferredMfa: false },
      });
      await this.adminClient.send(command);
      logger.info('TOTP MFA disabled', { username });
    } catch (error) {
      logger.error('Error disabling TOTP MFA', { username, error: error.message });
      throw this._handleError(error, 'Error al desactivar MFA TOTP');
    }
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  static _getCognitoUser(username) {
    return new CognitoUser({ Username: username, Pool: this.userPool });
  }

  static async _signUp(username, email, password) {
    const emailAttr = new CognitoUserAttribute({ Name: 'email', Value: email });
    return new Promise((resolve, reject) => {
      this.userPool.signUp(username, password, [emailAttr], null, (err, result) => {
        if (err) {
          logger.error('Cognito signUp failed', { error: err.message, code: err.code });
          return reject(this._handleError(err));
        }
        resolve(result.userSub);
      });
    });
  }

  static async _confirmUser(username) {
    try {
      const command = new AdminConfirmSignUpCommand({ UserPoolId: USER_POOL_ID, Username: username });
      await this.adminClient.send(command);
    } catch (error) {
      logger.error('Cognito confirmation failed', { username, error: error.message });
      throw this._handleError(error, 'Error al confirmar usuario');
    }
  }

  /**
   * Extrae tokens de una sesión de Cognito de forma consistente
   */
  static _extractTokens(session) {
    const expiresAt = session.getAccessToken().getExpiration();
    const nowInSeconds = Math.floor(Date.now() / 1000);
    const expiresIn = Math.max(0, expiresAt - nowInSeconds);

    return {
      accessToken: session.getAccessToken().getJwtToken(),
      idToken: session.getIdToken().getJwtToken(),
      refreshToken: session.getRefreshToken().getToken(),
      expiresIn,
    };
  }

  static _handleError(err, defaultMessage = 'Error en Cognito') {
    const errorHandler = this.ERROR_CODES[err.code];
    if (errorHandler) return errorHandler(err.message);
    return AppError.internal(defaultMessage);
  }
}

module.exports = CognitoUtil;