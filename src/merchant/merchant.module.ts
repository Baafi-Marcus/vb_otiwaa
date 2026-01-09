import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenaiModule } from '../openai/openai.module';
import { StabilityaiModule } from '../stabilityai/stabilityai.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { OrderModule } from '../order/order.module';

@Module({
    imports: [PrismaModule, OpenaiModule, StabilityaiModule, WhatsappModule, OrderModule],
    controllers: [MerchantController],
    providers: [MerchantService],
    exports: [MerchantService],
})
export class MerchantModule { }
