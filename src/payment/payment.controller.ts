import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentService } from './payment.service';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  PaymentResponseDto,
  PaymentStatusDto,
} from './payment.dto';
import { FirebaseAuthGuard } from '../guards/firebase-auth-guard';
import { UsersService } from '../users/users.service';

@ApiTags('payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly usersService: UsersService,
  ) {}

  @Post('create-intent')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a payment intent for an order' })
  @ApiResponse({
    status: 201,
    description: 'Payment intent created successfully',
    type: PaymentResponseDto,
  })
  async createPaymentIntent(
    @Req() req: any,
    @Body() createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<PaymentResponseDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.paymentService.createPaymentIntent(userId, createPaymentIntentDto);
  }

  @Post('confirm')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Confirm payment and update order status' })
  @ApiResponse({
    status: 200,
    description: 'Payment confirmed',
    type: PaymentStatusDto,
  })
  async confirmPayment(
    @Req() req: any,
    @Body() confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<PaymentStatusDto> {
    const userId = await this.getUserIdFromRequest(req);
    return this.paymentService.confirmPayment(userId, confirmPaymentDto);
  }

  @Post('webhook')
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ): Promise<{ received: boolean }> {
    const payload = req.rawBody;
    if (!payload) {
      throw new Error('Request body is required');
    }
    await this.paymentService.handleWebhook(signature, payload);
    return { received: true };
  }

  @Get('status/:orderId')
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get payment status for an order' })
  @ApiResponse({
    status: 200,
    description: 'Payment status retrieved',
    type: PaymentStatusDto,
  })
  async getPaymentStatus(@Param('orderId') orderId: string): Promise<PaymentStatusDto> {
    return this.paymentService.getPaymentStatus(orderId);
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

