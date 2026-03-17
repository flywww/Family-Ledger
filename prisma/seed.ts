import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const seedAccount = process.env.SEED_ACCOUNT;
    const seedPassword = process.env.SEED_PASSWORD;

    if (!seedAccount || !seedPassword) {
        console.log('Skipping seed user creation because SEED_ACCOUNT or SEED_PASSWORD is missing.');
        return;
    }

    const hashedPassword = await bcrypt.hash(seedPassword, 10);

    await prisma.user.upsert({
        where: {
            account: seedAccount,
        },
        create: {
            account: seedAccount,
            password: hashedPassword,
        },
        update: {
            password: hashedPassword,
        },
    });
}

main()
.then(() => {
    console.log('Database seeded successfully.');
})
.catch((e) => {
    console.error(e);
    process.exit(1);
})
.finally(async () => {
    await prisma.$disconnect();
});
