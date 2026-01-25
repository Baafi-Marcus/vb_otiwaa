const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
    try {
        // Check if admin already exists
        const existing = await prisma.admin.findUnique({
            where: { username: 'admin' }
        });

        if (existing) {
            console.log('✓ Admin user already exists!');
            console.log(`  Username: ${existing.username}`);
            console.log(`  ID: ${existing.id}`);
            return;
        }

        // Create admin with hashed password
        const password = 'Admin@2026'; // Change this to your preferred password
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                username: 'admin',
                password: hashedPassword
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('=================================');
        console.log(`Username: admin`);
        console.log(`Password: ${password}`);
        console.log(`ID: ${admin.id}`);
        console.log('=================================');
        console.log('\n⚠️  IMPORTANT: Change this password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdmin();
