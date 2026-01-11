import { Controller, Get, Patch, Body, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

import { Roles } from '../auth/roles.decorator';

@Controller('api/admin')
@UseGuards(JwtAuthGuard)
@Roles('admin')
export class AdminController {
    constructor(private prisma: PrismaService) { }

    @Get('profile')
    async getProfile(@Request() req: any) {
        if (req.user.type !== 'admin') throw new NotFoundException('Admin profile only');

        const admin = await (this.prisma as any).admin.findUnique({
            where: { id: req.user.sub }
        });

        if (!admin) throw new NotFoundException('Admin not found');

        const { password, ...result } = admin;
        return result;
    }

    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() data: { phone?: string }) {
        if (req.user.type !== 'admin') throw new NotFoundException('Admin profile only');

        return (this.prisma as any).admin.update({
            where: { id: req.user.sub },
            data: {
                phone: data.phone
            }
        });
    }
}
