'use client'

import { FlattedBalanceType, currencyType } from "@/lib/definitions"
import { delay } from "@/lib/utils"
import { ColumnDef, Row, Column } from '@tanstack/react-table'
import { MoreHorizontal, ArrowUpDown, AwardIcon } from "lucide-react"
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

const moneyCellFormatter = (value: number, key: string) => {
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

const numberCellFormatter = (row: Row<FlattedBalanceType>, key: string) => {
    const recordNumber = parseFloat(row.getValue(key))
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
        cell:({row}) => {
            const [editing, setEditing] = useState<boolean>(false)
            const [currentQuantity, setCurrentQuantity] = useState<number>(parseFloat(row.getValue('quantity')))
            const [oldQuantity, setOldQuantity] = useState<number>(parseFloat(row.getValue('quantity')))
            const [isLoading, setIsLoading] = useState<boolean>(false);
            const monthBalanceContext = useContext(MonthBalanceContext);
            if(!monthBalanceContext){
                throw Error ("Setting must be used within a setting provider")
            }
            const { monthBalanceData ,updateMonthBalance } = monthBalanceContext;  
            const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
                const balance = await fetchBalance(row.original.id)
                //const oldQuantity = balance?.quantity; 
                console.log(`[balance-columns] oldQuantity: ${oldQuantity} currentQuantity: ${currentQuantity}`);
                console.log(`[balance-columns] update??: ${balance && oldQuantity.toString() !== currentQuantity.toString()}`);
                //BUG: the quantity won't update when the user change back to the old value
                if(balance && oldQuantity.toString() !== currentQuantity.toString()){
                    setIsLoading(true);
                    const newFlatteredBalance = {
                        ...row.original,
                        quantity: currentQuantity,
                        price: balance.price, 
                        value: currentQuantity*balance.price,
                    }
                    await updateBalance({
                        id: row.original.id,
                        quantity: currentQuantity,
                        value: currentQuantity*balance.price,
                    })
                    updateMonthBalance(newFlatteredBalance); //TODO: the function name should be modified for clarity
                    setOldQuantity(currentQuantity);
                    await delay(600);
                    setIsLoading(false);
                }    
                setEditing(false)
            }

            useEffect(()=> setCurrentQuantity(row.getValue('quantity')), [monthBalanceData])
            //BUG: the quantity won't update when the user paste a new value
            //BUG: safari can't work well
            //TODO: add save value and blur after enter

            return (
                <div className="flex flex-row items-center gap-1 max-w-28">
                    <Input
                        name="quantity"
                        type="number"
                        value={currentQuantity}
                        readOnly={!editing}
                        onClick={ () => setEditing(true) }
                        onBlur={handleBlur}
                        onChange={(e) => setCurrentQuantity(parseFloat(e.target.value))}
                    ></Input>
                    { isLoading && <LoadingSpinner size={4}/> }
                </div>
            )
        }
    },
    {
        accessorKey: "price",
        header: ({column}) => getSortedHeader(column, "Price"),
        cell:({row}) => {
            return moneyCellFormatter(row.original.price, 'price')
        }
    },
    {
        accessorKey: "value",
        header: ({column}) => getSortedHeader(column, "Value"),
        cell:({row}) => {

            //BUG: the value isn't right when the user change the quantity
            const value = row.original.quantity * row.original.price;
            return  moneyCellFormatter( value , 'value')
        }
    },
    {
        accessorKey: "note",
        header: "Note",
        cell:({row}) => {
            const [editing, setEditing] = useState<boolean>(false)
            const [currentNote, setCurrentNote] = useState<string>(row.getValue('note'))
            const [isLoading, setIsLoading] = useState<boolean>(false);
            const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
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
                        onBlur={handleBlur}
                        onChange={(e) => setCurrentNote(e.target.value)}
                    ></Input>
                    { isLoading && <LoadingSpinner size={4}/> }
                </div>
            )
        }
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
                                        onClick={() => navigator.clipboard.writeText(row.original.price.toString())}
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