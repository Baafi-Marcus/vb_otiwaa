import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Create a test Merchant
    // Replace 'YOUR_WHATSAPP_PHONE_NUMBER_ID' with your actual testing ID from Meta
    // Check if the test merchant exists
    const existing = await prisma.merchant.findFirst({
        where: { whatsappPhoneNumberId: '991984453987854' }
    });

    if (!existing) {
        await prisma.merchant.create({
            data: {
                name: 'Mixhael Baafi Test Shop',
                whatsappPhoneNumberId: '991984453987854',
                systemPrompt: 'You are the assistant for Mixhael Baafi Test Shop, a boutique in Accra selling high-quality African wear.',
                catalog: {
                    create: [
                        { name: 'Kente Shirt', price: 250.00, description: 'Authentic hand-woven Kente shirt.', category: 'Clothing' },
                        { name: 'Beaded Necklace', price: 80.00, description: 'Traditional Ghanaian beads.', category: 'Accessories' },
                    ],
                },
            },
        });
        console.log('Seed: Created test merchant');
    } else {
        console.log('Seed: Test merchant already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
