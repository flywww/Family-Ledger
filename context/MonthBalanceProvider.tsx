'use client'

import { FlattedBalanceSchema, FlattedBalanceType } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { MonthBalanceContext } from "./monthBalanceContext";

export const MonthBalanceProvider: React.FC<{
    children: React.ReactNode,
    initialData: FlattedBalanceType[],
}> = ({
    children,
    initialData,
}) => {

    const [monthBalanceData, setMonthBalanceData] = useState<FlattedBalanceType[]>(initialData);
    const updateMonthBalanceData = (balanceData:FlattedBalanceType[]) => {
        if (JSON.stringify(balanceData) !== JSON.stringify(monthBalanceData)) {
            //console.log(`[MonthBalanceProvider] update monthBalanceData: ${JSON.stringify(balanceData)}`);
            setMonthBalanceData([...balanceData]);
        } else {
            console.log("[MonthBalanceProvider] No update needed; data is the same.");
        }
    }

    const updateMonthBalance = (balanceData:FlattedBalanceType) => {
        //Find index in array
        const index = monthBalanceData?.findIndex( (data:FlattedBalanceType) => {
            return data.id === balanceData.id
        })
    
        //Replace the object by index
        if(index !== -1 && monthBalanceData) {
            monthBalanceData[index] = balanceData;
            //console.log(`[MonthBalanceProvider] new monthBalance: ${JSON.stringify(monthBalanceData[index].quantity)}`);
            setMonthBalanceData([...monthBalanceData]);
        }
    }

    useEffect(()=>{
        console.log(`[MonthBalanceProvider] monthBalanceData is updated: ${JSON.stringify(monthBalanceData)}`);
        
    },[monthBalanceData])

    return (
        <MonthBalanceContext.Provider value = {{monthBalanceData, updateMonthBalanceData, updateMonthBalance}}>
            {children}
        </MonthBalanceContext.Provider>
    );
}