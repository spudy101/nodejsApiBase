'use strict';

// tests/unit/services/auth-register/register.test.js

jest.mock('uuid', () => ({ v4: () => 'test-uuid-1234' }));
jest.mock('crypto', () => ({
  randomBytes: () => ({ toString: () => 'mock-token-hex' }),
}));
jest.mock('../../../../shared/models', () => ({
  sequelize: { transaction: jest.fn() },
}));
jest.mock('../../../../modules/kyc/repositories/user.repository');
jest.mock('../../../../modules/kyc/repositories/person.repository');
jest.mock('../../../../modules/kyc/repositories/person-contact.repository');
jest.mock('../../../../modules/kyc/repositories/reset-credentials.repository');
jest.mock('../../../../modules/kyc/repositories/role.repository');
jest.mock('../../../../modules/notification/repositories/user-notification-preference.repository');
jest.mock('../../../../shared/utils/cognito.util');
jest.mock('../../../../modules/notification/src/services/notification-creation.service');
jest.mock('../../../../shared/constants', () => ({
  frontend:   { resetCredentialUrl: 'https://app.com/reset' },
  SECURITY:   { RESET_TOKEN_EXPIRATION_MINUTES: 30 },
  USER_ROLES: { USER: 'user' },
}));
jest.mock('../../../../modules/client/dtos/auth-register.dto', () => ({
  RegisterResponseDTO: jest.fn().mockImplementation((d) => ({ dto: 'register', ...d })),
}));

const { sequelize }              = require('../../../../shared/models');
const userRepository             = require('../../../../modules/kyc/repositories/user.repository');
const personRepository           = require('../../../../modules/kyc/repositories/person.repository');
const personContactRepository    = require('../../../../modules/kyc/repositories/person-contact.repository');
const resetCredentialsRepository = require('../../../../modules/kyc/repositories/reset-credentials.repository');
const roleRepository             = require('../../../../modules/kyc/repositories/role.repository');
const userNotificationPreferenceRepository = require('../../../../modules/notification/repositories/user-notification-preference.repository');
const CognitoUtil                = require('../../../../shared/utils/cognito.util');
const AppError                   = require('../../../../shared/utils/app-error.util');
const { logger }                 = require('../../../../shared/utils/logger.util');

const service = require('../../../../modules/client/src/services/auth-register.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockTransaction = () => {
  const t = { commit: jest.fn(), rollback: jest.fn() };
  sequelize.transaction.mockResolvedValue(t);
  return t;
};

const baseUserData = {
  email:      'juan@test.com',
  password:   'Password123!',
  firstName:  'Juan',
  lastName:   'Pérez',
  nationalId: '12345678',
  genderId:   1,
  countryId:  1,
};

const mockUser    = { id: 1, cognito_username: 'user_test-uuid-1234', person_id: 1, role_id: 1 };
const mockPerson  = { id: 1, first_name: 'Juan' };
const mockContact = { id: 1, email: 'juan@test.com' };
const mockTokens  = { accessToken: 'access', idToken: 'id', refreshToken: 'refresh', expiresIn: 3600 };

// ─── register ────────────────────────────────────────────────────────────────

describe('AuthRegisterService', () => {

  describe('register', () => {

    describe('registro exitoso', () => {

      beforeEach(() => {
        jest.clearAllMocks();
        personContactRepository.findByEmail.mockResolvedValue(null);
        personRepository.findByNationalId.mockResolvedValue(null);
        CognitoUtil.createUser.mockResolvedValue({ sub: 'cognito-sub-123' });
        CognitoUtil.updateUserCustomAttributes.mockResolvedValue();
        CognitoUtil.authenticateUser.mockResolvedValue(mockTokens);
        CognitoUtil.deleteUser.mockResolvedValue();
        roleRepository.findByName.mockResolvedValue({ id: 1, name: 'user' });
        const t = mockTransaction();
        personRepository.create.mockResolvedValue(mockPerson);
        personContactRepository.create.mockResolvedValue(mockContact);
        userRepository.create.mockResolvedValue(mockUser);
        userNotificationPreferenceRepository.create.mockResolvedValue({});
        t.commit.mockResolvedValue();
      });

      it('debe retornar RegisterResponseDTO con los datos del usuario', async () => {
        // ARRANGE — ya configurado en beforeEach

        // ACT
        const result = await service.register(baseUserData);

        // ASSERT
        expect(result).toMatchObject({ dto: 'register' });
        expect(CognitoUtil.createUser).toHaveBeenCalledWith({
          username: 'user_test-uuid-1234',
          email:    baseUserData.email,
          password: baseUserData.password,
        });
        expect(CognitoUtil.updateUserCustomAttributes).toHaveBeenCalled();
        expect(CognitoUtil.authenticateUser).toHaveBeenCalled();
      });

      it('debe crear en Cognito primero y en BD después', async () => {
        // ARRANGE
        const callOrder = [];
        CognitoUtil.createUser.mockImplementation(() => {
          callOrder.push('cognito');
          return Promise.resolve({ sub: 'sub-123' });
        });
        personRepository.create.mockImplementation(() => {
          callOrder.push('db');
          return Promise.resolve(mockPerson);
        });

        // ACT
        await service.register(baseUserData);

        // ASSERT
        expect(callOrder).toEqual(['cognito', 'db']);
      });
    });

    describe('validaciones de unicidad', () => {

      beforeEach(() => jest.clearAllMocks());

      it('debe lanzar conflict si el email ya está registrado', async () => {
        // ARRANGE
        personContactRepository.findByEmail.mockResolvedValue({ id: 99 });
        personRepository.findByNationalId.mockResolvedValue(null);

        // ACT & ASSERT
        await expect(service.register(baseUserData))
          .rejects.toMatchObject({ statusCode: 409, message: 'El email ya está registrado' });

        expect(CognitoUtil.createUser).not.toHaveBeenCalled();
      });

      it('debe lanzar conflict si el nationalId ya existe', async () => {
        // ARRANGE
        personContactRepository.findByEmail.mockResolvedValue(null);
        personRepository.findByNationalId.mockResolvedValue({ id: 99 });

        // ACT & ASSERT
        await expect(service.register(baseUserData))
          .rejects.toMatchObject({ statusCode: 409, message: 'El usuario ya existe' });

        expect(CognitoUtil.createUser).not.toHaveBeenCalled();
      });
    });

    describe('rollback de Cognito', () => {

      beforeEach(() => {
        jest.clearAllMocks();
        personContactRepository.findByEmail.mockResolvedValue(null);
        personRepository.findByNationalId.mockResolvedValue(null);
        CognitoUtil.createUser.mockResolvedValue({ sub: 'sub-123' });
        CognitoUtil.deleteUser.mockResolvedValue();
        roleRepository.findByName.mockResolvedValue({ id: 1, name: 'user' });
        mockTransaction();
      });

      it('debe eliminar el usuario de Cognito si falla la creación en BD', async () => {
        // ARRANGE
        personRepository.create.mockRejectedValue(new Error('DB connection error'));

        // ACT & ASSERT
        await expect(service.register(baseUserData)).rejects.toThrow();

        expect(CognitoUtil.createUser).toHaveBeenCalled();
        expect(CognitoUtil.deleteUser).toHaveBeenCalledWith('user_test-uuid-1234');
      });

      it('debe eliminar el usuario de Cognito si falla updateUserCustomAttributes', async () => {
        // ARRANGE
        const t = mockTransaction();
        personRepository.create.mockResolvedValue(mockPerson);
        personContactRepository.create.mockResolvedValue(mockContact);
        userRepository.create.mockResolvedValue(mockUser);
        userNotificationPreferenceRepository.create.mockResolvedValue({});
        t.commit.mockResolvedValue();
        CognitoUtil.updateUserCustomAttributes.mockRejectedValue(new Error('Cognito attr error'));

        // ACT & ASSERT
        await expect(service.register(baseUserData)).rejects.toThrow();

        expect(CognitoUtil.deleteUser).toHaveBeenCalledWith('user_test-uuid-1234');
      });

      it('NO debe intentar eliminar Cognito si nunca llegó a crearse', async () => {
        // ARRANGE
        CognitoUtil.createUser.mockRejectedValue(new Error('Cognito unavailable'));

        // ACT & ASSERT
        await expect(service.register(baseUserData)).rejects.toThrow();

        expect(CognitoUtil.deleteUser).not.toHaveBeenCalled();
      });

      it('debe relanzar AppError conocido sin reemplazarlo por error genérico', async () => {
        // ARRANGE
        personRepository.create.mockRejectedValue(AppError.conflict('El email ya está registrado'));

        // ACT & ASSERT
        await expect(service.register(baseUserData))
          .rejects.toMatchObject({ statusCode: 409, message: 'El email ya está registrado' });
      });

      it('debe lanzar error genérico para errores inesperados', async () => {
        // ARRANGE
        personRepository.create.mockRejectedValue(new Error('Unexpected DB error'));

        // ACT & ASSERT
        await expect(service.register(baseUserData))
          .rejects.toMatchObject({ statusCode: 500, message: 'Error al crear usuario. Intenta nuevamente' });
      });
    });
  });

  // ─── requestResetCredentials ───────────────────────────────────────────────

  describe('requestResetCredentials', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      resetCredentialsRepository.create.mockResolvedValue({});
    });

    describe('usuario no encontrado o inactivo', () => {

      it('debe retornar null si el email no existe — sin revelar info al cliente', async () => {
        // ARRANGE
        personContactRepository.findByEmail.mockResolvedValue(null);

        // ACT
        const result = await service.requestResetCredentials({ email: 'noexiste@test.com', type: 'password' });

        // ASSERT
        expect(result).toBeNull();
        expect(resetCredentialsRepository.create).not.toHaveBeenCalled();
      });

      it('debe retornar null si el usuario está inactivo', async () => {
        // ARRANGE
        personContactRepository.findByEmail.mockResolvedValue({
          person: { user: { id: 1, is_active: false } },
        });

        // ACT
        const result = await service.requestResetCredentials({ email: 'inactivo@test.com', type: 'password' });

        // ASSERT
        expect(result).toBeNull();
        expect(resetCredentialsRepository.create).not.toHaveBeenCalled();
      });
    });

    describe('usuario activo', () => {

      beforeEach(() => {
        personContactRepository.findByEmail.mockResolvedValue({
          person: { first_name: 'Juan', user: { id: 1, is_active: true } },
        });
      });

      it('debe crear token de reset si el usuario existe y está activo', async () => {
        // ACT
        const result = await service.requestResetCredentials({ email: 'juan@test.com', type: 'password' });

        // ASSERT
        expect(result).toBeNull(); // siempre null — no revela si existe
        expect(resetCredentialsRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({
            user_id: 1,
            token:   'mock-token-hex',
            type:    'password',
            email:   'juan@test.com',
          })
        );
      });

      it('debe crear token para reset de MFA también', async () => {
        // ACT
        await service.requestResetCredentials({ email: 'juan@test.com', type: 'mfa' });

        // ASSERT
        expect(resetCredentialsRepository.create).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'mfa' })
        );
      });
    });
  });

  // ─── confirmResetCredentials ───────────────────────────────────────────────

  describe('confirmResetCredentials', () => {

    const mockResetRecord = {
      id:   1,
      type: 'password',
      user: {
        id:               1,
        cognito_username: 'user_cognito',
        person: {
          first_name: 'Juan',
          contact:    { email: 'juan@test.com' },
        },
      },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      CognitoUtil.changeUserPassword.mockResolvedValue();
      CognitoUtil.disableTOTPMFA.mockResolvedValue();
      CognitoUtil.enableTOTPMFA.mockResolvedValue();
      userRepository.updatePassword.mockResolvedValue();
      userRepository.updateTOTPStatus.mockResolvedValue();
      resetCredentialsRepository.markAsUsed.mockResolvedValue();
      const t = mockTransaction();
      t.commit.mockResolvedValue();
    });

    describe('validaciones de token', () => {

      it('debe lanzar badRequest si el token es inválido o expirado', async () => {
        // ARRANGE
        resetCredentialsRepository.findValidToken.mockResolvedValue(null);

        // ACT & ASSERT
        await expect(service.confirmResetCredentials({ token: 'bad-token', type: 'password' }))
          .rejects.toMatchObject({ statusCode: 400, message: 'Token inválido o expirado' });
      });

      it('debe lanzar badRequest si el tipo no coincide con el token', async () => {
        // ARRANGE
        resetCredentialsRepository.findValidToken.mockResolvedValue({ ...mockResetRecord, type: 'mfa' });

        // ACT & ASSERT
        await expect(service.confirmResetCredentials({ token: 'valid', type: 'password' }))
          .rejects.toMatchObject({ statusCode: 400, message: 'Tipo de reset incorrecto' });
      });

      it('debe lanzar badRequest si type=password y no viene newPassword', async () => {
        // ARRANGE
        resetCredentialsRepository.findValidToken.mockResolvedValue(mockResetRecord);

        // ACT & ASSERT
        await expect(service.confirmResetCredentials({ token: 'valid', type: 'password' }))
          .rejects.toMatchObject({ statusCode: 400, message: 'La nueva contraseña es requerida' });
      });
    });

    describe('reset de password', () => {

      beforeEach(() => {
        resetCredentialsRepository.findValidToken.mockResolvedValue(mockResetRecord);
      });

      it('debe actualizar Cognito primero y BD después', async () => {
        // ARRANGE
        const callOrder = [];
        CognitoUtil.changeUserPassword.mockImplementation(() => {
          callOrder.push('cognito');
          return Promise.resolve();
        });
        userRepository.updatePassword.mockImplementation(() => {
          callOrder.push('db');
          return Promise.resolve();
        });

        // ACT
        await service.confirmResetCredentials({ token: 'valid', newPassword: 'NewPass123!', type: 'password' });

        // ASSERT
        expect(callOrder).toEqual(['cognito', 'db']);
      });

      it('NO debe revertir Cognito si falla BD — loguea CRITICAL en su lugar', async () => {
        // ARRANGE
        userRepository.updatePassword.mockRejectedValue(new Error('DB error'));

        // ACT & ASSERT
        await expect(service.confirmResetCredentials({
          token: 'valid', newPassword: 'NewPass123!', type: 'password',
        })).rejects.toThrow();

        expect(CognitoUtil.changeUserPassword).toHaveBeenCalled();
        expect(CognitoUtil.disableTOTPMFA).not.toHaveBeenCalled(); // no era mfa
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining('CRITICAL'),
          expect.any(Object)
        );
      });
    });

    describe('reset de MFA', () => {

      beforeEach(() => {
        resetCredentialsRepository.findValidToken.mockResolvedValue({ ...mockResetRecord, type: 'mfa' });
      });

      it('debe deshabilitar MFA en Cognito primero y actualizar BD después', async () => {
        // ARRANGE
        const callOrder = [];
        CognitoUtil.disableTOTPMFA.mockImplementation(() => {
          callOrder.push('cognito');
          return Promise.resolve();
        });
        userRepository.updateTOTPStatus.mockImplementation(() => {
          callOrder.push('db');
          return Promise.resolve();
        });

        // ACT
        await service.confirmResetCredentials({ token: 'valid', type: 'mfa' });

        // ASSERT
        expect(callOrder).toEqual(['cognito', 'db']);
      });

      it('debe revertir MFA en Cognito si falla la actualización en BD', async () => {
        // ARRANGE
        userRepository.updateTOTPStatus.mockRejectedValue(new Error('DB error'));

        // ACT & ASSERT
        await expect(service.confirmResetCredentials({ token: 'valid', type: 'mfa' }))
          .rejects.toThrow();

        expect(CognitoUtil.disableTOTPMFA).toHaveBeenCalled();
        expect(CognitoUtil.enableTOTPMFA).toHaveBeenCalledWith('user_cognito');
      });
    });
  });
});
