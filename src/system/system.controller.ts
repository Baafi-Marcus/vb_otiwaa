import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemService } from './system.service';

@Controller('system')
@UseGuards(JwtAuthGuard)
export class SystemController {
    constructor(private readonly systemService: SystemService) { }

    @Get('api-keys')
    async getApiKeys() {
        return this.systemService.getApiKeys();
    }

    @Post('api-keys')
    async addApiKey(@Body() body: { provider: string; key: string }) {
        return this.systemService.addApiKey(body.provider, body.key);
    }

    @Delete('api-keys/:id')
    async deleteApiKey(@Param('id') id: string) {
        return this.systemService.deleteApiKey(id);
    }

    // Public test endpoint for media delivery
    @Post('test-media')
    async testMedia(@Body() body: { to: string, url: string }) {
        return this.systemService.testMediaSend(body.to, body.url);
    }
}
