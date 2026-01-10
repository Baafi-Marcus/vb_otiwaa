import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getMerchant() {
    try {
        const merchants = await prisma.merchant.findMany({
            select: {
                id: true,
                name: true,
                whatsappPhoneNumberId: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        console.log('\n=== MERCHANTS ===');
        merchants.forEach((merchant, index) => {
            console.log(`\n${index + 1}. Merchant ID: ${merchant.id}`);
            console.log(`   Name: ${merchant.name}`);
            console.log(`   WhatsApp Phone Number ID: ${merchant.whatsappPhoneNumberId}`);
            console.log(`   Created: ${merchant.createdAt}`);
        });
        console.log('\n');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getMerchant();
