import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
    private readonly logger = new Logger(AuditService.name);

    constructor(private prisma: PrismaService) { }

    async logAction(payload: {
        actorId: string;
        actorType: 'ADMIN' | 'MERCHANT' | 'SYSTEM';
        action: string;
        target?: string;
        details?: string | object;
        ipAddress?: string;
    }) {
        try {
            const { actorId, actorType, action, target, details, ipAddress } = payload;

            const detailsString = typeof details === 'string'
                ? details
                : JSON.stringify(details);

            await this.prisma.auditLog.create({
                data: {
                    actorId,
                    actorType,
                    action,
                    target,
                    details: detailsString,
                    ipAddress,
                }
            });
            this.logger.log(`[Audit] ${actorType}:${actorId} performed ${action}`);
        } catch (error) {
            this.logger.error(`Failed to create audit log: ${error.message}`, error.stack);
            // We do not throw here to prevent log failures from blocking main business logic
        }
    }

    async getLogs(limit: number = 50) {
        return this.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }
}
