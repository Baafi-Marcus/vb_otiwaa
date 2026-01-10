import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { MarketingService } from './marketing.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('marketing')
@UseGuards(JwtAuthGuard)
export class MarketingController {
    constructor(private readonly marketingService: MarketingService) { }

    @Post(':merchantId/campaign')
    async createCampaign(
        @Param('merchantId') merchantId: string,
        @Body() data: { name: string; message: string; customerIds: string[] }
    ) {
        return this.marketingService.createCampaign(merchantId, data);
    }

    @Get(':merchantId/campaigns')
    async getCampaigns(@Param('merchantId') merchantId: string) {
        return this.marketingService.getCampaigns(merchantId);
    }
}
