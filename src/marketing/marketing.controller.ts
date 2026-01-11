import { Controller, Post, Get, Body, Param, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('marketing')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('merchant', 'admin')
export class MarketingController {
    constructor(private readonly marketingService: MarketingService) { }

    @Post(':merchantId/campaign')
    async createCampaign(
        @Param('merchantId') merchantId: string,
        @Body() data: { name: string; message: string; customerIds: string[] },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== merchantId) throw new ForbiddenException('Not owner');
        return this.marketingService.createCampaign(merchantId, data);
    }

    @Get(':merchantId/campaigns')
    async getCampaigns(@Param('merchantId') merchantId: string, @Request() req: any) {
        if (req.user.type === 'merchant' && req.user.sub !== merchantId) throw new ForbiddenException('Not owner');
        return this.marketingService.getCampaigns(merchantId);
    }
}
