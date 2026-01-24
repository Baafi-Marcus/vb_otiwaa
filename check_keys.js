const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const keys = await prisma.apiKey.findMany();
        console.log('Available API Keys:');
        keys.forEach(k => {
            console.log(`- Provider: ${k.provider}, ID: ${k.id}`);
            if (k.provider.toLowerCase().includes('stability')) {
                console.log('✅ Found Stability AI Key!');
            }
        });
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
