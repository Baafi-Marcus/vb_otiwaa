import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { OpenaiService } from '../openai/openai.service';

@Injectable()
export class NudgeService {
    private readonly logger = new Logger(NudgeService.name);

    constructor(
        private prisma: PrismaService,
        private whatsapp: WhatsappService,
        private openai: OpenaiService,
    ) { }

    @Cron(CronExpression.EVERY_6_HOURS)
    async handleCron() {
        this.logger.log('Running proactive re-engagement check...');
        await this.processNudges();
    }

    async processNudges() {
        const twentyFourHoursAgo = new Date();
        twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

        const fortyEightHoursAgo = new Date();
        fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

        // Find customers who were last seen older than 24h
        // We will filter specific nudge timings inside the loop based on merchant tier
        const potentialIdleCustomers = await this.prisma.customer.findMany({
            where: {
                lastSeen: {
                    lte: twentyFourHoursAgo,
                },
                botPaused: false, // Don't nudge if the merchant has taken over manually
            },
            include: {
                merchant: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
            },
        });

        this.logger.log(`Found ${potentialIdleCustomers.length} potential customers to check for nudges.`);

        for (const customer of potentialIdleCustomers) {
            try {
                const { merchant, lastSeen, lastNudgedAt } = customer;
                const nudgeDays = (merchant as any).tier === 'ENTERPRISE' ? (merchant as any).nudgeDays : 2;
                const nudgeThreshold = new Date();
                nudgeThreshold.setDate(nudgeThreshold.getDate() - nudgeDays);

                // Only nudge if they haven't been seen since the threshold
                // AND haven't been nudged in the last nudgeDays (or 24h minimum)
                const lastNudgeLimit = new Date();
                lastNudgeLimit.setHours(lastNudgeLimit.getHours() - 24);

                if (lastSeen <= nudgeThreshold && (!lastNudgedAt || lastNudgedAt <= lastNudgeLimit)) {
                    await this.sendNudge(customer);
                }
            } catch (err: any) {
                this.logger.error(`Failed to nudge customer ${customer.phoneNumber}: ${err.message}`);
            }
        }
    }

    private async sendNudge(customer: any) {
        const { phoneNumber, merchant, orders, name } = customer;

        let nudgeMessage = (merchant as any).tier === 'ENTERPRISE' && (merchant as any).nudgeMessage
            ? (merchant as any).nudgeMessage
            : "";

        if (!nudgeMessage) {
            if (orders.length > 0) {
                nudgeMessage = `Hi ${name || 'there'}! 😊 We noticed it's been a while since your last order from ${merchant.name}. 

Would you like to see our menu again today? We have some fresh items you might love! 🛍️`;
            } else {
                nudgeMessage = `Hello from ${merchant.name}! 👋 

Just checking in to see if you have any questions or if you'd like to place an order today. We're here to help!`;
            }
        }

        this.logger.log(`Nudging ${phoneNumber} for ${merchant.name}`);

        // In a real production environment, this would use a WhatsApp Template
        // For this implementation, we use the standard Twilio message sending
        await this.whatsapp.sendWhatsAppMessage(phoneNumber, nudgeMessage);

        // Update lastNudgedAt to prevent double nudging too soon
        await (this.prisma.customer as any).update({
            where: { id: customer.id },
            data: { lastNudgedAt: new Date() },
        });
    }

    // Utility to manually trigger for testing via Admin
    async triggerManualNudge(customerId: string) {
        const customer = await this.prisma.customer.findUnique({
            where: { id: customerId },
            include: { merchant: true, orders: { orderBy: { createdAt: 'desc' }, take: 1 } },
        });
        if (!customer) return { success: false, message: 'Customer not found' };

        await this.sendNudge(customer);
        return { success: true };
    }
}
