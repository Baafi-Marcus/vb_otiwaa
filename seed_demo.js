const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting to seed 25 demo businesses...');

    const businesses = [
        { name: 'Star Jollof', category: 'Restaurant', location: 'Osu, Accra', vision: 'Best spicy jollof in the city.' },
        { name: 'Kente Krafts', category: 'Boutique', location: 'Kumasi', vision: 'Authentic handwoven Kente for all occasions.' },
        { name: 'Afro Bites', category: 'Restaurant', location: 'East Legon', vision: 'Modern twists on traditional Ghanaian dishes.' },
        { name: 'TechHub Logistics', category: 'Logistics', location: 'Airport Residential', vision: 'Fastest door-to-door delivery service.' },
        { name: 'Mama\'s Kitchen', category: 'Restaurant', location: 'Tema Community 1', vision: 'Home-cooked meals with love.' },
        { name: 'Urban Sole', category: 'Boutique', location: 'Osu', vision: 'Premium sneakers and streetwear.' },
        { name: 'Legal Mind Gp', category: 'Professional Service', location: 'Ridge, Accra', vision: 'Corporate legal consulting simplified.' },
        { name: 'Green Grocers', category: 'General', location: 'Cantonments', vision: 'Fresh organic farm produce.' },
        { name: 'Piza Palace', category: 'Restaurant', location: 'Spintex', vision: 'Authentic wood-fired pizza.' },
        { name: 'Acoustic Sounds', category: 'General', location: 'Labadi', vision: 'High-end audio equipment and records.' },
        { name: 'Glitz & Glam', category: 'Boutique', location: 'Accra Mall', vision: 'Luxury fashion and bridal wear.' },
        { name: 'Quick Wash', category: 'Professional Service', location: 'Dzorwulu', vision: 'Mobile car detailing and detailing.' },
        { name: 'The Studio', category: 'Professional Service', location: 'Achimota', vision: 'Creative photography and videography.' },
        { name: 'Healthy Habits', category: 'Restaurant', location: 'Dansoman', vision: 'Salads and cold-pressed juices.' },
        { name: 'Blue Ridge Tech', category: 'Professional Service', location: 'Adabraka', vision: 'IT support and managed cloud services.' },
        { name: 'Sparkle Jewels', category: 'Boutique', location: 'East Legon', vision: 'Ethically sourced gold and diamond jewelry.' },
        { name: 'The Book Nook', category: 'General', location: 'Legon Campus', vision: 'Rare books and cozy reading vibes.' },
        { name: 'Speedy Couriers', category: 'Logistics', location: 'Lapaz', vision: 'Next-day intercity delivery.' },
        { name: 'Artisan Bakes', category: 'Restaurant', location: 'Madina', vision: 'Sourdough bread and french pastries.' },
        { name: 'Fit Life Gym', category: 'Professional Service', location: 'Airport West', vision: 'Personalized fitness training.' },
        { name: 'Classic Cuts', category: 'Professional Service', location: 'Haatso', vision: 'Premium grooming and barber services.' },
        { name: 'Ocean View Spa', category: 'Professional Service', location: 'Nungua', vision: 'Relaxing wellness and massage therapy.' },
        { name: 'Gadget Grotto', category: 'General', location: 'Circle', vision: 'Latest smartphones and accessories.' },
        { name: 'Floral Fancy', category: 'General', location: 'Tesano', vision: 'Bespoke flower arrangements.' },
        { name: 'Brew & Bake', category: 'Restaurant', location: 'Kaneshie', vision: 'Quality coffee and artisan donuts.' }
    ];

    for (const b of businesses) {
        await prisma.merchant.create({
            data: {
                name: b.name,
                category: b.category,
                location: b.location,
                clientVision: b.vision,
                systemPrompt: `You are the AI assistant for ${b.name}. ${b.vision}`,
                tier: 'PRO',
                baseDeliveryFee: 15.00,
                isClosed: false,
                paymentMethods: 'MTN MoMo, Cash',
                momoNumber: '0240000000',
                description: `${b.name} is a premier ${b.category} business in ${b.location}.`,
                operatingHours: 'Mon-Sat 9am-9pm'
            }
        });
        console.log(`✅ Created ${b.name}`);
    }

    console.log('✨ Seeded 25 businesses successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
