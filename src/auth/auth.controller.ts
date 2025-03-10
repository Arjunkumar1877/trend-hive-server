import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthResponseDto, CreateUserDto, LoginDto } from './auth.dto';
import { Request } from 'express';

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
  async signup(@Body() createUserDto: CreateUserDto, @Req() req: Request): Promise<AuthResponseDto> {
    console.log("Received signup request");
  
    const host = req.get('host');
    const protocol = req.protocol; 
    const fullUrl = `${protocol}://${host}`; 
  
    return this.authService.signup(createUserDto, fullUrl);
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
}
