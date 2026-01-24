// Quick script to check merchant data
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkMerchants() {
    const merchants = await prisma.merchant.findMany({
        select: {
            id: true,
            name: true,
            logoUrl: true,
            menuImageUrl: true,
        }
    });

    console.log('Merchants with logo/menu data:');
    merchants.forEach(m => {
        console.log(`\n${m.name}:`);
        console.log(`  Logo: ${m.logoUrl || 'NOT SET'}`);
        console.log(`  Menu: ${m.menuImageUrl || 'NOT SET'}`);
    });

    await prisma.$disconnect();
}

checkMerchants().catch(console.error);
