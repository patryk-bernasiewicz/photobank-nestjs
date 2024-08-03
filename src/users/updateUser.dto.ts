import { UserRole } from '@prisma/client';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  @Length(6)
  password?: string;

  @IsOptional()
  username?: string;

  @IsOptional()
  @Matches(
    `^${Object.values(UserRole)
      .filter((v) => typeof v !== 'number')
      .join('|')}$`,
    'i',
  )
  role?: UserRole;

  @IsOptional()
  @IsEmail()
  email?: string;
}
