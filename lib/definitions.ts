import { z } from 'zod';
import NextAuth, { DefaultSession, User as AuthUser } from 'next-auth';

export type currencyType = 'TWD' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'CNY' | 'KRW' | 'HKD' | 'AUD' | 'CAD' | 'SGD' | 'CHF' | 'SEK' | 'NZD' | 'THB' | 'PHP' | 'IDR' | 'VND' | 'MYR' | 'ZAR' | 'BRL' | 'INR' | 'RUB' | 'DKK' | 'NOK' | 'TRY' | 'MXN' | 'PLN' | 'ILS' | 'HUF' | 'CZK' | 'CLP' | 'EGP' | 'AED' | 'COP' | 'SAR' | 'PKR' | 'KWD' | 'QAR' | 'OMR' | 'BHD' | 'RSD' | 'HRK' | 'BGN' | 'RON' | 'LKR' | 'BDT' | 'DZD' | 'KES' | 'NGN' | 'UGX' | 'GHS' | 'ZMW' | 'MAD' | 'MZN';
export type categoryListType = 'Cash' | 'Cryptocurrency' | 'Listed stock' | 'Unlisted stock';
export type typeListType = 'Assets' | 'Liabilities'
export type priceStatusType = 'pending' | 'success' | 'failed';
export type refreshJobStatusType = 'pending' | 'running' | 'partial_complete' | 'completed' | 'failed';
export type cronRunTriggerType = 'scheduled' | 'manual_test' | 'manual_create';
export type cronRunStatusType = 'idle' | 'pending' | 'running' | 'partial_complete' | 'completed' | 'failed';
export const currencySymbols = ['TWD','USD','EUR','JPY','GBP','CNY','KRW','HKD','AUD','CAD','SGD','CHF','SEK','NZD','THB','PHP','IDR','VND','MYR','ZAR','BRL','INR','RUB','DKK','NOK','TRY','MXN','PLN','ILS','HUF','CZK','CLP','EGP','AED','COP','SAR','PKR','KWD','QAR','OMR','BHD','RSD','HRK','BGN','RON','LKR','BDT','DZD','KES','NGN','UGX','GHS','ZMW','MAD','MZN']

declare module 'next-auth' {
    interface User {
        id?: string;
        account?: string; // Add the account property
    }
    interface Session {
        user: {
            id: string;
            account: string;
        } & DefaultSession["user"];
    }
    interface JWT {
        id: string;
        account?: string; // Add the account property
    }
}

export const UserSchema = z.object({
    id: z.string().optional(),
    account: z.string(), //TODO: add verified result messages
    password: z.string().min(6),
    updatedAt: z.date().optional(),
    createdAt: z.date().optional(),
})
export const UserCreateSchema = UserSchema.omit({
    id: true,
    updatedAt: true,
    createdAt: true,
})
export const UserUpdateSchema = UserCreateSchema.partial().extend({
    id: z.string(),
})

export type User = z.infer<typeof UserSchema>
export type UserCreateType = z.infer<typeof UserCreateSchema>
export type UserUpdateType = z.infer<typeof UserUpdateSchema>

export const SettingSchema = z.object({
    id: z.number(),
    accountingDate: z.date(),
    displayCurrency: z.enum([...currencySymbols] as [string, ...string[]]),
    displayCategories: z.string(),
    cronTestTargetMonth: z.date().nullable().optional(),
    cronTestStartedAt: z.date().nullable().optional(),
    userId: z.string(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const SettingCreateSchema = SettingSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})
export const SettingUpdateSchema = SettingCreateSchema.partial().extend({
    id: z.number().optional(),
})

export type Setting = z.infer<typeof SettingSchema>
export type SettingCreateType = z.infer<typeof SettingCreateSchema>
export type SettingUpdateType = z.infer<typeof SettingUpdateSchema>

export const CategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    isHide: z.boolean(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const CategoryCreateSchema = CategorySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})
export const CategoryUpdateSchema = CategoryCreateSchema.partial().extend({
    id: z.number(),
})

export type Category = z.infer<typeof CategorySchema>
export type CategoryCreateType = z.infer<typeof CategoryCreateSchema>
export type CategoryUpdateType = z.infer<typeof CategoryUpdateSchema>

export const TypeSchema = z.object({
    id: z.number(),
    name: z.string(),
    updatedAt: z.date(),
    createdAt: z.date(),
})

export const TypeCreateSchema = TypeSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})

export const TypeUpdateSchema = TypeCreateSchema.partial().extend({
    id: z.number(),
})

export type Type = z.infer<typeof TypeSchema>
export type TypeCreateType = z.infer<typeof TypeCreateSchema>
export type TypeUpdateType = z.infer<typeof TypeUpdateSchema>

export const HoldingSchema = z.object({
    id: z.number(),
    name: z.string(),
    symbol: z.string(),
    typeId: z.number(),
    type: TypeSchema,
    categoryId: z.number(),
    category: CategorySchema,
    userId: z.string(),
    user: UserSchema.optional(),
    sourceURL: z.string().nullable().optional(),
    sourceId: z.string().nullable().optional(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const HoldingCreateSchema = HoldingSchema.omit({
    id: true,
    category: true,
    type:true,
    user:true,
    createdAt: true,
    updatedAt: true,
})
export const HoldingUpdateSchema = HoldingCreateSchema.partial().extend({
    id: z.number(),
});
export const HoldingArraySchema = z.array(HoldingSchema);

export type Holding = z.infer<typeof HoldingSchema>;
export type HoldingsArray = z.infer<typeof HoldingArraySchema>;
export type HoldingCreateType = z.infer<typeof HoldingCreateSchema>
export type HoldingUpdateType = z.infer<typeof HoldingUpdateSchema>


export const BalanceSchema = z.object({
    id: z.number(),
    date: z.date(),
    holdingId: z.number(),
    holding: HoldingSchema,
    quantity: z.number(),
    price: z.number(),
    value: z.number(),
    currency: z.enum([...currencySymbols] as [string, ...string[]]).default('TWD'),
    note: z.preprocess((val) => val ?? "", z.string().optional()),
    userId: z.string(),
    user: UserSchema.optional(),
    priceStatus: z.enum(['pending', 'success', 'failed']).default('success'),
    priceFetchedAt: z.date().nullable().optional(),
    priceSource: z.string().nullable().optional(),
    priceError: z.string().nullable().optional(),
    isTestData: z.boolean().optional(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const BalanceCreateSchema = BalanceSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    holding: true,
    user: true,
})
export const BalanceUpdateSchema = BalanceCreateSchema.partial().extend({ 
    id: z.number() 
})
export const FlattedBalanceSchema = BalanceSchema.extend({
    holdingName: z.string(),
    holdingSymbol: z.string(),
    holdingCategoryName: z.string(),
    holdingTypeName: z.string(),
})

export type Balance = z.infer<typeof BalanceSchema>
export type BalanceCreateType = z.infer<typeof BalanceCreateSchema>
export type BalanceUpdateType = z.infer<typeof BalanceUpdateSchema>
export type FlattedBalanceType = z.infer<typeof FlattedBalanceSchema>


export const ValueDataSchema = z.object({
    id: z.number(),
    key: z.string().optional(),
    date: z.date(),
    category: CategorySchema,
    categoryId: z.number(),
    type: TypeSchema,
    typeId: z.number(),
    value: z.number(),
    userId: z.string(),
    user: UserSchema.optional(),
    isTestData: z.boolean().optional(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const ValueDataCreateSchema = ValueDataSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    category: true,
    type: true,
    user: true,
})
export const ValueDataUpdateSchema = ValueDataCreateSchema.partial().extend({ 
    id: z.number() 
})

export type ValueData = z.infer<typeof ValueDataSchema>
export type ValueDataCreateType = z.infer<typeof ValueDataCreateSchema>
export type ValueDataUpdateType = z.infer<typeof ValueDataUpdateSchema>


export const currencyExchangeRateSchema = z.object({
    id: z.number(),
    currency: z.enum([...currencySymbols] as [string, ...string[]]),
    rate: z.number(),
    date: z.date(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const currencyExchangeRateCreateSchema = currencyExchangeRateSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})
export const currencyExchangeRateUpdateSchema = currencyExchangeRateCreateSchema.partial().extend({
    id: z.number(),
})

export type CurrencyExchangeRate = z.infer<typeof currencyExchangeRateSchema>
export type CurrencyExchangeRateCreateType = z.infer<typeof currencyExchangeRateCreateSchema>
export type CurrencyExchangeRateUpdateType = z.infer<typeof currencyExchangeRateUpdateSchema>


export const MonthlyRefreshJobSchema = z.object({
    id: z.number(),
    targetMonth: z.date(),
    status: z.enum(['pending', 'running', 'partial_complete', 'completed', 'failed']),
    lastCursor: z.string().nullable().optional(),
    attemptCount: z.number(),
    startedAt: z.date().nullable().optional(),
    completedAt: z.date().nullable().optional(),
    errorSummary: z.string().nullable().optional(),
    lastRunAt: z.date().nullable().optional(),
    lastDurationMs: z.number().nullable().optional(),
    lastProcessedAssets: z.number().nullable().optional(),
    isTestData: z.boolean().optional(),
    userId: z.string(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const MonthlyRefreshJobCreateSchema = MonthlyRefreshJobSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})
export const MonthlyRefreshJobUpdateSchema = MonthlyRefreshJobCreateSchema.partial().extend({
    id: z.number(),
})

export type MonthlyRefreshJob = z.infer<typeof MonthlyRefreshJobSchema>
export type MonthlyRefreshJobCreateType = z.infer<typeof MonthlyRefreshJobCreateSchema>
export type MonthlyRefreshJobUpdateType = z.infer<typeof MonthlyRefreshJobUpdateSchema>

export const MonthlyRefreshOverviewSchema = z.object({
    jobId: z.number().optional(),
    status: z.enum(['idle', 'pending', 'running', 'partial_complete', 'completed', 'failed']),
    pendingCount: z.number(),
    failedCount: z.number(),
    estimatedCount: z.number(),
    completedCount: z.number(),
    targetMonth: z.date(),
    updatedAt: z.date().optional(),
    lastRunAt: z.date().nullable().optional(),
    lastDurationMs: z.number().nullable().optional(),
    lastProcessedAssets: z.number().nullable().optional(),
    isTestData: z.boolean().optional(),
})

export type MonthlyRefreshOverview = z.infer<typeof MonthlyRefreshOverviewSchema>

export const CronRunLogSchema = z.object({
    id: z.number(),
    targetMonth: z.date(),
    triggerType: z.enum(['scheduled', 'manual_test', 'manual_create']),
    status: z.enum(['idle', 'pending', 'running', 'partial_complete', 'completed', 'failed']),
    processedAssets: z.number(),
    message: z.string(),
    providerCounts: z.record(z.string(), z.number()).nullable().optional(),
    startedAt: z.date(),
    finishedAt: z.date().nullable().optional(),
    userId: z.string(),
    jobId: z.number().nullable().optional(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const CronRunLogCreateSchema = CronRunLogSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})
export const CronRunLogUpdateSchema = CronRunLogCreateSchema.partial().extend({
    id: z.number(),
})

export type CronRunLog = z.infer<typeof CronRunLogSchema>
export type CronRunLogCreateType = z.infer<typeof CronRunLogCreateSchema>
export type CronRunLogUpdateType = z.infer<typeof CronRunLogUpdateSchema>

export const AssetPriceSnapshotSchema = z.object({
    id: z.number(),
    targetMonth: z.date(),
    provider: z.string(),
    sourceKey: z.string(),
    price: z.number().nullable().optional(),
    currency: z.string().nullable().optional(),
    fetchedAt: z.date().nullable().optional(),
    status: z.enum(['pending', 'success', 'failed']),
    error: z.string().nullable().optional(),
    userId: z.string(),
    jobId: z.number().nullable().optional(),
    isTestData: z.boolean().optional(),
    updatedAt: z.date(),
    createdAt: z.date(),
})
export const AssetPriceSnapshotCreateSchema = AssetPriceSnapshotSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})
export const AssetPriceSnapshotUpdateSchema = AssetPriceSnapshotCreateSchema.partial().extend({
    id: z.number(),
})

export type AssetPriceSnapshot = z.infer<typeof AssetPriceSnapshotSchema>
export type AssetPriceSnapshotCreateType = z.infer<typeof AssetPriceSnapshotCreateSchema>
export type AssetPriceSnapshotUpdateType = z.infer<typeof AssetPriceSnapshotUpdateSchema>
