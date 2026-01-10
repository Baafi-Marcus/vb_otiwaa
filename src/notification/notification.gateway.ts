import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
    cors: {
        origin: '*',
    },
})
@Injectable()
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(NotificationGateway.name);

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('joinMerchant')
    handleJoinMerchant(client: Socket, merchantId: string) {
        client.join(`merchant_${merchantId}`);
        this.logger.log(`Client ${client.id} joined room merchant_${merchantId}`);
        return { event: 'roomJoined', data: merchantId };
    }

    @SubscribeMessage('joinAdmin')
    handleJoinAdmin(client: Socket) {
        client.join('admin_room');
        this.logger.log(`Client ${client.id} joined admin_room`);
        return { event: 'roomJoined', data: 'admin' };
    }

    // Helper methodologies to emit events from services
    emitToMerchant(merchantId: string, event: string, data: any) {
        this.server.to(`merchant_${merchantId}`).emit(event, data);
    }

    emitToAdmin(event: string, data: any) {
        this.server.to('admin_room').emit(event, data);
    }

    emitToAll(event: string, data: any) {
        this.server.emit(event, data);
    }
}
