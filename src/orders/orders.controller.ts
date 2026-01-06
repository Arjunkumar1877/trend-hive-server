import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  OrderResponseDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
} from './order.dto';
import { FirebaseAuthGuard } from '../gaurds/firebase-auth-guard';
import { AdminGuard } from '../gaurds/admin.guard';

@ApiTags('orders')
@Controller('orders')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('JWT-auth')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully', type: OrderResponseDto })
  createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders for the authenticated user' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  getOrders(@Request() req): Promise<OrderResponseDto[]> {
    return this.ordersService.getOrdersForUser(req.user.userId);
  }

  @Get(':orderId')
  @ApiOperation({ summary: 'Get order details for the authenticated user' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  getOrder(@Request() req, @Param('orderId') orderId: string): Promise<OrderResponseDto> {
    return this.ordersService.getOrderForUser(orderId, req.user.userId);
  }

  @Patch(':orderId/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update order status (admin only)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updateOrderStatus(orderId, updateOrderStatusDto.status);
  }

  @Patch(':orderId/payment-status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update order payment status (admin only)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  updatePaymentStatus(
    @Param('orderId') orderId: string,
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
  ): Promise<OrderResponseDto> {
    return this.ordersService.updatePaymentStatus(orderId, updatePaymentStatusDto.paymentStatus);
  }

  @Post(':orderId/cancel')
  @ApiOperation({ summary: 'Cancel order for the authenticated user' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  cancelOrder(@Request() req, @Param('orderId') orderId: string): Promise<OrderResponseDto> {
    return this.ordersService.cancelOrder(orderId, req.user.userId);
  }

  @Post(':orderId/refund')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Refund an order (admin only)' })
  @ApiResponse({ status: 200, type: OrderResponseDto })
  refundOrder(@Param('orderId') orderId: string): Promise<OrderResponseDto> {
    return this.ordersService.refundOrder(orderId);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all orders (admin only)' })
  @ApiResponse({ status: 200, type: [OrderResponseDto] })
  getAllOrders(): Promise<OrderResponseDto[]> {
    return this.ordersService.getAllOrders();
  }
}


