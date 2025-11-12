import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserDto } from 'src/auth/auth.dto';
import { User, UserDocument } from 'src/data/schemas/user.schema';

@Injectable()
export class UsersService {
  findOneOrFail: any;
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findUserById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findUserByFirebaseId(firebaseId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ firebaseId }).exec();
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.findByEmail(createUserDto.email);

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = new this.userModel({
      name: createUserDto.name,
      email: createUserDto.email,
      password: hashedPassword,
      firebaseId: createUserDto.firbaseId,
      phoneNumber: createUserDto.phoneNumber
    });

    return user.save();
  }

  async updateVerifyUser(id: string) {
    return this.userModel.findByIdAndUpdate(
      id,
      { isEmailVerified: true },
      { new: true }
    ).exec();
  }
  
}
