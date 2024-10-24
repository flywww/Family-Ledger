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
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"


//TODO: fetch display currency from setting
const displayedCurrency = 'USD'


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
    {
        id: "actions",
        cell:({row}) => {
            return(
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only"> Open menu </span>
                            <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                            Copy
                                <DropdownMenuSubContent>
                                    <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(row.original.quantity.toString())}
                                    > Copy quantity </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            const recordCurrency: currencyType =  row.original.currency;
                                            const recordDate = row.original.date;
                                            const convertedPrice = convertCurrency(recordCurrency,displayedCurrency,row.original.price,recordDate);
                                            navigator.clipboard.writeText(convertedPrice.toString())
                                        }}
                                    > Copy price </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            const recordCurrency: currencyType =  row.original.currency;
                                            const recordDate = row.original.date;
                                            const convertedValue = convertCurrency(recordCurrency,displayedCurrency,row.original.value,recordDate);
                                            navigator.clipboard.writeText(convertedValue.toString())
                                        }}
                                    > Copy value </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuSubTrigger>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem> Edit </DropdownMenuItem>
                        <DropdownMenuItem> Delete </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
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