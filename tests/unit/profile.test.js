'use strict';

// tests/unit/services/profile/profile.test.js

jest.mock('../../../../shared/models', () => ({
  sequelize:      { transaction: jest.fn() },
  PersonLocation: { findOne: jest.fn(), create: jest.fn() },
}));
jest.mock('../../../../modules/kyc/repositories/user.repository');
jest.mock('../../../../modules/kyc/repositories/person.repository');
jest.mock('../../../../modules/kyc/repositories/person-contact.repository');
jest.mock('../../../../modules/kyc/repositories/avatar.repository');
jest.mock('../../../../modules/kyc/repositories/gender.repository');
jest.mock('../../../../modules/kyc/repositories/verification-code.repository');
jest.mock('../../../../shared/utils/cognito.util');
jest.mock('../../../../modules/kyc/utils/kyc.util');
jest.mock('../../../../modules/notification/src/services/notification-creation.service');
jest.mock('bcryptjs');
jest.mock('../../../../modules/client/dtos/profile.dto', () => ({
  BasicProfileDTO:             jest.fn().mockImplementation((d) => ({ dto: 'basic-profile' })),
  FullProfileDTO:              jest.fn().mockImplementation((d) => ({ dto: 'full-profile' })),
  UpdateEmailResponseDTO:      jest.fn().mockImplementation((d) => ({ dto: 'update-email' })),
  UpdatePhoneResponseDTO:      jest.fn().mockImplementation((d) => ({ dto: 'update-phone' })),
  UpdateNationalIdResponseDTO: jest.fn().mockImplementation((d) => ({ dto: 'update-national-id' })),
}));

const { sequelize }              = require('../../../../shared/models');
const userRepository             = require('../../../../modules/kyc/repositories/user.repository');
const personRepository           = require('../../../../modules/kyc/repositories/person.repository');
const personContactRepository    = require('../../../../modules/kyc/repositories/person-contact.repository');
const avatarRepository           = require('../../../../modules/kyc/repositories/avatar.repository');
const verificationCodeRepository = require('../../../../modules/kyc/repositories/verification-code.repository');
const CognitoUtil                = require('../../../../shared/utils/cognito.util');
const KycSharedUtil              = require('../../../../modules/kyc/utils/kyc.util');
const AppError                   = require('../../../../shared/utils/app-error.util');
const bcrypt                     = require('bcryptjs');
const { logger }                 = require('../../../../shared/utils/logger.util');

const service = require('../../../../modules/client/src/services/profile.service');

// ─── Helpers ─────────────────────────────────────────────────────────────────

const mockTransaction = () => {
  const t = { commit: jest.fn(), rollback: jest.fn(), finished: false };
  sequelize.transaction.mockResolvedValue(t);
  return t;
};

const mockContact = {
  id:     1,
  email:  'juan@test.com',
  update: jest.fn().mockResolvedValue({}),
};

const mockPerson = {
  id:          1,
  first_name:  'Juan',
  national_id: '12345678',
  contact:     mockContact,
  update:      jest.fn().mockResolvedValue({}),
};

const mockUser = {
  id:               1,
  username:         '12345678',
  cognito_username: 'user_cognito',
  is_active:        true,
  password_hash:    'hashed-password',
  person:           mockPerson,
};

const metadata = {
  userId:          1,
  cognitoUsername: 'user_cognito',
  ipAddress:       '127.0.0.1',
  userAgent:       'Mozilla/5.0',
};

// ─── getProfile / getFullProfile ──────────────────────────────────────────────

describe('ProfileService', () => {

  describe('getProfile', () => {

    beforeEach(() => jest.clearAllMocks());

    it('debe retornar BasicProfileDTO si el usuario existe', async () => {
      // ARRANGE
      userRepository.findByUserId.mockResolvedValue(mockUser);

      // ACT
      const result = await service.getProfile(1);

      // ASSERT
      expect(result).toMatchObject({ dto: 'basic-profile' });
    });

    it('debe lanzar notFound si el usuario no existe', async () => {
      // ARRANGE
      userRepository.findByUserId.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.getProfile(99))
        .rejects.toMatchObject({ statusCode: 404, message: 'Usuario no encontrado' });
    });
  });

  describe('getFullProfile', () => {

    it('debe retornar FullProfileDTO si el usuario existe', async () => {
      // ARRANGE
      userRepository.findByUserId.mockResolvedValue(mockUser);

      // ACT
      const result = await service.getFullProfile(1);

      // ASSERT
      expect(result).toMatchObject({ dto: 'full-profile' });
    });
  });

  // ─── updateProfile ────────────────────────────────────────────────────────

  describe('updateProfile', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      mockTransaction();
      userRepository.findByUserId.mockResolvedValue(mockUser);
      userRepository.findOne.mockResolvedValue(null);
      userRepository.update.mockResolvedValue();
    });

    it('debe actualizar username correctamente', async () => {
      // ACT
      await service.updateProfile({ username: 'nuevo_username' }, 1);

      // ASSERT
      expect(userRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ username: 'nuevo_username' }),
        expect.any(Object)
      );
    });

    it('debe lanzar conflict si el username ya está en uso por otro usuario', async () => {
      // ARRANGE
      userRepository.findOne.mockResolvedValue({ id: 99 });

      // ACT & ASSERT
      await expect(service.updateProfile({ username: 'ocupado' }, 1))
        .rejects.toMatchObject({ statusCode: 409, message: 'El username ya está en uso' });
    });

    it('debe lanzar notFound si el avatar no existe', async () => {
      // ARRANGE
      avatarRepository.findById.mockResolvedValue(null);

      // ACT & ASSERT
      await expect(service.updateProfile({ avatarId: 99 }, 1))
        .rejects.toMatchObject({ statusCode: 404, message: 'Avatar no encontrado' });
    });

    it('debe lanzar badRequest si el avatar no está activo', async () => {
      // ARRANGE
      avatarRepository.findById.mockResolvedValue({ id: 1, is_active: false });

      // ACT & ASSERT
      await expect(service.updateProfile({ avatarId: 1 }, 1))
        .rejects.toMatchObject({ statusCode: 400, message: 'Avatar no disponible' });
    });

    it('debe hacer rollback si falla la transacción', async () => {
      // ARRANGE
      const t = mockTransaction();
      userRepository.update.mockRejectedValue(new Error('DB error'));

      // ACT & ASSERT
      await expect(service.updateProfile({ username: 'nuevo' }, 1)).rejects.toThrow();

      expect(t.rollback).toHaveBeenCalled();
    });
  });

  // ─── updateEmail ─────────────────────────────────────────────────────────

  describe('updateEmail', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      mockTransaction();
      userRepository.findByUserId.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      verificationCodeRepository.findVerifiedByContact.mockResolvedValue({ id: 1 });
      personContactRepository.findByEmail.mockResolvedValue(null);
      CognitoUtil.updateUserEmail.mockResolvedValue();
      KycSharedUtil.logChange.mockResolvedValue();
      personContactRepository.update.mockResolvedValue();
    });

    describe('validaciones', () => {

      it('debe lanzar unauthorized si la contraseña actual es incorrecta', async () => {
        // ARRANGE
        bcrypt.compare.mockResolvedValue(false);

        // ACT & ASSERT
        await expect(service.updateEmail({ email: 'nuevo@test.com', currentPassword: 'wrong' }, metadata))
          .rejects.toMatchObject({ statusCode: 401, message: 'Contraseña incorrecta' });
      });

      it('debe lanzar forbidden si el email nuevo no está verificado', async () => {
        // ARRANGE
        verificationCodeRepository.findVerifiedByContact.mockResolvedValue(null);

        // ACT & ASSERT
        await expect(service.updateEmail({ email: 'nuevo@test.com', currentPassword: 'pass' }, metadata))
          .rejects.toMatchObject({ statusCode: 403 });
      });

      it('debe lanzar conflict si el email ya está en uso por otro usuario', async () => {
        // ARRANGE
        personContactRepository.findByEmail.mockResolvedValue({ person_id: 99 });

        // ACT & ASSERT
        await expect(service.updateEmail({ email: 'ocupado@test.com', currentPassword: 'pass' }, metadata))
          .rejects.toMatchObject({ statusCode: 409 });
      });

      it('debe lanzar badRequest si el nuevo email es igual al actual', async () => {
        // ACT & ASSERT — mismo email que tiene mockUser
        await expect(service.updateEmail({ email: 'juan@test.com', currentPassword: 'pass' }, metadata))
          .rejects.toMatchObject({ statusCode: 400, message: 'El nuevo email es igual al actual' });
      });
    });

    describe('orden de operaciones', () => {

      it('debe actualizar BD primero y Cognito después', async () => {
        // ARRANGE
        const callOrder = [];
        mockContact.update.mockImplementation(() => {
          callOrder.push('db');
          return Promise.resolve();
        });
        CognitoUtil.updateUserEmail.mockImplementation(() => {
          callOrder.push('cognito');
          return Promise.resolve();
        });

        // ACT
        await service.updateEmail({ email: 'nuevo@test.com', currentPassword: 'pass' }, metadata);

        // ASSERT
        expect(callOrder).toEqual(['db', 'cognito']);
      });

      it('debe revertir BD si Cognito falla después del commit', async () => {
        // ARRANGE
        CognitoUtil.updateUserEmail.mockRejectedValue(new Error('Cognito error'));

        // ACT & ASSERT
        await expect(service.updateEmail({ email: 'nuevo@test.com', currentPassword: 'pass' }, metadata))
          .rejects.toMatchObject({ statusCode: 500 });

        expect(personContactRepository.update).toHaveBeenCalledWith(
          expect.objectContaining({ email: 'juan@test.com' }), // revierte al email original
          expect.any(Object)
        );
      });
    });
  });

  // ─── updatePassword ───────────────────────────────────────────────────────

  describe('updatePassword', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      mockTransaction();
      userRepository.findByUserId.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      CognitoUtil.changeUserPassword.mockResolvedValue();
      userRepository.updatePassword.mockResolvedValue();
      KycSharedUtil.logChange.mockResolvedValue();
    });

    it('debe lanzar unauthorized si la contraseña actual es incorrecta', async () => {
      // ARRANGE
      bcrypt.compare.mockResolvedValue(false);

      // ACT & ASSERT
      await expect(service.updatePassword({ currentPassword: 'wrong', newPassword: 'NewPass123!' }, metadata))
        .rejects.toMatchObject({ statusCode: 401 });
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
      await service.updatePassword({ currentPassword: 'pass', newPassword: 'NewPass123!' }, metadata);

      // ASSERT
      expect(callOrder).toEqual(['cognito', 'db']);
    });

    it('debe loguear CRITICAL si BD falla después de Cognito', async () => {
      // ARRANGE
      userRepository.updatePassword.mockRejectedValue(new Error('DB error'));

      // ACT & ASSERT
      await expect(service.updatePassword({ currentPassword: 'pass', newPassword: 'NewPass123!' }, metadata))
        .rejects.toMatchObject({ statusCode: 500 });

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL'),
        expect.any(Object)
      );
    });
  });

  // ─── updateNationalId ─────────────────────────────────────────────────────

  describe('updateNationalId', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      mockTransaction();
      userRepository.findByUserId.mockResolvedValue({ ...mockUser, role: { name: 'user' } });
      bcrypt.compare.mockResolvedValue(true);
      KycSharedUtil.validateNationalIdByRole.mockReturnValue();
      userRepository.findByNationalId.mockResolvedValue(null);
      CognitoUtil.updateUserCustomAttributes.mockResolvedValue();
      KycSharedUtil.logChange.mockResolvedValue();
    });

    it('debe lanzar badRequest si el nuevo nationalId es igual al actual', async () => {
      // ACT & ASSERT — mismo nationalId que tiene mockUser
      await expect(service.updateNationalId({ newNationalId: '12345678', currentPassword: 'pass' }, metadata))
        .rejects.toMatchObject({ statusCode: 400 });
    });

    it('debe lanzar conflict si el nationalId ya está registrado por otro usuario', async () => {
      // ARRANGE
      userRepository.findByNationalId.mockResolvedValue({ id: 99 });

      // ACT & ASSERT
      await expect(service.updateNationalId({ newNationalId: '99999999', currentPassword: 'pass' }, metadata))
        .rejects.toMatchObject({ statusCode: 409 });
    });

    it('debe actualizar Cognito primero y BD después', async () => {
      // ARRANGE
      const callOrder = [];
      CognitoUtil.updateUserCustomAttributes.mockImplementation(() => {
        callOrder.push('cognito');
        return Promise.resolve();
      });
      mockPerson.update.mockImplementation(() => {
        callOrder.push('db');
        return Promise.resolve();
      });

      // ACT
      await service.updateNationalId({ newNationalId: '99999999', currentPassword: 'pass' }, metadata);

      // ASSERT
      expect(callOrder).toEqual(['cognito', 'db']);
    });

    it('debe revertir Cognito al nationalId original si falla BD', async () => {
      // ARRANGE
      mockPerson.update.mockRejectedValue(new Error('DB error'));

      // ACT & ASSERT
      await expect(service.updateNationalId({ newNationalId: '99999999', currentPassword: 'pass' }, metadata))
        .rejects.toThrow();

      expect(CognitoUtil.updateUserCustomAttributes).toHaveBeenLastCalledWith(
        'user_cognito',
        { nationalId: '12345678' } // revierte al nationalId original
      );
    });
  });

  // ─── deleteAccount ────────────────────────────────────────────────────────

  describe('deleteAccount', () => {

    beforeEach(() => {
      jest.clearAllMocks();
      mockTransaction();
      userRepository.findByUserId.mockResolvedValue(mockUser);
      bcrypt.compare.mockResolvedValue(true);
      personContactRepository.findByPersonId.mockResolvedValue({
        id: 1, email: 'juan@test.com', phone_primary: '3001234567',
      });
      KycSharedUtil.formatDeletedNationalId.mockReturnValue('DEL_12345678');
      KycSharedUtil.formatDeletedUsername.mockReturnValue('DEL_12345678');
      KycSharedUtil.formatDeletedEmail.mockReturnValue('DEL_juan@test.com');
      KycSharedUtil.formatDeletedPhone.mockReturnValue('DEL_3001234567');
      personRepository.update.mockResolvedValue();
      userRepository.update.mockResolvedValue();
      personContactRepository.update.mockResolvedValue();
      KycSharedUtil.logChange.mockResolvedValue();
      CognitoUtil.deleteUser.mockResolvedValue();
    });

    it('debe lanzar unauthorized si la contraseña es incorrecta', async () => {
      // ARRANGE
      bcrypt.compare.mockResolvedValue(false);

      // ACT & ASSERT
      await expect(service.deleteAccount({ currentPassword: 'wrong' }, metadata))
        .rejects.toMatchObject({ statusCode: 401 });
    });

    it('debe eliminar en BD primero y Cognito después del commit', async () => {
      // ARRANGE
      const callOrder = [];
      personRepository.update.mockImplementation(() => {
        callOrder.push('db');
        return Promise.resolve();
      });
      CognitoUtil.deleteUser.mockImplementation(() => {
        callOrder.push('cognito');
        return Promise.resolve();
      });

      // ACT
      await service.deleteAccount({ currentPassword: 'pass' }, metadata);

      // ASSERT
      expect(callOrder[0]).toBe('db');
      expect(callOrder[callOrder.length - 1]).toBe('cognito');
    });

    it('debe loguear CRITICAL si Cognito falla después del commit — sin lanzar error al cliente', async () => {
      // ARRANGE
      CognitoUtil.deleteUser.mockRejectedValue(new Error('Cognito error'));

      // ACT — no debe lanzar, Cognito es best-effort después del commit
      await service.deleteAccount({ currentPassword: 'pass' }, metadata);

      // ASSERT
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('CRITICAL'),
        expect.any(Object)
      );
    });

    it('debe retornar null al completarse', async () => {
      // ACT
      const result = await service.deleteAccount({ currentPassword: 'pass' }, metadata);

      // ASSERT
      expect(result).toBeNull();
    });
  });
});
