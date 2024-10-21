import prisma from "./prisma";
import { firstDateOfMonth } from "./utils";

export async function fetchMonthlyBalance( queryDate: Date  ){
    
    console.log('Fetching monthly balance with date', queryDate);

    //const testData = await prisma.balance.findFirst();
    //console.log('Fetching monthly first testing data', testData);

    const startOfDay = new Date(queryDate);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(queryDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    try {
        const data = await prisma.balance.findMany({
            where:{ 
                date: {
                    gte: startOfDay,
                    lte: endOfDay,
                  },
             }
        })
        return data;
    } catch (error) {
        return [];
    }
}