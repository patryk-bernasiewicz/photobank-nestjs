import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { User, UserEmailConfirmationToken, UserRole } from '@prisma/client';

import { DatabaseService } from '../database/database.service';
import { CreateUserDto } from './createUser.dto';
import { UpdateUserDto } from './updateUser.dto';

@Injectable()
export class UsersService {
  public constructor(private readonly databaseService: DatabaseService) {}

  public async findAll() {
    return await this.databaseService.user.findMany();
  }

  public async findOne(id: number) {
    return await this.databaseService.user.findUnique({ where: { id } });
  }

  public async findByUsernameOrEmail(usernameOrEmail: string) {
    return await this.databaseService.user.findFirst({
      where: {
        OR: [
          { username: { equals: usernameOrEmail } },
          { email: { equals: usernameOrEmail } },
        ],
      },
    });
  }

  public async createUser(createUserDto: CreateUserDto): Promise<User> {
    return this.databaseService.user.create({
      data: createUserDto,
    });
  }

  public async updateUser(
    userId: number,
    updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.databaseService.user.update({
      where: {
        id: userId,
      },
      data: updateUserDto,
    });
  }

  public async createEmailConfirmationToken(
    userId: number,
  ): Promise<UserEmailConfirmationToken> {
    const length = 32;
    const token = randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);

    return this.databaseService.userEmailConfirmationToken.create({
      data: { token, userId },
    });
  }

  public async confirmEmail(token: string): Promise<void> {
    const confirmationToken =
      await this.databaseService.userEmailConfirmationToken.findFirst({
        where: { token, userId: undefined },
        include: { User: true },
      });

    if (!confirmationToken) {
      throw new NotFoundException('Token not found.');
    }

    await this.databaseService.user.update({
      where: { id: confirmationToken.userId },
      data: { emailConfirmed: true },
    });
    await this.databaseService.userEmailConfirmationToken.deleteMany({
      where: { token },
    });
  }

  public async createResetPasswordToken(userId: number) {
    const length = 32;
    const token = randomBytes(Math.ceil(length / 2))
      .toString('hex')
      .slice(0, length);

    return this.databaseService.userPasswordResetToken.create({
      data: { token, userId },
    });
  }

  public async validateResetPasswordToken(token: string): Promise<User> {
    const resetPasswordToken =
      await this.databaseService.userPasswordResetToken.findFirst({
        where: { token, userId: undefined },
        include: { User: true },
      });

    if (!resetPasswordToken) {
      throw new NotFoundException('Token not found.');
    }

    return resetPasswordToken.User;
  }

  public async removeResetPasswordToken(
    userId: number,
    token: string,
  ): Promise<void> {
    await this.databaseService.userPasswordResetToken.deleteMany({
      where: {
        AND: [
          {
            userId,
          },
          {
            token,
          },
        ],
      },
    });
  }

  async setUserRole(userId: number, role: UserRole) {
    return this.databaseService.user.update({
      where: { id: userId },
      data: { role },
    });
  }
}
