import SummaryCard from "./summary-card";
import { fetchSumOfAssets, fetchSumOfLiabilities } from "@/lib/actions";
import { getCalculatedMonth } from "@/lib/utils";
export default async function SummarySection({
    queryDate,
    excludedCategory,
}:{
    queryDate: Date,
    excludedCategory: string[]
}){
    //TODO: get currency from setting
    const displayCurrency = 'USD'
    const sumOfLiabilities = await fetchSumOfLiabilities(queryDate, excludedCategory, displayCurrency) || 0;
    const sumOfAssets =  await fetchSumOfAssets(queryDate, excludedCategory, displayCurrency) || 0;
    const netValue = sumOfAssets - sumOfLiabilities;
    const lastMonthSumOfLiabilities = await fetchSumOfLiabilities(getCalculatedMonth(queryDate, -1), excludedCategory, displayCurrency) || 0;
    const lastMonthSumOfAssets =  await fetchSumOfAssets(getCalculatedMonth(queryDate, -1), excludedCategory, displayCurrency) || 0;
    const lastMonthNetValue = lastMonthSumOfAssets - lastMonthSumOfLiabilities;

    return(
        <div className="flex flex-row gap-4 pt-3">
            <SummaryCard
                title='Net value'
                value={`${netValue.toFixed(0).toString()}`}
                description={`${netValue - lastMonthNetValue > 0 ? '+' : '-'}${Math.abs(netValue - lastMonthNetValue).toFixed(0)} from last month`}
                currency={displayCurrency}
            />
            <SummaryCard
                title='Assets'
                value={`${sumOfAssets.toFixed(0).toString()}`}
                description={`${sumOfAssets - lastMonthSumOfAssets > 0 ? '+' : '-'}${Math.abs(sumOfAssets - lastMonthSumOfAssets).toFixed(0)} from last month`}
                currency={displayCurrency}
            />
            <SummaryCard
                title='Liabilities'
                value={`${sumOfLiabilities.toFixed(0).toString()}`}
                description={`${sumOfLiabilities - lastMonthSumOfLiabilities > 0 ? '+' : '-'}${Math.abs(sumOfLiabilities - lastMonthSumOfLiabilities).toFixed(0)} from last month`}
                currency={displayCurrency}
            />
        </div>
    )
}