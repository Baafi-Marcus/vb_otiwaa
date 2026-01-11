import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { AdminNotificationService } from '../notification/admin-notification.service';

@Injectable()
export class TierScheduler {
    private readonly logger = new Logger(TierScheduler.name);

    constructor(
        private prisma: PrismaService,
        private adminNotificationService: AdminNotificationService
    ) { }

    // Daily check for expired tiers at midnight
    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleTierExpirationChecks() {
        this.logger.log('Running daily tier expiration checks...');

        const now = new Date();
        const expiredMerchants = await (this.prisma as any).merchant.findMany({
            where: {
                tierExpiresAt: {
                    lt: now,
                },
            },
        });

        if (expiredMerchants.length > 0) {
            this.logger.warn(`Found ${expiredMerchants.length} expired merchant tiers.`);

            for (const merchant of expiredMerchants) {
                await this.adminNotificationService.createAlert({
                    type: 'TIER_EXPIRED',
                    priority: 'CRITICAL',
                    title: `Subscription Expired: ${merchant.name}`,
                    message: `The subscription for ${merchant.name} (${(merchant as any).tier}) expired on ${new Date((merchant as any).tierExpiresAt).toLocaleDateString()}.`,
                    merchantId: merchant.id,
                });
            }
        }
    }

    // Monthly reset of order counts for BASIC tier merchants (1st of every month at midnight)
    @Cron('0 0 1 * *')
    async handleMonthlyOrderCountReset() {
        this.logger.log('Resetting monthly order counts for BASIC tier merchants...');

        const result = await (this.prisma as any).merchant.updateMany({
            where: {
                tier: 'BASIC',
            },
            data: {
                monthlyOrderCount: 0,
                lastOrderCountReset: new Date(),
            },
        });

        this.logger.log(`Successfully reset order counts for ${result.count} Basic merchants.`);
    }
}
