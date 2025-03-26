import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Admin } from 'src/data/entities/admin.entity';

export class AdminLoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'The email of the admin',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Admin@123',
    description: 'The password of the admin',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}




export class AdminLoginResponseDto {
  @ApiProperty({
    example: 1,
    description: 'The unique ID of the admin',
  })
  id: number;

  @ApiProperty({
    example: 'John Doe',
    description: 'The name of the admin',
  })
  name: string;

  @ApiProperty({
    example: 'admin@example.com',
    description: 'The email of the admin',
  })
  email: string;

  @ApiProperty({
    example: '2025-03-26T12:00:00.000Z',
    description: 'The date and time when the admin was created',
  })
  createdAt: Date;
}




export function toAdminDto(admin: Admin): AdminLoginResponseDto {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    createdAt: admin.createdAt
  };
}