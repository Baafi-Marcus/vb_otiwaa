const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function resetAdmin() {
    try {
        // Delete all existing admins
        await prisma.admin.deleteMany({});
        console.log('✓ Deleted all existing admin users');

        // Create new admin with email
        const email = 'marcusowusu26@gmail.com';
        const password = 'Password123!#';
        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.admin.create({
            data: {
                username: email, // Using email as username for now
                password: hashedPassword
            }
        });

        console.log('✅ Admin user created successfully!');
        console.log('=================================');
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
        console.log(`ID: ${admin.id}`);
        console.log('=================================');
        console.log('\n✓ You can now log in with your email and password!');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetAdmin();
