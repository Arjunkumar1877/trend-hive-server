import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Address, AddressDocument } from 'src/data/schemas/address.schema';
import { UpdateAddressRequestDto } from './address.dto';
import { EncryptionService } from 'src/helpers/encryption.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private addressModel: Model<AddressDocument>,
    private encryptionService: EncryptionService,
    private userService: UsersService,
  ) {}

  async updateAddressDetails(input: UpdateAddressRequestDto, token: string) {
    const tokenInput = { token: token };
    const userId = await this.encryptionService.getIdsFromToken(tokenInput);

    if (!userId) {
      throw new Error('User ID not found');
    }

    const newAddress = new this.addressModel({
      ...input,
      userId: userId.id,
    });

    const verifyEmail = await this.userService.updateVerifyUser(userId.id);
    if (!verifyEmail) {
      throw new Error('Error verifying the email');
    }
    return await newAddress.save();
  }
}
