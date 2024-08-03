import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Injectable()
export class TokenStrategy extends PassportStrategy(Strategy, 'access_token') {
  public constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: (req: Request) => {
        if (req && req.cookies) {
          return req.cookies['access_token'];
        }
        return null;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.SECRET,
    });
  }

  async validate({
    sub,
    username,
  }: {
    sub: number;
    username: string;
  }): Promise<any> {
    const user = await this.authService.validateAccessTokenPayload(
      sub,
      username,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
