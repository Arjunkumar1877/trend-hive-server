import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from 'src/data/entities/address.entity';
import { UpdateAddressRequestDto } from './address.dto';
import { EncryptionService } from 'src/helpers/encryption.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private encryptionService: EncryptionService,
    private userService: UsersService,
  ) {}

  async updateAddressDetails(input: UpdateAddressRequestDto, token: string) {
    const tokenInput = { token: token };
    const userId = await this.encryptionService.getIdsFromToken(tokenInput);

    if (!userId) {
      throw new Error('User ID not found');
    }

    const newAddress = this.addressRepository.create({
      ...input,
      userId: Number(userId.id),
    });

    const verifyEmail = await this.userService.updateVerifyUser(+userId.id);
    if (!verifyEmail) {
      throw new Error('Error verifying the email');
    }
    return await this.addressRepository.save(newAddress);
  }
}
