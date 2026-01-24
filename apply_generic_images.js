const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🎨 Applying Generic AI Images to Merchants...');

    const merchants = await prisma.merchant.findMany();

    // Mapping Logic
    // Restaurant -> demo_food.png
    // Boutique, General -> demo_retail.png
    // Professional Service, Logistics -> demo_service.png

    let updatedCount = 0;

    for (const m of merchants) {
        let imageName = 'demo_service.png'; // Default

        if (m.category === 'Restaurant') {
            imageName = 'demo_food.png';
        } else if (m.category === 'Boutique' || m.category === 'General') {
            imageName = 'demo_retail.png';
        }

        const logoUrl = `/generatedImages/${imageName}`;

        await prisma.merchant.update({
            where: { id: m.id },
            data: {
                logoUrl: logoUrl,
                menuImageUrl: logoUrl // syncing both for now to ensure visibility
            }
        });
        console.log(`✅ Updated ${m.name} (${m.category}) -> ${imageName}`);
        updatedCount++;
    }

    console.log(`✨ Successfully updated ${updatedCount} merchants with AI visuals!`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
