import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';
import { AuthGuard } from '@nestjs/passport';
import { UpdateProfileDto } from './updateProfile.dto';
import { Profile } from '@prisma/client';

const mockProfileService = {
  getProfileById: jest.fn(),
  getAll: jest.fn(),
  getProfileByUser: jest.fn(),
  createDefaultProfile: jest.fn(),
  updateProfile: jest.fn(),
};

describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: jest.Mocked<ProfileService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: mockProfileService }],
    })
      .overrideGuard(AuthGuard('access_token'))
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get<ProfileService, jest.Mocked<ProfileService>>(
      ProfileService,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return the profile by ID', async () => {
      const profile: Profile = {
        id: 1,
        userId: 1,
        firstName: 'Test User',
      } as Profile;
      profileService.getProfileById.mockResolvedValue(profile);

      expect(await controller.getProfile(1)).toBe(profile);
      expect(profileService.getProfileById).toHaveBeenCalledWith(1);
    });
  });

  describe('getProfiles', () => {
    it('should return all profiles', async () => {
      const profiles: Profile[] = [
        { id: 1, userId: 1, firstName: 'Test User' } as Profile,
      ];
      profileService.getAll.mockResolvedValue(profiles);

      expect(await controller.getProfiles()).toBe(profiles);
      expect(profileService.getAll).toHaveBeenCalled();
    });
  });

  describe('getUserProfile', () => {
    it('should return the profile for the user', async () => {
      const profile: Profile = {
        id: 1,
        userId: 1,
        firstName: 'Test User',
      } as Profile;
      const request = { user: { id: 1 } };
      profileService.getProfileByUser.mockResolvedValue(profile);

      expect(await controller.getUserProfile(request)).toBe(profile);
      expect(profileService.getProfileByUser).toHaveBeenCalledWith(1);
    });

    it('should create a default profile if none exists', async () => {
      const profile: Profile = {
        id: 1,
        userId: 1,
        firstName: 'Test User',
      } as Profile;
      const request = { user: { id: 1 } };
      profileService.getProfileByUser.mockResolvedValue(null);
      profileService.createDefaultProfile.mockResolvedValue(profile);

      expect(await controller.getUserProfile(request)).toBe(profile);
      expect(profileService.getProfileByUser).toHaveBeenCalledWith(1);
      expect(profileService.createDefaultProfile).toHaveBeenCalledWith(1);
    });
  });

  describe('updateProfile', () => {
    it('should update the profile if it exists', async () => {
      const profile: Profile = {
        id: 1,
        userId: 1,
        firstName: 'Updated User',
      } as Profile;
      const request = { user: { id: 1 } };
      const payload: UpdateProfileDto = { firstName: 'Updated User' };
      profileService.getProfileByUser.mockResolvedValue(profile);
      profileService.updateProfile.mockResolvedValue(profile);

      expect(await controller.updateProfile(request, payload)).toBe(profile);
      expect(profileService.getProfileByUser).toHaveBeenCalledWith(1);
      expect(profileService.updateProfile).toHaveBeenCalledWith(1, payload);
    });

    it('should create a default profile if none exists and update it', async () => {
      const profile: Profile = {
        id: 1,
        userId: 1,
        firstName: 'Updated User',
      } as Profile;
      const request = { user: { id: 1 } };
      const payload: UpdateProfileDto = { firstName: 'Updated User' };
      profileService.getProfileByUser.mockResolvedValue(null);
      profileService.createDefaultProfile.mockResolvedValue(profile);

      expect(await controller.updateProfile(request, payload)).toBe(profile);
      expect(profileService.getProfileByUser).toHaveBeenCalledWith(1);
      expect(profileService.createDefaultProfile).toHaveBeenCalledWith(
        1,
        payload,
      );
    });
  });

  describe('updateProfileByUserId', () => {
    it('should update the profile if it exists', async () => {
      const profile: Profile = {
        id: 1,
        userId: 1,
        firstName: 'Updated User',
      } as Profile;
      const payload: UpdateProfileDto = { firstName: 'Updated User' };
      profileService.getProfileByUser.mockResolvedValue(profile);
      profileService.updateProfile.mockResolvedValue(profile);

      expect(await controller.updateProfileByUserId('1', payload)).toBe(
        profile,
      );
      expect(profileService.getProfileByUser).toHaveBeenCalledWith(1);
      expect(profileService.updateProfile).toHaveBeenCalledWith(1, payload);
    });

    it('should create a default profile if none exists and update it', async () => {
      const profile: Profile = {
        id: 1,
        userId: 1,
        firstName: 'Updated User',
      } as Profile;
      const payload: UpdateProfileDto = { firstName: 'Updated User' };
      profileService.getProfileByUser.mockResolvedValue(null);
      profileService.createDefaultProfile.mockResolvedValue(profile);

      expect(await controller.updateProfileByUserId('1', payload)).toBe(
        profile,
      );
      expect(profileService.getProfileByUser).toHaveBeenCalledWith(1);
      expect(profileService.createDefaultProfile).toHaveBeenCalledWith(
        1,
        payload,
      );
    });
  });
});
