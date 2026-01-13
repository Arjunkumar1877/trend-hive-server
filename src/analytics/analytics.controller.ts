import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { AdminGuard } from '../gaurds/admin.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AdminGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard overview statistics' })
  async getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get daily sales analytics' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getSalesAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getSalesAnalytics(startDate, endDate);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTopProducts(@Query('limit') limit: number = 5) {
    return this.analyticsService.getTopProducts(limit);
  }
}
