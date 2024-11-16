'use client'

import { BalanceCreateType, FlattedBalanceType, currencyType } from "@/lib/definitions"
import { convertCurrency } from "@/lib/utils"
import { ColumnDef, Row, Column } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
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
import { deleteBalance } from "@/lib/actions"
import Link from "next/link"


//TODO: fetch displayed currency from setting
const displayedCurrency = 'USD'

const moneyCellFormatter = (row: Row<FlattedBalanceType>, key: string) => {
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

const numberCellFormatter = (row: Row<FlattedBalanceType>, key: string) => {
    const recordNumber = parseInt(row.getValue(key))
    return <div className="text-right font-medium">{recordNumber}</div>
}

const getSortedHeader = ( column: Column<FlattedBalanceType>, headerName:string ) => {
    return(
        <Button
            variant="ghost"
            onClick={ () => column.toggleSorting(column.getIsSorted() === "asc" ) }
        >
        {headerName}
        <ArrowUpDown className="ml-2 h-4 w-4"/>
        </Button>
    )
}


export const columns: ColumnDef<FlattedBalanceType>[] = [
    {
        accessorKey: "holdingName",
        header: "Name",
    },
    {
        accessorKey: "holdingSymbol",
        header: "Symbol",
    },
    {
        accessorKey: "holdingCategoryName",
        header: ({column}) => getSortedHeader(column, "Category"),
    },
    {
        accessorKey: "holdingTypeName",
        header: ({column}) => getSortedHeader(column, "Type"),
    },
    {
        accessorKey: "quantity",
        header: ({column}) => getSortedHeader(column, "Quantity"),
        cell:({row}) => numberCellFormatter(row, 'quantity')
    },
    {
        accessorKey: "price",
        header: ({column}) => getSortedHeader(column, "Price"),
        cell:({row}) => moneyCellFormatter(row, 'price')
    },
    {
        accessorKey: "value",
        header: ({column}) => getSortedHeader(column, "Value"),
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
                        <DropdownMenuItem asChild>
                            <Link href={`/balance/${row.original.id}/edit`}>
                                Edit
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                            onClick={async () => {
                                const id = row.original.id;
                                const balance: FlattedBalanceType = row.original;
                                if(id){
                                    await deleteBalance(id, balance);
                                }
                            }}
                        > Delete </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        }
    },
] 