import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TwilioService } from '../twilio/twilio.service';

@Injectable()
export class SystemService {
    constructor(private prisma: PrismaService, private twilioService: TwilioService) { }

    async getApiKeys() {
        const keys = await (this.prisma as any).apiKey.findMany({
            select: {
                id: true,
                provider: true,
                key: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return keys;
    }

    async addApiKey(provider: string, key: string) {
        return (this.prisma as any).apiKey.create({
            data: {
                provider,
                key,
            },
        });
    }

    async deleteApiKey(id: string) {
        return (this.prisma as any).apiKey.delete({
            where: { id },
        });
    }

    async createLead(data: {
        businessName: string;
        contactPerson: string;
        phone: string;
        email: string;
        businessType: string;
        message?: string;
    }) {
        const lead = await (this.prisma as any).lead.create({ data });

        // Trigger WhatsApp Alert to Marcus
        const adminNumber = 'whatsapp:+233276019796';
        const alertMessage = `🚀 *New Business Lead!*
            
*Business:* ${data.businessName}
*Contact:* ${data.contactPerson}
*Phone:* ${data.phone}
*Email:* ${data.email}
*Type:* ${data.businessType}
*Message:* ${data.message || 'N/A'}

Check the Admin Dashboard for details.`;

        try {
            // NOTE: This will fail if the Admin (+233276019796) has not messaged the bot in the last 24 hours.
            // Using 'null' for merchantId to skip DB logging and avoid FK constraints.
            const sid = await this.twilioService.sendMessage(adminNumber, alertMessage, undefined);
            console.log(`[LEAD_ALERT] WhatsApp notification sent. SID: ${sid?.sid}`);
        } catch (error) {
            console.error('[LEAD_ALERT] Failed to send WhatsApp notification. Admin may be outside 24h session window.', error);
        }

        return lead;
    }

    async getLeads() {
        return (this.prisma as any).lead.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async updateLeadStatus(id: string, status: string) {
        return (this.prisma as any).lead.update({
            where: { id },
            data: { status }
        });
    }

    async testMediaSend(to: string, url: string) {
        return this.twilioService.sendMediaMessage(to, url, "Test Image Delivery 🧪");
    }
}
