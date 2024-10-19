import prisma from "./prisma";

export async function fetchMonthlyBalance( year:string, month:string  ){
    
    const lastDateOfMonth = (date = new Date()) =>
        new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const firstDateOfMonth = (date = new Date()) =>
        new Date(date.getFullYear(), date.getMonth() , 1);

    const localStartDate = firstDateOfMonth(new Date(`${year}-${month}`));
    const localEndDate = lastDateOfMonth(new Date(localStartDate));
    const UTCStartDate = new Date(localStartDate).toUTCString();
    const UTCEndDate = new Date(localEndDate).toUTCString();
    
    console.log('fetch function timezone:')
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
    
    console.log('Fetching monthly balance from');
    console.log(UTCStartDate);
    console.log(UTCEndDate);

    try {
        const data = await prisma.balance.findMany({
            where:{
                date:{
                    gte: localStartDate,
                    lte: localEndDate,
                }
            }
        })
        return data;
    } catch (error) {
        return [];
    }
}