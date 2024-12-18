import SummaryCard from "./summary-card";
import { currencyType, typeListType, ValueData } from "@/lib/definitions";
import { getCalculatedMonth } from "@/lib/utils";
import { enUSNumberFormat } from "../../lib/utils"

export default function SummarySection({
    queryDate,
    valueData,
    currency,
}:{
    queryDate: Date,
    valueData: ValueData[] | undefined,
    currency: currencyType,
}){

    const sumCalculate = ( data:ValueData[], type:typeListType): number => {
        const sum = data
            .filter(data => data.type.name === type)
            .reduce((total, valueData) => total + valueData.value, 0)
        return sum;
    }

    const monthValueData = valueData?.filter(valueData => valueData.date.getTime() === queryDate.getTime()) || [];
    const lastMonthValueData = valueData?.filter(valueData => valueData.date.getTime() === getCalculatedMonth(queryDate, -1).getTime()) || [];
    const sumOfAssets = sumCalculate( monthValueData, 'Assets');
    const sumOfLiabilities = sumCalculate( monthValueData, 'Liabilities');
    const lastMonthSumOfAssets = sumCalculate( lastMonthValueData, 'Assets');
    const lastMonthSumOfLiabilities = sumCalculate( lastMonthValueData, 'Liabilities');
    const netValue = sumOfAssets - sumOfLiabilities;
    const lastMonthNetValue = lastMonthSumOfAssets - lastMonthSumOfLiabilities;
    
    return(
        <div className="flex flex-row gap-4 pt-3">
            <SummaryCard
                title='Net value'
                value={`${enUSNumberFormat(netValue.toFixed(0)).toString()}`}
                description={`${netValue - lastMonthNetValue > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(netValue - lastMonthNetValue).toFixed(0))} from last month`}
                currency={currency}
            />
            <SummaryCard
                title='Assets'
                value={`${enUSNumberFormat(sumOfAssets.toFixed(0)).toString()}`}
                description={`${sumOfAssets - lastMonthSumOfAssets > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfAssets - lastMonthSumOfAssets).toFixed(0))} from last month`}
                currency={currency}
            />
            <SummaryCard
                title='Liabilities'
                value={`${enUSNumberFormat(sumOfLiabilities.toFixed(0)).toString()}`}
                description={`${sumOfLiabilities - lastMonthSumOfLiabilities > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfLiabilities - lastMonthSumOfLiabilities).toFixed(0))} from last month`}
                currency={currency}
            />
        </div>
    )
}