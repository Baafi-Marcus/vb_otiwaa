import { Controller, Get, Post, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemService } from './system.service';

@Controller('diagnostics')
export class SystemController {
    private readonly logger = new Logger(SystemController.name);
    constructor(private readonly systemService: SystemService) {
        this.logger.log('SystemController initialized');
    }

    // Public test endpoint for media delivery
    @Post('test-media')
    async testMedia(@Body() body: { to: string, url: string }) {
        return this.systemService.testMediaSend(body.to, body.url);
    }

    @Get('health')
    health() {
        return { status: 'ok', time: new Date().toISOString() };
    }

    @UseGuards(JwtAuthGuard)
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
}
