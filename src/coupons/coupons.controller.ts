import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './coupons.dto';
import { AdminGuard } from '../gaurds/admin.guard';
import { AuthGuard } from '@nestjs/passport'; // Or your specific auth guard

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new coupon (Admin only)' })
  @ApiResponse({ status: 201, description: 'Coupon created successfully' })
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponsService.create(createCouponDto);
  }

  @Get()
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all coupons (Admin only)' })
  findAll() {
    return this.couponsService.findAll();
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get coupon by ID (Admin only)' })
  findOne(@Param('id') id: string) {
    return this.couponsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update coupon (Admin only)' })
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponsService.update(id, updateCouponDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), AdminGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete coupon (Admin only)' })
  remove(@Param('id') id: string) {
    return this.couponsService.remove(id);
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate coupon and calculate discount' })
  @ApiResponse({ status: 200, description: 'Coupon is valid', schema: { example: { isValid: true, discountAmount: 10 } } })
  validate(@Body() validateCouponDto: ValidateCouponDto) {
    return this.couponsService.validateCoupon(validateCouponDto);
  }
}
