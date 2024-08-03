import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailerModule } from './mailer/mailer.module';
import { ProfileModule } from './profile/profile.module';

@Module({
  imports: [DatabaseModule, AuthModule, UsersModule, MailerModule, ProfileModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
