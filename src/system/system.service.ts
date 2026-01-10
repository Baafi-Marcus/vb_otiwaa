import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemService {
    constructor(private prisma: PrismaService) { }

    async getApiKeys() {
        const keys = await this.prisma.apiKey.findMany({
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
        return this.prisma.apiKey.create({
            data: {
                provider,
                key,
            },
        });
    }

    async deleteApiKey(id: string) {
        return this.prisma.apiKey.delete({
            where: { id },
        });
    }
}
