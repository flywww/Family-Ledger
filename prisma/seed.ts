import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_ACCOUNT = 'demo';
const DEMO_PASSWORD = 'demo';
const DISPLAY_CATEGORIES = ['Cash', 'Cryptocurrency', 'Listed stock', 'Unlisted stock'];
const DEMO_MONTHS = 12;

function repeatedNotes(note: string) {
  return Array.from({ length: DEMO_MONTHS }, () => note);
}

type DemoHoldingSeed = {
  key: string;
  name: string;
  symbol: string;
  category: string;
  type: 'Assets' | 'Liabilities';
  currency: string;
  quantities: number[];
  prices: number[];
  notes: string[];
};

const demoHoldings: DemoHoldingSeed[] = [
  {
    key: 'cash',
    name: 'Demo Cash Reserve',
    symbol: 'DEMO-CASH',
    category: 'Cash',
    type: 'Assets',
    currency: 'USD',
    quantities: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    prices: [16820, 17460, 18110, 17740, 18690, 19480, 19160, 20320, 21140, 20790, 21950, 22860],
    notes: repeatedNotes('Synthetic cash reserve for demo use only.'),
  },
  {
    key: 'crypto',
    name: 'Demo Crypto Basket',
    symbol: 'DEMO-BTC',
    category: 'Cryptocurrency',
    type: 'Assets',
    currency: 'USD',
    quantities: [1.28, 1.31, 1.35, 1.32, 1.39, 1.43, 1.4, 1.48, 1.52, 1.49, 1.57, 1.61],
    prices: [6920, 7410, 8250, 7680, 8460, 9130, 8740, 9620, 10180, 9720, 10840, 11460],
    notes: repeatedNotes('Synthetic crypto balance for charts and previews only.'),
  },
  {
    key: 'stock',
    name: 'Demo Equity Basket',
    symbol: 'DEMO-STOCK',
    category: 'Listed stock',
    type: 'Assets',
    currency: 'USD',
    quantities: [112, 114, 116, 115, 118, 121, 120, 124, 127, 126, 130, 133],
    prices: [88, 91, 95, 93, 98, 102, 100, 107, 111, 109, 116, 121],
    notes: repeatedNotes('Synthetic listed equity holdings for demo only.'),
  },
  {
    key: 'private',
    name: 'Demo Private Fund',
    symbol: 'DEMO-PRIVATE',
    category: 'Unlisted stock',
    type: 'Assets',
    currency: 'USD',
    quantities: [295, 295, 300, 300, 304, 308, 308, 314, 318, 318, 324, 328],
    prices: [38, 39, 41, 40, 42, 44, 43, 45, 47, 46, 49, 51],
    notes: repeatedNotes('Synthetic private investment value, not linked to a real asset.'),
  },
  {
    key: 'debt',
    name: 'Demo Credit Line',
    symbol: 'DEMO-DEBT',
    category: 'Cash',
    type: 'Liabilities',
    currency: 'USD',
    quantities: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    prices: [10350, 10120, 9870, 9960, 9540, 9280, 9360, 9010, 8720, 8790, 8460, 8210],
    notes: repeatedNotes('Synthetic liability to keep demo net worth realistic-looking.'),
  },
];

function getDemoMonths(): Date[] {
  const today = new Date();
  return Array.from({ length: DEMO_MONTHS }, (_, index) => {
    const month = new Date(today.getFullYear(), today.getMonth() - DEMO_MONTHS + index, 1);
    month.setHours(0, 0, 0, 0);
    return month;
  });
}

async function ensureBaseData() {
  await Promise.all(
    DISPLAY_CATEGORIES.map((name) =>
      prisma.category.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );

  await Promise.all(
    ['Assets', 'Liabilities'].map((name) =>
      prisma.type.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    ),
  );
}

async function seedDemoUser() {
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const demoUser = await prisma.user.upsert({
    where: {
      account: DEMO_ACCOUNT,
    },
    create: {
      account: DEMO_ACCOUNT,
      password: hashedPassword,
    },
    update: {
      password: hashedPassword,
    },
  });

  const [categories, types] = await Promise.all([
    prisma.category.findMany({
      where: { name: { in: DISPLAY_CATEGORIES } },
    }),
    prisma.type.findMany({
      where: { name: { in: ['Assets', 'Liabilities'] } },
    }),
  ]);

  const categoryByName = new Map(categories.map((category) => [category.name, category]));
  const typeByName = new Map(types.map((type) => [type.name, type]));

  const createdHoldings = new Map<string, { id: number; categoryId: number; typeId: number; currency: string }>();

  for (const holding of demoHoldings) {
    const category = categoryByName.get(holding.category);
    const type = typeByName.get(holding.type);

    if (!category || !type) {
      throw new Error(`Missing seed dependency for holding ${holding.name}.`);
    }

    const createdHolding = await prisma.holding.upsert({
      where: {
        name_symbol: {
          name: holding.name,
          symbol: holding.symbol,
        },
      },
      create: {
        name: holding.name,
        symbol: holding.symbol,
        categoryId: category.id,
        typeId: type.id,
        userId: demoUser.id,
      },
      update: {
        categoryId: category.id,
        typeId: type.id,
        userId: demoUser.id,
      },
    });

    createdHoldings.set(holding.key, {
      id: createdHolding.id,
      categoryId: category.id,
      typeId: type.id,
      currency: holding.currency,
    });
  }

  const months = getDemoMonths();
  const balancesToCreate = [];

  for (let monthIndex = 0; monthIndex < months.length; monthIndex += 1) {
    for (const holding of demoHoldings) {
      const seededHolding = createdHoldings.get(holding.key);

      if (!seededHolding) {
        throw new Error(`Failed to create demo holding ${holding.name}.`);
      }

      const quantity = holding.quantities[monthIndex];
      const price = holding.prices[monthIndex];
      const existingBalance = await prisma.balance.findFirst({
        where: {
          userId: demoUser.id,
          holdingId: seededHolding.id,
          date: months[monthIndex],
        },
        select: {
          id: true,
        },
      });
      const balanceData = {
        date: months[monthIndex],
        holdingId: seededHolding.id,
        quantity,
        price,
        value: Number((quantity * price).toFixed(2)),
        currency: seededHolding.currency,
        note: holding.notes[monthIndex],
        userId: demoUser.id,
        priceStatus: 'success' as const,
        priceSource: 'demo-seed',
        isTestData: false,
      };

      if (existingBalance) {
        await prisma.balance.update({
          where: {
            id: existingBalance.id,
          },
          data: balanceData,
        });
      } else {
        balancesToCreate.push(balanceData);
      }
    }
  }

  if (balancesToCreate.length > 0) {
    await prisma.balance.createMany({
      data: balancesToCreate,
    });
  }

  for (const [monthIndex, month] of months.entries()) {
    for (const holding of demoHoldings) {
      const seededHolding = createdHoldings.get(holding.key);

      if (!seededHolding) {
        throw new Error(`Failed to create value data for ${holding.name}.`);
      }

      await prisma.valueData.upsert({
        where: {
          date_categoryId_typeId_userId: {
            date: month,
            categoryId: seededHolding.categoryId,
            typeId: seededHolding.typeId,
            userId: demoUser.id,
          },
        },
        create: {
          date: month,
          categoryId: seededHolding.categoryId,
          typeId: seededHolding.typeId,
          value: Number((holding.quantities[monthIndex] * holding.prices[monthIndex]).toFixed(2)),
          userId: demoUser.id,
          isTestData: false,
        },
        update: {
          value: Number((holding.quantities[monthIndex] * holding.prices[monthIndex]).toFixed(2)),
          isTestData: false,
        },
      });
    }
  }

  const latestMonth = months.at(-1);

  if (!latestMonth) {
    throw new Error('Failed to derive latest demo month.');
  }

  await prisma.setting.upsert({
    where: {
      userId: demoUser.id,
    },
    create: {
      accountingDate: latestMonth,
      displayCurrency: 'USD',
      displayCategories: DISPLAY_CATEGORIES.join(','),
      userId: demoUser.id,
    },
    update: {
      accountingDate: latestMonth,
      displayCurrency: 'USD',
      displayCategories: DISPLAY_CATEGORIES.join(','),
      cronTestTargetMonth: null,
      cronTestStartedAt: null,
    },
  });
}

async function seedConfiguredUser() {
  const seedAccount = process.env.SEED_ACCOUNT;
  const seedPassword = process.env.SEED_PASSWORD;

  if (!seedAccount || !seedPassword) {
    console.log('Skipping SEED_ACCOUNT user creation because SEED_ACCOUNT or SEED_PASSWORD is missing.');
    return;
  }

  const hashedPassword = await bcrypt.hash(seedPassword, 10);

  const existingUser = await prisma.user.findUnique({
    where: {
      account: seedAccount,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    console.log(`Skipping SEED_ACCOUNT update for existing account ${seedAccount}.`);
    return;
  }

  await prisma.user.create({
    data: {
      account: seedAccount,
      password: hashedPassword,
    },
  });
}

async function main() {
  await ensureBaseData();
  await seedDemoUser();
  await seedConfiguredUser();
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
