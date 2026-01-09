import { Module } from '@nestjs/common';
import { SystemController } from './system.controller';
import { UploadsController } from './uploads.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [SystemController, UploadsController],
})
export class SystemModule { }
