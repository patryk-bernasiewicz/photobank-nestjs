import { CookieOptions, Response } from 'express';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User, UserRole } from '@prisma/client';
import { omit } from 'lodash';

import { CreateUserDto } from '../users/createUser.dto';
import { UsersService } from '../users/users.service';
import { MailerService } from '../mailer/mailer.service';
import { AuthService } from './auth.service';
import { RolesGuard } from '../users/roles/roles.guard';
import { Roles } from '../users/roles/roles.decorator';

const PASSWORD_MIN_LENGTH = 6;

@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly userService: UsersService,
    private readonly authService: AuthService,
    private readonly mailerService: MailerService,
  ) {}

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(
    @Req() request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedException();
    }

    const accessToken = await this.authService.createAccessToken(request.user);
    const refreshToken = await this.authService.createRefreshToken(
      request.user,
    );

    const accessCookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
    };
    const refreshCookieOptions: CookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
    };

    response.cookie('access_token', accessToken, accessCookieOptions);
    response.cookie('refresh_token', refreshToken, refreshCookieOptions);

    response.json(request.user);
  }

  @UseGuards(AuthGuard('access_token'))
  @Post('logout')
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
  }

  @UseGuards(AuthGuard('access_token'))
  @Get('me')
  async me(@Req() request) {
    return request.user;
  }

  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() userDto: CreateUserDto) {
    if (userDto.password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      });
    }

    const password = await this.authService.hashPassword(userDto.password);
    const userWithHashedPassword = {
      ...userDto,
      password,
    } as CreateUserDto;

    const createdUser = await this.userService.createUser(
      userWithHashedPassword,
    );
    const confirmationTokenData =
      await this.userService.createEmailConfirmationToken(createdUser.id);

    this.mailerService.sendMail(
      userDto.email,
      'Confirm email',
      `Your confirmation token: ${confirmationTokenData.token}`,
    );

    return omit(createdUser, 'password');
  }

  @Post('confirm-email/:token')
  async confirmEmail(@Param('token') token: string) {
    if (!token) {
      throw new BadRequestException({ message: 'Missing token' });
    }

    await this.userService.confirmEmail(token);

    return { message: 'Email confirmed' };
  }

  @Post('reset-password')
  async resetPassword(@Body('email') email: string) {
    if (!email) {
      throw new BadRequestException({ message: 'Missing email' });
    }

    const user = await this.userService.findByUsernameOrEmail(email);

    if (!user) {
      return;
    }

    const resetPasswordToken = await this.userService.createResetPasswordToken(
      user.id,
    );

    this.mailerService.sendMail(
      user.email,
      'Reset password',
      `Your reset password token: ${resetPasswordToken.token}`,
    );
  }

  @Get('reset-password/:token')
  async validateResetPasswordToken(
    @Param('token') token: string,
  ): Promise<User> {
    return this.userService.validateResetPasswordToken(token);
  }

  @Post('reset-password/:token')
  async resetPasswordConfirm(
    @Param('token') token: string,
    @Body('password') password: string,
  ) {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new BadRequestException({
        message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
      });
    }

    if (!token) {
      throw new BadRequestException({ message: 'Invalid token' });
    }

    const user = await this.userService.validateResetPasswordToken(token);
    if (!user) {
      throw new BadRequestException({ message: 'Invalid token' });
    }

    const hashedPassword = await this.authService.hashPassword(password);
    const updatedUser = await this.userService.updateUser(user.id, {
      password: hashedPassword,
    });
    await this.userService.removeResetPasswordToken(user.id, token);

    return updatedUser;
  }

  // @UseGuards(AuthGuard('access_token'), RolesGuard)
  // @Get('admin-only')
  // @Roles(UserRole.ADMIN)
  // async adminOnly() {
  //   return { message: 'Only for admins' };
  // }
}
