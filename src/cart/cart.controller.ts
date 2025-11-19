import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './cart.dto';
import { FirebaseAuthGuard } from '../gaurds/firebase-auth-guard';
import { UsersService } from '../users/users.service';

@ApiTags('cart')
@Controller('cart')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully', type: CartResponseDto })
  async getCart(@Request() req): Promise<CartResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.cartService.getCart(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get cart item count' })
  @ApiResponse({ status: 200, description: 'Cart count retrieved successfully' })
  async getCartCount(@Request() req): Promise<{ count: number }> {
    const userId = await this.getUserIdFromRequest(req);
    const count = await this.cartService.getCartItemCount(userId);
    return { count };
  }

  @Post('add')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 200, description: 'Item added to cart successfully', type: CartResponseDto })
  async addToCart(
    @Request() req,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.cartService.addToCart(userId, addToCartDto);
  }

  @Put('update')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Cart item updated successfully', type: CartResponseDto })
  async updateCartItem(
    @Request() req,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.cartService.updateCartItem(userId, updateCartItemDto);
  }

  @Delete('remove/:productId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart successfully', type: CartResponseDto })
  async removeFromCart(
    @Request() req,
    @Param('productId') productId: string,
  ): Promise<CartResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.cartService.removeFromCart(userId, productId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(@Request() req): Promise<{ message: string }> {
    const userId = await this.getUserIdFromRequest(req);
    await this.cartService.clearCart(userId);
    return { message: 'Cart cleared successfully' };
  }

  /**
   * Helper method to get user ID from request
   * The FirebaseAuthGuard sets req.user with uid, we need to find the user by firebaseId
   */
  private async getUserIdFromRequest(req: any): Promise<string> {
    if (req.user?.userId) {
      return req.user.userId;
    }

    // Fallback: find user by firebaseId
    if (req.user?.uid) {
      const user = await this.usersService.findUserByFirebaseId(req.user.uid);
      if (user) {
        return user._id.toString();
      }
    }

    throw new Error('User not found');
  }
}

