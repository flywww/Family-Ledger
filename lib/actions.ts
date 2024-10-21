import prisma from "./prisma";
import { firstDateOfMonth } from "./utils";

export async function fetchMonthlyBalance( date: Date  ){
    
    const queryDate = firstDateOfMonth(date);
    console.log('Fetching monthly balance with date', date);

    try {
        const data = await prisma.balance.findMany({
            where:{
                date: date
            }
        })
        return data;
    } catch (error) {
        return [];
    }
}