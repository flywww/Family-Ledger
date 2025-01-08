import BalanceTable from "@/components/balance/balance-table";
import { fetchLastDateOfBalance, fetchMonthlyBalance, fetchSetting, getConvertedCurrency } from "@/lib/actions";
import { currencyType, FlattedBalanceType } from "@/lib/definitions";
import { MonthBalanceProvider } from "@/context/MonthBalanceProvider";
import { auth } from "@/auth";
import { getCalculatedMonth } from "@/lib/utils";
import { Metadata } from "next";

export const metadata: Metadata = {
	title: 'Balance',
};

export default async function Page({
  searchParams,
}:{
  searchParams?:{
    date?: string;
    currency?: string,
  }
}) {
    const queryDate = searchParams?.date ? new Date(searchParams.date) : await fetchLastDateOfBalance() || getCalculatedMonth(new Date(), -1);
    const session = await auth();
    const setting = session && await fetchSetting(session.user.id);;
    const displayCurrency = (searchParams?.currency ? searchParams.currency : setting?.displayCurrency || 'USD') as currencyType;
    const balanceData = await fetchMonthlyBalance(queryDate);
    const flattedBalanceData = await Promise.all(balanceData?.map(async (balance) => ({
        ...balance,
        price: await getConvertedCurrency(balance.currency as currencyType, displayCurrency, balance.price, balance.date),
        value: await getConvertedCurrency(balance.currency as currencyType, displayCurrency, balance.value, balance.date),
        holdingName: balance?.holding?.name,
        holdingSymbol: balance?.holding?.symbol,
        holdingCategoryName: balance?.holding?.category?.name,
        holdingTypeName: balance?.holding?.type?.name,
    })) as Promise<FlattedBalanceType>[]);    
    //TODO: long loading while switch date
    return (
      <MonthBalanceProvider initialData={flattedBalanceData || []}>
        <div>
            {flattedBalanceData &&
                <BalanceTable 
                  queryDate={ queryDate } 
                  data={ flattedBalanceData }
                />
            }
        </div>
      </MonthBalanceProvider>
    )
  }