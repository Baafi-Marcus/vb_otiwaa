import { Controller, Post, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { NudgeService } from './nudge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('nudge')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NudgeController {
    constructor(
        private readonly nudgeService: NudgeService,
        private readonly prisma: PrismaService
    ) { }

    @Post('manual/:customerId')
    async manualNudge(@Param('customerId') customerId: string, @Request() req: any) {
        if (req.user.type === 'merchant') {
            const customer = await (this.prisma as any).customer.findUnique({ where: { id: customerId } });
            if (!customer || customer.merchantId !== req.user.sub) throw new ForbiddenException('Not owner');
        }
        return this.nudgeService.triggerManualNudge(customerId);
    }
}
