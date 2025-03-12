import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Address } from 'src/data/entities/address.entity';
import { UpdateAddressRequestDto } from './address.dto';
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
      throw new Error('User ID not found');
    }

    const newAddress = this.addressRepository.create({
      ...input,
      userId: Number(userId),
    });

    return await this.addressRepository.save(newAddress);
  }
}
