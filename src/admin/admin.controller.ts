import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthResponseDto } from 'src/auth/auth.dto';
import { AdminLoginDto, AdminLoginResponseDto } from './admin.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
constructor(private adminService: AdminService){}

@Post('login')
@ApiOperation({summary: 'admin login'})
@ApiResponse({
    status: 200,
    description: 'logged in succesfully',
    type: ''
})
async login(@Body() adminLoginDto: AdminLoginDto): Promise<AdminLoginResponseDto | string>{
    return this.adminService.login(adminLoginDto);
}
}
