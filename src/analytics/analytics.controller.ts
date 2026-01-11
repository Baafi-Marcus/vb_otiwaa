import { Controller, Get, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('merchant/:id')
    async getMerchantAnalytics(@Param('id') id: string, @Request() req: any) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.analyticsService.getMerchantAnalytics(id);
    }
}
