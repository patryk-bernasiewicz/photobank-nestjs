import { Test, TestingModule } from '@nestjs/testing';
import { User, UserRole } from '@prisma/client';

import { DatabaseService } from '../database/database.service';
import { UsersService } from './users.service';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';
import { NotFoundException } from '@nestjs/common';

type MockDatabaseService = {
  user: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  userEmailConfirmationToken: {
    create: jest.Mock;
    findFirst: jest.Mock;
    deleteMany: jest.Mock;
  };
  userPasswordResetToken: {
    create: jest.Mock;
    findFirst: jest.Mock;
    deleteMany: jest.Mock;
  };
};

const mockDatabaseService = {
  user: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  userEmailConfirmationToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
  userPasswordResetToken: {
    create: jest.fn(),
    findFirst: jest.fn(),
    deleteMany: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;
  let databaseService: MockDatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    databaseService = module.get(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const results = [
        {
          id: 1,
          username: 'test',
          email: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as User[];
      databaseService.user.findMany.mockResolvedValue(results);

      expect(service.findAll()).resolves.toBe(results);
    });
  });

  describe('findOne', () => {
    it('should return a user', async () => {
      const result = {
        id: 1,
        username: 'test',
        email: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;
      databaseService.user.findUnique.mockResolvedValue(result);

      expect(service.findOne(1)).resolves.toBe(result);
      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });

  describe('findByUsernameOrEmail', () => {
    it('should lookup database for user by email', async () => {
      await service.findByUsernameOrEmail('test@test.com');
      expect(databaseService.user.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { username: { equals: 'test@test.com' } },
            { email: { equals: 'test@test.com' } },
          ],
        },
      });
    });
  });

  describe('createUser', () => {
    it('should create a new user in database', async () => {
      const dto: CreateUserDto = {
        username: 'newuser',
        email: 'test',
        password: 'test',
      };
      const result = { id: 1, ...dto };
      databaseService.user.create.mockResolvedValue(result);

      expect(service.createUser(dto)).resolves.toBe(result);
      expect(databaseService.user.create).toHaveBeenCalledWith({ data: dto });
    });
  });

  describe('updateUser', () => {
    it('should update a user in database', async () => {
      const dto: UpdateUserDto = {
        password: 'newpassword',
      };
      const result = { id: 1, ...dto };
      databaseService.user.update.mockResolvedValue(result);

      expect(service.updateUser(1, dto)).resolves.toBe(result);
      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: dto,
      });
    });
  });

  describe('createEmailConfirmationToken', () => {
    it('should create email confirmation token', async () => {
      const result = {
        id: 1,
        token: '',
        userId: 1,
      };
      databaseService.userEmailConfirmationToken.create.mockResolvedValue(
        result,
      );

      expect(service.createEmailConfirmationToken(1)).resolves.toBe(result);
      expect(
        databaseService.userEmailConfirmationToken.create,
      ).toHaveBeenCalledWith({
        data: {
          token: expect.anything(),
          userId: 1,
        },
      });
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email and delete the token', async () => {
      const token = 'token';
      const user = { id: 1, email: 'test@exampele.com' };
      databaseService.userEmailConfirmationToken.findFirst.mockResolvedValue({
        token,
        User: user,
        userId: 1,
      });

      await service.confirmEmail(token);

      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { emailConfirmed: true },
      });
      expect(
        databaseService.userEmailConfirmationToken.deleteMany,
      ).toHaveBeenCalledWith({ where: { token } });
    });

    it('should throw NotFoundException if token not found', async () => {
      databaseService.userEmailConfirmationToken.findFirst.mockResolvedValue(
        null,
      );
      await expect(service.confirmEmail('token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createResetPasswordToken', () => {
    it('should create reset password token', async () => {
      const result = { id: 1, token: 'token', userId: 1 };
      databaseService.userPasswordResetToken.create.mockResolvedValue(result);

      expect(service.createResetPasswordToken(1)).resolves.toBe(result);
      expect(
        databaseService.userPasswordResetToken.create,
      ).toHaveBeenCalledWith({ data: { token: expect.anything(), userId: 1 } });
    });
  });

  describe('validateResetPasswordToken', () => {
    it('should find token in database, skipping userId, and return it', async () => {
      const result = { id: 1, token: 'token', userId: 1, User: { id: 1 } };
      databaseService.userPasswordResetToken.findFirst.mockResolvedValue(
        result,
      );

      expect(
        service.validateResetPasswordToken('token'),
      ).resolves.toStrictEqual({
        id: 1,
      });
      expect(
        databaseService.userPasswordResetToken.findFirst,
      ).toHaveBeenCalledWith({
        where: { token: 'token', userId: undefined },
        include: { User: true },
      });
    });

    it('should throw NotFoundException if token not found', async () => {
      databaseService.userPasswordResetToken.findFirst.mockResolvedValue(null);
      await expect(service.validateResetPasswordToken('token')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('removeResetPasswordToken', () => {
    it('should remove reset password token', async () => {
      await service.removeResetPasswordToken(1, 'token');
      expect(
        databaseService.userPasswordResetToken.deleteMany,
      ).toHaveBeenCalledWith({
        where: { AND: [{ userId: 1 }, { token: 'token' }] },
      });
    });
  });

  describe('setUserRole', () => {
    it('should update user role', async () => {
      await service.setUserRole(1, UserRole.ADMIN);
      expect(databaseService.user.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { role: UserRole.ADMIN },
      });
    });
  });
});
