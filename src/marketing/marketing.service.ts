import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class MarketingService {
    private readonly logger = new Logger(MarketingService.name);

    constructor(
        private prisma: PrismaService,
        private twilio: TwilioService
    ) { }

    async createCampaign(merchantId: string, data: { name: string; message: string; customerIds: string[] }) {
        this.logger.log(`Creating campaign "${data.name}" for merchant ${merchantId}`);

        // 1. Create Campaign record
        const campaign = await (this.prisma as any).campaign.create({
            data: {
                merchantId,
                name: data.name,
                message: data.message,
                status: 'SENDING'
            }
        });

        // 2. Start Broadcast (Async)
        this.runBroadcast(campaign.id, data.message, data.customerIds);

        return campaign;
    }

    private async runBroadcast(campaignId: string, message: string, customerIds: string[]) {
        this.logger.log(`Starting broadcast for campaign ${campaignId} to ${customerIds.length} customers`);

        for (const customerId of customerIds) {
            try {
                const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
                if (customer) {
                    await this.twilio.sendMessage(customer.phoneNumber, message);

                    await (this.prisma as any).campaignLog.create({
                        data: {
                            campaignId,
                            customerId,
                            status: 'DELIVERED'
                        }
                    });
                }
            } catch (err: any) {
                this.logger.error(`Failed to send campaign message to customer ${customerId}: ${err.message}`);
                await (this.prisma as any).campaignLog.create({
                    data: {
                        campaignId,
                        customerId,
                        status: 'FAILED',
                        error: err.message
                    }
                });
            }
        }

        await (this.prisma as any).campaign.update({
            where: { id: campaignId },
            data: { status: 'COMPLETED' }
        });

        this.logger.log(`Campaign ${campaignId} completed.`);
    }

    async getCampaigns(merchantId: string) {
        return (this.prisma as any).campaign.findMany({
            where: { merchantId },
            include: { logs: true },
            orderBy: { createdAt: 'desc' }
        });
    }
}
