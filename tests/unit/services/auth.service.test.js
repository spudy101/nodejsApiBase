// tests/unit/services/auth.service.test.js
const authService = require('../../../src/services/auth.service');
const userRepository = require('../../../src/repository/user.repository');
const loginAttemptsRepository = require('../../../src/repository/loginAttempts.repository');
const JWTUtil = require('../../../src/utils/jwt');
const AppError = require('../../../src/utils/AppError');
const { RegisterDTO, LoginDTO, RefreshTokenDTO } = require('../../../src/dto/auth.dto');

// Mock dependencies
jest.mock('../../../src/repository/user.repository');
jest.mock('../../../src/repository/loginAttempts.repository');
jest.mock('../../../src/utils/jwt');

describe('AuthService - Unit Tests', () => {
  // Mock data
  const mockUser = {
    id: 'uuid-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'user',
    isActive: true,
    password: 'hashed-password',
    comparePassword: jest.fn(),
    toJSON: jest.fn().mockReturnValue({
      id: 'uuid-123',
      email: 'test@example.com',
      name: 'Test User',
      role: 'user'
    })
  };

  const mockTokens = {
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token'
  };

  const mockAuditContext = {
    ip: '127.0.0.1',
    userAgent: 'Jest Test',
    method: 'POST',
    path: '/api/auth/register'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register()', () => {
    it('should register a new user successfully', async () => {
      const registerDTO = RegisterDTO.fromRequest({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        role: 'user'
      });

      // Setup mocks
      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      JWTUtil.generateTokenPair.mockResolvedValue(mockTokens);

      // Execute
      const result = await authService.register(registerDTO, mockAuditContext);

      // Assertions
      expect(userRepository.findByEmail).toHaveBeenCalledWith('newuser@example.com');
      expect(userRepository.create).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
        role: 'user'
      });
      expect(JWTUtil.generateTokenPair).toHaveBeenCalledWith(mockUser);
      
      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should throw conflict error if email already exists', async () => {
      const registerDTO = RegisterDTO.fromRequest({
        email: 'existing@example.com',
        password: 'Password123!',
        name: 'Existing User'
      });

      // User already exists
      userRepository.findByEmail.mockResolvedValue(mockUser);

      // Execute & Assert
      await expect(
        authService.register(registerDTO, mockAuditContext)
      ).rejects.toThrow(AppError);

      await expect(
        authService.register(registerDTO, mockAuditContext)
      ).rejects.toMatchObject({
        statusCode: 409
      });

      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('should handle database errors during registration', async () => {
      const registerDTO = RegisterDTO.fromRequest({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User'
      });

      userRepository.findByEmail.mockResolvedValue(null);
      userRepository.create.mockRejectedValue(new Error('Database error'));

      await expect(
        authService.register(registerDTO, mockAuditContext)
      ).rejects.toThrow('Database error');
    });
  });

  describe('login()', () => {
    it('should login user successfully', async () => {
      const loginDTO = LoginDTO.fromRequest({
        email: 'test@example.com',
        password: 'Password123!'
      });

      // Setup mocks
      loginAttemptsRepository.isBlocked.mockResolvedValue(false);
      userRepository.findActiveByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(true);
      loginAttemptsRepository.resetAttempts.mockResolvedValue();
      userRepository.updateLastLogin.mockResolvedValue();
      JWTUtil.generateTokenPair.mockResolvedValue(mockTokens);

      // Execute
      const result = await authService.login(loginDTO, mockAuditContext);

      // Assertions
      expect(loginAttemptsRepository.isBlocked).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.findActiveByEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('Password123!');
      expect(loginAttemptsRepository.resetAttempts).toHaveBeenCalledWith('test@example.com');
      expect(userRepository.updateLastLogin).toHaveBeenCalledWith('uuid-123');
      expect(JWTUtil.generateTokenPair).toHaveBeenCalledWith(mockUser);
      
      expect(result).toBeDefined();
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should throw error if account is blocked', async () => {
      const loginDTO = LoginDTO.fromRequest({
        email: 'blocked@example.com',
        password: 'Password123!'
      });

      loginAttemptsRepository.isBlocked.mockResolvedValue(true);
      loginAttemptsRepository.getRemainingBlockTime.mockResolvedValue(600); // 10 min

      await expect(
        authService.login(loginDTO, mockAuditContext)
      ).rejects.toThrow(AppError);

      await expect(
        authService.login(loginDTO, mockAuditContext)
      ).rejects.toMatchObject({
        statusCode: 429
      });

      expect(userRepository.findActiveByEmail).not.toHaveBeenCalled();
    });

    it('should increment attempts if user not found', async () => {
      const loginDTO = LoginDTO.fromRequest({
        email: 'notfound@example.com',
        password: 'Password123!'
      });

      loginAttemptsRepository.isBlocked.mockResolvedValue(false);
      userRepository.findActiveByEmail.mockResolvedValue(null);

      await expect(
        authService.login(loginDTO, mockAuditContext)
      ).rejects.toThrow(AppError);

      expect(loginAttemptsRepository.incrementAttempts).toHaveBeenCalledWith(
        'notfound@example.com',
        '127.0.0.1'
      );
    });

    it('should increment attempts if password is invalid', async () => {
      const loginDTO = LoginDTO.fromRequest({
        email: 'test@example.com',
        password: 'WrongPassword!'
      });

      loginAttemptsRepository.isBlocked.mockResolvedValue(false);
      userRepository.findActiveByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login(loginDTO, mockAuditContext)
      ).rejects.toThrow(AppError);

      expect(loginAttemptsRepository.incrementAttempts).toHaveBeenCalledWith(
        'test@example.com',
        '127.0.0.1'
      );
    });

    it('should not reset attempts if login fails', async () => {
      const loginDTO = LoginDTO.fromRequest({
        email: 'test@example.com',
        password: 'WrongPassword!'
      });

      loginAttemptsRepository.isBlocked.mockResolvedValue(false);
      userRepository.findActiveByEmail.mockResolvedValue(mockUser);
      mockUser.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login(loginDTO, mockAuditContext)
      ).rejects.toThrow();

      expect(loginAttemptsRepository.resetAttempts).not.toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    it('should logout user successfully', async () => {
      const userId = 'uuid-123';
      const token = 'access-token';

      JWTUtil.blacklistToken.mockResolvedValue(true);
      JWTUtil.invalidateRefreshToken.mockResolvedValue(true);

      const result = await authService.logout(userId, token, mockAuditContext);

      expect(JWTUtil.blacklistToken).toHaveBeenCalledWith(token);
      expect(JWTUtil.invalidateRefreshToken).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('message');
    });

    it('should handle logout even if blacklist fails', async () => {
      const userId = 'uuid-123';
      const token = 'access-token';

      JWTUtil.blacklistToken.mockResolvedValue(false);
      JWTUtil.invalidateRefreshToken.mockResolvedValue(true);

      const result = await authService.logout(userId, token, mockAuditContext);

      expect(result).toHaveProperty('message');
    });
  });

  describe('refreshToken()', () => {
    it('should refresh token successfully', async () => {
      const refreshTokenDTO = RefreshTokenDTO.fromRequest({
        refreshToken: 'valid-refresh-token'
      });

      const decodedToken = {
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'user'
      };

      JWTUtil.verifyRefreshToken.mockReturnValue(decodedToken);
      JWTUtil.verifyStoredRefreshToken.mockResolvedValue(true);
      userRepository.findById.mockResolvedValue(mockUser);
      JWTUtil.generateTokenPair.mockResolvedValue(mockTokens);

      const result = await authService.refreshToken(refreshTokenDTO, mockAuditContext);

      expect(JWTUtil.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(JWTUtil.verifyStoredRefreshToken).toHaveBeenCalledWith('uuid-123', 'valid-refresh-token');
      expect(userRepository.findById).toHaveBeenCalledWith('uuid-123');
      expect(JWTUtil.generateTokenPair).toHaveBeenCalledWith(mockUser);
      
      expect(result.tokens).toEqual(mockTokens);
    });

    it('should throw error if stored token is invalid', async () => {
      const refreshTokenDTO = RefreshTokenDTO.fromRequest({
        refreshToken: 'invalid-refresh-token'
      });

      const decodedToken = {
        id: 'uuid-123',
        email: 'test@example.com'
      };

      JWTUtil.verifyRefreshToken.mockReturnValue(decodedToken);
      JWTUtil.verifyStoredRefreshToken.mockResolvedValue(false);

      await expect(
        authService.refreshToken(refreshTokenDTO, mockAuditContext)
      ).rejects.toThrow(AppError);

      expect(userRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error if user not found', async () => {
      const refreshTokenDTO = RefreshTokenDTO.fromRequest({
        refreshToken: 'valid-refresh-token'
      });

      const decodedToken = {
        id: 'uuid-123',
        email: 'test@example.com'
      };

      JWTUtil.verifyRefreshToken.mockReturnValue(decodedToken);
      JWTUtil.verifyStoredRefreshToken.mockResolvedValue(true);
      userRepository.findById.mockResolvedValue(null);

      await expect(
        authService.refreshToken(refreshTokenDTO, mockAuditContext)
      ).rejects.toThrow(AppError);
    });

    it('should throw error if user is inactive', async () => {
      const refreshTokenDTO = RefreshTokenDTO.fromRequest({
        refreshToken: 'valid-refresh-token'
      });

      const decodedToken = {
        id: 'uuid-123',
        email: 'test@example.com'
      };

      const inactiveUser = { ...mockUser, isActive: false };

      JWTUtil.verifyRefreshToken.mockReturnValue(decodedToken);
      JWTUtil.verifyStoredRefreshToken.mockResolvedValue(true);
      userRepository.findById.mockResolvedValue(inactiveUser);

      await expect(
        authService.refreshToken(refreshTokenDTO, mockAuditContext)
      ).rejects.toThrow(AppError);
    });
  });

  describe('verifyToken()', () => {
    it('should verify valid token', async () => {
      const token = 'valid-token';
      const decodedToken = {
        id: 'uuid-123',
        email: 'test@example.com',
        role: 'user'
      };

      JWTUtil.isTokenBlacklisted.mockResolvedValue(false);
      JWTUtil.verifyAccessToken.mockReturnValue(decodedToken);
      userRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.verifyToken(token);

      expect(result.valid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.id).toBe('uuid-123');
    });

    it('should return invalid if token is blacklisted', async () => {
      const token = 'blacklisted-token';

      JWTUtil.isTokenBlacklisted.mockResolvedValue(true);

      const result = await authService.verifyToken(token);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Token blacklisted');
    });

    it('should return invalid if user not found', async () => {
      const token = 'valid-token';
      const decodedToken = {
        id: 'uuid-123',
        email: 'test@example.com'
      };

      JWTUtil.isTokenBlacklisted.mockResolvedValue(false);
      JWTUtil.verifyAccessToken.mockReturnValue(decodedToken);
      userRepository.findById.mockResolvedValue(null);

      const result = await authService.verifyToken(token);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('User not found or inactive');
    });

    it('should return invalid if user is inactive', async () => {
      const token = 'valid-token';
      const decodedToken = {
        id: 'uuid-123',
        email: 'test@example.com'
      };

      const inactiveUser = { ...mockUser, isActive: false };

      JWTUtil.isTokenBlacklisted.mockResolvedValue(false);
      JWTUtil.verifyAccessToken.mockReturnValue(decodedToken);
      userRepository.findById.mockResolvedValue(inactiveUser);

      const result = await authService.verifyToken(token);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('User not found or inactive');
    });

    it('should handle JWT verification errors', async () => {
      const token = 'invalid-token';

      JWTUtil.isTokenBlacklisted.mockResolvedValue(false);
      JWTUtil.verifyAccessToken.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await authService.verifyToken(token);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid token');
    });
  });
});
