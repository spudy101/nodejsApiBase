'use strict';

// tests/unit/services/auth-login/login.test.js

jest.mock('../../../../modules/kyc/repositories/user.repository');
jest.mock('../../../../modules/kyc/repositories/user-login-attempt.repository');
jest.mock('../../../../modules/kyc/repositories/trusted-device.repository');
jest.mock('../../../../shared/utils/cognito.util');
jest.mock('../../../../shared/utils/device-fingerprint.util');
jest.mock('../../../../modules/notification/src/services/notification-creation.service');
jest.mock('../../../../shared/constants', () => ({
  LOGIN_ATTEMPTS: {
    MAX_ATTEMPTS:           3,
    BLOCK_DURATION_MINUTES: 15,
  },
}));
jest.mock('../../../../modules/client/dtos/auth-login.dto', () => ({
  LoginResponseDTO:        jest.fn().mockImplementation((d) => ({ dto: 'login', ...d })),
  MFARequiredResponseDTO:  jest.fn().mockImplementation((d) => ({ dto: 'mfa-required', ...d })),
  RefreshTokenResponseDTO: jest.fn().mockImplementation((d) => ({ dto: 'refresh', ...d })),
  TrustedDeviceListDTO:    jest.fn().mockImplementation((d) => ({ dto: 'device-list', devices: d })),
  TrustedDeviceUpdateDTO:  jest.fn().mockImplementation((d) => ({ dto: 'device-update', ...d })),
}));

const userRepository             = require('../../../../modules/kyc/repositories/user.repository');
const userLoginAttemptRepository = require('../../../../modules/kyc/repositories/user-login-attempt.repository');
const trustedDeviceRepository    = require('../../../../modules/kyc/repositories/trusted-device.repository');
const CognitoUtil                = require('../../../../shared/utils/cognito.util');
const AppError                   = require('../../../../shared/utils/app-error.util');
const { logger }                 = require('../../../../shared/utils/logger.util');

const service = require('../../../../modules/client/src/services/auth-login.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockUser = {
  id:               1,
  cognito_username: 'user_cognito',
  is_active:        true,
  password_hash:    'hashed-password',
  person: {
    first_name: 'Juan',
    contact:    { email: 'juan@test.com' },
  },
};

const auditContext = {
  ip:              '127.0.0.1',
  userAgent:       'Mozilla/5.0',
  fingerprintHash: 'device-fp-abc',
};

const mockTokens = {
  accessToken:  'access-token',
  idToken:      'id-token',
  refreshToken: 'refresh-token',
  expiresIn:    3600,
};

// ─── login ────────────────────────────────────────────────────────────────────

describe('AuthLoginService', () => {

  describe('login', () => {

    describe('login exitoso', () => {

      beforeEach(() => {
        jest.clearAllMocks();
        userLoginAttemptRepository.checkIfBlocked.mockResolvedValue({ blocked: false });
        userRepository.findByNationalIdForLogin.mockResolvedValue(mockUser);
        userRepository.verifyPassword.mockResolvedValue(true);
        CognitoUtil.authenticateUser.mockResolvedValue(mockTokens);
        userLoginAttemptRepository.recordAttempt.mockResolvedValue({ id: 1 });
        userLoginAttemptRepository.countFailedAttempts.mockResolvedValue(0);
        trustedDeviceRepository.findByFingerprint.mockResolvedValue({ id: 1 });
        trustedDeviceRepository.updateLastSeen.mockResolvedValue();
      });

      it('debe retornar LoginResponseDTO con credenciales correctas', async () => {
        // ACT
        const result = await service.login({ nationalId: '12345678', password: 'Password123!' }, auditContext);

        // ASSERT
        expect(result).toMatchObject({ dto: 'login' });
        expect(userLoginAttemptRepository.recordAttempt).toHaveBeenCalledWith(
          expect.objectContaining({ success: true })
        );
      });

      it('debe retornar MFARequiredResponseDTO si Cognito exige TOTP', async () => {
        // ARRANGE
        CognitoUtil.authenticateUser.mockResolvedValue({
          challengeName: 'SOFTWARE_TOKEN_MFA',
          username:      'user_cognito',
          session:       'challenge-session',
        });

        // ACT
        const result = await service.login({ nationalId: '12345678', password: 'Password123!' }, auditContext);

        // ASSERT
        expect(result).toMatchObject({ dto: 'mfa-required', challengeType: 'SOFTWARE_TOKEN_MFA' });
      });
    });

    describe('login fallido', () => {

      beforeEach(() => {
        jest.clearAllMocks();
        userLoginAttemptRepository.checkIfBlocked.mockResolvedValue({ blocked: false });
        userLoginAttemptRepository.recordAttempt.mockResolvedValue({ id: 1 });
        userLoginAttemptRepository.countFailedAttempts.mockResolvedValue(0);
      });

      it('debe lanzar unauthorized si el usuario no existe', async () => {
        // ARRANGE
        userRepository.findByNationalIdForLogin.mockResolvedValue(null);

        // ACT & ASSERT
        await expect(service.login({ nationalId: '99999999', password: 'pass' }, auditContext))
          .rejects.toMatchObject({ statusCode: 401, message: 'Credenciales inválidas' });
      });

      it('debe lanzar forbidden si el usuario está inactivo', async () => {
        // ARRANGE
        userRepository.findByNationalIdForLogin.mockResolvedValue({ ...mockUser, is_active: false });

        // ACT & ASSERT
        await expect(service.login({ nationalId: '12345678', password: 'pass' }, auditContext))
          .rejects.toMatchObject({ statusCode: 403, message: 'Cuenta inactiva o suspendida' });
      });

      it('debe registrar intento fallido si la contraseña es incorrecta', async () => {
        // ARRANGE
        userRepository.findByNationalIdForLogin.mockResolvedValue(mockUser);
        userRepository.verifyPassword.mockResolvedValue(false);

        // ACT & ASSERT
        await expect(service.login({ nationalId: '12345678', password: 'wrong' }, auditContext))
          .rejects.toMatchObject({ statusCode: 401 });

        expect(userLoginAttemptRepository.recordAttempt).toHaveBeenCalledWith(
          expect.objectContaining({ success: false, failure_reason: 'Contraseña inválida' })
        );
      });

      it('debe registrar intento fallido si Cognito falla', async () => {
        // ARRANGE
        userRepository.findByNationalIdForLogin.mockResolvedValue(mockUser);
        userRepository.verifyPassword.mockResolvedValue(true);
        CognitoUtil.authenticateUser.mockRejectedValue(new Error('Cognito error'));

        // ACT & ASSERT
        await expect(service.login({ nationalId: '12345678', password: 'pass' }, auditContext))
          .rejects.toThrow();

        expect(userLoginAttemptRepository.recordAttempt).toHaveBeenCalledWith(
          expect.objectContaining({ success: false, failure_reason: 'Error en Cognito' })
        );
      });
    });

    describe('bloqueo de cuenta', () => {

      beforeEach(() => {
        jest.clearAllMocks();
        userLoginAttemptRepository.recordAttempt.mockResolvedValue({ id: 1 });
      });

      it('debe lanzar forbidden si la cuenta está bloqueada antes del intento', async () => {
        // ARRANGE
        userLoginAttemptRepository.checkIfBlocked.mockResolvedValue({
          blocked:          true,
          remainingMinutes: 10,
        });

        // ACT & ASSERT
        await expect(service.login({ nationalId: '12345678', password: 'pass' }, auditContext))
          .rejects.toMatchObject({ statusCode: 403 });

        expect(userRepository.findByNationalIdForLogin).not.toHaveBeenCalled();
      });

      it('debe bloquear la cuenta al alcanzar el máximo de intentos fallidos', async () => {
        // ARRANGE
        userLoginAttemptRepository.checkIfBlocked.mockResolvedValue({ blocked: false });
        userRepository.findByNationalIdForLogin.mockResolvedValue(mockUser);
        userRepository.verifyPassword.mockResolvedValue(false);
        // Ya van 2 intentos — este es el 3ro (MAX_ATTEMPTS = 3)
        userLoginAttemptRepository.countFailedAttempts.mockResolvedValue(2);

        // ACT & ASSERT
        await expect(service.login({ nationalId: '12345678', password: 'wrong' }, auditContext))
          .rejects.toMatchObject({ statusCode: 403 });

        expect(userLoginAttemptRepository.recordAttempt).toHaveBeenCalledWith(
          expect.objectContaining({ blocked_until: expect.any(Date) })
        );
      });
    });
  });

  // ─── verifyMFA ────────────────────────────────────────────────────────────

  describe('verifyMFA', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      userLoginAttemptRepository.checkIfBlocked.mockResolvedValue({ blocked: false });
      userRepository.findByNationalIdForLogin.mockResolvedValue(mockUser);
      userLoginAttemptRepository.recordAttempt.mockResolvedValue({ id: 1 });
      trustedDeviceRepository.findByFingerprint.mockResolvedValue({ id: 1 });
      trustedDeviceRepository.updateLastSeen.mockResolvedValue();
    });

    it('debe completar login exitosamente con código TOTP correcto', async () => {
      // ARRANGE
      CognitoUtil.respondToTOTPChallenge.mockResolvedValue(mockTokens);

      // ACT
      const result = await service.verifyMFA(
        { nationalId: '12345678', totpCode: '123456', session: 'sess' },
        auditContext
      );

      // ASSERT
      expect(result).toMatchObject({ dto: 'login' });
      expect(userLoginAttemptRepository.recordAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('debe registrar intento fallido si el código TOTP es incorrecto', async () => {
      // ARRANGE
      CognitoUtil.respondToTOTPChallenge.mockRejectedValue(new Error('Invalid TOTP'));

      // ACT & ASSERT
      await expect(service.verifyMFA(
        { nationalId: '12345678', totpCode: '000000', session: 'sess' },
        auditContext
      )).rejects.toThrow();

      expect(userLoginAttemptRepository.recordAttempt).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, failure_reason: 'Código TOTP incorrecto' })
      );
    });
  });

  // ─── refreshToken ─────────────────────────────────────────────────────────

  describe('refreshToken', () => {

    beforeEach(() => jest.clearAllMocks());

    it('debe retornar nuevos tokens si el usuario existe', async () => {
      // ARRANGE
      userRepository.findByNationalId.mockResolvedValue(mockUser);
      CognitoUtil.refreshAccessToken.mockResolvedValue(mockTokens);

      // ACT
      const result = await service.refreshToken('refresh-token', '12345678');

      // ASSERT
      expect(result).toMatchObject({ dto: 'refresh' });
      expect(CognitoUtil.refreshAccessToken).toHaveBeenCalledWith('refresh-token', 'user_cognito');
    });

    it('debe lanzar unauthorized si el usuario no existe', async () => {
      // ARRANGE
      userRepository.findByNationalId.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.refreshToken('refresh-token', '99999999'))
        .rejects.toMatchObject({ statusCode: 401, message: 'Usuario no encontrado' });
    });
  });

  // ─── logout ───────────────────────────────────────────────────────────────

  describe('logout', () => {

    it('debe actualizar last_seen del dispositivo y retornar null', async () => {
      // ARRANGE
      trustedDeviceRepository.updateLastSeen.mockResolvedValue();

      // ACT
      const result = await service.logout(1, 'fingerprint-abc');

      // ASSERT
      expect(trustedDeviceRepository.updateLastSeen).toHaveBeenCalledWith(1, 'fingerprint-abc');
      expect(result).toBeNull();
    });
  });

  // ─── trusted devices ──────────────────────────────────────────────────────

  describe('trusted devices', () => {

    beforeEach(() => jest.clearAllMocks());

    describe('getTrustedDevices', () => {

      it('debe retornar lista de dispositivos del usuario', async () => {
        // ARRANGE
        trustedDeviceRepository.findAllByUser.mockResolvedValue([{ id: 1 }, { id: 2 }]);

        // ACT
        const result = await service.getTrustedDevices(1, 'current-fp');

        // ASSERT
        expect(result).toMatchObject({ dto: 'device-list' });
      });
    });

    describe('renameDevice', () => {

      it('debe lanzar notFound si el dispositivo no existe', async () => {
        // ARRANGE
        trustedDeviceRepository.findByIdAndUser.mockResolvedValue(null);

        // ACT & ASSERT
        await expect(service.renameDevice(1, 99, 'Mi Mac'))
          .rejects.toMatchObject({ statusCode: 404, message: 'Dispositivo no encontrado' });
      });

      it('debe renombrar el dispositivo correctamente', async () => {
        // ARRANGE
        trustedDeviceRepository.findByIdAndUser.mockResolvedValue({ id: 1 });
        trustedDeviceRepository.rename.mockResolvedValue({ id: 1, device_name: 'Mi Mac' });

        // ACT
        const result = await service.renameDevice(1, 1, 'Mi Mac');

        // ASSERT
        expect(trustedDeviceRepository.rename).toHaveBeenCalledWith(1, 'Mi Mac');
        expect(result).toMatchObject({ dto: 'device-update' });
      });
    });

    describe('removeDevice', () => {

      it('debe lanzar notFound si el dispositivo no existe', async () => {
        // ARRANGE
        trustedDeviceRepository.findByIdAndUser.mockResolvedValue(null);

        // ACT & ASSERT
        await expect(service.removeDevice(1, 99, 'current-fp'))
          .rejects.toMatchObject({ statusCode: 404 });
      });

      it('debe lanzar badRequest si intenta eliminar el dispositivo actual', async () => {
        // ARRANGE
        trustedDeviceRepository.findByIdAndUser.mockResolvedValue({
          id: 1, fingerprint_hash: 'current-fp',
        });

        // ACT & ASSERT
        await expect(service.removeDevice(1, 1, 'current-fp'))
          .rejects.toMatchObject({ statusCode: 400 });
      });

      it('debe eliminar el dispositivo correctamente', async () => {
        // ARRANGE
        trustedDeviceRepository.findByIdAndUser.mockResolvedValue({
          id: 1, fingerprint_hash: 'other-fp',
        });
        trustedDeviceRepository.delete.mockResolvedValue();

        // ACT
        const result = await service.removeDevice(1, 1, 'current-fp');

        // ASSERT
        expect(trustedDeviceRepository.delete).toHaveBeenCalledWith(1);
        expect(result).toBeNull();
      });
    });
  });
});
