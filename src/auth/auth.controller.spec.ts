import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { Response } from 'express';

import { RolesGuard } from '../users/roles/roles.guard';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

const mockAuthService = {
  validateUser: jest.fn(),
  hashPassword: jest.fn(),
  createAccessToken: jest.fn(),
  validateAccessTokenPayload: jest.fn(),
  createRefreshToken: jest.fn(),
};

const mockUserService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByUsernameOrEmail: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  createEmailConfirmationToken: jest.fn(),
  confirmEmail: jest.fn(),
  createResetPasswordToken: jest.fn(),
  validateResetPasswordToken: jest.fn(),
  removeResetPasswordToken: jest.fn(),
};

const mockMailerService = {
  sendMail: jest.fn(),
};

const mockRolesGuard = {
  canActivate: jest.fn(() => true),
};

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;
  let userService: jest.Mocked<UsersService>;
  let mailerService: jest.Mocked<MailerService>;

  const mockUser: User = {
    id: 1,
    username: 'test',
    email: 'test@example.com',
    password: 'test',
    emailConfirmed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as User;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUserService },
        { provide: MailerService, useValue: mockMailerService },
      ],
    })
      .overrideGuard(AuthGuard('access_token'))
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(AuthGuard('local'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService, jest.Mocked<AuthService>>(
      AuthService,
    );
    userService = module.get<UsersService, jest.Mocked<UsersService>>(
      UsersService,
    );
    mailerService = module.get<MailerService, jest.Mocked<MailerService>>(
      MailerService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    let response: jest.Mocked<Response>;

    const mockCredentials = {
      username: 'test',
      password: 'test',
    };

    const request = {
      user: mockUser,
      body: mockCredentials,
    };

    beforeEach(() => {
      response = {
        cookie: jest.fn(),
        json: jest.fn((response) => response),
      } as unknown as jest.Mocked<Response>;

      authService.validateUser.mockResolvedValue(mockUser);
      authService.createAccessToken.mockResolvedValue('token');
      authService.createRefreshToken.mockResolvedValue('token');
    });

    it('should return user data on successful login', async () => {
      expect(await controller.login(request, response)).toBe(mockUser);
      expect(response.json).toHaveBeenCalled();
    });

    it('should set access and refresh token cookies on successful login', async () => {
      await controller.login(request, response);

      expect(authService.createAccessToken).toHaveBeenCalledWith(mockUser);
      expect(authService.createRefreshToken).toHaveBeenCalledWith(mockUser);
      expect(response.cookie).toHaveBeenCalledWith(
        'access_token',
        'token',
        expect.anything(),
      );
      expect(response.cookie).toHaveBeenCalledWith(
        'refresh_token',
        'token',
        expect.anything(),
      );
    });

    it('should throw an error if user validation fails', async () => {
      authService.validateUser.mockResolvedValue(null);
      const request = { body: mockCredentials };

      await expect(controller.login(request, response)).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('should clear access and refresh token cookies', async () => {
      const response = {
        clearCookie: jest.fn(),
      } as unknown as Response;

      await controller.logout(response);
      expect(response.clearCookie).toHaveBeenCalledWith('access_token');
      expect(response.clearCookie).toHaveBeenCalledWith('refresh_token');
    });
  });

  describe('register', () => {
    const registrationPayload = {
      username: 'newuser',
      email: 'newuser@test.com',
      password: 'test01',
    };

    beforeEach(() => {
      userService.createUser.mockResolvedValue({
        ...mockUser,
        ...registrationPayload,
      });
      userService.createEmailConfirmationToken.mockResolvedValue({
        id: 1,
        token: 'confirmation_token',
        userId: 1,
      });
      authService.hashPassword.mockResolvedValue('hashedpassword');
    });

    it('should throw on missing or too short password', () => {
      expect(
        controller.register({
          ...registrationPayload,
          password: '1',
        }),
      ).rejects.toThrow();
    });

    it('should create a new user and return user data without the password', async () => {
      const result = await controller.register(registrationPayload);

      expect(result).toEqual(
        expect.objectContaining({
          id: expect.any(Number),
          username: registrationPayload.username,
          email: registrationPayload.email,
        }),
      );
      expect(result).not.toHaveProperty('password');
    });

    it('should hash the password before creating the user', async () => {
      await controller.register(registrationPayload);

      expect(authService.hashPassword).toHaveBeenCalledWith(
        registrationPayload.password,
      );
      expect(userService.createUser).toHaveBeenCalledWith(
        expect.objectContaining({
          ...registrationPayload,
          password: 'hashedpassword',
        }),
      );
    });

    it('should create and send an email confirmation token', async () => {
      await controller.register(registrationPayload);

      expect(userService.createEmailConfirmationToken).toHaveBeenCalledWith(
        expect.any(Number),
      );
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        registrationPayload.email,
        expect.any(String),
        expect.stringContaining('confirmation_token'),
      );
    });

    it('should throw an exception if user creation fails', async () => {
      userService.createUser.mockRejectedValue(
        new Error('User creation failed'),
      );
      expect(controller.register(registrationPayload)).rejects.toThrow();
    });
  });

  describe('me', () => {
    const request = {
      user: mockUser,
    };

    it('should return user data', async () => {
      expect(await controller.me(request)).toEqual(mockUser);
    });
  });

  describe('confirmEmail', () => {
    it('should throw on missing token', () => {
      expect(controller.confirmEmail(null)).rejects.toThrow();
    });

    it('should confirm email on valid token', async () => {
      userService.confirmEmail.mockResolvedValue();

      const result = await controller.confirmEmail('token');

      expect(userService.confirmEmail).toHaveBeenCalledWith('token');
      expect(result).toHaveProperty('message', 'Email confirmed');
    });
  });

  describe('resetPassword - create token and send email to user', () => {
    it('should throw on missing email address', async () => {
      expect(controller.resetPassword(null)).rejects.toThrow();
    });

    it('should return empty response on invalid email address', async () => {
      userService.findByUsernameOrEmail.mockResolvedValue(null);

      expect(controller.resetPassword('invalid@mail')).resolves.toBeFalsy();
    });

    it('should create a reset password token and send email to user', async () => {
      userService.findByUsernameOrEmail.mockResolvedValue(mockUser);
      userService.createResetPasswordToken.mockResolvedValue({
        id: 1,
        token: 'token',
        userId: mockUser.id,
      });

      await controller.resetPassword('test@mail');

      expect(userService.createResetPasswordToken).toHaveBeenCalledWith(
        mockUser.id,
      );
      expect(mailerService.sendMail).toHaveBeenCalledWith(
        mockUser.email,
        expect.anything(),
        expect.stringContaining('token'),
      );
    });
  });

  describe('validateResetPasswordToken - validate token exists', () => {
    it('should throw on missing token', () => {
      expect(controller.resetPassword(null)).rejects.toThrow();
    });

    it('should return User on valid token', async () => {
      userService.validateResetPasswordToken.mockResolvedValue(mockUser);
      expect(await controller.validateResetPasswordToken('token')).toEqual(
        mockUser,
      );
    });
  });

  describe('resetPasswordConfirm', () => {
    beforeEach(() => {
      userService.validateResetPasswordToken.mockResolvedValue(mockUser);
      userService.updateUser.mockImplementation((userId, { password }) =>
        Promise.resolve({
          ...mockUser,
          password,
        }),
      );
      authService.hashPassword.mockResolvedValue('hashedpassword');
    });

    it('should throw on missing token', () => {
      expect(controller.resetPasswordConfirm(null, 'lorem6')).rejects.toThrow();
    });

    it('should throw on missing or too short password', () => {
      expect(controller.resetPasswordConfirm('token', '1')).rejects.toThrow();
    });

    it('should hash the new password on valid token', async () => {
      expect(
        await controller.resetPasswordConfirm('token', 'lorem6'),
      ).toStrictEqual({
        ...mockUser,
        password: 'hashedpassword',
      });
      expect(userService.updateUser).toHaveBeenCalledWith(mockUser.id, {
        password: 'hashedpassword',
      });
    });

    it('should remove password token on success', async () => {
      await controller.resetPasswordConfirm('token', 'lorem6');
      expect(userService.removeResetPasswordToken).toHaveBeenCalledWith(
        mockUser.id,
        'token',
      );
    });
  });
});
