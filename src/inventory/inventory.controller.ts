import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { InventoryService, LowStockProduct } from './inventory.service';
import { FirebaseAuthGuard } from '../guards/firebase-auth-guard';
import { AdjustStockDto, SetStockDto } from './inventory.dto';

@ApiTags('inventory')
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get current stock for a product' })
  @ApiResponse({ status: 200, description: 'Returns product stock level' })
  async getProductStock(
    @Param('productId') productId: string,
  ): Promise<{ productId: string; stock: number }> {
    const stock = await this.inventoryService.getProductStock(productId);
    return { productId, stock };
  }

  @Get('low-stock')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get products with low stock (admin)' })
  @ApiResponse({ status: 200, description: 'Returns low stock products' })
  @ApiQuery({ name: 'threshold', required: false, type: Number })
  async getLowStockProducts(
    @Query('threshold') threshold?: number,
  ): Promise<LowStockProduct[]> {
    return this.inventoryService.getLowStockProducts(threshold);
  }

  @Get('out-of-stock')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get out of stock products (admin)' })
  @ApiResponse({ status: 200, description: 'Returns out of stock products' })
  async getOutOfStockProducts(): Promise<LowStockProduct[]> {
    return this.inventoryService.getOutOfStockProducts();
  }

  @Patch('product/:productId/adjust')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Adjust product stock (admin)' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  async adjustStock(
    @Param('productId') productId: string,
    @Body() adjustStockDto: AdjustStockDto,
  ): Promise<{ message: string; newStock: number }> {
    const product = await this.inventoryService.adjustStock(
      productId,
      adjustStockDto.adjustment,
      adjustStockDto.reason,
    );
    return {
      message: 'Stock adjusted successfully',
      newStock: product.availableQuantity,
    };
  }

  @Patch('product/:productId/set')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Set product stock to specific value (admin)' })
  @ApiResponse({ status: 200, description: 'Stock set successfully' })
  async setStock(
    @Param('productId') productId: string,
    @Body() setStockDto: SetStockDto,
  ): Promise<{ message: string; newStock: number }> {
    const product = await this.inventoryService.setStock(
      productId,
      setStockDto.quantity,
    );
    return {
      message: 'Stock set successfully',
      newStock: product.availableQuantity,
    };
  }
}


