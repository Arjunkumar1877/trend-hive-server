import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Admin, AdminDocument } from 'src/data/schemas/admin.schema';

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
    example: '507f1f77bcf86cd799439011',
    description: 'The unique ID of the admin',
  })
  id: string;

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
    required: false,
  })
  createdAt?: Date;
}




export function toAdminDto(admin: AdminDocument): AdminLoginResponseDto {
  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    createdAt: admin.createdAt || new Date()
  };
}