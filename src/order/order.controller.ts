import { Controller, Get, Patch, Param, Body, Query } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
    constructor(private readonly orderService: OrderService) { }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.orderService.updateStatus(id, status);
    }

    @Get('analytics/:merchantId')
    async getAnalytics(@Param('merchantId') merchantId: string) {
        return this.orderService.getMerchantAnalytics(merchantId);
    }
}
