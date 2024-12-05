import SummaryCard from "./summary-card";
import { fetchSumOfAssets, fetchSumOfLiabilities } from "@/lib/actions";
import { ValueData } from "@/lib/definitions";
import { getCalculatedMonth } from "@/lib/utils";
export default async function SummarySection({
    queryDate,
    categories,
    valueData,
}:{
    queryDate: Date,
    categories: string[],
    valueData: ValueData[] | undefined,
}){
    //TODO: get currency from setting
    const displayCurrency = 'USD'
    // console.log(`value data: ${valueData}`)
    
    const monthValueData =  valueData 
                            ? valueData
                                .filter(valueData => valueData.date.getTime() === queryDate.getTime())
                            : []
    const lastMonthValueData =  valueData 
                            ? valueData
                                .filter(valueData => valueData.date.getTime() === getCalculatedMonth(queryDate, -1).getTime())
                            : []
    const sumOfLiabilities = monthValueData
                                .filter(valueData => valueData.type.name === 'Liabilities')
                                .reduce((total, valueData) => total + valueData.value, 0)
    const sumOfAssets =  monthValueData
                            .filter(valueData => valueData.type.name === 'Assets')
                            .reduce((total, valueData) => total + valueData.value, 0)
    const netValue = sumOfAssets - sumOfLiabilities;
    const lastMonthSumOfLiabilities = lastMonthValueData
                                        .filter(valueData => valueData.type.name === 'Liabilities')
                                        .reduce((total, valueData) => total + valueData.value, 0)
    const lastMonthSumOfAssets =  lastMonthValueData
                                    .filter(valueData => valueData.type.name === 'Assets')
                                    .reduce((total, valueData) => total + valueData.value, 0)
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