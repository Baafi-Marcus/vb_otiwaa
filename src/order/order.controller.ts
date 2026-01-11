import { Controller, Get, Patch, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant', 'admin')
export class OrderController {
    constructor(
        private readonly orderService: OrderService,
        private readonly prisma: PrismaService
    ) { }

    @Patch(':id/status')
    async updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req: any) {
        if (req.user.type === 'merchant') {
            const order = await (this.prisma as any).order.findUnique({ where: { id } });
            if (!order || order.merchantId !== req.user.sub) throw new ForbiddenException('Not owner');
        }
        return this.orderService.updateStatus(id, status);
    }

    @Get('analytics/:merchantId')
    async getAnalytics(@Param('merchantId') merchantId: string, @Request() req: any) {
        if (req.user.type === 'merchant' && req.user.sub !== merchantId) throw new ForbiddenException('Not owner');
        return this.orderService.getMerchantAnalytics(merchantId);
    }

    @Patch('bulk-status')
    async bulkStatus(@Body() data: { ids: string[], status: string }, @Request() req: any) {
        if (req.user.type === 'merchant') {
            const orders = await (this.prisma as any).order.findMany({
                where: { id: { in: data.ids } }
            });
            const allOwned = orders.every((o: any) => o.merchantId === req.user.sub);
            if (!allOwned) throw new ForbiddenException('One or more orders not owned');
        }
        return this.orderService.bulkUpdateStatus(data.ids, data.status);
    }
}
