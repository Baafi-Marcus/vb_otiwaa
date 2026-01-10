import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => WhatsappService))
        private whatsapp: WhatsappService,
        private readonly notification: NotificationGateway,
    ) { }

    private generateShortId() {
        return '#' + Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    async createOrder(data: {
        merchantId: string;
        customerName: string;
        customerPhone: string;
        items: { productId: string; quantity: number; price: number }[];
        fulfillmentMode: string;
        location?: string;
        deliveryFee: number;
    }) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Check for duplicate order from same customer in last 5 minutes
        const duplicate = await this.prisma.order.findFirst({
            where: {
                customerPhone: data.customerPhone,
                merchantId: data.merchantId,
                createdAt: { gte: fiveMinutesAgo },
                fulfillmentMode: data.fulfillmentMode,
                totalAmount: data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + data.deliveryFee
            }
        });

        if (duplicate) {
            console.log(`[Order] Duplicate order detected for ${data.customerPhone}. Skipping.`);
            return duplicate;
        }

        const totalAmount = data.items.reduce((sum, item) => sum + (item.price * item.quantity), 0) + data.deliveryFee;

        // Ensure customer exists or update lastSeen
        const customer = await this.prisma.customer.upsert({
            where: { phoneNumber: data.customerPhone },
            update: { lastSeen: new Date(), merchantId: data.merchantId },
            create: {
                phoneNumber: data.customerPhone,
                name: data.customerName,
                merchantId: data.merchantId
            }
        });

        const order = await (this.prisma.order as any).create({
            data: {
                shortId: this.generateShortId(),
                merchantId: data.merchantId,
                customerId: customer.id,
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                totalAmount: totalAmount,
                deliveryFee: data.deliveryFee,
                fulfillmentMode: data.fulfillmentMode,
                location: data.location,
                status: 'PENDING',
                items: {
                    create: data.items.map(item => ({
                        productId: item.productId,
                        quantity: item.quantity,
                        price: item.price
                    }))
                }
            },
            include: { items: { include: { product: true } } }
        });

        // Notify merchant via WebSocket
        this.notification.emitToMerchant(data.merchantId, 'newOrder', order);
        this.notification.emitToAdmin('newOrder', { merchantId: data.merchantId, ...order });

        return order;
    }

    async getMerchantOrders(merchantId: string) {
        return this.prisma.order.findMany({
            where: { merchantId },
            include: {
                items: { include: { product: true } },
                customer: true
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateStatus(orderId: string, status: string) {
        const order: any = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { merchant: true }
        });
        if (!order) throw new NotFoundException('Order not found');

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { status },
        });

        // Send WhatsApp notification to customer
        const displayId = order.shortId || order.id.substring(0, 4);
        let message = `Update on your order ${displayId} from *${order.merchant.name}*:\n\nYour order status is now: *${status}*`;

        if (status === 'CONFIRMED') message += "\n\nWe are preparing your items! 👨‍🍳";
        if (status === 'READY') message += "\n\nYour order is ready! 🛍️";
        if (status === 'DELIVERED') message += "\n\nEnjoy your meal! Please rate us on WhatsApp soon! ❤️🍱";
        if (status === 'CANCELLED') message += "\n\nWe're sorry, your order has been cancelled. Please contact us for details.";

        try {
            await this.whatsapp.sendWhatsAppMessage(order.customerPhone, message);
        } catch (err) {
            console.error(`Failed to send status update to ${order.customerPhone}: ${err.message}`);
        }

        return updatedOrder;
    }

    async getLatestOrderStatus(customerPhone: string) {
        return this.prisma.order.findFirst({
            where: { customerPhone },
            orderBy: { createdAt: 'desc' },
            include: { items: { include: { product: true } } }
        });
    }

    async getMerchantAnalytics(merchantId: string) {
        const orders = await this.prisma.order.findMany({
            where: { merchantId },
            include: { items: true },
        });

        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
        const orderCount = orders.length;

        // Last 7 days revenue for chart
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayRevenue = orders
                .filter(o => o.createdAt.toISOString().split('T')[0] === dateStr)
                .reduce((sum, o) => sum + Number(o.totalAmount), 0);
            return { date: dateStr, revenue: dayRevenue };
        }).reverse();

        return {
            totalRevenue,
            orderCount,
            revenueHistory: last7Days,
        };
    }

    async bulkUpdateStatus(orderIds: string[], status: string) {
        const results = [];
        for (const id of orderIds) {
            try {
                const res = await this.updateStatus(id, status);
                results.push({ id, status: 'success' });
            } catch (err) {
                results.push({ id, status: 'failed', error: err.message });
            }
        }
        return results;
    }
}
