const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const merchant = await prisma.merchant.findFirst();
    if (!merchant) {
        console.log('No merchant found');
        return;
    }

    const zones = [
        { name: 'Accra Mall', price: 30 },
        { name: 'East Legon', price: 40 },
        { name: 'Osu', price: 25 },
        { name: 'Madina', price: 50 }
    ];

    for (const zone of zones) {
        await prisma.deliveryZone.upsert({
            where: { id: merchant.id + zone.name }, // Hacky unique id for seed
            update: { price: zone.price },
            create: {
                id: merchant.id + zone.name,
                name: zone.name,
                price: zone.price,
                merchantId: merchant.id
            }
        });
    }

    console.log('Delivery zones seeded for merchant:', merchant.name);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
