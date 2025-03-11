import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';
import { Address } from 'src/data/entities/address.entity';
import { UsersModule } from 'src/users/users.module';
import { EncryptionService } from 'src/helpers/encryption.service';

@Module({
  imports: [UsersModule, TypeOrmModule.forFeature([Address])],
  controllers: [AddressController],
  providers: [AddressService, EncryptionService],
  exports: [AddressService],
})
export class AddressModule {}
