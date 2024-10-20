import { fetchMonthlyBalance } from "@/lib/actions";

export default async function BalanceTable({
    month,
    year,
}:{
    month:string;
    year:string;
}){
    console.log('balance table timezone:',Intl.DateTimeFormat().resolvedOptions().timeZone)

    console.log('Table check');
    console.log(month);
    console.log(year);
    
    const balanceData = await fetchMonthlyBalance(year, month);
    console.log('BalanceData');
    console.log(JSON.stringify(balanceData[0]));
    console.log(JSON.stringify(balanceData[1]));
    
    
    

    return(
        <>
            <div>Table</div>
            <div>{JSON.stringify(balanceData)}</div>
        </>
    )
}