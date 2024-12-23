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
            setMonthBalanceData([...balanceData]);
        } else {
            console.log("No update needed; data is the same.");
        }
    }

    const updateMonthBalance = (balanceData:FlattedBalanceType) => {
        //Find index in array
        
        console.log(`@@@@@ ${JSON.stringify(monthBalanceData)}`);
        
        const index = monthBalanceData?.findIndex( (data:FlattedBalanceType) => {
            console.log(`%%%%% data.id: ${data}`);
            console.log(`%%%%% balanceData.id: ${balanceData.id}`);    
            return data.id === balanceData.id
    })
        console.log(`???? index: ${index}`);
        console.log(`???? balanceData: ${JSON.stringify(balanceData)}`);
        console.log(`???? monthBalanceData: ${JSON.stringify(monthBalanceData)}`);
    
        //Replace the object by index
        if(index !== -1 && monthBalanceData) {
            monthBalanceData[index] = balanceData;
            console.log(`????!!!! monthBalanceData: ${JSON.stringify(monthBalanceData)}`);
            setMonthBalanceData([...monthBalanceData]);
        }
    }

    useEffect(()=>{
        console.log(`!!!monthBalanceData is updated: ${JSON.stringify(monthBalanceData)}`);
        
    },[monthBalanceData])

    return (
        <MonthBalanceContext.Provider value = {{monthBalanceData, updateMonthBalanceData, updateMonthBalance}}>
            {children}
        </MonthBalanceContext.Provider>
    );
}