import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // Clear existing admins
    await prisma.admin.deleteMany({});
    console.log('🗑️ Existing admins cleared.');

    const adminEmail = 'marcusowusu26@gmail.com';
    const adminPassword = 'Password123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.admin.create({
        data: {
            username: adminEmail,
            password: hashedPassword,
        },
    });

    console.log(`✅ Admin user created: ${admin.username}`);
    console.log(`👉 Access via /admin using: ${adminEmail} / ${adminPassword}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
