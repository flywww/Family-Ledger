'use client'

import { BalanceRecord, currencyType } from "@/lib/definitions"
import { convertCurrency } from "@/lib/utils"
import { ColumnDef, Row } from '@tanstack/react-table'
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"


//TODO: fetch display currency from setting
const displayedCurrency = 'TWD'


export const columns: ColumnDef<BalanceRecord>[] = [
    {
        accessorKey: "holdingName",
        header: "Name",
    },
    {
        accessorKey: "holdingSymbol",
        header: "Symbol",
    },
    {
        accessorKey: "categoryName",
        header: "Category",
    },
    {
        accessorKey: "typeName",
        header: "Type",
    },
    {
        accessorKey: "quantity",
        header: "Quantity",
    },
    {
        accessorKey: "price",
        header: () => <div className="text-right">Price</div>,
        cell:({row}) => moneyCellFormatter(row, 'price')
    },
    {
        accessorKey: "value",
        header: () => <div className="text-right">Value</div>,
        cell:({row}) => moneyCellFormatter(row, 'value')
    },
    {
        accessorKey: "note",
        header: "Note",
    },
] 

const moneyCellFormatter = (row: Row<BalanceRecord>, key: string) => {
    const recordPrice = parseFloat(row.getValue(key))
            const recordCurrency: currencyType =  row.original.currency;
            const recordDate = row.original.date;
            const convertedPrice = convertCurrency(recordCurrency,displayedCurrency,recordPrice,recordDate);
            const formattedPrice = new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: displayedCurrency,
            }).format(convertedPrice)
            return <div className="text-right font-medium">{formattedPrice}</div>
}