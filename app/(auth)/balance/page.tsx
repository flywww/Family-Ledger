import { Button } from "@/components/ui/button"
import { format } from "date-fns";
import Search from "@/components/balance/search";
import BalanceTable from "@/components/balance/balance-table";
import { firstDateOfMonth } from "@/lib/utils";

export default async function Page({
  searchParams,
}:{
  searchParams?:{
    date?: string;
  }
}) {

    let queryDate = firstDateOfMonth(new Date());
    if(searchParams?.date) queryDate = new Date(searchParams.date);

    return (
      <div>
        <h1> balance page</h1>
        <Search/>
        <BalanceTable date={ queryDate }/>
      </div>
    )
  }