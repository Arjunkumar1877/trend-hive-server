import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument, DiscountType } from '../data/schemas/coupon.schema';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './coupons.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponModel.findOne({ code: createCouponDto.code.toUpperCase() });
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }

    const coupon = new this.couponModel({
      ...createCouponDto,
      code: createCouponDto.code.toUpperCase(),
    });
    return coupon.save();
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponModel.findById(id).exec();
    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.couponModel.findByIdAndUpdate(
      id,
      { 
        ...updateCouponDto,
        code: updateCouponDto.code ? updateCouponDto.code.toUpperCase() : undefined 
      },
      { new: true },
    ).exec();

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }
    return coupon;
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException('Coupon not found');
    }
  }

  async validateCoupon(validateCouponDto: ValidateCouponDto): Promise<{ isValid: boolean; discountAmount: number; coupon?: Coupon }> {
    const { code, orderTotal } = validateCouponDto;
    const coupon = await this.couponModel.findOne({ code: code.toUpperCase() }).exec();

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    if (!coupon.isActive) {
      throw new BadRequestException('Coupon is inactive');
    }

    if (new Date() > coupon.expirationDate) {
      throw new BadRequestException('Coupon has expired');
    }

    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      throw new BadRequestException('Coupon usage limit reached');
    }
    
    if (orderTotal < coupon.minOrderValue) {
      throw new BadRequestException(`Minimum order value of ${coupon.minOrderValue} required`);
    }

    let discountAmount = 0;
    if (coupon.discountType === DiscountType.PERCENTAGE) {
      discountAmount = (orderTotal * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }
    
    // Ensure discount doesn't exceed total
    if (discountAmount > orderTotal) {
      discountAmount = orderTotal;
    }

    return { isValid: true, discountAmount, coupon };
  }
  
  async incrementUsage(code: string): Promise<void> {
    await this.couponModel.findOneAndUpdate(
      { code: code.toUpperCase() },
      { $inc: { usageCount: 1 } }
    ).exec();
  }
}
