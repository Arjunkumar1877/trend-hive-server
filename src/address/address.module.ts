import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { Address, AddressSchema } from 'src/data/schemas/address.schema';
import { UsersModule } from 'src/users/users.module';
import { EncryptionService } from 'src/helpers/encryption.service';

@Module({
  imports: [
    UsersModule,
    MongooseModule.forFeature([{ name: Address.name, schema: AddressSchema }]),
  ],
  controllers: [AddressController],
  providers: [AddressService, EncryptionService],
  exports: [AddressService],
})
export class AddressModule {}
