import { fetchMonthlyBalance } from "@/lib/actions";
import { Balance } from "@/lib/data";

export default async function BalanceTable({
    date,
}:{
    date:Date;
}){
    console.log('balance table query date:', date);
    const balanceData = await fetchMonthlyBalance(date);
    
    return(
        <>
            <div>Table</div>
            <div>{JSON.stringify(balanceData)}</div>
        </>
    )
}