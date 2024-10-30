import { z } from 'zod';

export type currencyType = 'TWD' | 'USD';

export const UserFormSchema = z.object({
    id: z.number(),
    account: z.string(),
    password: z.string(),
    updateAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type UserForm = z.infer<typeof UserFormSchema>

export const SettingFormSchema = z.object({
    id: z.number(),
    accountingDate: z.date(),
    userId: z.number(),
    updateAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type SettingForm = z.infer<typeof SettingFormSchema>

export const CategoryFormSchema = z.object({
    id: z.number(),
    name: z.string(),
    isHide: z.boolean(),
    updateAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type CategoryForm = z.infer<typeof CategoryFormSchema>


export const TypeFormSchema = z.object({
    id: z.number(),
    name: z.string(),
    updateAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type TypeForm = z.infer<typeof TypeFormSchema>

export const HoldingFormSchema = z.object({
    id: z.number(),
    name: z.string(),
    symbol: z.string().optional(),
    typeId: z.number(),
    categoryId: z.number(),
    userId: z.number(),
    updateAt: z.date().optional(),
    createdAt: z.date().optional(),
})
export const HoldingsFormSchema = z.array(HoldingFormSchema);
export type HoldingForm = z.infer<typeof HoldingFormSchema>;
export type HoldingsForm = z.infer<typeof HoldingsFormSchema>;

export const BalanceRecordSchema = z.object({
    id: z.number(),
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
    updateAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type BalanceRecord = z.infer<typeof BalanceRecordSchema>

export const BalanceFormSchema = z.object({
    id: z.number(),
    date: z.date(),
    holdingId: z.number(),
    holding: HoldingFormSchema,
    quantity: z.number(),
    price: z.number(),
    value: z.number(),
    currency: z.enum(['TWD' , 'USD']).default('TWD'),
    note: z.string().optional(),
    userId: z.number(),
    updateAt: z.date().optional(),
    createdAt: z.date().optional(),
})

export type BalanceForm = z.infer<typeof BalanceFormSchema>