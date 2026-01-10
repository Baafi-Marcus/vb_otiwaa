import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminUsername = 'admin';
    const adminPassword = 'Password123!'; // User should change this
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const admin = await prisma.admin.upsert({
        where: { username: adminUsername },
        update: { password: hashedPassword },
        create: {
            username: adminUsername,
            password: hashedPassword,
        },
    });

    console.log(`✅ Admin user created/updated: ${admin.username}`);
    console.log(`👉 Please use this password to log in for the first time.`);

    // Optional: Set default passwords for existing merchants if needed
    // For now, we allow merchants to log in and set their own password if it's null.
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
