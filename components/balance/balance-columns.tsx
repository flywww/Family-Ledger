'use client'

import { FlattedBalanceType, currencyType } from "@/lib/definitions"
import { delay } from "@/lib/utils"
import { ColumnDef, Column } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown} from "lucide-react"
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
import { deleteBalance, fetchBalance, updateBalance } from "@/lib/actions"
import Link from "next/link"
import React, { useEffect, useState, useContext } from "react"
import { SettingContext } from "@/context/settingContext"
import { Input } from "../ui/input"
import LoadingSpinner from "../ui/loading-spinner"
import { MonthBalanceContext } from "@/context/monthBalanceContext"

const MoneyCellFormatter = ({ value }: { value: number }) => {
    const [displayedCurrency, setDisplayedCurrency] = useState<currencyType>('USD');
    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { setting } = settingContext;         
    useEffect(()=>{
        if (setting && 'displayCurrency' in setting){
            setDisplayedCurrency(setting.displayCurrency as currencyType);
        }
    }, [setting]) 
    const formattedPrice = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: displayedCurrency,
    }).format(value)
    return <div className="text-right font-medium">{formattedPrice}</div>
}

const PercentageCell = ({ value }: { value: number }) => {
    const formattedPercentage = new Intl.NumberFormat("en-US", {
        style: "percent",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value)

    return <div className="w-14 text-right font-medium tabular-nums">{formattedPercentage}</div>
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

const PriceStatusCell = ({ value }: { value: FlattedBalanceType["priceStatus"] }) => {
    if (value === 'success') {
        return <span className="text-xs text-slate-500">Fresh</span>
    }

    const className = value === 'failed'
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-amber-200 bg-amber-50 text-amber-700";

    return (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
            {value === 'failed' ? 'Failed' : 'Estimated'}
        </span>
    )
}

const QuantityCell = ({ row }: { row: any }) => {
    const [editing, setEditing] = useState<boolean>(false)
    const [currentQuantity, setCurrentQuantity] = useState<number>(parseFloat(row.getValue('quantity')))
    const [oldQuantity, setOldQuantity] = useState<number>(parseFloat(row.getValue('quantity')))
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const monthBalanceContext = useContext(MonthBalanceContext);
    if(!monthBalanceContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { monthBalanceData ,updateMonthBalance } = monthBalanceContext;  
    const handleValueChange = async (e: React.FocusEvent<HTMLInputElement>) => {
        const balance = await fetchBalance(row.original.id)
        if(balance && oldQuantity.toString() !== currentQuantity.toString()){
            setIsLoading(true);
            await updateBalance({
                id: row.original.id,
                quantity: currentQuantity,
                value: currentQuantity*balance.price,
            })
            updateMonthBalance({
                ...row.original,
                quantity: currentQuantity,
                value: currentQuantity*row.original.price,
            });
            setOldQuantity(currentQuantity);
            await delay(600);
            setIsLoading(false);
        }    
        setEditing(false)
    }

    useEffect(()=> {
        setCurrentQuantity(row.getValue('quantity'))
    }, [monthBalanceData, row])

    return (
        <div className="flex flex-row items-center gap-1 max-w-28">
            <Input
                name="quantity"
                type="number"
                value={currentQuantity}
                readOnly={!editing}
                onClick={ () => setEditing(true) }
                onBlur={handleValueChange}
                onChange={(e) => setCurrentQuantity(parseFloat(e.target.value))}
                onKeyDown={(e) => {
                    if(e.key === 'Enter'){
                        e.preventDefault();
                        handleValueChange(e as unknown as React.FocusEvent<HTMLInputElement>);
                    }
                }}
            ></Input>
            { isLoading && <LoadingSpinner size={4}/> }
        </div>
    )
}

const NoteCell = ({ row }: { row: any }) => {
    const [editing, setEditing] = useState<boolean>(false)
    const [currentNote, setCurrentNote] = useState<string>(row.getValue('note'))
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const handleValueChange = async (e: React.FocusEvent<HTMLInputElement>) => {
        const balance = await fetchBalance(row.original.id)
        const oldNote = balance ? balance.note : ''; 
        
        if(oldNote !== currentNote){
            setIsLoading(true);
            await updateBalance({
                id: row.original.id,
                note: currentNote
            })
            await delay(600);
            setIsLoading(false);
        }    
        setEditing(false)
    }
    return (
        <div className="flex flex-row items-center gap-1">
            <Input
                name="note"
                type="text"
                value={currentNote}
                readOnly={!editing}
                onClick={ () => setEditing(true) }
                onBlur={handleValueChange}
                onChange={(e) => setCurrentNote(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter'){
                        e.preventDefault();
                        handleValueChange(e as unknown as React.FocusEvent<HTMLInputElement>);
                    }
                }}
            ></Input>
            { isLoading && <LoadingSpinner size={4}/> }
        </div>
    )
}

export const columns: ColumnDef<FlattedBalanceType>[] = [
    {
        accessorKey: "percentage",
        size: 56,
        minSize: 56,
        maxSize: 56,
        header: ({column}) => getSortedHeader(column, "%"),
        cell:({row}) => <PercentageCell value={row.original.percentage} />
    },
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
        cell:({row}) => <QuantityCell row={row} />
    },
    {
        accessorKey: "price",
        header: ({column}) => getSortedHeader(column, "Price"),
        cell:({row}) => {
            return <MoneyCellFormatter value={row.original.price} />
        }
    },
    {
        accessorKey: "value",
        header: ({column}) => getSortedHeader(column, "Value"),
        cell:({row}) => {            
            return <MoneyCellFormatter value={row.getValue('value')} />
        }
    },
    {
        accessorKey: "note",
        header: "Note",
        cell:({row}) => <NoteCell row={row} />
    },
    {
        accessorKey: "priceStatus",
        header: "Status",
        cell:({row}) => <PriceStatusCell value={row.original.priceStatus} />
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
                                        onClick={() => navigator.clipboard.writeText(row.original.price.toString())}
                                    > Copy price </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => navigator.clipboard.writeText(row.original.value.toString())}
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
