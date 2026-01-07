import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { Order, OrderDocument, PaymentStatus } from '../data/schemas/order.schema';
import {
  CreatePaymentIntentDto,
  ConfirmPaymentDto,
  PaymentResponseDto,
  PaymentStatusDto,
} from './payment.dto';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,
    private ordersService: OrdersService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not found. Payment functionality will be limited.');
    } else {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-12-15.clover',
      });
    }
  }

  /**
   * Create a payment intent for an order
   */
  async createPaymentIntent(
    userId: string,
    createPaymentIntentDto: CreatePaymentIntentDto,
  ): Promise<PaymentResponseDto> {
    const order = await this.orderModel.findById(createPaymentIntentDto.orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId.toString() !== userId) {
      throw new BadRequestException('Order does not belong to user');
    }

    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestException('Order is already paid');
    }

    // Validate amount matches order total
    const amountInCents = Math.round(createPaymentIntentDto.amount * 100);
    const orderTotalInCents = Math.round(order.total * 100);

    if (amountInCents !== orderTotalInCents) {
      throw new BadRequestException(
        `Payment amount (${createPaymentIntentDto.amount}) does not match order total (${order.total})`,
      );
    }

    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: createPaymentIntentDto.currency || 'usd',
        metadata: {
          orderId: order._id.toString(),
          userId: userId,
          orderNumber: order.orderNumber,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update order with payment intent ID
      order.paymentMethod = createPaymentIntentDto.paymentMethod;
      order.paymentIntentId = paymentIntent.id;
      await order.save();

      return {
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
        orderId: order._id.toString(),
        amount: createPaymentIntentDto.amount,
        currency: createPaymentIntentDto.currency || 'usd',
        status: paymentIntent.status,
      };
    } catch (error) {
      this.logger.error('Error creating payment intent:', error);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Confirm payment and update order status
   */
  async confirmPayment(
    userId: string,
    confirmPaymentDto: ConfirmPaymentDto,
  ): Promise<PaymentStatusDto> {
    const order = await this.orderModel.findById(confirmPaymentDto.orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId.toString() !== userId) {
      throw new BadRequestException('Order does not belong to user');
    }

    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        confirmPaymentDto.paymentIntentId,
      );

      if (paymentIntent.status === 'succeeded') {
        await this.ordersService.updatePaymentStatus(
          confirmPaymentDto.orderId,
          PaymentStatus.PAID,
        );
        return {
          paymentIntentId: paymentIntent.id,
          status: 'succeeded',
          orderId: confirmPaymentDto.orderId,
        };
      } else if (paymentIntent.status === 'requires_payment_method') {
        return {
          paymentIntentId: paymentIntent.id,
          status: 'requires_payment_method',
          orderId: confirmPaymentDto.orderId,
          error: 'Payment method is required',
        };
      } else if (paymentIntent.status === 'requires_action') {
        return {
          paymentIntentId: paymentIntent.id,
          status: 'requires_action',
          orderId: confirmPaymentDto.orderId,
          error: 'Additional action required',
        };
      } else {
        return {
          paymentIntentId: paymentIntent.id,
          status: paymentIntent.status,
          orderId: confirmPaymentDto.orderId,
        };
      }
    } catch (error) {
      this.logger.error('Error confirming payment:', error);
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(signature: string, payload: Buffer): Promise<void> {
    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      this.logger.warn('STRIPE_WEBHOOK_SECRET not configured. Webhook verification skipped.');
      return;
    }

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      this.logger.error('Webhook signature verification failed:', err);
      throw new BadRequestException('Webhook signature verification failed');
    }

    this.logger.log(`Received webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        this.logger.log(`Unhandled event type: ${event.type}`);
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      this.logger.error('Order ID not found in payment intent metadata');
      return;
    }

    try {
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.PAID);
      this.logger.log(`Payment succeeded for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to update order ${orderId} payment status:`, error);
    }
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      this.logger.error('Order ID not found in payment intent metadata');
      return;
    }

    try {
      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.FAILED);
      this.logger.log(`Payment failed for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Failed to update order ${orderId} payment status:`, error);
    }
  }

  /**
   * Handle canceled payment
   */
  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const orderId = paymentIntent.metadata.orderId;

    if (!orderId) {
      this.logger.error('Order ID not found in payment intent metadata');
      return;
    }

    this.logger.log(`Payment canceled for order ${orderId}`);
    // Payment status remains as PENDING when canceled
  }

  /**
   * Get payment status for an order
   */
  async getPaymentStatus(orderId: string): Promise<PaymentStatusDto> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return {
      paymentIntentId: order.paymentIntentId || '',
      status: order.paymentStatus,
      orderId: order._id.toString(),
    };
  }

  /**
   * Refund a payment
   */
  async refundPayment(orderId: string, amount?: number): Promise<{ refundId: string; status: string }> {
    const order = await this.orderModel.findById(orderId).exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.paymentStatus !== PaymentStatus.PAID) {
      throw new BadRequestException('Order is not paid');
    }

    if (!order.paymentIntentId) {
       throw new BadRequestException('Payment Intent ID not found for this order. Cannot process refund.');
    }

    if (!this.stripe) {
      throw new BadRequestException('Payment service is not configured');
    }

    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: order.paymentIntentId,
      };

      if (amount) {
        refundParams.amount = Math.round(amount * 100);
      }

      const refund = await this.stripe.refunds.create(refundParams);

      await this.ordersService.updatePaymentStatus(orderId, PaymentStatus.REFUNDED);
      
      return {
        refundId: refund.id,
        status: refund.status || 'unknown',
      };
    } catch (error) {
      this.logger.error('Error processing refund:', error);
      throw new BadRequestException(`Failed to process refund: ${error.message}`);
    }
  }
}

