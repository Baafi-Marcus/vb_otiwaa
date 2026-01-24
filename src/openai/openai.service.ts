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

      const catalogInfo = merchant.catalog.slice(0, 30).map(p => `- ${p.name}: ${p.price} GHS (${p.description})`).join('\n');
      const deliveryZones = (merchant.deliveryZones || []).map(z => `- ${z.name}: ${z.price} GHS`).join('\n');

      // --- ADVANCED CATEGORY AWARENESS ---
      let mainTerm = "Menu", actionTerm = "Order", vibe = "polite agent", emoji = "💼";
      if (merchant.category === 'Boutique') {
        mainTerm = "Collections"; actionTerm = "Buy"; vibe = "trendy personal stylist"; emoji = "👗";
      } else if (merchant.category === 'Professional Service') {
        mainTerm = "Services"; actionTerm = "Book"; vibe = "professional consultant"; emoji = "🤝";
      } else if (merchant.category === 'Logistics') {
        mainTerm = "Shipping Rates & Services"; actionTerm = "Request Shipment"; vibe = "efficient logistics coordinator"; emoji = "🚚";
      } else if (merchant.category === 'Restaurant') {
        mainTerm = "Menu"; actionTerm = "Order"; vibe = "friendly host"; emoji = "🥘";
      } else {
        mainTerm = "Products"; actionTerm = "Buy"; vibe = "helpful clerk"; emoji = "🏪";
      }

      // --- FULFILLMENT CONSTRAINTS ---
      const deliveryOpts = merchant.deliveryOptions || "BOTH";
      let fulfillmentInstruction = "Include [ASK_FULFILLMENT] for 'Pickup or Delivery'.";
      if (deliveryOpts === "PICKUP") fulfillmentInstruction = "We ONLY offer PICKUP. Do NOT mention delivery.";
      if (deliveryOpts === "DELIVERY") fulfillmentInstruction = "We ONLY offer DELIVERY. Do NOT offer pickup.";

      const systemPrompt = `
You are the dedicated WhatsApp assistant for ${merchant.name} ${emoji}, a ${merchant.category} business. 
Your vibe: ${vibe}.
Business Description: ${merchant.description || 'Premium products and services.'}
Hours: ${merchant.operatingHours || 'Available daily.'}
Location: ${merchant.location}

KNOWLEDGE RULE: Use the description, hours, and catalog provided below to answer ALL questions about what we do, when we are open, and what we offer. If asked "What do you offer?", provide a helpful summary based on our context.

1️⃣ View ${mainTerm} | 2️⃣ ${actionTerm} Now | 3️⃣ Track ${actionTerm}s | 4️⃣ Talk to Support

${orderMemory}

FULFILLMENT RULE: ${fulfillmentInstruction}
Visual Assets: ${merchant.menuImageUrl ? 'YES' : 'NO'} (Use [SEND_MENU_IMAGE] if they ask to see ${mainTerm}).

CATALOG / PRODUCTS:
${catalogInfo}

DELIVERY RATES:
${deliveryZones}

Stay strictly in the context of ${merchant.name}. Do NOT mention or knowledge other businesses. Use Ghanaian English or local Twi if the user speaks it.
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
                description: `Record an official ${actionTerm.toLowerCase()}`,
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
              function: { name: 'check_order_status', description: 'Check status of ALL active orders', parameters: { type: 'object', properties: {} } }
            }
          ];

          const completion = await config.client.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }, ...history],
            model: config.model,
            tools: tools,
            max_tokens: 350
          });

          const msg = completion.choices[0].message;
          if (msg.tool_calls) {
            for (const tool of msg.tool_calls) {
              if (tool.function.name === 'place_order') {
                const args = JSON.parse(tool.function.arguments);

                // Enforce business constraints at tool level
                if (deliveryOpts === "PICKUP" && args.fulfillmentMode === "DELIVERY") {
                  return "I'm sorry, but we currently only offer Pickup service. Would you like to proceed with a pickup order? 😊";
                }
                if (deliveryOpts === "DELIVERY" && args.fulfillmentMode === "PICKUP") {
                  return "I'm sorry, but we currently only operate via Delivery. Please provide your delivery location to proceed. 🚚";
                }

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
                const activeOrders = await (this.orderService as any).getActiveOrders(userID, merchant.id);
                if (activeOrders.length === 0) return "I couldn't find any active orders for you at the moment. Would you like to see our offerings? 😊";

                const summary = activeOrders.map(o => {
                  const items = o.items.map(i => i.product.name).join(', ');
                  return `📍 Order ${o.shortId}: ${items} (Status: *${o.status}*)`;
                }).join('\n');

                return `I found your active ${actionTerm.toLowerCase()}s! 🔍\n\n${summary}\n\nLet me know if you need more details! 😊`;
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
      this.logger.error(`Fatal AI Error: ${e.message}`);
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
        messages: [{ role: "user", content: [{ type: "text", text: "Extract items as JSON: {name, price, description}" }, { type: "image_url", image_url: { url } }] }],
        max_tokens: 1000
      });
      const content = resp.choices[0].message.content;
      return JSON.parse(content.replace(/```json|```/g, '').trim());
    } catch { return []; }
  }

  async transcribeAudio(path: string): Promise<string> {
    const config = await this.getOpenAIClient();
    if (!config) return '';
    const resp = await config.client.audio.transcriptions.create({ file: fs.createReadStream(path), model: 'whisper-1' });
    return resp.text;
  }
}
