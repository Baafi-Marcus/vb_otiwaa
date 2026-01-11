import { Controller, Get, Patch, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AdminNotificationService } from './admin-notification.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('api/admin/notifications')
@UseGuards(JwtAuthGuard)
@Roles('admin')
export class AdminNotificationController {
    constructor(private readonly notificationService: AdminNotificationService) { }

    @Get()
    async getNotifications(@Query('unreadOnly') unreadOnly: string) {
        return this.notificationService.getNotifications(unreadOnly === 'true');
    }

    @Patch(':id/read')
    async markAsRead(@Param('id') id: string) {
        return this.notificationService.markAsRead(id);
    }

    @Patch('read-all')
    async markAllAsRead() {
        return this.notificationService.markAllAsRead();
    }

    @Delete(':id')
    async deleteNotification(@Param('id') id: string) {
        return this.notificationService.deleteNotification(id);
    }
}
