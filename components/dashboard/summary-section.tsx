import SummaryCard from "./summary-card";
import { currencyType, typeListType, ValueData } from "@/lib/definitions";
import { getCalculatedMonth } from "@/lib/utils";
import { enUSNumberFormat } from "../../lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export default async function SummarySection({
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
    const monthValueData = valueData?.filter(valueData => ((valueData.date.toISOString().slice(0,7) === queryDate.toISOString().slice(0,7)))) || [];
    const lastMonthValueData = valueData?.filter(valueData => (valueData.date.toISOString().slice(0,7) === getCalculatedMonth(queryDate, -1).toISOString().slice(0,7))) || [];
    const sumOfAssets = sumCalculate( monthValueData, 'Assets');
    const sumOfLiabilities = sumCalculate( monthValueData, 'Liabilities');
    const lastMonthSumOfAssets = sumCalculate( lastMonthValueData, 'Assets');
    const lastMonthSumOfLiabilities = sumCalculate( lastMonthValueData, 'Liabilities');
    const netValue = sumOfAssets - sumOfLiabilities;
    const lastMonthNetValue = lastMonthSumOfAssets - lastMonthSumOfLiabilities;
    
    return(
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 w-full">
            <SummaryCard
                title='Net value'
                value={`${enUSNumberFormat(netValue.toFixed(0)).toString()}`}
                description={`${netValue - lastMonthNetValue > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(netValue - lastMonthNetValue).toFixed(0))} from last month`}
                currency={currency}
                className="hidden sm:block"
            />
            <SummaryCard
                title='Assets'
                value={`${enUSNumberFormat(sumOfAssets.toFixed(0)).toString()}`}
                description={`${sumOfAssets - lastMonthSumOfAssets > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfAssets - lastMonthSumOfAssets).toFixed(0))} from last month`}
                currency={currency}
                className="hidden sm:block"
            />
            <SummaryCard
                title='Liabilities'
                value={`${enUSNumberFormat(sumOfLiabilities.toFixed(0)).toString()}`}
                description={`${sumOfLiabilities - lastMonthSumOfLiabilities > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfLiabilities - lastMonthSumOfLiabilities).toFixed(0))} from last month`}
                currency={currency}
                className="hidden sm:block"
            />
            <Card className={`w-full block sm:hidden`}>
                <CardHeader>
                    <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-2 justify-start items-baseline">
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-row gap-2 justify-start items-baseline">
                                <p className="font-semibold text-xl">Net value</p>
                                <p className="font-normal text-xl">{`${enUSNumberFormat(netValue.toFixed(0)).toString()}`}</p>
                                <p className="text-sm font-extralight">{currency}</p>    
                            </div>        
                            <p className="text-sm font-extralight">{`${netValue - lastMonthNetValue > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(netValue - lastMonthNetValue).toFixed(0))} from last month`}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-row gap-2 justify-start items-baseline">
                                <p className="font-semibold text-xl">Assets</p>
                                <p className="font-normal text-xl">{`${enUSNumberFormat(sumOfAssets.toFixed(0)).toString()}`}</p>
                                <p className="text-sm font-extralight">{currency}</p>    
                            </div>        
                            <p className="text-sm font-extralight">{`${sumOfAssets - lastMonthSumOfAssets > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfAssets - lastMonthSumOfAssets).toFixed(0))} from last month`}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                            <div className="flex flex-row gap-2 justify-start items-baseline">
                                <p className="font-semibold text-xl">Liabilities</p>
                                <p className="font-normal text-xl">{`${enUSNumberFormat(sumOfLiabilities.toFixed(0)).toString()}`}</p>
                                <p className="text-sm font-extralight">{currency}</p>    
                            </div>        
                            <p className="text-sm font-extralight">{`${sumOfLiabilities - lastMonthSumOfLiabilities > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfLiabilities - lastMonthSumOfLiabilities).toFixed(0))} from last month  `}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}