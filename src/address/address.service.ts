import { Injectable } from '@nestjs/common';
import { UpdateAddressRequestDto } from './address.dto';
import { Address } from 'src/data/entities/address.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EncryptionService } from 'src/helpers/encryption.service';

@Injectable()
export class AddressService {
  constructor(
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    private encryptionService: EncryptionService,
  ) {}

  async updateAddressDetails(input: UpdateAddressRequestDto, token: string) {
    const tokenInput = { token: token };
    const userId = await this.encryptionService.getIdFromToken(tokenInput);

    if (!userId) {
      throw new Error('User Id not found');
    }

    const updatedAddress = this.addressRepository.create({
      userId: Number(userId),
      ...input,
    });

    return await this.addressRepository.save(updatedAddress);
  }
}
