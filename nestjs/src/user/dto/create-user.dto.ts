import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(5)
  password: string;

  @IsEnum(['USER', 'ADMIN'] as const)
  role: 'USER' | 'ADMIN';

  @IsOptional() @IsString() fullname?: string;
  @IsOptional() @IsString() avatar?: string;
}
