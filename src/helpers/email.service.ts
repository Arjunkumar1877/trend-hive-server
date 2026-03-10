import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OrderDocument } from '../data/schemas/order.schema';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  private createTransporter() {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT');
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port: port || 587,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.logger.warn(
        'SMTP configuration missing. Email service will run in mock mode (logging only).',
      );
    }
  }

  async sendOrderConfirmation(
    to: string,
    order: OrderDocument,
  ): Promise<boolean> {
    if (!this.transporter) {
      this.logger.log(
        `[MOCK EMAIL] To: ${to}, Subject: Order Confirmation #${order.orderNumber}, Total: ${order.total} ${order.currency}`,
      );
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${this.configService.get('APP_NAME') || 'Trend Hive'}" <${this.configService.get('SMTP_FROM') || this.configService.get('SMTP_USER')}>`,
        to,
        subject: `Order Confirmation #${order.orderNumber}`,
        html: this.generateOrderTemplate(order),
      });
      this.logger.log(`Email sent: ${info.messageId}`);
      return true;
    } catch (error) {
      this.logger.error('Failed to send order confirmation email:', error);
      return false;
    }
  }

  private generateOrderTemplate(order: OrderDocument): string {
    const itemsList = order.items
      .map((item: any) => {
        // Handle both populated and unpopulated/embedded structures if necessary
        const name = item.productName || 'Product';
        const price = item.productPrice || 0;
        const qty = item.quantity || 1;
        const sub = item.subtotal || price * qty;
        const variant = item.variantName ? `(${item.variantName})` : '';
        return `<li>${name} ${variant} - ${qty} x ${price} = ${sub}</li>`;
      })
      .join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your order!</h2>
        <p>Your order <strong>#${order.orderNumber}</strong> has been received and is being processed.</p>
        
        <h3>Order Details</h3>
        <ul>
          ${itemsList}
        </ul>
        
        <p><strong>Subtotal:</strong> ${order.subtotal}</p>
        <p><strong>Shipping:</strong> ${order.shippingFee}</p>
        <p><strong>Discount:</strong> -${order.discount}</p>
        <p><strong>Total:</strong> ${order.total} ${order.currency.toUpperCase()}</p>
        
        <p>You can view your order status in your dashboard.</p>
        
        <p>Best regards,<br>Trend Hive Team</p>
      </div>
    `;
  }
}
