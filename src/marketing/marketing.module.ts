import { Module } from '@nestjs/common';
import { MarketingController } from './marketing.controller';
import { MarketingService } from './marketing.service';
import { TwilioModule } from '../twilio/twilio.module';

@Module({
    imports: [TwilioModule],
    controllers: [MarketingController],
    providers: [MarketingService],
})
export class MarketingModule { }
