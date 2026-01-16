import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Twilio, validateRequest } from 'twilio';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TwilioService {
    private readonly logger = new Logger(TwilioService.name);
    private client: Twilio;
    private readonly fromNumber: string;

    constructor(
        private configService: ConfigService,
        private prisma: PrismaService
    ) {
        const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
        const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
        this.fromNumber = this.configService.get<string>('TWILIO_WHATSAPP_NUMBER') || 'whatsapp:+14155238886';

        if (accountSid && authToken) {
            this.client = new Twilio(accountSid, authToken);
            this.logger.log(`Twilio initialized with Account SID: ${accountSid.substring(0, 6)}...${accountSid.substring(accountSid.length - 4)}`);
        } else {
            this.logger.warn('Twilio credentials missing! TwilioService will not work.');
        }
    }

    async sendMessage(to: string, body: string, merchantId?: string) {
        if (!this.client) {
            this.logger.error('Cannot send message: Twilio client not initialized.');
            return null;
        }
        try {
            this.logger.log(`[Twilio Client: ${this.client.accountSid}] Sending WhatsApp message to ${to}`);
            const response = await this.client.messages.create({
                body,
                from: this.fromNumber,
                to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
            });

            // Log outbound message if merchantId is provided
            if (merchantId) {
                const customerPhone = to.replace('whatsapp:', '');
                // Ensure customer exists or find them. 
                // Note: For now, we assume customer exists if we are sending to them, 
                // or we skip if not found to avoid foreign key errors if strictly enforced.
                // Best effort logging.
                try {
                    // Ensure customer exists via UPSERT
                    await this.prisma.customer.upsert({
                        where: { phoneNumber: customerPhone },
                        update: {}, // No update needed if exists
                        create: {
                            phoneNumber: customerPhone,
                            merchantId: merchantId,
                            name: 'Guest',
                            lastSeen: new Date()
                        }
                    });

                    await this.prisma.message.create({
                        data: {
                            merchantId,
                            customerPhone,
                            direction: 'OUTBOUND',
                            content: body,
                            status: 'SENT'
                        }
                    });
                } catch (dbErr) {
                    this.logger.warn(`Failed to log outbound message: ${dbErr.message}`);
                }
            }

            return response;
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp message: ${error.message}`);
            throw error;
        }
    }

    async sendMediaMessage(to: string, mediaUrl: string, caption?: string) {
        if (!this.client) {
            this.logger.error('Cannot send media message: Twilio client not initialized.');
            return null;
        }
        try {
            const serverUrl = process.env.SERVER_URL || '';
            const callbackUrl = serverUrl ? `${serverUrl.replace(/\/$/, '')}/api/whatsapp/twilio` : undefined;

            this.logger.log(`[Twilio Client: ${this.client.accountSid}] Sending WhatsApp media message to ${to}: ${mediaUrl}. Callback: ${callbackUrl || 'None'}`);
            const response = await this.client.messages.create({
                body: caption,
                mediaUrl: [mediaUrl],
                from: this.fromNumber,
                to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
                statusCallback: callbackUrl
            });
            this.logger.log(`[Twilio Service] Media Message Created. SID: ${response.sid}, Status: ${response.status}`);
            return response;
        } catch (error: any) {
            this.logger.error(`[Twilio Error] Failed to send media: ${error.message}`, error.stack);
            throw error;
        }
    }

    async sendTemplateMessage(to: string, contentSid: string, contentVariables: string) {
        if (!this.client) {
            this.logger.error('Cannot send template message: Twilio client not initialized.');
            return null;
        }
        try {
            this.logger.log(`Sending WhatsApp template message to ${to}: ${contentSid}`);
            const response = await this.client.messages.create({
                contentSid,
                contentVariables,
                from: this.fromNumber,
                to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
            });
            return response;
        } catch (error) {
            this.logger.error(`Failed to send WhatsApp template message: ${error.message}`);
            throw error;
        }
    }

    async markMessageAsRead(messageSid: string) {
        if (!this.client) return null;
        try {
            this.logger.log(`Marking message ${messageSid} as read`);
            const response = await (this.client.messages(messageSid) as any).update({ status: 'read' });
            return response;
        } catch (error) {
            this.logger.warn(`Failed to mark message as read: ${error.message}`);
            return null;
        }
    }

    async sendFulfillmentButtons(to: string) {
        if (!this.client) return null;
        try {
            this.logger.log(`Sending fulfillment buttons to ${to}`);

            // For production with Content API, we would use a Content SID.
            // For now, we implement a robust interactive-style text fallback 
            // that the controller will handle via keywords.
            const body = "Select fulfillment method for your order:\n\n1. Pickup 🛍️\n2. Delivery 🚚";

            const response = await this.client.messages.create({
                body,
                from: this.fromNumber,
                to: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`,
            });
            return response;
        } catch (error) {
            this.logger.error(`Failed to send fulfillment buttons: ${error.message}`);
            throw error;
        }
    }

    validateWebhook(signature: string, url: string, params: any): boolean {
        try {
            const authToken = this.configService.get<string>('TWILIO_AUTH_TOKEN');
            return validateRequest(authToken, signature, url, params);
        } catch (error) {
            this.logger.error(`Webhook validation failed: ${error.message}`);
            return false;
        }
    }
}
