import { Button } from "@/components/ui/button"
import { format } from "date-fns";
import Search from "@/components/balance/search";
import { monthList } from "@/lib/data";
import BalanceTable from "@/components/balance/balance-table";



export default async function Page({
  searchParams,
}:{
  searchParams?:{
    month?: string;
    year?: string
  }
}) {
    
    //TODO: Check localized date 

    console.log('balance page timezone:')
    console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);

    let queryMonth:string = "";
    let queryYear:string = "";

    if(!searchParams?.month || !searchParams?.year){
      queryYear = new Date().getFullYear().toString();
      queryMonth = monthList[new Date().getMonth()].toString();
    }else{
      queryYear = searchParams.year;
      queryMonth = searchParams.month;
    }

    const todayDate = new Date();

    return (
      <div>
        <h1> balance page</h1>
        <h2>{todayDate.toString()}</h2>
        <h2>{todayDate.toUTCString()}</h2>
        <h2>{todayDate.toISOString()}</h2>
        <h2>{todayDate.toDateString()}</h2>
        <Search/>
        <BalanceTable month={queryMonth} year={queryYear}/>
      </div>
    )
  }