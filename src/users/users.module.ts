import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../data/entities/user.entity';
import { FirebaseModule } from 'src/firebase/firebase.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), FirebaseModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
