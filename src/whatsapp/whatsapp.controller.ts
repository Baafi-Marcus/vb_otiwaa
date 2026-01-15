import { Body, Controller, Get, Header, HttpCode, Logger, Post, Req, Inject, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { WhatsappService } from './whatsapp.service';
import { StabilityaiService } from 'src/stabilityai/stabilityai.service';
import { OpenaiService } from 'src/openai/openai.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { UserContextService } from 'src/user-context/user-context.service';
import { NotificationGateway } from 'src/notification/notification.gateway';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsAppService: WhatsappService,
    private readonly stabilityaiService: StabilityaiService,
    @Inject(forwardRef(() => OpenaiService))
    private readonly openaiService: OpenaiService,
    private readonly prismaService: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly context: UserContextService,
    private readonly notification: NotificationGateway,
  ) { }

  @Get('webhook')
  whatsappVerificationChallenge(@Req() request: Request) {
    const mode = request.query['hub.mode'];
    const challenge = request.query['hub.challenge'];
    const token = request.query['hub.verify_token'];

    this.logger.log(`[Webhook Verification] Received: mode=${mode}, token=${token}`);

    const verificationToken = process.env.WHATSAPP_CLOUD_API_WEBHOOK_VERIFICATION_TOKEN;

    if (mode === 'subscribe' && token === verificationToken) {
      return challenge?.toString();
    }
    return 'Verification failed';
  }

  @Post('webhook')
  @HttpCode(200)
  async handleIncomingMetaMessage(@Body() request: any, @Req() req: Request) {
    const host = req.headers['x-forwarded-host'] as string || req.get('host');
    this.logger.log(`[Meta Webhook] Payload: ${JSON.stringify(request)}`);

    const value = request?.entry?.[0]?.changes?.[0].value;
    const { messages, metadata } = value ?? {};

    if (!messages || !metadata) return 'No messages';

    const phoneNumberId = metadata.phone_number_id;
    const message = messages[0];
    const sender = message.from;
    const messageID = message.id;

    return this.processMessage(sender, message, phoneNumberId, messageID, host);
  }

  @Post('twilio')
  @HttpCode(200)
  @Header('Content-Type', 'text/xml')
  async handleIncomingTwilioMessage(@Body() body: any, @Req() req: Request) {
    const host = req.headers['x-forwarded-host'] as string || req.get('host');
    this.logger.log(`[Twilio Webhook] Received request from host: ${host}`);
    // Log to DB for debugging
    try {
      await this.prismaService.webhookLog.create({
        data: {
          provider: 'TWILIO',
          payload: body
        }
      });
    } catch (e) {
      this.logger.error('Failed to log webhook', e);
    }

    this.logger.log(`[Twilio Webhook] Payload: ${JSON.stringify(body)}`);

    const sender = body.From?.replace('whatsapp:', '') || 'Unknown';
    const recipient = body.To?.replace('whatsapp:', '') || 'Unknown';
    const messageText = body.Body;
    const messageSid = body.MessageSid;
    const mediaUrl = body.MediaUrl0;
    const mediaType = body.MediaContentType0;

    this.logger.log(`[Twilio Webhook] From: ${sender}, To: ${recipient}, Text: ${messageText}`);

    // Mark as read immediately for blue ticks
    if (messageSid && this.whatsAppService.markRead) {
      this.whatsAppService.markRead(messageSid).catch(err =>
        this.logger.warn(`Failed to mark SID ${messageSid} as read: ${err.message}`)
      );
    }

    // Ignore status callbacks (sent, delivered, read) to avoid double processing
    if (body.SmsStatus && !body.Body && !mediaUrl) {
      if (body.SmsStatus === 'failed' || body.ErrorCode) {
        this.logger.error(`[Twilio Status] FAILURE: ${body.SmsStatus} for ${body.MessageSid}. Error: ${body.ErrorCode} - ${body.ErrorMessage}`);
      } else {
        this.logger.log(`[Twilio Status] Update: ${body.SmsStatus} for ${body.MessageSid}`);
      }
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    // For Twilio Sandbox, we use the recipient number (Twilio Number) to identify the merchant
    // Identify by recipient (the bot's number)
    const twilioNumber = recipient; // Renamed for clarity based on new logic
    const merchant: any = await (this.prismaService.merchant as any).findFirst({
      where: {
        OR: [
          { twilioPhoneNumber: twilioNumber },
          { twilioPhoneNumber: `+${twilioNumber.replace('+', '')}` }
        ]
      },
      include: {
        catalog: true,
        deliveryZones: true
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!merchant) {
      this.logger.warn(`No merchant found for number: ${twilioNumber}`);
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    // 3. Check if Bot is Paused for this Customer
    const customer = await this.prismaService.customer.findUnique({
      where: { phoneNumber: sender }
    });

    if ((customer as any)?.botPaused) {
      this.logger.log(`[Handoff] Bot is PAUSED for ${sender}. Skipping AI response.`);
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    this.logger.log(`Processing message for merchant ID: ${merchant.id}`);
    const contextId = merchant.id;

    if (mediaUrl) {
      if (mediaType?.startsWith('image/')) {
        this.notification.emitToMerchant(merchant.id, 'newMessage', { from: sender, type: 'image', url: mediaUrl });
        this.notification.emitToAdmin('newMessage', { merchantId: merchant.id, from: sender, type: 'image' });
        return this.processMediaMessage(sender, 'image', mediaUrl, contextId, messageSid);
      } else if (mediaType?.startsWith('audio/')) {
        this.notification.emitToMerchant(merchant.id, 'newMessage', { from: sender, type: 'audio', url: mediaUrl });
        return this.processMediaMessage(sender, 'audio', mediaUrl, contextId, messageSid);
      }
    }

    // Process standard text messages
    if (messageText) {
      this.notification.emitToMerchant(merchant.id, 'newMessage', { from: sender, text: messageText });
      this.notification.emitToAdmin('newMessage', { merchantId: merchant.id, from: sender, text: messageText });
      return this.processTextMessage(sender, messageText, contextId, messageSid, host);
    }

    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  private async processMessage(sender: string, message: any, contextId: string, messageID: string, host?: string) {
    if (message.type === 'text') {
      return this.processTextMessage(sender, message.text.body, contextId, messageID, host);
    } else if (message.type === 'audio') {
      // For Meta, we'd need to fetch the URL first, then download
      // For now, let's keep it simple or implement if needed
      this.logger.warn('Meta audio messages not fully implemented in unified processor');
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  private async processTextMessage(sender: string, text: string, contextId: string, messageID: string, host?: string) {
    if (!text) return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    const imageGenerationCommand = '/imagine';
    const lowerText = text.toLowerCase();

    if (lowerText.includes(imageGenerationCommand)) {
      const prompt = text.replace(new RegExp(imageGenerationCommand, 'i'), '').trim();
      const response = await this.stabilityaiService.textToImage(prompt);

      if (Array.isArray(response) && response.length > 0) {
        await this.whatsAppService.sendImageByUrl(sender, response[0], 'Here is your generated image!');
      }
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    const aiResponse = await this.openaiService.generateAIResponse(sender, text, contextId);

    // 0. Handle AI Failure (Quota/Key issues)
    if (aiResponse === '[AI_FAILURE]') {
      this.logger.error(`[AI_FAILURE] Detected for user ${sender}. Triggering human handoff.`);

      // Notify Customer
      const customerMessage = "I'm sorry, I'm having a little technical trouble. 🛠️ I've notified our human team to assist you personally. Someone will reach out shortly! 🤝";
      await this.whatsAppService.sendWhatsAppMessage(sender, customerMessage);

      // Auto-Pause Bot for this customer
      await (this.prismaService.customer as any).update({
        where: { phoneNumber: sender },
        data: { botPaused: true }
      }).catch(err => this.logger.warn(`Failed to pause bot for ${sender}: ${err.message}`));

      // Notify Merchant
      try {
        const merchant: any = await (this.prismaService.merchant as any).findFirst({
          where: {
            OR: [
              { id: contextId },
              { whatsappPhoneNumberId: contextId },
              { twilioPhoneNumber: contextId }
            ]
          }
        });

        if (merchant?.twilioPhoneNumber) {
          const alertMessage = `⚠️ *AI ALERT*: I've encountered an API error while chatting with ${sender}. I've paused the AI and switched to MANUAL mode for this customer. Please check your dashboard!`;
          // We send to the merchant's absolute number (sender is what we usually use for 'to')
          // But here 'sender' is the customer. We want to send to the merchant.
          // Note: Twilio Sandbox only allows verified numbers. For production, this works.
          await this.whatsAppService.sendWhatsAppMessage(merchant.twilioPhoneNumber, alertMessage);
        }
      } catch (alertErr) {
        this.logger.warn(`Failed to alert merchant about AI failure: ${alertErr.message}`);
      }

      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    // 1. Always remove the tag and send the clean message first
    const cleanResponse = aiResponse
      .replace(/\[SEND_MENU_IMAGE\]/g, '')
      .replace(/\[ASK_FULFILLMENT\]/g, '')
      .replace(/\[HUMAN_REQUEST\]/g, '')
      .trim();

    if (aiResponse.includes('[SEND_MENU_IMAGE]')) {
      this.logger.log(`[MENU_DEBUG] Tag detected. Looking for merchant with contextId: ${contextId}`);
      // Find merchant using robust logic (ID, Meta ID, or Twilio Number)
      const merchant: any = await (this.prismaService.merchant as any).findFirst({
        where: {
          OR: [
            { id: contextId },
            { whatsappPhoneNumberId: contextId },
            { twilioPhoneNumber: contextId },
            { twilioPhoneNumber: `+${contextId.replace('+', '')}` }
          ]
        },
        orderBy: { createdAt: 'desc' },
      });

      if (!merchant) {
        this.logger.warn(`[MENU_DEBUG] Merchant NOT FOUND for contextId: ${contextId}`);
      } else {
        this.logger.log(`[MENU_DEBUG] Merchant Found: ${merchant.name} (${merchant.id}). menuImageUrl: ${merchant.menuImageUrl}`);
      }

      if (merchant?.menuImageUrl) {
        let imageUrl = merchant.menuImageUrl;

        // Fix potential double-prefixed URLs from previous implementations
        if (imageUrl.includes('/api/whatsapp/twilio')) {
          imageUrl = imageUrl.split('/api/whatsapp/twilio').pop();
        }

        if (!imageUrl.startsWith('http')) {
          let serverUrl = process.env.SERVER_URL || host || '';
          // Strip paths if host/SERVER_URL accidentally includes them
          serverUrl = serverUrl.split('/api/whatsapp')[0];
          serverUrl = serverUrl.replace(/\/$/, '');

          let cleanPath = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;

          // Debugging: Warn if SERVER_URL is missing or local
          if (!serverUrl || serverUrl.includes('localhost')) {
            this.logger.warn(`[MENU_DEBUG] SERVER_URL/host is missing or local (${serverUrl}). Twilio will fail to download this image.`);
          }

          // Fix potential double /api prefix (common if SERVER_URL includes it)
          if (serverUrl.endsWith('/api') && cleanPath.startsWith('/api/')) {
            this.logger.log(`[MENU_DEBUG] Fixing double /api prefix in URL`);
            cleanPath = cleanPath.substring(4);
          }

          // Force https if no protocol specified or if on Railway
          if (serverUrl && !serverUrl.startsWith('http')) {
            serverUrl = `https://${serverUrl}`;
          }

          imageUrl = `${serverUrl}${cleanPath}`;
        }

        this.logger.log(`[MENU_DEBUG] Final Image URL: ${imageUrl}`);

        // Combine text and image into one message for better reliability
        const finalCaption = cleanResponse ? `${cleanResponse}\n\nHere is our menu! 😊` : 'Here is our menu! 😊';

        await this.whatsAppService.sendImageByUrl(sender, imageUrl, finalCaption);
        return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
      } else if (merchant) {
        this.logger.warn(`[MENU_DEBUG] Merchant found but menuImageUrl is EMPTY/NULL`);
      }
    }

    // Check for Fulfillment trigger
    if (aiResponse.includes('[ASK_FULFILLMENT]')) {
      if (cleanResponse) {
        await this.whatsAppService.sendWhatsAppMessage(sender, cleanResponse);
        await this.context.saveToContext(cleanResponse, 'assistant', sender);
      }
      const buttonBody = "Select fulfillment method for your order:\n\n1. Pickup 🛍️\n2. Delivery 🚚";
      await this.twilioService.sendFulfillmentButtons(sender);
      await this.context.saveToContext(buttonBody, 'assistant', sender);
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    // Check for Human Request trigger
    if (aiResponse.includes('[HUMAN_REQUEST]')) {
      this.logger.log(`[HANDOFF] User ${sender} requested to talk to a human.`);
      if (cleanResponse) {
        await this.whatsAppService.sendWhatsAppMessage(sender, cleanResponse);
      }
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    await this.whatsAppService.sendWhatsAppMessage(sender, cleanResponse || aiResponse);
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  private async processMediaMessage(sender: string, type: 'image' | 'audio', url: string, contextId: string, messageID: string, host?: string) {
    if (type === 'audio') {
      const download = await this.whatsAppService.downloadMedia(url, messageID);
      if (download.status === 'success') {
        const transcribed = await this.openaiService.transcribeAudio(download.data);
        if (transcribed) {
          this.logger.log(`[Whisper] Transcribed audio: "${transcribed}"`);
          // Inform the user we heard them (optional, but good UX)
          // await this.whatsAppService.sendWhatsAppMessage(sender, `👂 I heard: "${transcribed}"`);

          // Process as a text message
          return this.processTextMessage(sender, transcribed, contextId, messageID, host);
        }
      }
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    // Image analysis logic could go here
    this.logger.log(`[Media] Received ${type} message from ${sender}. URL: ${url}`);

    if (type === 'image') {
      // Check if user has an active order that needs payment
      const activeOrder = await this.prismaService.order.findFirst({
        where: {
          customerPhone: sender,
          paymentStatus: 'NONE',
          status: 'PENDING'
        },
        orderBy: { createdAt: 'desc' },
        include: { merchant: true }
      });

      if (activeOrder && activeOrder.merchant.tier === 'ENTERPRISE') {
        this.logger.log(`[Payment] Image from ${sender} linked to order ${activeOrder.id} as payment proof.`);
        await this.prismaService.order.update({
          where: { id: activeOrder.id },
          data: {
            paymentScreenshotUrl: url,
            paymentStatus: 'PENDING'
          }
        });

        await this.whatsAppService.sendWhatsAppMessage(sender, "Thank you! I've received your payment screenshot. The merchant will verify it shortly. 😊✅");
      }
    }

    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }
}
