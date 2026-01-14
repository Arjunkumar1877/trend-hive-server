import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { AddToWishlistDto, WishlistResponseDto } from './wishlist.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth-guard';
import { UsersService } from '../users/users.service';

@ApiTags('wishlist')
@Controller('wishlist')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('JWT-auth')
export class WishlistController {
  constructor(
    private readonly wishlistService: WishlistService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist retrieved successfully', type: WishlistResponseDto })
  async getWishlist(@Request() req): Promise<WishlistResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.wishlistService.getWishlist(userId);
  }

  @Get('count')
  @ApiOperation({ summary: 'Get wishlist item count' })
  @ApiResponse({ status: 200, description: 'Wishlist count retrieved successfully' })
  async getWishlistCount(@Request() req): Promise<{ count: number }> {
    const userId = await this.getUserIdFromRequest(req);
    const count = await this.wishlistService.getWishlistItemCount(userId);
    return { count };
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is in wishlist' })
  @ApiResponse({ status: 200, description: 'Returns whether product is in wishlist' })
  async checkProductInWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ): Promise<{ isInWishlist: boolean }> {
    const userId = await this.getUserIdFromRequest(req);
    const isInWishlist = await this.wishlistService.isInWishlist(userId, productId);
    return { isInWishlist };
  }

  @Post('add')
  @ApiOperation({ summary: 'Add product to wishlist' })
  @ApiResponse({ status: 200, description: 'Product added to wishlist successfully', type: WishlistResponseDto })
  async addToWishlist(
    @Request() req,
    @Body() addToWishlistDto: AddToWishlistDto,
  ): Promise<WishlistResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.wishlistService.addToWishlist(userId, addToWishlistDto);
  }

  @Delete('remove/:productId')
  @ApiOperation({ summary: 'Remove product from wishlist' })
  @ApiResponse({ status: 200, description: 'Product removed from wishlist successfully', type: WishlistResponseDto })
  async removeFromWishlist(
    @Request() req,
    @Param('productId') productId: string,
  ): Promise<WishlistResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.wishlistService.removeFromWishlist(userId, productId);
  }

  @Delete('clear')
  @ApiOperation({ summary: 'Clear entire wishlist' })
  @ApiResponse({ status: 200, description: 'Wishlist cleared successfully' })
  async clearWishlist(@Request() req): Promise<{ message: string }> {
    const userId = await this.getUserIdFromRequest(req);
    await this.wishlistService.clearWishlist(userId);
    return { message: 'Wishlist cleared successfully' };
  }

  @Post('move-to-cart')
  @ApiOperation({ summary: 'Move wishlist items to cart' })
  @ApiResponse({ status: 200, description: 'Products moved to cart successfully' })
  async moveToCart(
    @Request() req,
    @Body() body?: { productIds?: string[] },
  ): Promise<{ message: string; movedCount: number }> {
    const userId = await this.getUserIdFromRequest(req);
    return this.wishlistService.moveToCart(userId, body?.productIds);
  }

  /**
   * Helper method to get user ID from request
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

