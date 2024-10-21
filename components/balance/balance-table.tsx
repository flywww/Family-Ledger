import { fetchMonthlyBalance } from "@/lib/actions";
import { Balance } from "@/lib/definitions";

export default async function BalanceTable({
    date,
}:{
    date:Date;
}){
    console.log('balance table query date:', date);
    const balanceData = await fetchMonthlyBalance(date);
    console.log('balance table query result:', balanceData[0]);
    console.log('balance table query result:', balanceData[1]);

    return(
        <>
            <div>Table</div>
            <div>{JSON.stringify(balanceData)}</div>
        </>
    )
}