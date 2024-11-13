import { z } from 'zod';

export type currencyType = 'TWD' | 'USD';

export const UserSchema = z.object({
    id: z.number(),
    account: z.string(),
    password: z.string(),
    updatedAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type User = z.infer<typeof UserSchema>

export const SettingSchema = z.object({
    id: z.number(),
    accountingDate: z.date(),
    userId: z.number(),
    updatedAt: z.date(),
    createdAt: z.date(),
})

export type Setting = z.infer<typeof SettingSchema>

export const CategorySchema = z.object({
    id: z.number(),
    name: z.string(),
    isHide: z.boolean(),
    updatedAt: z.date(),
    createdAt: z.date(),
})

export type Category = z.infer<typeof CategorySchema>

export const CategoryCreateSchema = CategorySchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})

export type CategoryCreateType = z.infer<typeof CategoryCreateSchema>

export const TypeSchema = z.object({
    id: z.number(),
    name: z.string(),
    updatedAt: z.date(),
    createdAt: z.date(),
})

export type Type = z.infer<typeof TypeSchema>

export const TypeCreateSchema = TypeSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})

export type TypeCreateType = z.infer<typeof TypeCreateSchema>

export const HoldingSchema = z.object({
    id: z.number(),
    name: z.string(),
    symbol: z.string(),
    typeId: z.number(),
    categoryId: z.number(),
    userId: z.number(),
    sourceURL: z.string().nullable().optional(),
    sourceId: z.number().nullable().optional(),
    updatedAt: z.date(),
    createdAt: z.date(),
})

export type Holding = z.infer<typeof HoldingSchema>;
export const HoldingArraySchema = z.array(HoldingSchema);
export type HoldingsArray = z.infer<typeof HoldingArraySchema>;

export const HoldingCreateSchema = HoldingSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
})

export type HoldingCreateType = z.infer<typeof HoldingCreateSchema>

export const BalanceRecordSchema = z.object({
    id: z.number().optional(),
    date: z.date(),
    holdingId: z.number(),
    holdingName: z.string().optional(),
    holdingSymbol: z.string(),
    categoryId: z.number().optional(),
    categoryName: z.string(),
    categoryIsHide: z.boolean(),
    typeId: z.number().optional(),
    typeName: z.string(),
    quantity: z.number(),
    price: z.number(),
    value: z.number(),
    currency: z.enum(['TWD' , 'USD']).default('TWD'),
    note: z.string().optional(),
    userId: z.number(),
    updatedAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type BalanceRecord = z.infer<typeof BalanceRecordSchema>

export const BalanceFormSchema = z.object({
    id: z.number().optional(),
    date: z.date(),
    holdingId: z.number(),
    quantity: z.number(),
    price: z.number(),
    value: z.number(),
    currency: z.enum(['TWD' , 'USD']).default('TWD'),
    note: z.string().optional(),
    userId: z.number(),
    updatedAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type BalanceForm = z.infer<typeof BalanceFormSchema>