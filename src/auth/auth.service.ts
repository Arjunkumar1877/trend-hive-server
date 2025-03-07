import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './auth.dto';
import { FirebaseService } from 'src/firebase/firebase.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) {}

  async signup(createUserDto: CreateUserDto): Promise<any> {
    console.log(createUserDto);
    const hashedPassword = bcrypt.hashSync(createUserDto.password, 10);
    const createFirebaseUser = await this.firebaseService.signup(
      createUserDto.email,
      hashedPassword,
    );

    console.log(createFirebaseUser);
    const user = await this.usersService.create({
      ...createUserDto,
      firbaseId: createFirebaseUser.user.uid,
    });

    console.log(user);
    return user;
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
