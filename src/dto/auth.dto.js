// src/dto/auth.dto.js
const { UserResponseDTO } = require('./user.dto');

// ========================================
// INPUT DTOs (Request - datos entrantes)
// ========================================

/**
 * DTO para registro de usuario
 * Sanitiza y estructura los datos del request
 */
class RegisterDTO {
  constructor(data) {
    this.email = data.email?.toLowerCase().trim();
    this.password = data.password;
    this.name = data.name?.trim();
    this.role = data.role || 'user';
  }

  static fromRequest(body) {
    return new RegisterDTO(body);
  }
}

/**
 * DTO para login de usuario
 * Solo extrae email y password
 */
class LoginDTO {
  constructor(data) {
    this.email = data.email?.toLowerCase().trim();
    this.password = data.password;
  }

  static fromRequest(body) {
    return new LoginDTO(body);
  }
}

/**
 * DTO para refresh token
 */
class RefreshTokenDTO {
  constructor(data) {
    this.refreshToken = data.refreshToken;
  }

  static fromRequest(body) {
    return new RefreshTokenDTO(body);
  }
}

// ========================================
// OUTPUT DTOs (Response - datos salientes)
// ========================================

/**
 * DTO para respuesta de autenticación completa
 * Incluye usuario y tokens
 */
class AuthResponseDTO {
  constructor(user, tokens) {
    this.user = new UserResponseDTO(user);
    this.tokens = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    };
  }

  static fromData(user, tokens) {
    return new AuthResponseDTO(user, tokens);
  }
}

/**
 * DTO para respuesta solo de tokens
 */
class TokenResponseDTO {
  constructor(tokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
  }

  static fromTokens(tokens) {
    return new TokenResponseDTO(tokens);
  }
}

module.exports = {
  // Input DTOs
  RegisterDTO,
  LoginDTO,
  RefreshTokenDTO,
  
  // Output DTOs
  AuthResponseDTO,
  TokenResponseDTO
};