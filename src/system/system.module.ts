import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { UploadsController } from './uploads.controller';
import { SystemService } from './system.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TwilioModule } from '../twilio/twilio.module';

import { AuditService } from './audit.service';

@Module({
    imports: [PrismaModule, TwilioModule],
    controllers: [SystemController, UploadsController],
    providers: [SystemService, AuditService],
    exports: [SystemService, AuditService],
})
export class SystemModule { }
