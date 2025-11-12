import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from 'src/data/schemas/admin.schema';
import { AdminLoginDto, AdminLoginResponseDto, toAdminDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<AdminDocument>,
  ) {}

  async findByEmail(email: string): Promise<AdminDocument | null> {
    return this.adminModel.findOne({ email }).exec();
  }
  
  async login(adminLoginDto: AdminLoginDto): Promise<AdminLoginResponseDto | string> {
    const adminData = await this.findByEmail(adminLoginDto.email);
    
    if (!adminData) {
      return 'Admin not found!';
    }
  
    if (adminData.password !== adminLoginDto.password) {
      return 'Invalid credentials!';
    }
  
    return toAdminDto(adminData);
  }
  
}
