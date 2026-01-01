// tests/unit/validators/auth.validator.test.js
const { validationResult } = require('express-validator');
const AuthValidator = require('../../../src/validators/auth.validator');

describe('Auth Validators - Unit Tests', () => {
  // Helper para ejecutar validaciones
  const runValidation = async (validators, req) => {
    for (const validator of validators) {
      await validator.run(req);
    }
    return validationResult(req);
  };

  // Mock request object
  const createMockReq = (body = {}) => ({
    body,
    query: {},
    params: {}
  });

  describe('register() validator', () => {
    it('should pass with valid registration data', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe',
        role: 'user'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const req = createMockReq({
        email: 'not-an-email',
        password: 'Password123!',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'email')).toBe(true);
    });

    it('should fail with empty email', async () => {
      const req = createMockReq({
        email: '',
        password: 'Password123!',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'email')).toBe(true);
    });

    it('should fail with short password', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Pass1!', // Solo 6 caracteres
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail with password without uppercase', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'password123!',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail with password without lowercase', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'PASSWORD123!',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail with password without number', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password!',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail with password without special character', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail with short name', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'A' // Solo 1 carácter
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'name')).toBe(true);
    });

    it('should fail with name containing numbers', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John123'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'name')).toBe(true);
    });

    it('should accept name with accents and ñ', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'José María Pérez Muñoz'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid role', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe',
        role: 'superadmin' // Invalid role
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'role')).toBe(true);
    });

    it('should pass with valid admin role', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe',
        role: 'admin'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should pass without role (optional)', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should normalize email to lowercase', async () => {
      const req = createMockReq({
        email: 'TEST@EXAMPLE.COM',
        password: 'Password123!',
        name: 'John Doe'
      });

      const validators = AuthValidator.register();
      await runValidation(validators, req);

      expect(req.body.email).toBe('test@example.com');
    });

    it('should trim whitespace from fields', async () => {
      const req = createMockReq({
        email: '  test@example.com  ',
        password: 'Password123!',
        name: '  John Doe  '
      });

      const validators = AuthValidator.register();
      await runValidation(validators, req);

      expect(req.body.email).toBe('test@example.com');
      expect(req.body.name).toBe('John Doe');
    });
  });

  describe('login() validator', () => {
    it('should pass with valid credentials', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: 'Password123!'
      });

      const validators = AuthValidator.login();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with invalid email format', async () => {
      const req = createMockReq({
        email: 'not-an-email',
        password: 'Password123!'
      });

      const validators = AuthValidator.login();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'email')).toBe(true);
    });

    it('should fail with empty email', async () => {
      const req = createMockReq({
        email: '',
        password: 'Password123!'
      });

      const validators = AuthValidator.login();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
    });

    it('should fail with empty password', async () => {
      const req = createMockReq({
        email: 'test@example.com',
        password: ''
      });

      const validators = AuthValidator.login();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'password')).toBe(true);
    });

    it('should fail with missing fields', async () => {
      const req = createMockReq({});

      const validators = AuthValidator.login();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should normalize email', async () => {
      const req = createMockReq({
        email: '  TEST@EXAMPLE.COM  ',
        password: 'Password123!'
      });

      const validators = AuthValidator.login();
      await runValidation(validators, req);

      expect(req.body.email).toBe('test@example.com');
    });
  });

  describe('refreshToken() validator', () => {
    it('should pass with valid refresh token', async () => {
      const req = createMockReq({
        refreshToken: 'valid-refresh-token-string'
      });

      const validators = AuthValidator.refreshToken();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(true);
    });

    it('should fail with empty refresh token', async () => {
      const req = createMockReq({
        refreshToken: ''
      });

      const validators = AuthValidator.refreshToken();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
      const errors = result.array();
      expect(errors.some(e => e.path === 'refreshToken')).toBe(true);
    });

    it('should fail without refresh token', async () => {
      const req = createMockReq({});

      const validators = AuthValidator.refreshToken();
      const result = await runValidation(validators, req);

      expect(result.isEmpty()).toBe(false);
    });

    it('should trim refresh token', async () => {
      const req = createMockReq({
        refreshToken: '  token-with-spaces  '
      });

      const validators = AuthValidator.refreshToken();
      await runValidation(validators, req);

      expect(req.body.refreshToken).toBe('token-with-spaces');
    });
  });
});
