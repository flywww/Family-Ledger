import { z } from 'zod';
import NextAuth, { DefaultSession, User as AuthUser } from 'next-auth';

export type currencyType = 'TWD' | 'USD';
export type categoryListType = 'Cash' | 'Cryptocurrency' | 'Listed stock' | 'Unlisted stock';
export type typeListType = 'Assets' | 'Liabilities'

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
    displayCurrency: z.enum(['TWD','USD']),
    displayCategories: z.string(),
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
    currency: z.enum(['TWD' , 'USD']).default('TWD'),
    note: z.preprocess((val) => val ?? "", z.string().optional()),
    userId: z.string(),
    user: UserSchema.optional(),
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
