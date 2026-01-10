import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    async getMerchantAnalytics(merchantId: string) {
        // 1. Revenue Trends (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const orders = await this.prisma.order.findMany({
            where: {
                merchantId,
                createdAt: { gte: sevenDaysAgo },
                status: 'COMPLETED'
            },
            select: {
                createdAt: true,
                totalAmount: true
            }
        });

        // Group by day
        const revenueTrends = Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const dateStr = date.toISOString().split('T')[0];
            const dayRevenue = orders
                .filter(o => o.createdAt.toISOString().split('T')[0] === dateStr)
                .reduce((sum, o) => sum + Number(o.totalAmount), 0);

            return { date: dateStr, revenue: dayRevenue };
        });

        // 2. Top Products
        const topProducts = await (this.prisma.orderItem as any).groupBy({
            by: ['productId'],
            where: {
                order: { merchantId, status: 'COMPLETED' }
            },
            _sum: {
                quantity: true
            },
            orderBy: {
                _sum: {
                    quantity: 'desc'
                }
            },
            take: 5
        });

        // Get product names
        const enrichedTopProducts = await Promise.all(
            topProducts.map(async (tp: any) => {
                const product = await this.prisma.product.findUnique({
                    where: { id: tp.productId },
                    select: { name: true }
                });
                return {
                    name: product?.name || 'Unknown',
                    quantity: tp._sum.quantity
                };
            })
        );

        // 3. AI vs Manual Metrics
        // For now, we'll estimate based on botPaused field in Customer
        // Real tracking would require a "processedBy" field in Message logs
        const customerEngagement = await this.prisma.customer.count({
            where: { merchantId }
        });

        const manualHandoffs = await this.prisma.customer.count({
            where: { merchantId, botPaused: true }
        });

        return {
            revenueTrends,
            topProducts: enrichedTopProducts,
            metrics: {
                totalCustomers: customerEngagement,
                activeAI: customerEngagement - manualHandoffs,
                manualHandoffs
            }
        };
    }
}
