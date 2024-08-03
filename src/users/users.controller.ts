import {
  BadRequestException,
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './createUser.dto';
import { Roles } from './roles/roles.decorator';
import { UserRole } from '@prisma/client';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from './roles/roles.guard';
import { UpdateUserDto } from './updateUser.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('access_token'), RolesGuard)
  @Post()
  @Roles(UserRole.ADMIN)
  async createUser(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createUser(createUserDto);
  }

  @UseGuards(AuthGuard('access_token'), RolesGuard)
  @Put(':userId')
  @Roles(UserRole.ADMIN)
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: any,
  ) {
    if (
      request.user.id === Number(userId) &&
      updateUserDto.role !== request.user.role
    ) {
      throw new BadRequestException('You cannot update your own role');
    }

    return this.usersService.updateUser(Number(userId), updateUserDto);
  }
}
