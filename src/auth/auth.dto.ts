import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'test@email.com',
    description: 'This is the email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password',
    description: 'Ths is the password of the user',
  })
  @IsString()
  @MinLength(6)
  password: string;
}

export class LoginDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'test@examle.com',
    description: 'The password of the user',
  })
  @IsString()
  password: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: 'jwt-token-here',
    description: 'JWT access token',
  })
  accessToken: string;
}
