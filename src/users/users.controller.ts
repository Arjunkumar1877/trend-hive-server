import { Controller, Get, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FirebaseAuthGuard } from 'src/guards/firebase-auth-guard';

@Controller('users')
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user profile' })
  getProfile() {
    return { message: 'ths is a protected route' };
  }


  
}
