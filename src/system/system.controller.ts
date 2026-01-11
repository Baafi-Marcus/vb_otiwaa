import { Controller, Get, Post, Delete, Body, Param, UseGuards, Logger } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SystemService } from './system.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

@Controller('system')
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

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('api-keys')
    async getApiKeys() {
        return this.systemService.getApiKeys();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Post('api-keys')
    async addApiKey(@Body() body: { provider: string; key: string }) {
        return this.systemService.addApiKey(body.provider, body.key);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Delete('api-keys/:id')
    async deleteApiKey(@Param('id') id: string) {
        return this.systemService.deleteApiKey(id);
    }
}
