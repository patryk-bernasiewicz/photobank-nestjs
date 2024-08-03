import { Injectable } from '@nestjs/common';
import { omit } from 'lodash';
import { hash, compare } from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  public constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  public async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsernameOrEmail(username);
    if (user) {
      const passwordMatch = await compare(password, user.password);
      if (passwordMatch) {
        return omit(user, 'password');
      }
    }
    return null;
  }

  public async hashPassword(password: string): Promise<string> {
    return hash(password, 10);
  }

  public async createAccessToken(user: User): Promise<string> {
    const payload = { sub: user.id, username: user.username };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1d',
      secret: process.env.SECRET,
    });
    return token;
  }

  public async validateAccessTokenPayload(
    sub: number,
    username: string,
  ): Promise<User | null> {
    const user = await this.userService.findOne(sub);
    if (user.username === username) {
      return user;
    }
    return null;
  }

  public async createRefreshToken(user: User): Promise<string> {
    const payload = { sub: user.id };
    const token = await this.jwtService.signAsync(payload, {
      expiresIn: '1h',
      secret: process.env.SECRET,
    });
    return token;
  }
}
