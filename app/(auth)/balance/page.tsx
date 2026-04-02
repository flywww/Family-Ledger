import BalanceTable from "@/components/balance/balance-table";
import {
  fetchCronHealth,
  fetchCurrentMonthBalanceCreationState,
  fetchLastDateOfBalance,
  fetchMonthlyBalance,
  fetchMonthlyRefreshState,
  fetchSetting,
  getConvertedCurrency,
} from "@/lib/actions";
import { balanceAnalysisViewType, currencyType, FlattedBalanceType } from "@/lib/definitions";
import { MonthBalanceProvider } from "@/context/MonthBalanceProvider";
import { auth } from "@/auth";
import { getCalculatedMonth, monthKeyToDate, resolveMonthKey } from "@/lib/utils";
import { Metadata } from "next";
import MonthlyRefreshStatus from "@/components/monthly-refresh-status";
import RetryFailedButton from "@/components/balance/retry-failed-button";
import { resolveBalanceAnalysisView } from "@/lib/balance-analysis";
import CronHealthAlert from "@/components/cron-health-alert";

export const metadata: Metadata = {
	title: 'Balance',
};

export default async function Page(
  props:{
    searchParams?: Promise<{
      month?: string;
      date?: string;
      currency?: string,
      view?: string,
    }>
  }
) {
  const searchParams = await props.searchParams;
  const fallbackDate = (await fetchLastDateOfBalance()) || getCalculatedMonth(new Date(), -1);
  const queryMonthKey = resolveMonthKey({
    month: searchParams?.month,
    date: searchParams?.date,
    fallback: fallbackDate,
  });
  const queryDate = monthKeyToDate(queryMonthKey);
  const session = await auth();
  const setting = session && (await fetchSetting(session.user.id));
  const displayCurrency = (searchParams?.currency ? searchParams.currency : setting?.displayCurrency || 'USD') as currencyType;
  const queryView = resolveBalanceAnalysisView(searchParams?.view) as balanceAnalysisViewType;
  const balanceData = await fetchMonthlyBalance(queryDate);
  const refreshState = await fetchMonthlyRefreshState(queryDate);
  const cronHealth = await fetchCronHealth();
  const currentMonthCreationState = session
    ? await fetchCurrentMonthBalanceCreationState(session.user.id, queryMonthKey)
    : undefined;
  const flattedBalanceData = await Promise.all(balanceData?.map(async (balance) => ({
      ...balance,
      price: await getConvertedCurrency(balance.currency as currencyType, displayCurrency, balance.price, balance.date),
      value: await getConvertedCurrency(balance.currency as currencyType, displayCurrency, balance.value, balance.date),
      holdingName: balance?.holding?.name,
      holdingSymbol: balance?.holding?.symbol,
      holdingCategoryName: balance?.holding?.category?.name,
      holdingTypeName: balance?.holding?.type?.name,
      percentage: 0,
  })) as Promise<FlattedBalanceType>[]);
  //TODO: long loading while switch date
  return (
    <MonthBalanceProvider initialData={flattedBalanceData || []}>
      <div className="flex flex-col gap-4">
          <CronHealthAlert health={cronHealth} />
          <MonthlyRefreshStatus
            overview={refreshState}
            action={
              refreshState && refreshState.failedCount > 0 ? (
                <RetryFailedButton date={queryDate} />
              ) : undefined
            }
          />
          {flattedBalanceData &&
              <BalanceTable 
                queryDate={ queryDate } 
                queryMonthKey={queryMonthKey}
                queryView={queryView}
                refreshState={refreshState}
                currentMonthCreationState={currentMonthCreationState}
              />
          }
      </div>
    </MonthBalanceProvider>
  )
}
