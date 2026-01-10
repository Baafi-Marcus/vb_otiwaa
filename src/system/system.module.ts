import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { UploadsController } from './uploads.controller';
import { SystemService } from './system.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SystemController, UploadsController],
    providers: [SystemService],
    exports: [SystemService],
})
export class SystemModule { }
