import { Controller, Get, Post, Delete, Body, Param, UseGuards, Logger, Patch } from '@nestjs/common';
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

    @Delete('api-keys/:id')
    async deleteApiKey(@Param('id') id: string) {
        return this.systemService.deleteApiKey(id);
    }

    @Post('leads')
    async createLead(@Body() data: any) {
        return this.systemService.createLead(data);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('leads')
    async getLeads() {
        return this.systemService.getLeads();
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Patch('leads/:id')
    async updateLeadStatus(@Param('id') id: string, @Body() body: { status: string }) {
        return this.systemService.updateLeadStatus(id, body.status);
    }

    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('admin')
    @Get('audit-logs')
    async getAuditLogs() {
        return this.systemService.getAuditLogs();
    }
}
