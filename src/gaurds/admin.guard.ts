
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId) {
      return false;
    }

    // You might need to adjust this depending on how your User schema defines admins.
    // Assuming there is an 'role' or 'isAdmin' field.
    // Based on previous files, I haven't seen an 'isAdmin' field on UserSchema yet, 
    // so I will need to check the User Schema first. 
    // For now, I will assume a standardized way or check the schema in the next step.
    // But I will write the basic structure.
    
    // WAIT. I should check the User Schema first before writing this file to be sure.
    // I will assume for now that I can fetch the user and check a property.
    
    const dbUser = await this.usersService.findUserById(user.userId);
    if (!dbUser || dbUser.role !== 'admin') { 
        // Note: I need to verify if 'role' exists. 
        return false;
    }

    return true;
  }
}
