import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { UploadsController } from './uploads.controller';
import { SystemService } from './system.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';

@Module({
    imports: [PrismaModule, TwilioModule],
    controllers: [SystemController, UploadsController],
    providers: [SystemService],
    exports: [SystemService],
})
export class SystemModule { }
