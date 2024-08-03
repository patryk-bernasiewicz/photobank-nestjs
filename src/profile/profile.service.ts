import { Injectable } from '@nestjs/common';
import { Profile } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { UpdateProfileDto } from './updateProfile.dto';

@Injectable()
export class ProfileService {
  constructor(private readonly databaseService: DatabaseService) {}

  async createDefaultProfile(
    userId: number,
    payload: UpdateProfileDto = {},
  ): Promise<Profile> {
    return this.databaseService.profile.create({
      data: { userId, ...payload },
    });
  }

  async getProfileByUser(userId: number): Promise<Profile> {
    return this.databaseService.profile.findFirst({
      where: { userId },
    });
  }

  async getProfileById(id: number): Promise<Profile> {
    return this.databaseService.profile.findUniqueOrThrow({ where: { id } });
  }

  async getAll(): Promise<Profile[]> {
    return this.databaseService.profile.findMany();
  }

  async updateProfile(
    userId: number,
    profileDto: UpdateProfileDto,
  ): Promise<Profile> {
    return this.databaseService.profile.update({
      where: { userId },
      data: profileDto,
    });
  }
}
