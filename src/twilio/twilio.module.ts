import { Module } from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [ConfigModule, PrismaModule],
    providers: [TwilioService],
    exports: [TwilioService],
})
export class TwilioModule { }
