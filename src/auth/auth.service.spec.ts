import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    emailConfirmed: false,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByUsernameOrEmail: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user object without password if validation is successful', async () => {
      jest
        .spyOn(usersService, 'findByUsernameOrEmail')
        .mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(true));

      const result = await authService.validateUser('testuser', 'password');
      expect(result).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          username: mockUser.username,
        }),
      );
      expect(result.password).toBeUndefined();
    });

    it('should return null if user is not found', async () => {
      jest.spyOn(usersService, 'findByUsernameOrEmail').mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent', 'password');
      expect(result).toBeNull();
    });

    it('should return null if password does not match', async () => {
      jest
        .spyOn(usersService, 'findByUsernameOrEmail')
        .mockResolvedValue(mockUser);
      jest
        .spyOn(bcrypt, 'compare')
        .mockImplementation(() => Promise.resolve(false));

      const result = await authService.validateUser(
        'testuser',
        'wrongpassword',
      );
      expect(result).toBeNull();
    });
  });

  describe('hashPassword', () => {
    it('should return a hashed password', async () => {
      const hashedPassword = await authService.hashPassword('password');
      expect(hashedPassword).not.toBe('password');
      expect(hashedPassword.length).toBeGreaterThan(0);
    });
  });

  describe('createAccessToken', () => {
    it('should create and return an access token', async () => {
      const mockToken = 'mock.access.token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);

      const token = await authService.createAccessToken(mockUser);
      expect(token).toBe(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id, username: mockUser.username },
        { expiresIn: '1d', secret: process.env.SECRET },
      );
    });
  });

  describe('validateAccessTokenPayload', () => {
    it('should return user if payload is valid', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      const result = await authService.validateAccessTokenPayload(
        mockUser.id,
        mockUser.username,
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if username does not match', async () => {
      jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

      const result = await authService.validateAccessTokenPayload(
        mockUser.id,
        'wrongusername',
      );
      expect(result).toBeNull();
    });
  });

  describe('createRefreshToken', () => {
    it('should create and return a refresh token', async () => {
      const mockToken = 'mock.refresh.token';
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue(mockToken);

      const token = await authService.createRefreshToken(mockUser);
      expect(token).toBe(mockToken);
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { sub: mockUser.id },
        { expiresIn: '1h', secret: process.env.SECRET },
      );
    });
  });
});
