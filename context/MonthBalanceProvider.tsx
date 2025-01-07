'use client'

import { FlattedBalanceType } from "@/lib/definitions";
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
            console.log("[MonthBalanceProvider] No update needed; data is the same.");
        }
    }
    const updateMonthBalance = (newBalance:FlattedBalanceType) => {
        const newMonthBalanceData = monthBalanceData.map( balance => {
            return balance.id === newBalance.id ? newBalance : balance
        })
        setMonthBalanceData(newMonthBalanceData);
    }
    //Update monthBalanceData when page fetch new data
    useEffect(() => {
        setMonthBalanceData(initialData);
    }, [initialData]);

    return (
        <MonthBalanceContext.Provider value = {{monthBalanceData, updateMonthBalanceData, updateMonthBalance}}>
            {children}
        </MonthBalanceContext.Provider>
    );
}