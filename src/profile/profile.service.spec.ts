import { Test, TestingModule } from '@nestjs/testing';
import { Profile } from '@prisma/client';

import { ProfileService } from './profile.service';
import { DatabaseService } from '../database/database.service';
import { UpdateProfileDto } from './updateProfile.dto';

describe('ProfileService', () => {
  let service: ProfileService;
  let databaseService: DatabaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: DatabaseService,
          useValue: {
            profile: {
              create: jest.fn(),
              findFirst: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              findMany: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
    databaseService = module.get<DatabaseService>(DatabaseService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDefaultProfile', () => {
    it('should create a profile', async () => {
      const userId = 1;
      const payload: UpdateProfileDto = {};
      const profile: Profile = { id: 1, userId, ...payload } as Profile;

      jest.spyOn(databaseService.profile, 'create').mockResolvedValue(profile);

      expect(await service.createDefaultProfile(userId, payload)).toBe(profile);
      expect(databaseService.profile.create).toHaveBeenCalledWith({
        data: { userId, ...payload },
      });
    });
  });

  describe('getProfileByUser', () => {
    it('should return the profile for the user', async () => {
      const userId = 1;
      const profile: Profile = {
        id: 1,
        userId,
        firstName: 'Test User',
      } as Profile;

      jest
        .spyOn(databaseService.profile, 'findFirst')
        .mockResolvedValue(profile);

      expect(await service.getProfileByUser(userId)).toBe(profile);
      expect(databaseService.profile.findFirst).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('getProfileById', () => {
    it('should return the profile by ID', async () => {
      const id = 1;
      const profile: Profile = {
        id,
        userId: 1,
        firstName: 'Test User',
      } as Profile;

      jest
        .spyOn(databaseService.profile, 'findUniqueOrThrow')
        .mockResolvedValue(profile);

      expect(await service.getProfileById(id)).toBe(profile);
      expect(databaseService.profile.findUniqueOrThrow).toHaveBeenCalledWith({
        where: { id },
      });
    });
  });

  describe('getAll', () => {
    it('should return all profiles', async () => {
      const profiles: Profile[] = [
        { id: 1, userId: 1, firstName: 'Test User' } as Profile,
      ];

      jest
        .spyOn(databaseService.profile, 'findMany')
        .mockResolvedValue(profiles);

      expect(await service.getAll()).toBe(profiles);
      expect(databaseService.profile.findMany).toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update the profile', async () => {
      const userId = 1;
      const profileDto: UpdateProfileDto = { firstName: 'Updated User' };
      const updatedProfile: Profile = {
        id: 1,
        userId,
        firstName: 'Updated User',
      } as Profile;

      jest
        .spyOn(databaseService.profile, 'update')
        .mockResolvedValue(updatedProfile);

      expect(await service.updateProfile(userId, profileDto)).toBe(
        updatedProfile,
      );
      expect(databaseService.profile.update).toHaveBeenCalledWith({
        where: { userId },
        data: profileDto,
      });
    });
  });
});
