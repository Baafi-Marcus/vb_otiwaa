import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OpenAI } from 'openai';
import { UserContextService } from 'src/user-context/user-context.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from 'src/order/order.service';
import * as fs from 'fs';

@Injectable()
export class OpenaiService {
  private readonly logger = new Logger(OpenaiService.name);
  private static currentKeyIndex = 0;

  constructor(
    private readonly context: UserContextService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
  ) { }

  private async getActiveKeys() {
    try {
      const dbKeys = await (this.prisma as any).apiKey.findMany();
      if (dbKeys.length > 0) {
        return dbKeys.map(k => ({
          key: k.key.trim().replace(/^"|"$/g, ''),
          provider: k.provider.toLowerCase(),
          id: k.id
        }));
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch DB keys: ${e.message}. Falling back to ENV.`);
    }

    const singleKey = process.env.OPENAI_API_KEY;
    if (singleKey && singleKey.trim() !== '') {
      return [{ key: singleKey.trim().replace(/^"|"$/g, ''), provider: 'openai' }];
    }
    return [];
  }

  private async getOpenAIClient() {
    const keys = await this.getActiveKeys();
    if (keys.length === 0) {
      this.logger.error('No AI API Keys found!');
      return null;
    }
    if (OpenaiService.currentKeyIndex >= keys.length) OpenaiService.currentKeyIndex = 0;
    const keyConfig = keys[OpenaiService.currentKeyIndex];
    OpenaiService.currentKeyIndex = (OpenaiService.currentKeyIndex + 1) % keys.length;

    let baseURL = process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1';
    let model = process.env.OPENAI_MODEL || 'gpt-4o';

    if (keyConfig.provider === 'github') {
      baseURL = 'https://models.inference.ai.azure.com';
    }

    return {
      client: new OpenAI({ apiKey: keyConfig.key, baseURL: baseURL }),
      model: model,
      provider: keyConfig.provider
    };
  }

  async generateAIResponse(userID: string, userInput: string, phoneNumberId: string) {
    this.logger.log(`[OpenAI] User ${userID} -> MerchantRef ${phoneNumberId}`);
    try {
      let merchant = await (this.prisma.merchant as any).findFirst({
        where: {
          OR: [
            { id: phoneNumberId },
            { whatsappPhoneNumberId: phoneNumberId },
            { twilioPhoneNumber: phoneNumberId },
            { twilioPhoneNumber: `+${phoneNumberId.replace('+', '')}` }
          ]
        },
        include: { catalog: true, deliveryZones: true }
      });

      if (!merchant) {
        merchant = await (this.prisma.merchant as any).findFirst({ include: { catalog: true, deliveryZones: true } });
        if (!merchant) return 'Business not found.';
      }

      // Dynamic Context Setup
      const customerOrders = await this.prisma.order.findMany({
        where: { customerPhone: userID, merchantId: merchant.id },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      const orderMemory = customerOrders.length > 0
        ? `\n\nCUSTOMER ORDER HISTORY: ${customerOrders.map(o => `- Order ${o.shortId}: ${o.items.map(i => i.product.name).join(', ')}`).join('\n')}`
        : "";

      const catalogInfo = merchant.catalog.slice(0, 20).map(p => `- ${p.name}: ${p.price} GHS (${p.description})`).join('\n');
      const deliveryZones = (merchant.deliveryZones || []).map(z => `- ${z.name}: ${z.price} GHS`).join('\n');

      let mainTerm = "Menu", actionTerm = "Order", vibe = "polite agent";
      if (merchant.category === 'Boutique') { mainTerm = "Collections"; actionTerm = "Buy"; vibe = "stylist"; }
      else if (merchant.category === 'Professional Service') { mainTerm = "Services"; actionTerm = "Book"; vibe = "consultant"; }

      const systemPrompt = `
You are the WhatsApp assistant for ${merchant.name}, a ${merchant.category}. Act as a ${vibe}.
Context: ${merchant.description} | Location: ${merchant.location}
1️⃣ View ${mainTerm} | 2️⃣ ${actionTerm} Now | 3️⃣ Track ${actionTerm} | 4️⃣ Support
${orderMemory}
Visual Assets: ${merchant.menuImageUrl ? 'YES' : 'NO'} (Use [SEND_MENU_IMAGE] if they ask to see ${mainTerm}).
Catalog:\n${catalogInfo}\nDelivery:\n${deliveryZones}
Always use [ASK_FULFILLMENT] when they are ready to ${actionTerm.toLowerCase()}.
Stay strictly in the context of ${merchant.name}. Do NOT mention other businesses.
`;

      const history = await this.context.saveAndFetchContext(userInput, 'user', userID, merchant.id);
      const keys = await this.getActiveKeys();

      for (let attempt = 0; attempt < keys.length; attempt++) {
        try {
          const config = await this.getOpenAIClient();
          if (!config) continue;

          const tools: any[] = [
            {
              type: 'function',
              function: {
                name: 'place_order',
                description: 'Record an order',
                parameters: {
                  type: 'object',
                  properties: {
                    fulfillmentMode: { type: 'string', enum: ['PICKUP', 'DELIVERY'] },
                    customerName: { type: 'string' },
                    deliveryAddress: { type: 'string' },
                    contactNumber: { type: 'string' },
                    items: { type: 'array', items: { type: 'object', properties: { name: { type: 'string' }, quantity: { type: 'number' } } } }
                  },
                  required: ['items', 'fulfillmentMode', 'customerName']
                }
              }
            },
            {
              type: 'function',
              function: { name: 'check_order_status', description: 'Check status', parameters: { type: 'object', properties: {} } }
            }
          ];

          const completion = await config.client.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }, ...history],
            model: config.model,
            tools: tools,
            max_tokens: 300
          });

          const msg = completion.choices[0].message;
          if (msg.tool_calls) {
            for (const tool of msg.tool_calls) {
              if (tool.function.name === 'place_order') {
                const args = JSON.parse(tool.function.arguments);
                const items = args.items.map(i => {
                  const p = merchant.catalog.find(cat => cat.name.toLowerCase().includes(i.name.toLowerCase()));
                  return p ? { productId: p.id, quantity: i.quantity, price: Number(p.price) } : null;
                }).filter(Boolean);

                if (items.length > 0) {
                  const order = await (this.orderService as any).createOrder({
                    merchantId: merchant.id, customerName: args.customerName, customerPhone: userID,
                    items, fulfillmentMode: args.fulfillmentMode, location: args.deliveryAddress,
                    deliveryFee: args.fulfillmentMode === 'DELIVERY' ? Number(merchant.baseDeliveryFee) : 0
                  });
                  await this.context.clearContext(userID, merchant.id);
                  return `Recorded ${actionTerm} ${order.shortId}! We are processing it now. 😊`;
                }
              } else if (tool.function.name === 'check_order_status') {
                const order = await (this.orderService as any).getLatestOrderStatus(userID, merchant.id);
                return order ? `Order ${order.shortId} status: ${order.status}` : "No active orders found.";
              }
            }
          }

          const aiText = msg.content || 'How can I help?';
          await this.context.saveToContext(aiText, 'assistant', userID, merchant.id);
          return aiText;

        } catch (e) {
          this.logger.error(`AI Attempt failed: ${e.message}`);
          continue;
        }
      }
      return '[AI_FAILURE]';
    } catch (e) {
      return '[AI_FAILURE]';
    }
  }

  async expandMerchantVision(name: string, category: string, vision: string): Promise<string> {
    const config = await this.getOpenAIClient();
    if (!config) return `AI for ${name}`;
    const resp = await config.client.chat.completions.create({
      messages: [{ role: 'user', content: `Expand this vision for ${name} (${category}): ${vision}. Return only the prompt.` }],
      model: config.model,
      max_tokens: 200
    });
    return resp.choices[0].message.content.trim();
  }

  async generateBusinessDescription(name: string, category: string, vision: string): Promise<string> {
    const config = await this.getOpenAIClient();
    if (!config) return `${name} a ${category}.`;
    const resp = await config.client.chat.completions.create({
      messages: [{ role: 'user', content: `Describe ${name} (${category}) based on: ${vision}. Max 2 sentences.` }],
      model: config.model,
      max_tokens: 100
    });
    return resp.choices[0].message.content.trim();
  }

  async generateSandboxResponse(prompt: string, msg: string): Promise<string> {
    const config = await this.getOpenAIClient();
    if (!config) return 'AI Error';
    const resp = await config.client.chat.completions.create({
      messages: [{ role: 'system', content: prompt }, { role: 'user', content: msg }],
      model: config.model,
      max_tokens: 200
    });
    return resp.choices[0].message.content;
  }

  async analyzeMenuImage(url: string): Promise<any[]> {
    const config = await this.getOpenAIClient();
    if (!config) return [];
    try {
      const resp = await config.client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: [{ type: "text", text: "JSON array of items (name, price, description) from this image" }, { type: "image_url", image_url: { url } }] }],
        max_tokens: 1000
      });
      return JSON.parse(resp.choices[0].message.content.replace(/```json|```/g, ''));
    } catch { return []; }
  }

  async transcribeAudio(path: string): Promise<string> {
    const config = await this.getOpenAIClient();
    if (!config) return '';
    const resp = await config.client.audio.transcriptions.create({ file: fs.createReadStream(path), model: 'whisper-1' });
    return resp.text;
  }
}
