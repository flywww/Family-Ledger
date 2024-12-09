import BalanceTable from "@/components/balance/balance-table";
import { firstDateOfMonth, getCalculatedMonth } from "@/lib/utils";
import { fetchLastDateOfBalance, fetchMonthlyBalance } from "@/lib/actions";
import { FlattedBalanceType } from "@/lib/definitions";

export default async function Page({
  searchParams,
}:{
  searchParams?:{
    date?: string;
  }
}) {
    
    const queryDate = searchParams?.date ? new Date(searchParams.date) : await fetchLastDateOfBalance() || getCalculatedMonth(new Date(), -1);
    console.log(`[getCalculatedMonth] query date in balance page ${queryDate}`);
    //TODO: fetch with user id
    const balanceData = await fetchMonthlyBalance(queryDate);
    const flattedBalanceData = balanceData?.map( (balance) => ({
        ...balance,
        holdingName: balance?.holding?.name,
        holdingSymbol: balance?.holding?.symbol,
        holdingCategoryName: balance?.holding?.category?.name,
        holdingTypeName: balance?.holding?.type?.name,
    } as FlattedBalanceType)) 

    return (
      <div>
        {flattedBalanceData && <BalanceTable 
          queryDate={ queryDate } 
          data={ flattedBalanceData }
        />}
      </div>
    )
  }