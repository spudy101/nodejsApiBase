// shared/src/utils/cognito.util.js
const {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  SignUpCommand,
  ConfirmSignUpCommand,
  ResendConfirmationCodeCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  GlobalSignOutCommand,
  GetUserCommand,
  AdminDeleteUserCommand,
  AdminUpdateUserAttributesCommand, // ← NUEVO
  AdminGetUserCommand, // ← NUEVO
} = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const { logger } = require('./logger.util');

class CognitoUtil {
  constructor() {
    this.client = null;
    this.verifier = null;
    this.clientId = null;
    this.userPoolId = null;
    this.initialized = false;
  }

  /**
   * Inicializa Cognito con la configuración del servicio
   * @param {object} awsConfig - { region, accessKeyId, secretAccessKey }
   * @param {object} cognitoConfig - { userPoolId, clientId }
   */
  initialize(awsConfig, cognitoConfig) {
    if (this.initialized) {
      throw new Error('CognitoUtil already initialized');
    }

    if (!awsConfig?.region || !awsConfig?.accessKeyId || !awsConfig?.secretAccessKey) {
      throw new Error('AWS config (region, accessKeyId, secretAccessKey) is required');
    }

    if (!cognitoConfig?.userPoolId || !cognitoConfig?.clientId) {
      throw new Error('Cognito config (userPoolId, clientId) is required');
    }

    this.client = new CognitoIdentityProviderClient({
      region: awsConfig.region,
      credentials: {
        accessKeyId: awsConfig.accessKeyId,
        secretAccessKey: awsConfig.secretAccessKey,
      },
    });

    this.verifier = CognitoJwtVerifier.create({
      userPoolId: cognitoConfig.userPoolId,
      tokenUse: 'access',
      clientId: cognitoConfig.clientId,
    });

    this.clientId = cognitoConfig.clientId;
    this.userPoolId = cognitoConfig.userPoolId;
    this.initialized = true;
  }

  _checkInitialized() {
    if (!this.initialized) {
      throw new Error('CognitoUtil not initialized. Call initialize(config.aws, config.cognito) in server.js first.');
    }
  }

  /**
   * Sign up a new user
   */
  async signUp(username, password, email, phoneNumber) {
    this._checkInitialized();
    
    const command = new SignUpCommand({
      ClientId: this.clientId,
      Username: username,
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'phone_number', Value: phoneNumber },
      ],
    });

    try {
      const response = await this.client.send(command);
      logger.info('User signed up successfully', {
        username,
        cognitoSub: response.UserSub,
      });
      return response;
    } catch (error) {
      logger.error('Error signing up user', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Confirm user sign up with verification code
   */
  async confirmSignUp(username, confirmationCode) {
    this._checkInitialized();
    
    const command = new ConfirmSignUpCommand({
      ClientId: this.clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
    });

    try {
      await this.client.send(command);
      logger.info('User confirmed successfully', { username });
      return true;
    } catch (error) {
      logger.error('Error confirming user', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(username) {
    this._checkInitialized();
    
    const command = new ResendConfirmationCodeCommand({
      ClientId: this.clientId,
      Username: username,
    });

    try {
      await this.client.send(command);
      logger.info('Confirmation code resent', { username });
      return true;
    } catch (error) {
      logger.error('Error resending confirmation code', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Initiate auth (login)
   */
  async initiateAuth(username, password) {
    this._checkInitialized();
    
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    });

    try {
      const response = await this.client.send(command);
      logger.info('User authenticated successfully', { username });
      return response.AuthenticationResult;
    } catch (error) {
      logger.error('Authentication failed', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken) {
    this._checkInitialized();
    
    const command = new InitiateAuthCommand({
      ClientId: this.clientId,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    });

    try {
      const response = await this.client.send(command);
      logger.info('Token refreshed successfully');
      return response.AuthenticationResult;
    } catch (error) {
      logger.error('Error refreshing token', { error: error.message });
      throw error;
    }
  }

  /**
   * Verify JWT access token
   */
  async verifyToken(token) {
    this._checkInitialized();
    
    try {
      const payload = await this.verifier.verify(token);
      return payload;
    } catch (error) {
      logger.error('Token verification failed', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Global sign out (invalidate all tokens)
   */
  async globalSignOut(accessToken) {
    this._checkInitialized();
    
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken,
    });

    try {
      await this.client.send(command);
      logger.info('User signed out globally');
      return true;
    } catch (error) {
      logger.error('Error signing out user', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user info from access token
   */
  async getUser(accessToken) {
    this._checkInitialized();
    
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    try {
      const response = await this.client.send(command);
      return response;
    } catch (error) {
      logger.error('Error getting user info', { error: error.message });
      throw error;
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(username) {
    this._checkInitialized();
    
    const command = new ForgotPasswordCommand({
      ClientId: this.clientId,
      Username: username,
    });

    try {
      await this.client.send(command);
      logger.info('Forgot password initiated', { username });
      return true;
    } catch (error) {
      logger.error('Error initiating forgot password', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Confirm forgot password with code
   */
  async confirmForgotPassword(username, confirmationCode, newPassword) {
    this._checkInitialized();
    
    const command = new ConfirmForgotPasswordCommand({
      ClientId: this.clientId,
      Username: username,
      ConfirmationCode: confirmationCode,
      Password: newPassword,
    });

    try {
      await this.client.send(command);
      logger.info('Password reset successfully', { username });
      return true;
    } catch (error) {
      logger.error('Error resetting password', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Admin delete user (requires admin credentials)
   */
  async deleteUser(username) {
    this._checkInitialized();
    
    const command = new AdminDeleteUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    try {
      await this.client.send(command);
      logger.info('User deleted from Cognito', { username });
      return true;
    } catch (error) {
      logger.error('Error deleting user from Cognito', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  // =====================================================
  // NUEVOS MÉTODOS PARA CUSTOM ATTRIBUTES
  // =====================================================

  /**
   * Actualizar custom attributes de un usuario (requiere permisos admin)
   * @param {string} username - Username en Cognito
   * @param {object} attributes - Objeto con los attributes a actualizar
   * 
   * Ejemplo:
   * await CognitoUtil.adminUpdateUserAttributes('john_doe', {
   *   'custom:user_id': '123',
   *   'custom:role': 'ADMIN',
   *   'custom:first_name': 'John'
   * });
   */
  async adminUpdateUserAttributes(username, attributes) {
    this._checkInitialized();

    // Convertir objeto a formato de Cognito
    const userAttributes = Object.entries(attributes).map(([key, value]) => ({
      Name: key,
      Value: String(value),
    }));

    const command = new AdminUpdateUserAttributesCommand({
      UserPoolId: this.userPoolId,
      Username: username,
      UserAttributes: userAttributes,
    });

    try {
      await this.client.send(command);
      logger.info('User attributes updated successfully', {
        username,
        attributes: Object.keys(attributes),
      });
      return true;
    } catch (error) {
      logger.error('Error updating user attributes', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtener información completa del usuario (requiere permisos admin)
   * @param {string} username - Username en Cognito
   * @returns {object} - User data incluyendo todos los attributes
   */
  async adminGetUser(username) {
    this._checkInitialized();

    const command = new AdminGetUserCommand({
      UserPoolId: this.userPoolId,
      Username: username,
    });

    try {
      const response = await this.client.send(command);
      logger.info('User data retrieved successfully', { username });
      return response;
    } catch (error) {
      logger.error('Error getting user data', {
        username,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Helper: Actualizar custom attributes después del login
   * Esto hace que el PRÓXIMO token tenga los attributes actualizados
   * 
   * @param {string} username - Username en Cognito
   * @param {object} user - User object de la DB con toda la info
   */
  async updateUserCustomAttributes(username, user) {
    this._checkInitialized();

    const attributes = {
      'custom:user_id': String(user.user_id),
      'custom:person_id': String(user.person_id),
      'custom:role': user.role?.name || 'USER',
      'custom:first_name': user.person?.first_name || '',
      'custom:last_name': user.person?.last_name || '',
      'custom:national_id': user.person?.national_id || '',
    };

    return this.adminUpdateUserAttributes(username, attributes);
  }
}

// Exportar singleton
module.exports = new CognitoUtil();