import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'John ddoe',
    description: 'This is the name of the user',
  })
  @IsString()
  name: string;

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
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: false,
    description: 'Email is verified or not',
  })
  @IsBoolean()
  @IsOptional()
  isEmailVerified: boolean;

  @ApiProperty({
    example: '98782435546',
    description: 'Users phone number',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: '123432234gdd',
    description: 'Users firbase uid',
  })
  @IsOptional()
  @IsString()
  firbaseId?: string;
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

export class UpdateUserDto {
  @ApiProperty({
    example: '98782435546',
    description: 'Users phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: '123432234gdd',
    description: 'Users firbase uid',
  })
  @IsOptional()
  @IsString()
  firbaseId: string;
}

export class ConfirmationEmailResponseDto {
  @ApiProperty({
    example: 'email shared sucessfully',
    description: 'shared message'
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: true,
    description: 'status'
  })
  @IsBoolean()
  status: boolean;
}