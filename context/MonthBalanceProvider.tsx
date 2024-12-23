'use client'

import { FlattedBalanceType } from "@/lib/definitions";
import { useEffect, useState } from "react";
import { MonthBalanceContext } from "./monthBalanceContext";

export const MonthBalanceProvider: React.FC<{children: React.ReactNode}> = ({children}) => {


    const [monthBalanceData, setMonthBalanceData] = useState<FlattedBalanceType[]>([]);
        const updateMonthBalanceData = (balanceData:FlattedBalanceType[]) => {
            setMonthBalanceData(balanceData);
        }
        const updateMonthBalance = (balanceData:FlattedBalanceType) => {
            //Find index in array
            
            console.log(`@@@@@ ${JSON.stringify(monthBalanceData)}`);
            
            const index = monthBalanceData?.findIndex( data => {
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