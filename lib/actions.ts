import prisma from "./prisma";
import { firstDateOfMonth } from "./utils";

export async function fetchMonthlyBalance( queryDate: Date  ){
    
    console.log('Fetching monthly balance with date', queryDate);

    const testData = await prisma.balance.findFirst();
    console.log('Fetching monthly first testing data', testData);

    try {
        const data = await prisma.balance.findMany({
            where:{ date: queryDate }
        })
        return data;
    } catch (error) {
        return [];
    }
}