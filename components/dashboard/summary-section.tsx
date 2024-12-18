'use client'

import { SettingContext } from "@/context/settingContext";
import SummaryCard from "./summary-card";
import { currencyType, typeListType, ValueData } from "@/lib/definitions";
import { convertCurrency, getCalculatedMonth } from "@/lib/utils";
import { useContext, useEffect, useState } from "react";
import { enUSNumberFormat } from "../../lib/utils"

export default function SummarySection({
    queryDate,
    valueData,
}:{
    queryDate: Date,
    valueData: ValueData[] | undefined,
}){
    const [displayedCurrency, setDisplayedCurrency] = useState<currencyType>('USD');
    const [monthValueData, setMonthValueData] = useState<ValueData[]>([])
    const [lastMonthValueData, setLastMonthValueData] = useState<ValueData[]>([])
    const [sumOfLiabilities, setSumOfLiabilities] = useState<number>(0)
    const [sumOfAssets, setSumOfAssets] =  useState<number>(0)
    const [netValue, setNetValue] = useState<number>(0)
    const [lastMonthSumOfLiabilities, setLastMonthSumOfLiabilities] = useState<number>(0)
    const [lastMonthSumOfAssets, setLastMonthSumOfAssets] =  useState<number>(0)
    const [lastMonthNetValue, setLastMonthNetValue] = useState<number>(0)


    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { setting } = settingContext;         
    const sumCalculate = ( data:ValueData[], type:typeListType, currency:currencyType): number => {
        const sum = data
            .filter(data => data.type.name === type)
            .reduce((total, valueData) => total + convertCurrency('USD',currency,valueData.value,new Date()), 0)
        return sum;
    }

    useEffect(()=>{
        setLastMonthValueData(valueData?.filter(valueData => valueData.date.getTime() === getCalculatedMonth(queryDate, -1).getTime()) || []);
        setMonthValueData(valueData?.filter(valueData => valueData.date.getTime() === queryDate.getTime()) || []);
    }, [queryDate])

    useEffect(()=>{
        if (setting && 'displayCurrency' in setting){
            setDisplayedCurrency(setting.displayCurrency as currencyType);
        }
    }, [setting])

    useEffect(()=>{
        setSumOfLiabilities(sumCalculate( monthValueData, 'Liabilities', displayedCurrency ))
        setSumOfAssets(sumCalculate( monthValueData, 'Assets', displayedCurrency ))    
        setLastMonthSumOfLiabilities(sumCalculate( lastMonthValueData, 'Liabilities', displayedCurrency ))
        setLastMonthSumOfAssets(sumCalculate( lastMonthValueData, 'Assets', displayedCurrency ))        
    }, [displayedCurrency, monthValueData, lastMonthValueData])

    useEffect(() => {
        setNetValue(sumOfAssets - sumOfLiabilities);
        setLastMonthNetValue(lastMonthSumOfAssets - lastMonthSumOfLiabilities);
    }, [sumOfAssets, sumOfLiabilities, lastMonthSumOfAssets, lastMonthSumOfLiabilities])
    
    return(
        <div className="flex flex-row gap-4 pt-3">
            <SummaryCard
                title='Net value'
                value={`${enUSNumberFormat(netValue.toFixed(0)).toString()}`}
                description={`${netValue - lastMonthNetValue > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(netValue - lastMonthNetValue).toFixed(0))} from last month`}
                currency={displayedCurrency}
            />
            <SummaryCard
                title='Assets'
                value={`${enUSNumberFormat(sumOfAssets.toFixed(0)).toString()}`}
                description={`${sumOfAssets - lastMonthSumOfAssets > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfAssets - lastMonthSumOfAssets).toFixed(0))} from last month`}
                currency={displayedCurrency}
            />
            <SummaryCard
                title='Liabilities'
                value={`${enUSNumberFormat(sumOfLiabilities.toFixed(0)).toString()}`}
                description={`${sumOfLiabilities - lastMonthSumOfLiabilities > 0 ? '+' : '-'}${enUSNumberFormat(Math.abs(sumOfLiabilities - lastMonthSumOfLiabilities).toFixed(0))} from last month`}
                currency={displayedCurrency}
            />
        </div>
    )
}