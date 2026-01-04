import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  CARD = 'card',
  PAYPAL = 'paypal',
}

export class CreatePaymentIntentDto {
  @ApiProperty({
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  orderId: string;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Amount in cents',
    example: 10000,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    default: 'usd',
  })
  @IsString()
  @IsOptional()
  currency?: string;
}

export class ConfirmPaymentDto {
  @ApiProperty({
    description: 'Payment intent ID from Stripe',
    example: 'pi_1234567890',
  })
  @IsString()
  paymentIntentId: string;

  @ApiProperty({
    description: 'Order ID',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  orderId: string;
}

export class PaymentResponseDto {
  @ApiProperty()
  paymentIntentId: string;

  @ApiProperty()
  clientSecret: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty()
  status: string;
}

export class PaymentStatusDto {
  @ApiProperty()
  paymentIntentId: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  orderId: string;

  @ApiProperty({ required: false })
  error?: string;
}

