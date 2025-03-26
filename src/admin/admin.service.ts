import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Admin } from 'src/data/entities/admin.entity';
import { Repository } from 'typeorm';
import { AdminLoginDto, AdminLoginResponseDto, toAdminDto } from './admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async findByEmail(email: string): Promise<Admin | null> {
    return this.adminRepository.findOne({
      where: { email: email }, 
    });
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
