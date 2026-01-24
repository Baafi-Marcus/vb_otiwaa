import { Injectable, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { AdminNotificationService } from '../notification/admin-notification.service';
import { NotificationGateway } from '../notification/notification.gateway';

@Injectable()
export class OrderService {
    constructor(
        private prisma: PrismaService,
        @Inject(forwardRef(() => WhatsappService))
        private whatsapp: WhatsappService,
        private adminNotificationService: AdminNotificationService,
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

        // --- Inventory Check ---
        for (const item of data.items) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            if (product && (product as any).trackStock) {
                if ((product as any).stockQuantity < item.quantity) {
                    throw new Error(`Insufficient stock for ${product.name}. Available: ${(product as any).stockQuantity}`);
                }
            }
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

        // Increment monthly order count and check soft limit
        const merchant = await this.prisma.merchant.findUnique({ where: { id: data.merchantId } });
        if (merchant) {
            const newCount = (merchant as any).monthlyOrderCount + 1;

            await (this.prisma.merchant as any).update({
                where: { id: data.merchantId },
                data: { monthlyOrderCount: newCount }
            });

            // --- ALL TIERS: Send WhatsApp Alert to Merchant (Centralized Flow) ---
            if (merchant.contactPhone) {
                const shortId = order.shortId || order.id.substring(0, 4);

                // Construct items summary
                const itemsList = order.items.map(item => `- ${item.product.name} (x${item.quantity})`).join('\n');

                const alertMsg = `🔔 *NEW ORDER ${shortId}*\n\n` +
                    `👤 *Customer*: ${data.customerName}\n` +
                    `📞 *Phone*: ${data.customerPhone}\n\n` +
                    `📦 *Items*:\n${itemsList}\n\n` +
                    `💰 *Total*: GHS ${totalAmount}\n` +
                    `🚚 *Mode*: ${data.fulfillmentMode}\n` +
                    `📍 *Location*: ${data.location || 'N/A'}\n\n` +
                    `👉 Login to your dashboard to process: \n${process.env.SERVER_URL || 'https://fuseweb.service'}/admin`;

                try {
                    await this.whatsapp.sendWhatsAppMessage(merchant.contactPhone, alertMsg);
                } catch (err) {
                    console.error(`Failed to send merchant alert to ${merchant.contactPhone}: ${err.message}`);
                }
            }

            // Soft limit warning for Basic tier
            if ((merchant as any).tier === 'BASIC' && newCount > 100) {
                console.log(`[Tier Warning] Basic tier merchant ${data.merchantId} has exceeded 100 orders (${newCount}/100). Consider upgrading.`);
                // Persist alert and optionally notify admin via WhatsApp
                await this.adminNotificationService.createAlert({
                    type: 'ORDER_LIMIT_EXCEEDED',
                    priority: 'NORMAL',
                    title: `Order Limit Exceeded: ${merchant.name}`,
                    message: `Merchant ${merchant.name} has exceeded their monthly order limit. Current count: ${newCount}/100.`,
                    merchantId: data.merchantId,
                });
            }
        }

        // --- Deduct Stock ---
        for (const item of data.items) {
            const product = await this.prisma.product.findUnique({ where: { id: item.productId } });
            if (product && (product as any).trackStock) {
                await (this.prisma.product as any).update({
                    where: { id: item.productId },
                    data: { stockQuantity: { decrement: item.quantity } }
                });
            }
        }

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

        if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
            throw new Error(`Order is already ${order.status.toLowerCase()} and cannot be modified.`);
        }

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

    async updatePaymentStatus(orderId: string, paymentStatus: string) {
        const order: any = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { merchant: true }
        });
        if (!order) throw new NotFoundException('Order not found');

        const updatedOrder = await this.prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus },
        });

        const displayId = order.shortId || order.id.substring(0, 4);
        let message = "";

        if (paymentStatus === 'VERIFIED') {
            message = `Payment for order ${displayId} has been *VERIFIED*! ✅\n\nWe are now processing your order. Thank you! 🙏`;
        } else if (paymentStatus === 'REJECTED') {
            message = `We're sorry, your payment screenshot for order ${displayId} was *REJECTED*. ❌\n\nPlease check your details and send a valid confirmation screenshot to proceed. Thank you!`;
        }

        if (message) {
            try {
                await this.whatsapp.sendWhatsAppMessage(order.customerPhone, message);
            } catch (err) {
                console.error(`Failed to send payment update to ${order.customerPhone}: ${err.message}`);
            }
        }

        return updatedOrder;
    }

    async getLatestOrderStatus(customerPhone: string, merchantId: string) {
        return this.prisma.order.findFirst({
            where: { customerPhone, merchantId },
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
