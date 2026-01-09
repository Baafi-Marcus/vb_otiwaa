import { Body, Controller, Get, Header, HttpCode, Logger, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { WhatsappService } from './whatsapp.service';
import { AudioService } from 'src/audio/audio.service';
import { StabilityaiService } from 'src/stabilityai/stabilityai.service';
import { OpenaiService } from 'src/openai/openai.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { UserContextService } from 'src/user-context/user-context.service';

@Controller('whatsapp')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsAppService: WhatsappService,
    private readonly stabilityaiService: StabilityaiService,
    private readonly audioService: AudioService,
    private readonly openaiService: OpenaiService,
    private readonly prismaService: PrismaService,
    private readonly twilioService: TwilioService,
    private readonly context: UserContextService,
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
  async handleIncomingMetaMessage(@Body() request: any) {
    this.logger.log(`[Meta Webhook] Payload: ${JSON.stringify(request)}`);

    const value = request?.entry?.[0]?.changes?.[0].value;
    const { messages, metadata } = value ?? {};

    if (!messages || !metadata) return 'No messages';

    const phoneNumberId = metadata.phone_number_id;
    const message = messages[0];
    const sender = message.from;
    const messageID = message.id;

    return this.processMessage(sender, message, phoneNumberId, messageID);
  }

  @Post('twilio')
  @HttpCode(200)
  @Header('Content-Type', 'text/xml')
  async handleIncomingTwilioMessage(@Body() body: any) {
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
      this.logger.log(`[Twilio Webhook] Status Callback: ${body.SmsStatus} for ${body.MessageSid}`);
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    // For Twilio Sandbox, we use the recipient number (Twilio Number) to identify the merchant
    // Identify by recipient (the bot's number)
    let merchant = await (this.prismaService.merchant as any).findFirst({
      where: {
        OR: [
          { id: recipient },
          { whatsappPhoneNumberId: recipient },
          { twilioPhoneNumber: recipient },
          { twilioPhoneNumber: `+${recipient.replace('+', '')}` }
        ]
      },
      include: { catalog: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!merchant) {
      this.logger.warn(`No merchant found for Twilio recipient ${recipient}. Using first available merchant for testing.`);
      merchant = await this.prismaService.merchant.findFirst();
      if (merchant) {
        this.logger.log(`Fallback: Using merchant ${merchant.name} (ID: ${merchant.id})`);
      } else {
        this.logger.error(`CRITICAL: No merchants found in database!`);
      }
    }

    if (!merchant) {
      this.logger.error('No merchant available in system to handle request.');
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    this.logger.log(`Processing message for merchant ID: ${merchant.id}`);
    const contextId = merchant.id;

    if (mediaUrl) {
      if (mediaType?.startsWith('image/')) {
        return this.processMediaMessage(sender, 'image', mediaUrl, contextId, messageSid);
      } else if (mediaType?.startsWith('audio/')) {
        return this.processMediaMessage(sender, 'audio', mediaUrl, contextId, messageSid);
      }
    }

    // Process standard text messages
    if (messageText) {
      return this.processTextMessage(sender, messageText, contextId, messageSid);
    }

    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  private async processMessage(sender: string, message: any, contextId: string, messageID: string) {
    if (message.type === 'text') {
      return this.processTextMessage(sender, message.text.body, contextId, messageID);
    } else if (message.type === 'audio') {
      // For Meta, we'd need to fetch the URL first, then download
      // For now, let's keep it simple or implement if needed
      this.logger.warn('Meta audio messages not fully implemented in unified processor');
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  private async processTextMessage(sender: string, text: string, contextId: string, messageID: string) {
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

    // Check for Menu Image trigger
    if (aiResponse.includes('[SEND_MENU_IMAGE]')) {
      const merchant: any = await (this.prismaService.merchant as any).findUnique({ where: { id: contextId } });
      if (merchant?.menuImageUrl) {
        // Fix potential double-prefixed URLs
        let imageUrl = merchant.menuImageUrl;
        if (imageUrl.includes('/api/whatsapp/twilio')) {
          imageUrl = imageUrl.split('/api/whatsapp/twilio').pop();
        }
        if (!imageUrl.startsWith('http')) {
          const serverUrl = process.env.SERVER_URL || '';
          imageUrl = `${serverUrl.replace(/\/$/, '')}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
        }

        const cleanResponse = aiResponse.replace('[SEND_MENU_IMAGE]', '').trim();
        if (cleanResponse) {
          await this.whatsAppService.sendWhatsAppMessage(sender, cleanResponse);
        }
        await this.whatsAppService.sendImageByUrl(sender, imageUrl, 'Here is our menu!');
        return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
      }
    }

    // Check for Fulfillment trigger
    if (aiResponse.includes('[ASK_FULFILLMENT]')) {
      const cleanResponse = aiResponse.replace('[ASK_FULFILLMENT]', '').trim();
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
      const cleanResponse = aiResponse.replace('[HUMAN_REQUEST]', '').trim();
      await this.whatsAppService.sendWhatsAppMessage(sender, cleanResponse);
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    await this.whatsAppService.sendWhatsAppMessage(sender, aiResponse);
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }

  private async processMediaMessage(sender: string, type: 'image' | 'audio', url: string, contextId: string, messageID: string) {
    if (type === 'audio') {
      const download = await this.whatsAppService.downloadMedia(url, messageID);
      if (download.status === 'success') {
        const transcribed = await this.audioService.convertAudioToText(download.data);
        if (transcribed.status === 'success') {
          const aiResponse = await this.openaiService.generateAIResponse(sender, transcribed.data, contextId);
          await this.whatsAppService.sendWhatsAppMessage(sender, aiResponse);

          // Optional: Send voice response back
          const tts = await this.audioService.convertTextToSpeech(aiResponse);
          if (tts.status === 'success') {
            await this.whatsAppService.sendAudioByUrl(sender, tts.data);
          }
        }
      }
      return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
    }

    // Image analysis logic could go here
    return '<?xml version="1.0" encoding="UTF-8"?><Response></Response>';
  }
}
