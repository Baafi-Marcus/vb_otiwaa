import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { OpenAI } from 'openai';
import { UserContextService } from 'src/user-context/user-context.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderService } from 'src/order/order.service';
import * as fs from 'fs';

@Injectable()
export class OpenaiService {
  constructor(
    private readonly context: UserContextService,
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
  ) { }

  private get apiKeys() {
    // Prioritize a single private key if provided
    const singleKey = process.env.OPENAI_API_KEY;
    if (singleKey && singleKey.trim() !== '') {
      return [singleKey.trim().replace(/^"|"$/g, '')];
    }

    // Strip quotes if present in the environment variable
    const rawKeys = process.env.OPENAI_API_KEYS || '';
    const cleanedKeys = rawKeys.replace(/^"|"$/g, '');
    return cleanedKeys.split(',').map(k => k.trim().replace(/^"|"$/g, ''));
  }
  private static currentKeyIndex = 0;

  private getOpenAIClient() {
    const keys = this.apiKeys;
    const key = keys[OpenaiService.currentKeyIndex];

    if (!key || key.trim() === '') {
      this.logger.error('OpenAI API Key is missing or empty! System will not be able to generate responses.');
      return null;
    }

    // Rotate index for next call
    OpenaiService.currentKeyIndex = (OpenaiService.currentKeyIndex + 1) % keys.length;

    return new OpenAI({
      apiKey: key,
      baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
    });
  }
  private readonly logger = new Logger(OpenaiService.name);

  async generateAIResponse(
    userID: string,
    userInput: string,
    phoneNumberId: string,
  ) {
    this.logger.log(`[OpenAI] Generating response for user ${userID} (MerchantRef: ${phoneNumberId})`);
    try {
      let merchant: any;
      try {
        // Search by ID, Meta ID, or Twilio Number
        merchant = await (this.prisma.merchant as any).findFirst({
          where: {
            OR: [
              { id: phoneNumberId },
              { whatsappPhoneNumberId: phoneNumberId },
              { twilioPhoneNumber: phoneNumberId },
              { twilioPhoneNumber: `+${phoneNumberId.replace('+', '')}` }
            ]
          },
          include: { catalog: true, deliveryZones: true },
          orderBy: { createdAt: 'desc' },
        });
      } catch (dbError) {
        this.logger.warn(`Database Error: ${dbError.message}. Using hardcoded fallback for testing.`);
      }

      if (!merchant) {
        // Robust fallback for testing even without correct IDs
        this.logger.warn(`No merchant found for ID/Number: ${phoneNumberId}. Falling back to first available merchant.`);
        merchant = await (this.prisma.merchant as any).findFirst({ include: { catalog: true, deliveryZones: true } }) as any;

        if (!merchant) {
          this.logger.error(`CRITICAL: No merchants found in database at all.`);
          return 'Sorry, this business is not registered with our platform.';
        }
      }

      // 1.5 Fetch Customer Order History for "Memory"
      const customerOrders = await this.prisma.order.findMany({
        where: { customerPhone: userID, merchantId: merchant.id },
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      const orderMemory = customerOrders.length > 0
        ? `\n\nCUSTOMER ORDER HISTORY (Last 3 orders):
${customerOrders.map(o => `- Order ${o.shortId} on ${o.createdAt.toLocaleDateString()}: ${o.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')} (Total: ${o.totalAmount} GHS)`).join('\n')}`
        : "";

      // 2. Build Industrial Context (Catalog - limited to top 20 items to save tokens)
      const topProducts = merchant.catalog.slice(0, 20);
      const catalogInfo = topProducts
        .map((p) => `- ${p.name}: ${p.price} GHS (${p.description})`)
        .join('\n');

      const deliveryZoneInfo = (merchant.deliveryZones || [])
        .map((z: any) => `- ${z.name}: ${z.price} GHS`)
        .join('\n');

      this.logger.log(`[OpenAI] Sending ${topProducts.length} catalog items for context.`);

      const isClosed = merchant.isClosed;
      const closedInstruction = isClosed
        ? "\n\nCRITICAL: The business is currently CLOSED. You MUST inform the user politely that we are closed for now, but they can still place an order for tomorrow or our next opening day. DO NOT promise immediate fulfillment."
        : "";

      const masterSystemPrompt = `
✅ MASTER SYSTEM PROMPT (WHATSAPP ORDER BOT)

You are a WhatsApp business order assistant for ${merchant.name}.

Your role is to professionally assist customers who message the business on WhatsApp by helping them view products, place orders, and receive order confirmations. You must behave like a polite, efficient customer service agent, not a general-purpose AI or personal assistant.

LANGUAGE SUPPORT
- You are capable of understanding and responding in English and local Ghanaian languages (e.g., Twi, Ga, Fante).
- If a customer speaks in Twi, you should respond in Twi while maintaining a professional tone.
- If they speak English, respond in English.

BUSINESS CONTEXT
Business name: ${merchant.name}
Business type: ${merchant.category}
Location: ${merchant.location || 'Not Specified'}
Operating hours: ${merchant.operatingHours || 'Not Specified'}
Payment methods: ${merchant.paymentMethods || 'Not Specified'}
Delivery options: Base Delivery Fee: ${merchant.baseDeliveryFee || 0} GHS
Menu Image Available: ${merchant.menuImageUrl ? 'YES' : 'NO'}
${orderMemory}
${closedInstruction}

WHAT YOU OFFER
- Show the product or food menu
- Guide customers step-by-step to place an order
- For DELIVERY: You MUST collect: Full Name, Precise Location (Address), and an Active Contact Number for the rider.
- Confirm orders clearly before checkout
- Provide order summaries and total cost (including specific delivery fees)
- Give business support related to orders, products, and delivery

CONVERSATION RULES
- Only respond to customer-initiated messages
- Keep messages short, clear, and friendly
- Use numbered options when presenting menus
- Ask one question at a time
- Confirm understanding before finalizing orders
- Stay strictly within business and order-related topics

NOT ALLOWED
- Do NOT act as a general AI assistant
- Do NOT answer unrelated questions (politics, personal advice, homework, etc.)
- Do NOT engage in long free-form conversations
- Do NOT generate promotional messages unless explicitly instructed

DEFAULT GREETING
When a customer says "Hi", "Hello", or starts a conversation, ALWAYS reply with:
"Welcome to ${merchant.name} 👋
How can we help you today?

1️⃣ View Menu
2️⃣ Place an Order
3️⃣ Check Order Status (Just ask "What's the status of my order?")"

MENU DELIVERY:
- If 'Menu Image Available' is YES and the user asks to "View Menu" or see what you have:
  1. You MUST include the tag [SEND_MENU_IMAGE] at the end of your response.
  2. You MUST NOT list the items or prices in your text. Just say: "Sure! Let me send over our visual menu for you. Let me know what catches your eye! 😊"
- If 'Menu Image Available' is NO:
  1. List the top items from the catalog clearly.

HUMAN HANDOFF
- If the user explicitly asks to talk to a human, manager, or person, you MUST include the tag [HUMAN_REQUEST] at the end of your response.

ORDER FLOW
1. Present menu or product list
2. When the user is ready to order, you MUST include the tag [ASK_FULFILLMENT] at the end of your message to show them the "Pickup or Delivery" options.
3. For DELIVERY: 
   - Ask for their Full Name, Location (Address), and Active Phone Number.
   - Inform them of the specific delivery fee for their location: 
${deliveryZoneInfo || '(Base Fee: ' + (merchant.baseDeliveryFee || 0) + ' GHS)'}
4. Once you have ALL info (Items, Fulfillment, Name, Location, Phone), call the 'place_order' tool.
5. TRACKING: If the user asks about their order status, you can check it automatically by their phone number. Do NOT ask for an ID unless you can't find anything. Use the 'check_order_status' tool.
6. AFTER placing a DELIVERY order, tell the client their Order ID (Display ID) and that it's being prepared.

${closedInstruction}

STOCK:
${catalogInfo || 'None.'}

Keep it very short and use emojis.`;

      const systemPrompt = masterSystemPrompt;

      // 3. Handle Conversational Context
      const userContext = await this.context.saveAndFetchContext(
        userInput,
        'user',
        userID,
      );

      let lastError;
      const keys = this.apiKeys;

      // Try ALL available keys before giving up
      for (let attempt = 0; attempt < keys.length; attempt++) {
        try {
          const model = process.env.OPENAI_MODEL || 'gpt-4o';
          const client = this.getOpenAIClient();
          if (!client) {
            this.logger.error(`Attempt ${attempt + 1}/${keys.length}: Skipping due to null client.`);
            continue;
          }
          this.logger.log(`Attempt ${attempt + 1}/${keys.length}: Testing Key Index ${OpenaiService.currentKeyIndex} (Model: ${model})`);

          const tools: any[] = [
            {
              type: 'function',
              function: {
                name: 'place_order',
                description: 'Record an official order in the system after getting items, fulfillment mode, and location (if delivery).',
                parameters: {
                  type: 'object',
                  properties: {
                    fulfillmentMode: { type: 'string', enum: ['PICKUP', 'DELIVERY'] },
                    customerName: { type: 'string', description: 'Real name given by customer' },
                    deliveryAddress: { type: 'string', description: 'Precise address/location for delivery' },
                    contactNumber: { type: 'string', description: 'Active phone number for the rider to call' },
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          quantity: { type: 'number' }
                        },
                        required: ['name', 'quantity']
                      }
                    }
                  },
                  required: ['items', 'fulfillmentMode', 'customerName']
                }
              }
            },
            {
              type: 'function',
              function: {
                name: 'check_order_status',
                description: 'Check the status of the customer’s latest order automatically.',
                parameters: {
                  type: 'object',
                  properties: {}
                }
              }
            }
          ];

          const response = await client.chat.completions.create({
            messages: [{ role: 'system', content: systemPrompt }, ...userContext],
            model: model,
            max_tokens: 300,
            tools: tools,
            tool_choice: 'auto'
          });

          const message = response.choices[0].message;

          if (message.tool_calls && message.tool_calls.length > 0) {
            for (const toolCall of message.tool_calls) {
              if (toolCall.function.name === 'place_order') {
                const args = JSON.parse(toolCall.function.arguments);
                this.logger.log(`[Tool] Placing order for ${userID}: ${JSON.stringify(args)}`);

                const orderItems = args.items.map((item: any) => {
                  const product = merchant.catalog.find((p: any) =>
                    p.name.toLowerCase().includes(item.name.toLowerCase()) ||
                    item.name.toLowerCase().includes(p.name.toLowerCase())
                  );
                  return product ? { productId: product.id, quantity: item.quantity, price: Number(product.price) } : null;
                }).filter((i: any) => i !== null);

                if (orderItems.length > 0) {
                  let deliveryFee = Number(merchant.baseDeliveryFee);
                  if (args.fulfillmentMode === 'DELIVERY' && args.deliveryAddress) {
                    const zone = merchant.deliveryZones.find((z: any) =>
                      args.deliveryAddress.toLowerCase().includes(z.name.toLowerCase()) ||
                      z.name.toLowerCase().includes(args.deliveryAddress.toLowerCase())
                    );
                    if (zone) deliveryFee = Number(zone.price);
                  } else if (args.fulfillmentMode === 'PICKUP') {
                    deliveryFee = 0;
                  }

                  const order = await (this.orderService as any).createOrder({
                    merchantId: merchant.id,
                    customerName: args.customerName,
                    customerPhone: userID,
                    items: orderItems,
                    fulfillmentMode: args.fulfillmentMode,
                    location: `${args.deliveryAddress || 'N/A'} (Contact: ${args.contactNumber || 'N/A'})`,
                    deliveryFee: deliveryFee
                  });

                  const displayId = order.shortId || order.id.substring(0, 4);
                  await this.context.clearContext(userID);

                  if (args.fulfillmentMode === 'DELIVERY') {
                    return `You're all set, ${args.customerName}! ❤️ Your delicious order (${displayId}) is being prepared with love and will be on its way to ${args.deliveryAddress} shortly! 🚚🔥 We'll notify you as soon as it's out for delivery.`;
                  }
                  return `Perfect choice, ${args.customerName}! 📝✅ I've placed your pickup order (${displayId}). Our team is already working on it with care. You can come and collect your treats at our location once it is ready. See you soon! 😊`;
                } else {
                  return "I tried to place your order but couldn't find those specific items in our catalog. Could you please specify exactly what you'd like? 🧐";
                }
              } else if (toolCall.function.name === 'check_order_status') {
                const latestOrder = await (this.orderService as any).getLatestOrderStatus(userID);
                if (latestOrder) {
                  const displayId = latestOrder.shortId || latestOrder.id.substring(0, 4);
                  return `I found your latest order (${displayId})! 🔍 Its current status is: *${latestOrder.status}*. It was placed on ${new Date(latestOrder.createdAt).toLocaleDateString()}. Let me know if you need anything else! 😊`;
                } else {
                  return "I couldn't find any recent orders for your number. Would you like to place one now? 😊";
                }
              }
            }
          }

          const aiResponse = message.content;
          await this.context.saveToContext(aiResponse, 'assistant', userID);
          return aiResponse || 'How can I help you today?';
        } catch (error: any) {
          lastError = error;
          if (error?.status === 429 || error?.message?.includes('Rate limit')) {
            this.logger.warn(`Key ${OpenaiService.currentKeyIndex} rate limited (429). Trying next...`);
            continue;
          }
          this.logger.error(`API Error with key ${OpenaiService.currentKeyIndex}: ${error.message}`);
          continue;
        }
      }
      throw lastError;
    } catch (error: any) {
      this.logger.error('Error generating AI response after trying all keys', error);
      // Return a special tag that the controller will use to trigger human handoff
      return '[AI_FAILURE]';
    }
  }

  async expandMerchantVision(name: string, category: string, vision: string): Promise<string> {
    try {
      this.logger.log(`Expanding vision for ${name} (${category})`);

      const prompt = `You are a professional AI Personality Architect. 
      Your task is to take a business name, a business category, and a "Vision" described by the owner, and expand it into a high-quality "System Prompt" for a WhatsApp Chatbot.

      BUSINESS NAME: ${name}
      CATEGORY: ${category}
      OWNER'S VISION: ${vision}

      RULES:
      1. AI IDENTITY: "You are the smart WhatsApp assistant for [Business Name], a specialized [Category] business..."
      2. TONE & STYLE: 
         - Restaurants: Energetic, appetizing, focused on fast orders.
         - Boutiques: Trendy, sophisticated, personal stylist vibe.
         - Services: Professional, trust-building, organized.
         - Logistics: Reliable, efficient, clear.
      3. IMAGE CAPABILITY: 
         - If ${category} is 'Restaurant' or 'Boutique', explicitly state: "You can send high-quality product images using the [SEND_MENU_IMAGE] tag."
         - Otherwise, focus on text-based info.
      4. EMOJIS: Use emojis that match the ${category} (e.g., 🍕👗💼🚚).
      5. FULFILLMENT: Remind the AI to use the [ASK_FULFILLMENT] tag when a user is ready to order.

      OUTPUT: Only provide the final system prompt text. No titles, no explanations. Start directly with "You are..."`;

      const keys = this.apiKeys;
      let lastError;

      for (let attempt = 0; attempt < keys.length; attempt++) {
        try {
          const model = process.env.OPENAI_MODEL || 'gpt-4o';
          const client = this.getOpenAIClient();

          const response = await client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: model,
            max_tokens: 300,
          });

          return response.choices[0].message.content.trim();
        } catch (error: any) {
          lastError = error;
          this.logger.warn(`Expansion attempt ${attempt + 1} failed. Trying next key...`);
          continue;
        }
      }
      throw lastError;
    } catch (error) {
      this.logger.error('Failed to expand merchant vision', error);
      return `You are the AI assistant for ${name}. I am here to help you with our ${category} services.`;
    }
  }

  async generateSandboxResponse(systemPrompt: string, userMessage: string): Promise<string> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const client = this.getOpenAIClient();

    try {
      const response = await client.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        model: model,
        max_tokens: 200,
      });

      return response.choices[0].message.content || 'No response from AI.';
    } catch (error: any) {
      this.logger.error(`Sandbox AI Error: ${error.message}`);
      return `[Sandbox Error] ${error.message}`;
    }
  }

  async analyzeMenuImage(imageUrl: string): Promise<any[]> {
    const model = process.env.OPENAI_MODEL || 'gpt-4o';
    const client = this.getOpenAIClient();

    try {
      this.logger.log(`[Vision] Analyzing menu image: ${imageUrl}`);

      let finalImageUrl = imageUrl;

      // Use DB-backed Base64 injection to bypass Cloudflare/Network issues
      if (imageUrl.includes('/api/uploads/')) {
        try {
          const id = imageUrl.split('/api/uploads/').pop().split('/')[0];
          this.logger.log(`[Vision] Attempting to fetch image from DB. ID: ${id}`);

          const storedImage = await (this.prisma as any).storedImage.findUnique({ where: { id } });

          if (storedImage) {
            this.logger.log(`[Vision] Image found. Type: ${storedImage.mimeType}, Size: ${storedImage.data.length} bytes`);

            // Ensure we have a Buffer, then convert to Base64
            const buffer = Buffer.from(storedImage.data);
            const base64Body = buffer.toString('base64');

            // Ensure proper Data URI format
            finalImageUrl = `data:${storedImage.mimeType};base64,${base64Body}`;

            this.logger.log(`[Vision] Base64 generated. Prefix: ${finalImageUrl.substring(0, 50)}...`);
          } else {
            this.logger.warn(`[Vision] Image ID ${id} not found in database.`);
          }
        } catch (dbError) {
          this.logger.warn(`Failed to read DB image: ${dbError.message}`);
        }
      }

      const prompt = `Extract all food/product items from this menu image. 
      Return ONLY a JSON array of objects. 
      Each object must have: "name", "price" (number), and "description". 
      If no price is found, use 0. 
      Format: [{"name": "Item Name", "price": 10.5, "description": "Short description"}]`;

      const response = await client.chat.completions.create({
        model: model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: finalImageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const content = response.choices[0].message.content || '[]';
      // Clean up markdown code blocks if present
      const jsonString = content.replace(/```json|```/g, '').trim();
      return JSON.parse(jsonString);
    } catch (error: any) {
      this.logger.error(`Vision Error: ${error.message}`);
      return [];
    }
  }

  async transcribeAudio(filePath: string): Promise<string> {
    const client = this.getOpenAIClient();
    if (!client) return '';

    try {
      const resp = await client.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
      });
      return resp.text;
    } catch (error: any) {
      this.logger.error(`Whisper Error: ${error.message}`);
      return '';
    }
  }
}
