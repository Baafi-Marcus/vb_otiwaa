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

    async testMediaSend(to: string, url: string) {
        return this.twilioService.sendMediaMessage(to, url, "Test Image Delivery 🧪");
    }
}
