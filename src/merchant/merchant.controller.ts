import { Controller, Post, Get, Body, Param, Patch, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { OpenaiService } from '../openai/openai.service';
import { OrderService } from '../order/order.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('merchants')
export class MerchantController {
    constructor(
        private readonly merchantService: MerchantService,
        private readonly openai: OpenaiService,
        private readonly orderService: OrderService,
    ) { }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file')) // Memory storage by default
    async uploadFile(@UploadedFile() file: any) {
        const url = await this.merchantService.saveImage(file);
        return { url };
    }

    @Post('analyze-menu')
    async analyzeMenu(@Body() data: { imageUrl: string }) {
        const products = await this.openai.analyzeMenuImage(data.imageUrl);
        return { products };
    }

    @Post('register')
    async register(@Body() data: { name: string; whatsappPhoneNumberId?: string; twilioPhoneNumber?: string; category: string; clientVision: string; systemPrompt?: string; menuImageUrl?: string }
    ) {
        return this.merchantService.registerMerchant(data);
    }

    @Post('expand-vision')
    async expandVision(@Body() data: { name: string; category: string; vision: string }) {
        return {
            systemPrompt: await this.merchantService.expandVisionOnly(data.name, data.category, data.vision)
        };
    }

    @Get()
    async findAll() {
        return this.merchantService.getAllMerchants();
    }

    @Post(':id/products')
    async addProduct(
        @Param('id') id: string,
        @Body() data: { name: string; description: string; price: number; imageUrl?: string }
    ) {
        return this.merchantService.addProduct(id, data);
    }

    @Post(':id/bulk-products')
    async addBulkProducts(
        @Param('id') id: string,
        @Body() data: { products: any[] }
    ) {
        return this.merchantService.bulkAddProducts(id, data.products);
    }

    @Patch(':merchantId/products/:productId')
    async updateProduct(
        @Param('merchantId') merchantId: string,
        @Param('productId') productId: string,
        @Body() data: { name?: string; description?: string; price?: number; imageUrl?: string }
    ) {
        return this.merchantService.updateProduct(merchantId, productId, data);
    }

    @Delete(':merchantId/products/:productId')
    async deleteProduct(
        @Param('merchantId') merchantId: string,
        @Param('productId') productId: string
    ) {
        return this.merchantService.deleteProduct(merchantId, productId);
    }

    @Post(':id/generate-image')
    async generateImage(
        @Param('id') id: string,
        @Body() data: { name: string; description: string }
    ) {
        return this.merchantService.generateProductImage(id, data.name, data.description);
    }

    @Get(':id/dashboard')
    async getDashboard(@Param('id') id: string) {
        return this.merchantService.getMerchantDashboardData(id);
    }

    @Get(':id/orders')
    async getOrders(@Param('id') id: string) {
        return this.merchantService.getMerchantOrders(id);
    }

    @Post(':id/sandbox')
    async simulateSandbox(
        @Param('id') id: string,
        @Body() data: { customPrompt: string; message: string }
    ) {
        return this.merchantService.simulateSandboxChat(id, data.customPrompt, data.message);
    }

    @Get(':id/customers')
    async getCustomers(@Param('id') id: string) {
        return this.merchantService.getMerchantCustomers(id);
    }

    @Post(':id/broadcast')
    async sendBroadcast(
        @Param('id') id: string,
        @Body() data: { message: string; customerIds?: string[] }
    ) {
        return this.merchantService.sendMerchantBroadcast(id, data.message, data.customerIds);
    }

    @Patch(':id')
    async update(
        @Param('id') id: string,
        @Body() data: { name?: string; category?: string; systemPrompt?: string; menuImageUrl?: string }
    ) {
        return this.merchantService.updateMerchant(id, data);
    }

    @Get(':id/delivery-zones')
    async getDeliveryZones(@Param('id') id: string) {
        return this.merchantService.getDeliveryZones(id);
    }

    @Post(':id/delivery-zones')
    async addDeliveryZone(
        @Param('id') id: string,
        @Body() data: { name: string; price: number }
    ) {
        return this.merchantService.addDeliveryZone(id, data);
    }

    @Patch(':merchantId/delivery-zones/:zoneId')
    async updateDeliveryZone(
        @Param('merchantId') merchantId: string,
        @Param('zoneId') zoneId: string,
        @Body() data: { name?: string; price?: number }
    ) {
        return this.merchantService.updateDeliveryZone(merchantId, zoneId, data);
    }

    @Delete(':merchantId/delivery-zones/:zoneId')
    async deleteDeliveryZone(
        @Param('merchantId') merchantId: string,
        @Param('zoneId') zoneId: string
    ) {
        return this.merchantService.deleteDeliveryZone(merchantId, zoneId);
    }
}
