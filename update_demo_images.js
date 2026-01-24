const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating demo merchants with AI visuals...');

    const categoryImages = {
        'Restaurant': '/demo/restaurant.png',
        'Boutique': '/demo/boutique.png',
        'Logistics': '/demo/logistics.png',
        'Professional Service': '/demo/professional.png',
        'General': '/demo/general.png'
    };

    const merchants = await prisma.merchant.findMany({
        where: {
            OR: Object.keys(categoryImages).map(cat => ({ category: cat }))
        }
    });

    for (const m of merchants) {
        const imageUrl = categoryImages[m.category];
        if (imageUrl) {
            await prisma.merchant.update({
                where: { id: m.id },
                data: {
                    logoUrl: imageUrl
                }
            });
            console.log(`✅ Updated ${m.name} (${m.category})`);
        }
    }

    console.log('✨ All demo images updated successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
