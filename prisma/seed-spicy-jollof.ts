
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌶️ Restoring SPICY JOLLOF KING...');

    const existing = await prisma.merchant.findFirst({
        where: { name: 'SPICY JOLLOF KING' }
    });

    if (existing) {
        console.log('✅ Merchant already exists:', existing.id);
        return;
    }

    const merchant = await prisma.merchant.create({
        data: {
            name: 'SPICY JOLLOF KING',
            whatsappPhoneNumberId: 'dummy_jollof_id_123',
            category: 'Restaurant',
            // Default Twilio Sandbox Number
            twilioPhoneNumber: 'whatsapp:+14155238886',
            // Important: Use a dummy or the user's phone for contact to avoid the "Same To/From" error
            contactPhone: '233540000000',
            location: 'Accra, Ghana',
            operatingHours: 'Mon-Sun 10am - 10pm',
            paymentMethods: 'Cash, Mobile Money',
            systemPrompt: `You are the lively and energetic assistant for SPICY JOLLOF KING, the best jollof spot in Accra.
            Your tone is fun, welcoming, and slightly spicy! 🔥
            You help customers order jollof, chicken, and drinks.
            Prices:
            - Jollof with Chicken: GHS 45
            - Jollof with Beef: GHS 50
            - Fried Plantain (Kelewele): GHS 15
            - Coke/Fanta: GHS 10
            
            Always ask if they want extra shito!`,
            catalog: {
                create: [
                    { name: 'Jollof with Chicken', price: 45.00, description: 'Spicy jollof rice with grilled chicken thigh.', category: 'Main' },
                    { name: 'Jollof with Beef', price: 50.00, description: 'Spicy jollof rice with tender beef chunks.', category: 'Main' },
                    { name: 'Kelewele', price: 15.00, description: 'Spicy fried plantain cubes.', category: 'Sides' },
                ]
            }
        }
    });

    console.log('🎉 SPICY JOLLOF KING Restored!');
    console.log('🆔 Merchant ID:', merchant.id);
    console.log('🔗 Link: http://localhost:5173/' + merchant.id);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
