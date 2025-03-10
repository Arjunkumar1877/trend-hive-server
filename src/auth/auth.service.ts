import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './auth.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { createToken } from 'src/helpers/encrypt';
import { sendEmailVerification } from 'firebase/auth';
import { sendVerifyMail } from 'src/helpers/verification-email';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) {}

  async signup(createUserDto: CreateUserDto, url: string): Promise<any> {
    try {
      console.log(createUserDto);
  
      const hashedPassword = bcrypt.hashSync(createUserDto.password, 10);
  
      const { user } = await this.firebaseService.signup(createUserDto.email, hashedPassword);
      if (!user?.uid) throw new Error('Error creating Firebase user');
  
      const newUser = await this.usersService.create({
        ...createUserDto,
        firbaseId: user.uid,
      });
      if (!newUser) throw new Error('Error saving user details');
  
      const payload = { id: newUser.id, email: newUser.email };
      const token = await createToken({ payload });
  
      const verificationLink = `${url}/confirm-email?token=${token}`;
      const emailSent = await sendVerifyMail(newUser.email, verificationLink);
      if (!emailSent) throw new Error('Error sending verification email');
  
      return newUser.id;
    } catch (error) {
      console.error('Signup Error:', error.message);
      return { success: false, message: error.message };
    }
  }
  
  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.usersService.findByEmail(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      throw new UnauthorizedException('Invalid credentials!');
    }

    const payload = { email: user.email, sub: user.id };

    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
}
