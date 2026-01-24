const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting to seed demo businesses...');

    try {
        await prisma.orderItem.deleteMany({});
        await prisma.order.deleteMany({});
        await prisma.product.deleteMany({});
        await prisma.message.deleteMany({});
        await prisma.campaignLog.deleteMany({});
        await prisma.campaign.deleteMany({});
        await prisma.deliveryZone.deleteMany({});
        await prisma.upgradeRequest.deleteMany({});
        await prisma.customer.deleteMany({});
        await prisma.merchant.deleteMany({});
        console.log('🧹 Cleared all existing data.');
    } catch (e) {
        console.warn('⚠️ Warning during cleanup:', e.message);
    }

    const businesses = [
        { name: 'Star Jollof', category: 'Restaurant', location: 'Osu, Accra', vision: 'Best spicy jollof in the city.', lat: 5.5566, lng: -0.1740, logo: '/generatedImages/demo_food.png' },
        { name: 'Kente Krafts', category: 'Boutique', location: 'Kumasi', vision: 'Authentic handwoven Kente for all occasions.', lat: 6.6666, lng: -1.6163, logo: '/generatedImages/demo_retail.png' },
        { name: 'Afro Bites', category: 'Restaurant', location: 'East Legon', vision: 'Modern twists on traditional Ghanaian dishes.', lat: 5.6322, lng: -0.1648, logo: '/generatedImages/demo_food.png' },
        { name: 'TechHub Logistics', category: 'Logistics', location: 'Airport Residential', vision: 'Fastest door-to-door delivery service.', lat: 5.6026, lng: -0.1706, logo: '/generatedImages/demo_service.png' },
        { name: 'Mama\'s Kitchen', category: 'Restaurant', location: 'Tema Community 1', vision: 'Home-cooked meals with love.', lat: 5.6726, lng: -0.0152, logo: '/generatedImages/demo_food.png' },
        { name: 'Urban Sole', category: 'Boutique', location: 'Osu', vision: 'Premium sneakers and streetwear.', lat: 5.5552, lng: -0.1722, logo: '/generatedImages/demo_retail.png' },
        { name: 'Legal Mind Gp', category: 'Professional Service', location: 'Ridge, Accra', vision: 'Corporate legal consulting simplified.', lat: 5.5658, lng: -0.2016, logo: '/generatedImages/demo_service.png' },
        { name: 'Green Grocers', category: 'General', location: 'Cantonments', vision: 'Fresh organic farm produce.', lat: 5.5786, lng: -0.1698, logo: '/generatedImages/demo_retail.png' },
        { name: 'Piza Palace', category: 'Restaurant', location: 'Spintex', vision: 'Authentic wood-fired pizza.', lat: 5.6253, lng: -0.0934, logo: '/generatedImages/demo_food.png' },
        { name: 'Acoustic Sounds', category: 'General', location: 'Labadi', vision: 'High-end audio equipment and records.', lat: 5.5647, lng: -0.1458, logo: '/generatedImages/demo_retail.png' },
        { name: 'Glitz & Glam', category: 'Boutique', location: 'Accra Mall', vision: 'Luxury fashion and bridal wear.', lat: 5.6173, lng: -0.1681, logo: '/generatedImages/demo_retail.png' },
        { name: 'Quick Wash', category: 'Professional Service', location: 'Dzorwulu', vision: 'Mobile car detailing and detailing.', lat: 5.6086, lng: -0.1983, logo: '/generatedImages/demo_service.png' },
        { name: 'The Studio', category: 'Professional Service', location: 'Achimota', vision: 'Creative photography and videography.', lat: 5.6391, lng: -0.2186, logo: '/generatedImages/demo_service.png' },
        { name: 'Healthy Habits', category: 'Restaurant', location: 'Dansoman', vision: 'Salads and cold-pressed juices.', lat: 5.5526, lng: -0.2526, logo: '/generatedImages/demo_food.png' },
        { name: 'Blue Ridge Tech', category: 'Professional Service', location: 'Adabraka', vision: 'IT support and managed cloud services.', lat: 5.5621, lng: -0.2148, logo: '/generatedImages/demo_service.png' },
        { name: 'Sparkle Jewels', category: 'Boutique', location: 'East Legon', vision: 'Ethically sourced gold and diamond jewelry.', lat: 5.6291, lng: -0.1722, logo: '/generatedImages/demo_retail.png' },
        { name: 'The Book Nook', category: 'General', location: 'Legon Campus', vision: 'Rare books and cozy reading vibes.', lat: 5.6506, lng: -0.1872, logo: '/generatedImages/demo_retail.png' },
        { name: 'Speedy Couriers', category: 'Logistics', location: 'Lapaz', vision: 'Next-day intercity delivery.', lat: 5.6121, lng: -0.2358, logo: '/generatedImages/demo_service.png' },
        { name: 'Artisan Bakes', category: 'Restaurant', location: 'Madina', vision: 'Sourdough bread and french pastries.', lat: 5.6681, lng: -0.1642, logo: '/generatedImages/demo_food.png' },
        { name: 'Fit Life Gym', category: 'Professional Service', location: 'Airport West', vision: 'Personalized fitness training.', lat: 5.6122, lng: -0.1883, logo: '/generatedImages/demo_service.png' },
        { name: 'Classic Cuts', category: 'Professional Service', location: 'Haatso', vision: 'Premium grooming and barber services.', lat: 5.6826, lng: -0.2126, logo: '/generatedImages/demo_service.png' },
        { name: 'Ocean View Spa', category: 'Professional Service', location: 'Nungua', vision: 'Relaxing wellness and massage therapy.', lat: 5.5826, lng: -0.0526, logo: '/generatedImages/demo_service.png' },
        { name: 'Gadget Grotto', category: 'General', location: 'Circle', vision: 'Latest smartphones and accessories.', lat: 5.5626, lng: -0.2126, logo: '/generatedImages/demo_retail.png' },
        { name: 'Floral Fancy', category: 'General', location: 'Tesano', vision: 'Bespoke flower arrangements.', lat: 5.5926, lng: -0.2326, logo: '/generatedImages/demo_retail.png' },
        { name: 'Brew & Bake', category: 'Restaurant', location: 'Kaneshie', vision: 'Quality coffee and artisan donuts.', lat: 5.5726, lng: -0.2426, logo: '/generatedImages/demo_food.png' }
    ];

    for (let i = 0; i < businesses.length; i++) {
        const b = businesses[i];
        await prisma.merchant.create({
            data: {
                name: b.name,
                category: b.category,
                location: b.location,
                latitude: b.lat,
                longitude: b.lng,
                clientVision: b.vision,
                systemPrompt: `You are the AI assistant for ${b.name}. ${b.vision}`,
                tier: 'PRO',
                baseDeliveryFee: 15.00,
                isClosed: false,
                paymentMethods: 'MTN MoMo, Cash',
                momoNumber: `024${String(i).padStart(7, '0')}`, // Unique MoMo number
                logoUrl: b.logo,
                description: `${b.name} is a premier ${b.category} business in ${b.location}.`,
                operatingHours: 'Mon-Sat 9am-9pm'
            }
        });
        console.log(`✅ Created ${i + 1}/25: ${b.name}`);
    }

    console.log('✨ Seeded 25 businesses with coordinates successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Fatal error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
