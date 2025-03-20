import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { Address, User } from 'src/data/entities';

export class AddressDto {
  @ApiProperty({
    example: 1,
    description: 'The unique identifier of the address',
  })
  id: number;

  @ApiProperty({ example: 'New York', description: 'The city of the address' })
  @IsString()
  city: string;

  @ApiProperty({ example: 'NY', description: 'The state of the address' })
  @IsString()
  state: string;

  @ApiProperty({ example: 'USA', description: 'The country of the address' })
  @IsString()
  country: string;

  @ApiProperty({
    example: '10001',
    description: 'The postal code of the address',
  })
  @IsString()
  zipCode: string;
}

export class UserDto {
  @ApiProperty({ example: 1, description: 'The unique identifier of the user' })
  id: number;

  @ApiProperty({ example: 'John Doe', description: 'The name of the user' })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'johndoe@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'The phone number of the user',
  })
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user email is verified',
  })
  @IsEmail()
  isEmailVerified: boolean;

  @ApiProperty({ example: 'firebase id', description: 'This is firebase Id' })
  @IsString()
  firebaseId: string;

  @ApiProperty({
    type: [AddressDto],
    description: 'List of addresses associated with the user',
  })
  addresses?: AddressDto[];
}

export function toUserDto(user: User): UserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    firebaseId: user.firebaseId,
    isEmailVerified: !!user.isEmailVerified,
    addresses: user?.addresses?.map((address) => toAddressDto(address)) || [],
  };
}

export function toAddressDto(address: Address): AddressDto {
  return {
    id: address.id,
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode,
  };
}
