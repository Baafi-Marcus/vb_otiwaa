const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const merchants = await prisma.merchant.findMany({
            take: 5
        });
        console.log('Sample Merchants:');
        merchants.forEach(m => {
            console.log(`- ${m.name}: logoUrl="${m.logoUrl}", menuImageUrl="${m.menuImageUrl}"`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
