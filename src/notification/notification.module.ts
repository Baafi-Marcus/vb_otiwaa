import { Module, Global } from '@nestjs/common';
import { NotificationGateway } from './notification.gateway';
import { AdminNotificationService } from './admin-notification.service';
import { AdminNotificationController } from './admin-notification.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Global()
@Module({
    imports: [PrismaModule, WhatsappModule],
    controllers: [AdminNotificationController],
    providers: [NotificationGateway, AdminNotificationService],
    exports: [NotificationGateway, AdminNotificationService],
})
export class NotificationModule { }
