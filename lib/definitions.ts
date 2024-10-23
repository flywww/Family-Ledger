import { z } from 'zod';

export const BalanceRecordSchema = z.object({
    id: z.number(),
    date: z.date(),
    holdingName: z.string(),
    holdingSymbol: z.string(),
    categoryName: z.string(),
    categoryIsHide: z.boolean(),
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