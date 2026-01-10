import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAdmin() {
    try {
        const admin = await prisma.admin.findFirst({
            select: {
                id: true,
                username: true,
                createdAt: true,
            },
        });

        if (admin) {
            console.log('\n=== ADMIN CREDENTIALS ===');
            console.log(`Username: ${admin.username}`);
            console.log(`Created: ${admin.createdAt}`);
            console.log('\nNOTE: The password was set during the seed script.');
            console.log('Check prisma/seed-auth.ts for the default password.');
        } else {
            console.log('\n❌ No admin found in database.');
            console.log('You may need to run the seed script: npx ts-node prisma/seed-auth.ts');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

getAdmin();
