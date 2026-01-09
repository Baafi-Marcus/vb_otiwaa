import { Controller, Get, Post, Body } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('system')
export class SystemController {
    constructor(private prisma: PrismaService) { }

    @Get('config')
    async getConfig() {
        const configs = await this.prisma.systemConfig.findMany();
        return configs.reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
    }

    @Post('config')
    async updateConfig(@Body() data: { key: string; value: string }) {
        return this.prisma.systemConfig.upsert({
            where: { key: data.key },
            update: { value: data.value },
            create: { key: data.key, value: data.value },
        });
    }

    @Get('logs')
    async getLogs() {
        return this.prisma.webhookLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }
}
