import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly userSerivce: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split('Bearer ')[1];

    if (!token) return false;

    try {
      const decodedToken = await this.firebaseService.decodeToken(token);
      const userDetails = await this.userSerivce.findOneOrFail({
        firebaseId: decodedToken.uid,
      });
      request.user = {
        email: decodedToken.email,
        uid: decodedToken.uid,
        userId: userDetails.id,
      };
      return true;
    } catch (err) {
      return false;
    }
  }
}
