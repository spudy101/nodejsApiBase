// tests/unit/dto/user.dto.test.js
const { UserResponseDTO, UpdateUserDTO } = require('../../../src/dto/user.dto');

describe('User DTOs - Unit Tests', () => {
  describe('UserResponseDTO', () => {
    it('should create UserResponseDTO with all fields', () => {
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
        isActive: true,
        lastLogin: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        password: 'should-be-excluded'
      };

      const dto = new UserResponseDTO(user);

      expect(dto.id).toBe('uuid-123');
      expect(dto.email).toBe('test@example.com');
      expect(dto.name).toBe('John Doe');
      expect(dto.role).toBe('user');
      expect(dto.isActive).toBe(true);
      expect(dto.lastLogin).toEqual(new Date('2024-01-01'));
      expect(dto.createdAt).toEqual(new Date('2024-01-01'));
      expect(dto.updatedAt).toEqual(new Date('2024-01-02'));
      expect(dto.password).toBeUndefined();
    });

    it('should handle user with null lastLogin', () => {
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
        isActive: true,
        lastLogin: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dto = new UserResponseDTO(user);

      expect(dto.lastLogin).toBeNull();
    });

    it('should convert array of users using fromModel', () => {
      const users = [
        {
          id: 'uuid-1',
          email: 'user1@example.com',
          name: 'User 1',
          role: 'user',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'uuid-2',
          email: 'user2@example.com',
          name: 'User 2',
          role: 'admin',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const dtos = UserResponseDTO.fromModel(users);

      expect(Array.isArray(dtos)).toBe(true);
      expect(dtos).toHaveLength(2);
      expect(dtos[0]).toBeInstanceOf(UserResponseDTO);
      expect(dtos[0].id).toBe('uuid-1');
      expect(dtos[1].id).toBe('uuid-2');
    });

    it('should convert single user using fromModel', () => {
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const dto = UserResponseDTO.fromModel(user);

      expect(dto).toBeInstanceOf(UserResponseDTO);
      expect(dto.id).toBe('uuid-123');
    });

    it('should handle user with toJSON method (Sequelize instance)', () => {
      const user = {
        id: 'uuid-123',
        email: 'test@example.com',
        name: 'John Doe',
        role: 'user',
        isActive: true,
        password: 'hashed',
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() {
          const { password, ...rest } = this;
          return rest;
        }
      };

      const dto = new UserResponseDTO(user);

      expect(dto.password).toBeUndefined();
      expect(dto.id).toBe('uuid-123');
    });
  });

  describe('UpdateUserDTO', () => {
    it('should create UpdateUserDTO with name only', () => {
      const data = {
        name: '  John Updated  '
      };

      const dto = UpdateUserDTO.fromRequest(data);

      expect(dto.name).toBe('John Updated'); // trimmed
      expect(dto.email).toBeUndefined();
      expect(dto.password).toBeUndefined();
    });

    it('should create UpdateUserDTO with all fields', () => {
      const data = {
        name: 'John Updated',
        email: '  NEW@EMAIL.COM  ',
        password: 'NewPassword123!'
      };

      const dto = UpdateUserDTO.fromRequest(data);

      expect(dto.name).toBe('John Updated');
      expect(dto.email).toBe('new@email.com'); // lowercase + trimmed
      expect(dto.password).toBe('NewPassword123!');
    });

    it('should ignore extra fields', () => {
      const data = {
        name: 'John Updated',
        role: 'admin', // Should be ignored
        isActive: false, // Should be ignored
        extraField: 'extra' // Should be ignored
      };

      const dto = UpdateUserDTO.fromRequest(data);

      expect(dto.name).toBe('John Updated');
      expect(dto.role).toBeUndefined();
      expect(dto.isActive).toBeUndefined();
      expect(dto.extraField).toBeUndefined();
    });

    it('should handle undefined values', () => {
      const data = {
        name: undefined,
        email: undefined,
        password: undefined
      };

      const dto = UpdateUserDTO.fromRequest(data);

      expect(dto.name).toBeUndefined();
      expect(dto.email).toBeUndefined();
      expect(dto.password).toBeUndefined();
    });

    it('should handle empty strings', () => {
      const data = {
        name: '',
        email: '',
        password: ''
      };

      const dto = UpdateUserDTO.fromRequest(data);

      expect(dto.name).toBe('');
      expect(dto.email).toBe('');
      expect(dto.password).toBe('');
    });

    it('should only include provided fields', () => {
      const data = {
        email: 'newemail@test.com'
      };

      const dto = UpdateUserDTO.fromRequest(data);

      expect(dto.email).toBe('newemail@test.com');
      expect(dto.name).toBeUndefined();
      expect(dto.password).toBeUndefined();
      expect(Object.keys(dto)).toEqual(['email']);
    });
  });
});
