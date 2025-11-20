import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';
import { Address, AddressDocument } from 'src/data/schemas/address.schema';
import { User, UserDocument } from 'src/data/schemas/user.schema';

export class AddressDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'The unique identifier of the address',
  })
  id: string;

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
  @ApiProperty({ example: '507f1f77bcf86cd799439011', description: 'The unique identifier of the user' })
  id: string;

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

export function toUserDto(user: UserDocument): UserDto {
  const addresses: AddressDto[] = [];
  
  if (user.addresses && Array.isArray(user.addresses)) {
    for (const address of user.addresses) {
      // If address is populated, it will be an AddressDocument, otherwise it's an ObjectId
      if (address && typeof address === 'object' && 'city' in address && '_id' in address) {
        addresses.push(toAddressDto(address as unknown as AddressDocument));
      }
    }
  }
  
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phoneNumber: user.phoneNumber,
    firebaseId: user.firebaseId,
    isEmailVerified: !!user.isEmailVerified,
    addresses: addresses,
  };
}

export function toAddressDto(address: AddressDocument): AddressDto {
  return {
    id: address._id.toString(),
    city: address.city,
    state: address.state,
    country: address.country,
    zipCode: address.zipCode,
  };
}
