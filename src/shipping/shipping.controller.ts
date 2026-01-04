import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ShippingService } from './shipping.service';
import {
  CalculateShippingDto,
  ShippingCalculationResponseDto,
  ShippingRateDto,
  ShippingAddressDto,
} from './shipping.dto';
import { FirebaseAuthGuard } from '../gaurds/firebase-auth-guard';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate shipping cost' })
  @ApiResponse({
    status: 200,
    description: 'Shipping cost calculated successfully',
    type: ShippingCalculationResponseDto,
  })
  async calculateShipping(
    @Body() calculateShippingDto: CalculateShippingDto,
  ): Promise<ShippingCalculationResponseDto> {
    if (!this.shippingService.validateShippingAddress(calculateShippingDto.address)) {
      throw new Error('Invalid shipping address');
    }
    return this.shippingService.calculateShipping(calculateShippingDto);
  }

  @Post('methods')
  @ApiOperation({ summary: 'Get available shipping methods for an address' })
  @ApiResponse({
    status: 200,
    description: 'Returns available shipping methods',
    type: [ShippingRateDto],
  })
  async getAvailableMethods(
    @Body() address: ShippingAddressDto,
    @Query('subtotal') subtotal?: number,
    @Query('weight') weight?: number,
  ): Promise<ShippingRateDto[]> {
    if (!this.shippingService.validateShippingAddress(address)) {
      throw new Error('Invalid shipping address');
    }
    return this.shippingService.getAvailableShippingMethods(
      address,
      subtotal || 0,
      weight || 0,
    );
  }

  @Get('free-shipping-check')
  @ApiOperation({ summary: 'Check if order qualifies for free shipping' })
  @ApiResponse({
    status: 200,
    description: 'Returns free shipping eligibility',
  })
  async checkFreeShipping(
    @Query('country') country: string,
    @Query('subtotal') subtotal: number,
  ): Promise<{ eligible: boolean; threshold?: number }> {
    const eligible = this.shippingService.checkFreeShippingEligibility(
      country,
      subtotal,
    );
    const threshold = this.shippingService.getFreeShippingThreshold(country);
    return {
      eligible,
      threshold,
    };
  }
}

