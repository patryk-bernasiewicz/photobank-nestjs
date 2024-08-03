import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from 'src/users/users.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { AuthService } from './auth.service';
import { LocalStrategy } from './local.strategy';
import { TokenStrategy } from './token.strategy';
import { AuthController } from './auth.controller';

@Module({
  imports: [UsersModule, PassportModule, MailerModule, JwtModule],
  providers: [AuthService, LocalStrategy, TokenStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
