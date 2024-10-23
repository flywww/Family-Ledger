import prisma from "./prisma";
import { BalanceRecord, BalanceRecordSchema } from "./definitions";


export async function fetchMonthlyBalance( queryDate: Date  ){
    //TODO: fetch with user id
    console.log('Fetching monthly balance with date', queryDate);

    try {
        const data = await prisma.balance.findMany({
            where:{ date: queryDate },
            select:{
                id: true,
                date: true,
                quantity: true,
                price: true,
                value: true,
                currency: true,
                note: true,
                userId: true,
                createdAt: true,
                updatedAt: true,
                holding:{
                    select:{
                        name: true,
                        symbol: true,
                        type:{
                            select:{
                                name: true,
                            }
                        },
                        category:{
                            select:{
                                name: true,
                                isHide: true,
                            }
                        }
                    }
                }
            },
            orderBy:{
                id: 'asc'
            }
        })

        const balanceRecords = data.map( (balance) => {
            const parsed = BalanceRecordSchema.safeParse({
                id: balance.id,
                date: balance.date,
                holdingName: balance.holding.name,
                holdingSymbol: balance.holding.symbol,
                categoryName: balance.holding.category.name,
                categoryIsHide: balance.holding.category.isHide,
                typeName: balance.holding.type.name,
                quantity: balance.quantity,
                price: balance.price,
                value: balance.value,
                currency: balance.currency as 'TWD' | 'USD',
                note: balance.note ?? undefined,
                userId: balance.userId,
                updateAt: balance.updatedAt,
                createdAt: balance.createdAt,
            })
            if(!parsed.success){
                console.error("Invalid balance record:", parsed.error);
                return null;
            }
            return parsed.data;
        })
        return balanceRecords;
    } catch (error) {
        console.error("Failed to fetch balance data:", error);
        return [];
    }
}

export async function fetchUserWithId( id:number ){

}

export async function fetchHoldingWithId( id:number ){

}
