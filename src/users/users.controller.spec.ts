import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles/roles.guard';
import { CreateUserDto } from './createUser.dto';
import { User, UserRole } from '@prisma/client';
import { UpdateUserDto } from './updateUser.dto';
import { BadRequestException } from '@nestjs/common';

const mockUserService = {
  createUser: jest.fn(),
  updateUser: jest.fn(),
};

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUserService }],
    })
      .overrideGuard(AuthGuard('access_token'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService, jest.Mocked<UsersService>>(
      UsersService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createUser', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        username: 'testuser',
      };
      const createdUser: User = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailConfirmed: false,
        role: UserRole.USER,
        ...createUserDto,
      };
      usersService.createUser.mockResolvedValue(createdUser);

      expect(await controller.createUser(createUserDto)).toBe(createdUser);
      expect(usersService.createUser).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('updateUser', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should update a user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
        username: 'username',
        role: UserRole.USER,
      };
      const updatedUser: User = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailConfirmed: false,
        password: '',
        email: 'updated@example.com',
        username: 'username',
        role: UserRole.USER,
      };
      const request = { user: { id: 2, role: UserRole.ADMIN } };
      usersService.updateUser.mockResolvedValue(updatedUser);

      expect(await controller.updateUser(userId, updateUserDto, request)).toBe(
        updatedUser,
      );
      expect(usersService.updateUser).toHaveBeenCalledWith(1, updateUserDto);
    });

    it('should throw BadRequestException when trying to update own role', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        role: UserRole.ADMIN,
      };
      const request = { user: { id: 1, role: UserRole.USER } };

      expect(
        controller.updateUser(userId, updateUserDto, request),
      ).rejects.toThrow(BadRequestException);
      expect(usersService.updateUser).not.toHaveBeenCalled();
    });

    it('should allow updating other fields for own user', async () => {
      const userId = '1';
      const updateUserDto: UpdateUserDto = {
        email: 'updated@example.com',
      };
      const updatedUser: User = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        emailConfirmed: false,
        password: '',
        email: 'updated@example.com',
        username: 'username',
        role: UserRole.USER,
      };
      const request = { user: { id: 1 } };
      usersService.updateUser.mockResolvedValue(updatedUser);

      expect(await controller.updateUser(userId, updateUserDto, request)).toBe(
        updatedUser,
      );
      expect(usersService.updateUser).toHaveBeenCalledWith(1, updateUserDto);
    });
  });
});
