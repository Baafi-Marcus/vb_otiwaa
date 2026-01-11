import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationGateway } from './notification.gateway';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class AdminNotificationService {
    private readonly logger = new Logger(AdminNotificationService.name);

    constructor(
        private prisma: PrismaService,
        private notificationGateway: NotificationGateway,
        private whatsappService: WhatsappService,
    ) { }

    async createAlert(data: {
        type: string;
        priority: 'INFO' | 'NORMAL' | 'CRITICAL';
        title: string;
        message: string;
        merchantId?: string;
    }) {
        this.logger.log(`Creating admin alert: ${data.title}`);

        // 1. Persist to DB
        const notification = await (this.prisma as any).adminNotification.create({
            data: {
                type: data.type,
                priority: data.priority,
                title: data.title,
                message: data.message,
                merchantId: data.merchantId,
            },
        });

        // 2. Emit via WebSocket
        this.notificationGateway.emitToAdmin('newAlert', notification);

        // 3. WhatsApp for Critical Alerts
        if (data.priority === 'CRITICAL') {
            await this.sendWhatsAppToAdmins(data.title, data.message);
        }

        return notification;
    }

    private async sendWhatsAppToAdmins(title: string, message: string) {
        const admins = await (this.prisma as any).admin.findMany({
            where: { phone: { not: null } },
        });

        const alertText = `🚨 *CRITICAL ALERT: ${title}*\n\n${message}`;

        for (const admin of admins) {
            try {
                if (admin.phone) {
                    await this.whatsappService.sendWhatsAppMessage(admin.phone, alertText);
                }
            } catch (err: any) {
                this.logger.error(`Failed to send WhatsApp alert to admin ${admin.username}: ${err.message}`);
            }
        }
    }

    async getNotifications(unreadOnly = false) {
        return (this.prisma as any).adminNotification.findMany({
            where: unreadOnly ? { isRead: false } : {},
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async markAsRead(id: string) {
        return (this.prisma as any).adminNotification.update({
            where: { id },
            data: { isRead: true },
        });
    }

    async markAllAsRead() {
        return (this.prisma as any).adminNotification.updateMany({
            where: { isRead: false },
            data: { isRead: true },
        });
    }

    async deleteNotification(id: string) {
        return (this.prisma as any).adminNotification.delete({
            where: { id },
        });
    }
}
