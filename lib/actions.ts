import prisma from "./prisma";
import { firstDateOfMonth } from "./utils";

export async function fetchMonthlyBalance( queryDate: Date  ){
    
    console.log('Fetching monthly balance with date', queryDate);

    try {
        const data = await prisma.balance.findMany({
            where:{ date: queryDate }
        })
        return data;
    } catch (error) {
        return [];
    }
}