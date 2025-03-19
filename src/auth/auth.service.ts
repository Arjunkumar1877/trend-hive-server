import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcrypt';
import { ConfirmationEmailResponseDto, CreateUserDto } from './auth.dto';
import { FirebaseService } from 'src/firebase/firebase.service';
import { createToken } from 'src/helpers/encrypt';
import { sendVerifyMail } from 'src/helpers/verification-email';
import { getFirebaseErrorMessage } from 'src/helpers/error';
import { toUserDto } from 'src/users/user.dto';
import { User } from 'src/data/entities';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private firebaseService: FirebaseService,
  ) {}

  async signup(createUserDto: CreateUserDto): Promise<any> {
    try {
      const hashedPassword = bcrypt.hashSync(createUserDto.password, 10);

      const { user } = await this.firebaseService.signup(
        createUserDto.email,
        createUserDto.password,
      );
      if (!user?.uid) throw new Error('Error creating Firebase user');

      console.log(createUserDto.phoneNumber);
      const newUser = await this.usersService.create({
        email: createUserDto.email,
        password: hashedPassword,
        name: createUserDto.name,
        phoneNumber: createUserDto.phoneNumber,
        isEmailVerified: false,
        firbaseId: user.uid,
      });
      if (!newUser) throw new Error('Error saving user details');

      const payload = {
        id: newUser.id,
        email: newUser.email,
        firebaseId: user.uid,
      };
      const token = await createToken({ payload });

      const verificationLink = `${process.env.NEST_CLIENT_LINK}/add-details?token=${token}`;
      const emailSent = await sendVerifyMail(newUser.email, verificationLink);
      if (!emailSent) throw new Error('Error sending verification email');

      return {
        success: true,
        message: 'Email sent succesfully to your email. Please confirm.',
        userId: newUser.id,
      };
    } catch (error) {
      const errorMessage = getFirebaseErrorMessage(error);
      return { success: false, message: errorMessage };
    }
  }

  async resendConfirmationEmail(
    id: string,
  ): Promise<ConfirmationEmailResponseDto> {
    const user = await this.usersService.findUserById(id);
    if (!user) throw new NotFoundException('User not found');

    const token = await createToken({
      payload: { id: user.id, email: user.email },
    });
    const verificationLink = `${process.env.NEST_CLIENT_LINK}/add-details?token=${token}`;

    const emailSent = await sendVerifyMail(user.email, verificationLink);
    return {
      message: emailSent
        ? 'Email shared successfully!'
        : 'Email sharing failed!',
      status: emailSent,
    };
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

  async checkUserIsVerified(firebaseId: string) {
    const data = await this.usersService.findUserByFirebaseId(firebaseId);
    if (data && !data?.isEmailVerified) {
      const payload = { id: data.id, email: data.email };
      const token = await createToken({ payload });

      const verificationLink = `${process.env.NEST_CLIENT_LINK}/add-details?token=${token}`;
      return {
        data: verificationLink,
        verified: false,
        message: 'Email not verified.',
      };
    }

    return {
      data: toUserDto(data as User),
      verified: true,
      message: 'Logged In Successfully!',
    };
  }
}
