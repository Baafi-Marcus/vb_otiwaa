import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DirectoryService {
    constructor(private prisma: PrismaService) { }

    async listMerchants(page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const merchants = await this.prisma.merchant.findMany({
            where: { isClosed: false }, // Only show open merchants? Or all? Let's show all for now, maybe mark closed.
            select: {
                id: true,
                name: true,
                category: true,
                isClosed: true,
                location: true,
                tier: true,
                contactPhone: true,
                menuImageUrl: true,
            },
            take: limit,
            skip: skip,
            orderBy: { name: 'asc' },
        });

        const total = await this.prisma.merchant.count();

        return {
            merchants,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }

    async getMerchantById(id: string) {
        return this.prisma.merchant.findUnique({
            where: { id }
        });
    }

    formatMerchantList(merchants: any[]) {
        if (merchants.length === 0) return "No merchants found available at the moment.";

        let message = "🍽️ *Available Restaurants* 🍽️\n\n";
        message += "Reply with the *Number* to visit a store:\n\n";

        merchants.forEach((m, index) => {
            const status = m.isClosed ? "🔴 (Closed)" : "🟢";
            message += `*${index + 1}.* ${m.name} ${status}\n`;
            message += `   _${m.category || 'General'} • ${m.location || 'Online'}_\n\n`;
        });

        message += "\nType *Next* to see more.";
        return message;
    }
}
