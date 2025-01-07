'use client'

import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { 
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { Table } from "@tanstack/react-table";
import Search from "@/components/search";
import { createMonthBalances, fetchMonthlyBalance } from "@/lib/actions";
import { FlattedBalanceType } from "@/lib/definitions";
import Link from "next/link"
import { useEffect, useState, useContext, Suspense } from "react";
import { firstDateOfMonth, getLastMonth, getCalculatedMonth } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { SettingContext } from "@/context/settingContext";

export default function BalanceTableToolbar({ 
    table, 
    queryDate 
}:{
    table: Table<FlattedBalanceType>,
    queryDate: Date
}){
    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { setting } = settingContext;
    const lastMonth = getLastMonth(new Date());
    const [isOutdated, setIsOutdated] = useState<boolean>(false);
    const { data: session } = useSession();

    useEffect(() => {
        (async function(){
            if(session && setting){
                setIsOutdated(setting.accountingDate < lastMonth)
            }
        })();
    }, [setting])

    return(
            <div className="flex items-center justify-between ">
                <div className="w-full flex flex-col justify-start items-center gap-2 sm:flex-row">
                    <Suspense>
                        <Search queryDate={queryDate}/>
                    </Suspense>
                    <Input
                        placeholder="Filter balances"
                        value={(table.getState().globalFilter as string) ?? ""}
                        onChange={(event) => 
                            table.setGlobalFilter(String(event.target.value))
                        }
                        className="hidden w-full sm:max-w-48 sm:block text-base sm:text-sm"
                    /> 
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="default" className="hidden sm:flex ml-auto">
                            More <ChevronDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                            <Link href={`/balance/create?date=${queryDate}`}> New balance </Link>
                        </DropdownMenuItem>
                        {isOutdated && <DropdownMenuItem onClick={
                            async () => {
                                if(setting){
                                    const balances = await fetchMonthlyBalance(setting.accountingDate);
                                    if(balances){
                                        await createMonthBalances( firstDateOfMonth(getCalculatedMonth(setting.accountingDate, 1)), balances)
                                    }
                                }
                            }
                        }>
                            New month balance
                        </DropdownMenuItem>}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger> Column setting</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                {table
                                    .getAllColumns()
                                    .filter((column) => column.getCanHide())
                                    .map((column) => {
                                        return(
                                            <DropdownMenuCheckboxItem
                                                key={column.id}
                                                className="capitalize"
                                                checked={column.getIsVisible()}
                                                onCheckedChange={(value) => {
                                                    column.toggleVisibility(!!value)
                                                }}
                                            >
                                                {column.id}
                                            </DropdownMenuCheckboxItem>
                                )})}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
    )
}