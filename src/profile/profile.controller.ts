import {
  Body,
  Controller,
  Get,
  Param,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Profile, UserRole } from '@prisma/client';

import { UpdateProfileDto } from './updateProfile.dto';
import { ProfileService } from './profile.service';
import { RolesGuard } from '../users/roles/roles.guard';
import { Roles } from '../users/roles/roles.decorator';

@Controller('api')
export class ProfileController {
  public constructor(private readonly profileService: ProfileService) {}

  @Get('profile/:id')
  public getProfile(@Param('id') id: number): Promise<Profile> {
    return this.profileService.getProfileById(id);
  }

  @Get('profiles')
  public getProfiles(): Promise<Profile[]> {
    return this.profileService.getAll();
  }

  @UseGuards(AuthGuard('access_token'))
  @Get('profile')
  public async getUserProfile(@Req() request): Promise<Profile> {
    const profile = await this.profileService.getProfileByUser(request.user.id);

    if (!profile) {
      return this.profileService.createDefaultProfile(request.user.id);
    }

    return profile;
  }

  @UseGuards(AuthGuard('access_token'))
  @Put('profile')
  public async updateProfile(
    @Req() request,
    @Body() payload: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profileService.getProfileByUser(request.user.id);
    if (!profile) {
      return this.profileService.createDefaultProfile(request.user.id, payload);
    }

    return this.profileService.updateProfile(request.user.id, payload);
  }

  @UseGuards(AuthGuard('access_token'), RolesGuard)
  @Put('profile/:userId')
  @Roles(UserRole.ADMIN)
  public async updateProfileByUserId(
    @Param('userId') userId: string,
    @Body() payload: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profileService.getProfileByUser(Number(userId));
    if (!profile) {
      return this.profileService.createDefaultProfile(Number(userId), payload);
    }

    return this.profileService.updateProfile(profile.userId, payload);
  }
}
