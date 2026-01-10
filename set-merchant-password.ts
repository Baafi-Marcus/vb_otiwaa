import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function setMerchantPassword() {
    const merchantId = 'ec8eef1e-4ea4-43cf-9d04-957a1c5bfd59';
    const password = 'password123'; // Change this to your desired password

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.merchant.update({
            where: { id: merchantId },
            data: { password: hashedPassword },
        });

        console.log('\n✅ Password set successfully!');
        console.log(`Merchant ID: ${merchantId}`);
        console.log(`Password: ${password}`);
        console.log('\nYou can now login with these credentials.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setMerchantPassword();
