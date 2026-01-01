// tests/unit/dto/auth.dto.test.js
const {
  RegisterDTO,
  LoginDTO,
  RefreshTokenDTO,
  AuthResponseDTO,
  TokenResponseDTO
} = require('../../../src/dto/auth.dto');

describe('Auth DTOs - Unit Tests', () => {
  describe('RegisterDTO', () => {
    it('should create RegisterDTO with valid data', () => {
      const data = {
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123!',
        name: '  John Doe  ',
        role: 'user'
      };

      const dto = RegisterDTO.fromRequest(data);

      expect(dto.email).toBe('test@example.com'); // lowercase + trimmed
      expect(dto.password).toBe('Password123!');
      expect(dto.name).toBe('John Doe'); // trimmed
      expect(dto.role).toBe('user');
    });

    it('should set default role to "user" if not provided', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe'
      };

      const dto = RegisterDTO.fromRequest(data);

      expect(dto.role).toBe('user');
    });

    it('should handle undefined email gracefully', () => {
      const data = {
        email: undefined,
        password: 'Password123!',
        name: 'John Doe'
      };

      const dto = RegisterDTO.fromRequest(data);

      expect(dto.email).toBeUndefined();
    });

    it('should trim and lowercase email', () => {
      const data = {
        email: '   UPPERCASE@TEST.COM   ',
        password: 'Password123!',
        name: 'John Doe'
      };

      const dto = RegisterDTO.fromRequest(data);

      expect(dto.email).toBe('uppercase@test.com');
    });

    it('should preserve password as-is (no trimming)', () => {
      const data = {
        email: 'test@example.com',
        password: '  Password123!  ', // Con espacios
        name: 'John Doe'
      };

      const dto = RegisterDTO.fromRequest(data);

      // Password NO debe ser trimmeado (puede ser parte de la contraseña)
      expect(dto.password).toBe('  Password123!  ');
    });
  });

  describe('LoginDTO', () => {
    it('should create LoginDTO with valid data', () => {
      const data = {
        email: '  test@example.com  ',
        password: 'Password123!'
      };

      const dto = LoginDTO.fromRequest(data);

      expect(dto.email).toBe('test@example.com');
      expect(dto.password).toBe('Password123!');
    });

    it('should ignore extra fields', () => {
      const data = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Should be ignored',
        role: 'Should be ignored'
      };

      const dto = LoginDTO.fromRequest(data);

      expect(dto.email).toBe('test@example.com');
      expect(dto.password).toBe('Password123!');
      expect(dto.name).toBeUndefined();
      expect(dto.role).toBeUndefined();
    });

    it('should handle null email', () => {
      const data = {
        email: null,
        password: 'Password123!'
      };

      const dto = LoginDTO.fromRequest(data);

      expect(dto.email).toBeNull();
    });
  });

  describe('RefreshTokenDTO', () => {
    it('should create RefreshTokenDTO with valid token', () => {
      const data = {
        refreshToken: 'valid-refresh-token-here'
      };

      const dto = RefreshTokenDTO.fromRequest(data);

      expect(dto.refreshToken).toBe('valid-refresh-token-here');
    });

    it('should handle empty token', () => {
      const data = {
        refreshToken: ''
      };

      const dto = RefreshTokenDTO.fromRequest(data);

      expect(dto.refreshToken).toBe('');
    });
  });

  describe('AuthResponseDTO', () => {
    it('should create AuthResponseDTO with user and tokens', () => {
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
        password: 'hashed-password', // Should be excluded
        createdAt: new Date()
      };

      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const dto = AuthResponseDTO.fromData(user, tokens);

      expect(dto.user).toBeDefined();
      expect(dto.user.id).toBe('uuid-123');
      expect(dto.user.email).toBe('test@example.com');
      expect(dto.user.name).toBe('John Doe');
      expect(dto.user.role).toBe('user');
      expect(dto.user.password).toBeUndefined(); // Password excluded
      
      expect(dto.tokens).toBeDefined();
      expect(dto.tokens.accessToken).toBe('access-token');
      expect(dto.tokens.refreshToken).toBe('refresh-token');
    });

    it('should use UserResponseDTO for user data', () => {
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
        isActive: true,
        lastLogin: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const tokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      };

      const dto = AuthResponseDTO.fromData(user, tokens);

      // Verify UserResponseDTO structure
      expect(dto.user).toHaveProperty('id');
      expect(dto.user).toHaveProperty('email');
      expect(dto.user).toHaveProperty('name');
      expect(dto.user).toHaveProperty('role');
      expect(dto.user).not.toHaveProperty('password');
    });
  });

  describe('TokenResponseDTO', () => {
    it('should create TokenResponseDTO with tokens', () => {
      const tokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      };

      const dto = TokenResponseDTO.fromTokens(tokens);

      expect(dto.accessToken).toBe('new-access-token');
      expect(dto.refreshToken).toBe('new-refresh-token');
    });

    it('should handle tokens object', () => {
      const tokens = {
        accessToken: 'token1',
        refreshToken: 'token2',
        expiresIn: 900 // Should be ignored
      };

      const dto = TokenResponseDTO.fromTokens(tokens);

      expect(dto.accessToken).toBe('token1');
      expect(dto.refreshToken).toBe('token2');
      expect(dto.expiresIn).toBeUndefined();
    });
  });
});
