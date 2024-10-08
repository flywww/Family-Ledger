import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    await prisma.user.create({
        data: {
            account: 'linehome',
            password: '29694946',
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