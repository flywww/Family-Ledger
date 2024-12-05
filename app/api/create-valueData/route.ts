import { createValueData, fetchMonthlyBalance } from "@/lib/actions";
import prisma from "../../../lib/prisma";
import { delay } from "@/lib/utils";

export async function POST(req: Request) {
    try {
        const balanceArray = await prisma.balance.findMany({
            where:{},
            distinct:['date'],
            select:{
                date: true
            }
        })

        balanceArray.map(async ({date}) => {
            
            const monthlyBalance = await fetchMonthlyBalance(date);
            if(monthlyBalance){
                await createValueData(date, monthlyBalance);
                delay(1000);
            }
            
        })
        

    } catch (error) {
        
    }
}