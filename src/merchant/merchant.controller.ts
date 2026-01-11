import { Controller, Post, Get, Body, Param, Patch, Delete, UseInterceptors, UploadedFile, ForbiddenException } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { OpenaiService } from '../openai/openai.service';
import { OrderService } from '../order/order.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UseGuards } from '@nestjs/common';

import { Roles } from '../auth/roles.decorator';
import { Request } from '@nestjs/common';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { CreateUpgradeRequestDto } from './dto/create-upgrade-request.dto';

import { RolesGuard } from '../auth/roles.guard';

@Controller('merchants')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MerchantController {
    constructor(
        private readonly merchantService: MerchantService,
        private readonly openai: OpenaiService,
        private readonly orderService: OrderService,
    ) { }

    @Post('upload')
    @Roles('merchant', 'admin')
    @UseInterceptors(FileInterceptor('file')) // Memory storage by default
    async uploadFile(@UploadedFile() file: any) {
        const url = await this.merchantService.saveImage(file);
        return { url };
    }

    @Post('analyze-menu')
    @Roles('merchant', 'admin')
    async analyzeMenu(@Body() data: { imageUrl: string }) {
        const products = await this.openai.analyzeMenuImage(data.imageUrl);
        return { products };
    }

    @Post('register')
    @Roles('admin')
    async register(@Body() data: RegisterMerchantDto) {
        return this.merchantService.registerMerchant(data);
    }

    @Post('expand-vision')
    @Roles('merchant', 'admin')
    async expandVision(@Body() data: { name: string; category: string; vision: string }) {
        return {
            systemPrompt: await this.merchantService.expandVisionOnly(data.name, data.category, data.vision)
        };
    }

    @Get()
    @Roles('admin')
    async findAll() {
        return this.merchantService.getAllMerchants();
    }

    @Post(':id/products')
    @Roles('merchant', 'admin')
    async addProduct(
        @Param('id') id: string,
        @Body() data: { name: string; description: string; price: number; imageUrl?: string },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.addProduct(id, data);
    }

    @Post(':id/bulk-products')
    @Roles('merchant', 'admin')
    async addBulkProducts(
        @Param('id') id: string,
        @Body() data: { products: any[] },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.bulkAddProducts(id, data.products);
    }

    @Patch(':merchantId/products/:productId')
    @Roles('merchant', 'admin')
    async updateProduct(
        @Param('merchantId') merchantId: string,
        @Param('productId') productId: string,
        @Body() data: { name?: string; description?: string; price?: number; imageUrl?: string },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== merchantId) throw new ForbiddenException('Not owner');
        return this.merchantService.updateProduct(merchantId, productId, data);
    }

    @Delete(':merchantId/products/:productId')
    @Roles('merchant', 'admin')
    async deleteProduct(
        @Param('merchantId') merchantId: string,
        @Param('productId') productId: string,
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== merchantId) throw new ForbiddenException('Not owner');
        return this.merchantService.deleteProduct(merchantId, productId);
    }

    @Post(':id/generate-image')
    @Roles('merchant', 'admin')
    async generateImage(
        @Param('id') id: string,
        @Body() data: { name: string; description: string },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.generateProductImage(id, data.name, data.description);
    }

    @Get(':id/dashboard')
    @Roles('merchant', 'admin')
    async getDashboard(@Param('id') id: string, @Request() req: any) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.getMerchantDashboardData(id);
    }

    @Get(':id/orders')
    @Roles('merchant', 'admin')
    async getOrders(@Param('id') id: string, @Request() req: any) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.getMerchantOrders(id);
    }

    @Post(':id/sandbox')
    @Roles('merchant', 'admin')
    async simulateSandbox(
        @Param('id') id: string,
        @Body() data: { customPrompt: string; message: string },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.simulateSandboxChat(id, data.customPrompt, data.message);
    }

    @Get(':id/customers')
    @Roles('merchant', 'admin')
    async getCustomers(@Param('id') id: string, @Request() req: any) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.getMerchantCustomers(id);
    }

    @Post(':id/broadcast')
    @Roles('merchant', 'admin')
    async sendBroadcast(
        @Param('id') id: string,
        @Body() data: { message: string; customerIds?: string[] },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.sendMerchantBroadcast(id, data.message, data.customerIds);
    }

    @Patch(':id')
    @Roles('merchant', 'admin')
    async update(
        @Param('id') id: string,
        @Body() data: { name?: string; category?: string; systemPrompt?: string; menuImageUrl?: string },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.updateMerchant(id, data);
    }

    @Get(':id/delivery-zones')
    @Roles('merchant', 'admin')
    async getDeliveryZones(@Param('id') id: string, @Request() req: any) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.getDeliveryZones(id);
    }

    @Post(':id/delivery-zones')
    @Roles('merchant', 'admin')
    async addDeliveryZone(
        @Param('id') id: string,
        @Body() data: { name: string; price: number },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.addDeliveryZone(id, data);
    }

    @Patch(':merchantId/delivery-zones/:zoneId')
    @Roles('merchant', 'admin')
    async updateDeliveryZone(
        @Param('merchantId') merchantId: string,
        @Param('zoneId') zoneId: string,
        @Body() data: { name?: string; price?: number },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== merchantId) throw new ForbiddenException('Not owner');
        return this.merchantService.updateDeliveryZone(merchantId, zoneId, data);
    }

    @Delete(':merchantId/delivery-zones/:zoneId')
    @Roles('merchant', 'admin')
    async deleteDeliveryZone(
        @Param('merchantId') merchantId: string,
        @Param('zoneId') zoneId: string,
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== merchantId) throw new ForbiddenException('Not owner');
        return this.merchantService.deleteDeliveryZone(merchantId, zoneId);
    }

    @Patch(':id/customers/:customerId/toggle-bot')
    @Roles('merchant', 'admin')
    async toggleBot(
        @Param('id') id: string,
        @Param('customerId') customerId: string,
        @Body() data: { paused: boolean },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.toggleBot(id, customerId, data.paused);
    }

    @Get('upgrade-requests')
    @Roles('admin')
    async getUpgradeRequests() {
        return this.merchantService.getUpgradeRequests();
    }

    @Post(':id/upgrade-request')
    @Roles('merchant', 'admin')
    async createUpgradeRequest(
        @Param('id') id: string,
        @Body() data: CreateUpgradeRequestDto,
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.createUpgradeRequest(id, data.requestedTier);
    }

    @Patch('upgrade-requests/:id/approve')
    @Roles('admin')
    async approveUpgradeRequest(
        @Param('id') id: string,
        @Body() body: { tier?: string, durationMonths?: number }
    ) {
        return this.merchantService.approveUpgradeRequest(id, body.tier, body.durationMonths);
    }

    @Patch('upgrade-requests/:id/reject')
    @Roles('admin')
    async rejectUpgradeRequest(@Param('id') id: string) {
        return this.merchantService.rejectUpgradeRequest(id);
    }

    @Delete(':id/delete')
    @Roles('admin')
    async deleteMerchant(@Param('id') id: string) {
        return this.merchantService.deleteMerchant(id);
    }

    @Patch(':id/toggle-status')
    @Roles('merchant', 'admin')
    async toggleStatus(
        @Param('id') id: string,
        @Body() data: { isPaused: boolean },
        @Request() req: any
    ) {
        if (req.user.type === 'merchant' && req.user.sub !== id) throw new ForbiddenException('Not owner');
        return this.merchantService.toggleMerchantStatus(id, data.isPaused);
    }
}
