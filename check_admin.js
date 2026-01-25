const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
    try {
        const admins = await prisma.admin.findMany({
            select: {
                id: true,
                username: true,
                password: true,
                createdAt: true
            }
        });

        console.log('=== Admin Users in Database ===');
        console.log(JSON.stringify(admins, null, 2));

        if (admins.length === 0) {
            console.log('\n⚠️  NO ADMIN USERS FOUND!');
            console.log('You need to create an admin user first.');
        } else {
            admins.forEach(admin => {
                console.log(`\n✓ Admin: ${admin.username}`);
                console.log(`  ID: ${admin.id}`);
                console.log(`  Has Password: ${admin.password ? 'YES' : 'NO'}`);
                console.log(`  Created: ${admin.createdAt}`);
            });
        }
    } catch (error) {
        console.error('Error checking admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmin();
