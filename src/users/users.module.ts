import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  providers: [UsersService],
  imports: [DatabaseModule],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
