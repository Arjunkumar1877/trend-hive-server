import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  AuthResponseDto,
  CheckUserResponseDto,
  ConfirmationEmailResponseDto,
  CreateUserDto,
  LoginDto,
} from './auth.dto';
import { UserDto } from 'src/users/user.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'Email already exists.' })
  async signup(@Body() createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    console.log('Received signup request');
    return this.authService.signup(createUserDto);
  }

  @Post('resend-confirm-email/:id')
  @ApiOperation({ summary: 'Resend confirmation email' })
  @ApiResponse({
    status: 200,
    description: 'Email shared successfully.',
    type: ConfirmationEmailResponseDto,
  })
  async resendConfirmationEmail(@Param('id') id: string) {
    return this.authService.resendConfirmationEmail(id);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login in a user' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('check-user/:firebaseId')
  @ApiOperation({ summary: 'Check if the user is verified or not' })
  @ApiResponse({
    status: 200,
    description: 'User Verified',
    type: CheckUserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async checkUser(@Param('firebaseId') firebaseId: string) {
    return this.authService.checkUserIsVerified(firebaseId);
  }
}
