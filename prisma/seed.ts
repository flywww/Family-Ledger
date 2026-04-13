import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DEMO_ACCOUNT = 'demo';
const DEMO_PASSWORD = 'demo';
const DISPLAY_CATEGORIES = ['Cash', 'Cryptocurrency', 'Listed stock', 'Unlisted stock'];

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
    quantities: [1, 1, 1, 1, 1, 1],
    prices: [18200, 18850, 19540, 20100, 20980, 21640],
    notes: [
      'Synthetic cash reserve for demo use only.',
      'Synthetic cash reserve for demo use only.',
      'Synthetic cash reserve for demo use only.',
      'Synthetic cash reserve for demo use only.',
      'Synthetic cash reserve for demo use only.',
      'Synthetic cash reserve for demo use only.',
    ],
  },
  {
    key: 'crypto',
    name: 'Demo Crypto Basket',
    symbol: 'DEMO-BTC',
    category: 'Cryptocurrency',
    type: 'Assets',
    currency: 'USD',
    quantities: [1.42, 1.45, 1.47, 1.5, 1.54, 1.58],
    prices: [7600, 8120, 8450, 8890, 9340, 9780],
    notes: [
      'Synthetic crypto balance for charts and previews only.',
      'Synthetic crypto balance for charts and previews only.',
      'Synthetic crypto balance for charts and previews only.',
      'Synthetic crypto balance for charts and previews only.',
      'Synthetic crypto balance for charts and previews only.',
      'Synthetic crypto balance for charts and previews only.',
    ],
  },
  {
    key: 'stock',
    name: 'Demo Equity Basket',
    symbol: 'DEMO-STOCK',
    category: 'Listed stock',
    type: 'Assets',
    currency: 'USD',
    quantities: [120, 120, 124, 124, 128, 130],
    prices: [96, 99, 101, 104, 107, 111],
    notes: [
      'Synthetic listed equity holdings for demo only.',
      'Synthetic listed equity holdings for demo only.',
      'Synthetic listed equity holdings for demo only.',
      'Synthetic listed equity holdings for demo only.',
      'Synthetic listed equity holdings for demo only.',
      'Synthetic listed equity holdings for demo only.',
    ],
  },
  {
    key: 'private',
    name: 'Demo Private Fund',
    symbol: 'DEMO-PRIVATE',
    category: 'Unlisted stock',
    type: 'Assets',
    currency: 'USD',
    quantities: [310, 310, 310, 320, 320, 325],
    prices: [41, 43, 44, 45, 47, 48],
    notes: [
      'Synthetic private investment value, not linked to a real asset.',
      'Synthetic private investment value, not linked to a real asset.',
      'Synthetic private investment value, not linked to a real asset.',
      'Synthetic private investment value, not linked to a real asset.',
      'Synthetic private investment value, not linked to a real asset.',
      'Synthetic private investment value, not linked to a real asset.',
    ],
  },
  {
    key: 'debt',
    name: 'Demo Credit Line',
    symbol: 'DEMO-DEBT',
    category: 'Cash',
    type: 'Liabilities',
    currency: 'USD',
    quantities: [1, 1, 1, 1, 1, 1],
    prices: [9200, 9000, 8740, 8420, 8180, 7900],
    notes: [
      'Synthetic liability to keep demo net worth realistic-looking.',
      'Synthetic liability to keep demo net worth realistic-looking.',
      'Synthetic liability to keep demo net worth realistic-looking.',
      'Synthetic liability to keep demo net worth realistic-looking.',
      'Synthetic liability to keep demo net worth realistic-looking.',
      'Synthetic liability to keep demo net worth realistic-looking.',
    ],
  },
];

function getDemoMonths(): Date[] {
  const today = new Date();
  return Array.from({ length: 6 }, (_, index) => {
    const month = new Date(today.getFullYear(), today.getMonth() - 6 + index, 1);
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

async function resetDemoUserData(userId: string) {
  await prisma.$transaction([
    prisma.cronRunLog.deleteMany({ where: { userId } }),
    prisma.assetPriceSnapshot.deleteMany({ where: { userId } }),
    prisma.monthlyRefreshJob.deleteMany({ where: { userId } }),
    prisma.valueData.deleteMany({ where: { userId } }),
    prisma.balance.deleteMany({ where: { userId } }),
    prisma.holding.deleteMany({ where: { userId } }),
  ]);
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

  await resetDemoUserData(demoUser.id);

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

    const createdHolding = await prisma.holding.create({
      data: {
        name: holding.name,
        symbol: holding.symbol,
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

      balancesToCreate.push({
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
      });
    }
  }

  await prisma.balance.createMany({
    data: balancesToCreate,
  });

  const createdValueData = months.flatMap((month, monthIndex) =>
    demoHoldings.map((holding) => {
      const seededHolding = createdHoldings.get(holding.key);

      if (!seededHolding) {
        throw new Error(`Failed to create value data for ${holding.name}.`);
      }

      return {
        date: month,
        categoryId: seededHolding.categoryId,
        typeId: seededHolding.typeId,
        value: Number((holding.quantities[monthIndex] * holding.prices[monthIndex]).toFixed(2)),
        userId: demoUser.id,
        isTestData: false,
      };
    }),
  );

  await prisma.valueData.createMany({
    data: createdValueData,
  });

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
