// src/dto/user.dto.js

// ========================================
// INPUT DTOs (Request - datos entrantes)
// ========================================

/**
 * DTO para actualización de perfil
 */
class UpdateProfileDTO {
  constructor(data) {
    // Solo incluir campos permitidos para actualización
    if (data.name !== undefined) this.name = data.name?.trim();
    if (data.email !== undefined) this.email = data.email?.toLowerCase().trim();
    if (data.password !== undefined) this.password = data.password;
    if (data.currentPassword !== undefined) this.currentPassword = data.currentPassword;
  }

  static fromRequest(body) {
    return new UpdateProfileDTO(body);
  }
}

// ========================================
// OUTPUT DTOs (Response - datos salientes)
// ========================================

/**
 * DTO para respuesta de usuario
 * No expone información sensible como password
 */
class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.email = user.email;
    this.name = user.name;
    this.role = user.role;
    this.isActive = user.isActive;
    this.lastLoginAt = user.lastLoginAt;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  static fromModel(user) {
    return new UserResponseDTO(user);
  }

  static fromModelArray(users) {
    return users.map(user => new UserResponseDTO(user));
  }

  // Método para convertir desde toJSON() del modelo
  static fromJSON(userJSON) {
    return new UserResponseDTO(userJSON);
  }
}

module.exports = {
  // Input DTOs
  UpdateProfileDTO,
  
  // Output DTOs
  UserResponseDTO
};
