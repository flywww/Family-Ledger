'use client'

import { createContext } from "react"
import { Balance ,FlattedBalanceType } from "@/lib/definitions"

export interface MonthBalanceContextType {
    monthBalanceData: FlattedBalanceType[],
    updateMonthBalanceData: (balanceData:FlattedBalanceType[]) => void;
    updateMonthBalance: (balanceData:FlattedBalanceType) => void;
}

export const MonthBalanceContext = createContext<MonthBalanceContextType | undefined>(undefined)