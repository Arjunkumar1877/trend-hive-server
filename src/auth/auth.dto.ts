import {
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserDto } from 'src/users/user.dto';

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
  @ApiPropertyOptional()
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
    example: 'Login',
    description: 'Success or not',
  })
  @IsBoolean()
  success: boolean;

  @ApiProperty({
    example: 'Email sent message',
    description: 'Email shared successfully',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: 12345,
    description: 'User ID (optional)',
    required: false, 
  })
  @IsOptional()
  @IsNumber()
  userId?: number;
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
    description: 'shared message',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: true,
    description: 'status',
  })
  @IsBoolean()
  status: boolean;
}

export class CheckUserResponseDto {
  @ApiProperty({
    example: 'User details',
    description: 'shared message',
  })
  data: UserDto | string;

  @ApiProperty({
    example: 'Email is verified',
    description: 'email is verified',
  })
  @IsString()
  message: string;

  @ApiProperty({
    example: true,
    description: 'status',
  })
  @IsBoolean()
  verified: boolean;
}
