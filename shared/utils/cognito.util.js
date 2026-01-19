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
  AdminGetUserCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const AppError = require('./appError.util');
const { logger } = require('./logger.util');
const { cognito, aws } = require('../constants/index');

class CognitoUtil {
  static poolData = {
    UserPoolId: cognito.userPoolId,
    ClientId: cognito.clientId,
  };

  static userPool = new CognitoUserPool(this.poolData);

  static USER_POOL_ID = cognito.userPoolId;

  static adminClient = new CognitoIdentityProviderClient({
    region: aws.region,
    credentials: {
      accessKeyId: aws.accessKeyId,
      secretAccessKey: aws.secretAccessKey,
    },
  });

  static jwtVerifier = CognitoJwtVerifier.create({
    userPoolId: cognito.userPoolId,
    tokenUse: 'access',
    clientId: cognito.clientId,
  });

  // Mapeo de errores de Cognito
  static ERROR_CODES = {
    UsernameExistsException: () => AppError.conflict('El usuario ya existe'),
    InvalidPasswordException: () => AppError.badRequest('La contraseña no cumple los requisitos de seguridad'),
    InvalidParameterException: (msg) => AppError.badRequest(`Parámetros inválidos: ${msg}`),
    NotAuthorizedException: () => AppError.unauthorized('Credenciales inválidas'),
    UserNotFoundException: () => AppError.unauthorized('Usuario no encontrado'),
    UserNotConfirmedException: () => AppError.forbidden('Usuario no confirmado'),
  };

  /**
   * Crea usuario en Cognito y lo auto-confirma
   * @returns {Promise<{sub: string, username: string, email: string}>}
   */
  static async createUser({ username, email, password }) {
    try {
      // 1. Crear usuario
      const userSub = await this._signUp(username, email, password);

      // 2. Auto-confirmar
      await this._confirmUser(username);

      logger.info('User created and confirmed in Cognito', { username: username, sub: userSub });

      return { sub: userSub, username: username, email };
    } catch (error) {
      // Si falla, intentar limpiar
      await this.deleteUser(username).catch(() => {});
      throw error;
    }
  }

  /**
   * Autentica usuario y retorna tokens o challenge MFA
   * @returns {Promise<{accessToken: string, idToken: string, refreshToken: string, expiresIn: number} | {challengeName: string, session: string}>}
   */
  static async authenticateUser(cognitoUsername, password) {
    const cognitoUser = this._getCognitoUser(cognitoUsername);
    const authDetails = new AuthenticationDetails({ Username: cognitoUsername, Password: password });

    return new Promise((resolve, reject) => {
      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          resolve({
            accessToken: session.getAccessToken().getJwtToken(),
            idToken: session.getIdToken().getJwtToken(),
            refreshToken: session.getRefreshToken().getToken(),
            expiresIn: session.getAccessToken().getExpiration(),
          });
        },
        onFailure: (err) => {
          logger.error('Cognito authentication failed', { error: err.message, code: err.code });
          reject(this._handleError(err));
        },
        totpRequired: (challengeName, challengeParameters) => {
          // Usuario tiene TOTP habilitado, necesita código
          logger.info('TOTP MFA required for user', { username: cognitoUsername });
          resolve({
            challengeName: 'SOFTWARE_TOKEN_MFA',
            session: cognitoUser.Session, // Session temporal para continuar el flujo
            username: cognitoUsername,
          });
        },
        mfaRequired: (challengeName, challengeParameters) => {
          // SMS MFA (por si acaso lo habilitan en el futuro)
          logger.info('SMS MFA required for user', { username: cognitoUsername });
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
   * Responde al challenge de TOTP MFA
   * @param {string} cognito_username - cognito_username del usuario
   * @param {string} totpCode - Código de 6 dígitos
   * @param {string} session - Session del challenge anterior
   * @returns {Promise<{accessToken: string, idToken: string, refreshToken: string, expiresIn: number}>}
   */
  static async respondToTOTPChallenge(cognito_username, totpCode, session) {
    const cognitoUser = this._getCognitoUser(cognito_username);
    
    // Restaurar la sesión del challenge
    cognitoUser.Session = session;

    return new Promise((resolve, reject) => {
      cognitoUser.sendMFACode(
        totpCode,
        {
          onSuccess: (session) => {
            logger.info('TOTP MFA verification successful', { cognito_username });
            resolve({
              accessToken: session.getAccessToken().getJwtToken(),
              idToken: session.getIdToken().getJwtToken(),
              refreshToken: session.getRefreshToken().getToken(),
              expiresIn: session.getAccessToken().getExpiration(),
            });
          },
          onFailure: (err) => {
            logger.error('TOTP MFA verification failed', { 
              cognito_username, 
              error: err.message, 
              code: err.code 
            });

            if (err.code === 'CodeMismatchException') {
              return reject(AppError.badRequest('Código TOTP incorrecto'));
            }

            if (err.code === 'NotAuthorizedException') {
              return reject(AppError.unauthorized('Código TOTP inválido o expirado'));
            }

            reject(this._handleError(err, 'Error al verificar código TOTP'));
          },
        },
        'SOFTWARE_TOKEN_MFA' // Tipo de MFA
      );
    });
  }

  /**
   * Refresca access token usando refresh token
   * @returns {Promise<{accessToken: string, idToken: string, expiresIn: number}>}
   */
  static async refreshAccessToken(refreshToken, cognitoUsername) {
    const cognitoUser = this._getCognitoUser(cognitoUsername);
    
    // Crear objeto RefreshToken correctamente
    const { CognitoRefreshToken } = require('amazon-cognito-identity-js');
    const refreshTokenObj = new CognitoRefreshToken({ RefreshToken: refreshToken });

    return new Promise((resolve, reject) => {
      cognitoUser.refreshSession(refreshTokenObj, (err, session) => {
        if (err) {
          logger.error('Error refreshing tokens', { error: err.message, code: err.code });
          return reject(this._handleError(err, 'Refresh token inválido o expirado'));
        }

        resolve({
          accessToken: session.getAccessToken().getJwtToken(),
          idToken: session.getIdToken().getJwtToken(),
          expiresIn: session.getAccessToken().getExpiration(),
        });
      });
    });
  }

  /**
   * Verifica JWT access token
   * @returns {Promise<{sub: string, username: string, email: string, exp: number, iat: number}>}
   */
  static async verifyToken(accessToken) {
    try {
      const payload = await this.jwtVerifier.verify(accessToken);
      return {
        sub: payload.sub,
        username: payload.username,
        email: payload.email,
        exp: payload.exp,
        iat: payload.iat,
      };
    } catch (error) {
      logger.warn('Invalid or expired JWT', { error: error.message });
      
      if (error.message.includes('expired')) {
        throw AppError.unauthorized('Token expirado');
      }
      
      throw AppError.unauthorized('Token inválido');
    }
  }

  /**
   * Elimina usuario de Cognito (operación admin)
   */
  static async deleteUser(username) {
    try {
      const command = new AdminDeleteUserCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      });
      await this.adminClient.send(command);
      logger.info('User deleted from Cognito', { username });
    } catch (error) {
      logger.error('Error deleting user from Cognito', { username, error: error.message });
      throw this._handleError(error, 'Error al eliminar usuario de Cognito');
    }
  }

  /**
   * Helpers privados
   */
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
      const command = new AdminConfirmSignUpCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
      });
      await this.adminClient.send(command);
    } catch (error) {
      logger.error('Cognito confirmation failed', { username, error: error.message });
      throw this._handleError(error, 'Error al confirmar usuario');
    }
  }

  /**
   * Asocia software token (TOTP) con el usuario
   * Retorna el secret code para generar QR
   * @param {string} accessToken - Access token del usuario autenticado
   * @returns {Promise<{secretCode: string}>}
   */
  static async associateSoftwareToken(accessToken) {
    try {
      const command = new AssociateSoftwareTokenCommand({
        AccessToken: accessToken,
      });

      const response = await this.adminClient.send(command);

      logger.info('Software token associated successfully');

      return {
        secretCode: response.SecretCode,
      };
    } catch (error) {
      logger.error('Error associating software token', { error: error.message, code: error.code });
      throw this._handleError(error, 'Error al asociar token TOTP');
    }
  }

  /**
   * Verifica el código TOTP y marca como verificado
   * @param {string} accessToken - Access token del usuario
   * @param {string} totpCode - Código de 6 dígitos generado por la app
   * @returns {Promise<{status: string, session?: string}>}
   */
  static async verifySoftwareToken(accessToken, totpCode) {
    try {
      const command = new VerifySoftwareTokenCommand({
        AccessToken: accessToken,
        UserCode: totpCode,
      });

      const response = await this.adminClient.send(command);

      logger.info('Software token verified successfully', { status: response.Status });

      return {
        status: response.Status, // SUCCESS | ERROR
        session: response.Session,
      };
    } catch (error) {
      logger.error('Error verifying software token', { error: error.message, code: error.code });

      if (error.name === 'EnableSoftwareTokenMFAException') {
        throw AppError.badRequest('Código TOTP inválido');
      }

      if (error.name === 'CodeMismatchException') {
        throw AppError.badRequest('Código TOTP incorrecto');
      }

      throw this._handleError(error, 'Error al verificar código TOTP');
    }
  }

  /**
   * Activa TOTP como método MFA preferido para el usuario
   * @param {string} accessToken - Access token del usuario
   * @returns {Promise<void>}
   */
  static async enableTOTPMFA(accessToken) {
    try {
      const command = new SetUserMFAPreferenceCommand({
        AccessToken: accessToken,
        SoftwareTokenMfaSettings: {
          Enabled: true,
          PreferredMfa: true,
        },
      });

      await this.adminClient.send(command);

      logger.info('TOTP MFA enabled successfully');
    } catch (error) {
      logger.error('Error enabling TOTP MFA', { error: error.message, code: error.code });
      throw this._handleError(error, 'Error al activar MFA TOTP');
    }
  }

  /**
   * Desactiva TOTP MFA para el usuario (operación admin)
   * @param {string} username - Username del usuario
   * @returns {Promise<void>}
   */
  static async disableTOTPMFA(username) {
    try {
      const command = new AdminSetUserMFAPreferenceCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        SoftwareTokenMfaSettings: {
          Enabled: false,
          PreferredMfa: false,
        },
      });

      await this.adminClient.send(command);

      logger.info('TOTP MFA disabled successfully', { username });
    } catch (error) {
      logger.error('Error disabling TOTP MFA', { username, error: error.message, code: error.code });
      throw this._handleError(error, 'Error al desactivar MFA TOTP');
    }
  }

  /**
   * Cambia la contraseña de un usuario (operación admin)
   * @param {string} username - Username del usuario
   * @param {string} newPassword - Nueva contraseña
   * @param {boolean} permanent - Si es true, la contraseña es permanente. Si es false, el usuario deberá cambiarla en el primer login
   * @returns {Promise<void>}
   */
  static async changeUserPassword(username, newPassword, permanent = true) {
    try {
      const command = new AdminSetUserPasswordCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        Password: newPassword,
        Permanent: permanent,
      });

      await this.adminClient.send(command);

      logger.info('Password changed successfully', { username, permanent });
    } catch (error) {
      logger.error('Error changing user password', { 
        username, 
        error: error.message, 
        code: error.code 
      });
      throw this._handleError(error, 'Error al cambiar la contraseña del usuario');
    }
  }

  /**
   * Actualiza el email de un usuario en Cognito (operación admin)
   * @param {string} username - Username (national_id)
   * @param {string} newEmail - Nuevo email
   * @returns {Promise<void>}
   */
  static async updateUserEmail(username, newEmail) {
    try {
      const command = new AdminUpdateUserAttributesCommand({
        UserPoolId: USER_POOL_ID,
        Username: username,
        UserAttributes: [
          {
            Name: 'email',
            Value: newEmail
          },
          {
            Name: 'email_verified',
            Value: 'true' // Auto-verificar el email
          }
        ]
      });

      await this.adminClient.send(command);

      logger.info('User email updated in Cognito', { username, newEmail });
    } catch (error) {
      logger.error('Error updating user email in Cognito', { username, error: error.message });
      throw this._handleError(error, 'Error al actualizar email en Cognito');
    }
  }

  /**
   * Maneja errores de Cognito y los convierte a AppError
   * @private
   */
  static _handleError(err, defaultMessage = 'Error en Cognito') {
    const errorHandler = this.ERROR_CODES[err.code];
    
    if (errorHandler) {
      return errorHandler(err.message);
    }

    return AppError.serverError(defaultMessage);
  }

}

module.exports = CognitoUtil;