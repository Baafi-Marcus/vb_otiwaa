import { Module } from '@nestjs/common';
import { MerchantService } from './merchant.service';
import { MerchantController } from './merchant.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OpenaiModule } from '../openai/openai.module';
import { StabilityaiModule } from '../stabilityai/stabilityai.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { OrderModule } from '../order/order.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { TierScheduler } from './tier.scheduler';
import { NotificationModule } from '../notification/notification.module';
import { TwilioModule } from '../twilio/twilio.module';

@Module({
    imports: [PrismaModule, OpenaiModule, StabilityaiModule, WhatsappModule, OrderModule, AnalyticsModule, NotificationModule, TwilioModule],
    controllers: [MerchantController],
    providers: [MerchantService, TierScheduler],
    exports: [MerchantService],
})
export class MerchantModule { }
