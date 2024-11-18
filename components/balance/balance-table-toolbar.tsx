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
import Search from "@/components/balance/search";
import { createMonthBalances, fetchMonthlyBalance, fetchSetting } from "@/lib/actions";
import { Balance, FlattedBalanceType, Setting, SettingSchema } from "@/lib/definitions";
import Link from "next/link"
import { useEffect, useState } from "react";
import { parse } from "path";
import { firstDateOfMonth, getLastMonth, getCalculatedMonth } from "@/lib/utils";
import { date } from "zod";
import { isEqual } from "date-fns";

export default function BalanceTableToolbar({ 
    table, 
    queryDate 
}:{
    table: Table<FlattedBalanceType>,
    queryDate: Date
}){
    const [setting, setSetting] = useState<Setting>();
    const lastMonth = getLastMonth(new Date());
    const [isOutdated, setIsOutdated] = useState<boolean>(false);

    useEffect(() => {
        console.log(`getting settings`);
        
        const getSettingData = async () => {
            const data: Setting | undefined = await fetchSetting(3);
            console.log(`get setting data: ${data}`);
            
            if(data){
                setSetting(data);
                console.log(`accountingDate: ${data.accountingDate}`);
                console.log(`lastMonth: ${lastMonth}`);
                console.log(`compare: ${data.accountingDate < lastMonth}`);
                
                setIsOutdated(data.accountingDate < lastMonth)
            }
        };
        getSettingData();
    }, [])

    return(
            <div className="flex items-center py-4 justify-between">
                <div className="flex items-center gap-3 justify-between">
                    <Search queryDate={queryDate}/>
                    <Input
                        placeholder="Filter balances"
                        value={(table.getColumn("holdingName")?.getFilterValue() as string) ?? ""}
                        onChange={(event) => 
                            table.getColumn("holdingName")?.setFilterValue(event.target.value)
                        }
                        className="min-w-40"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="default" className="ml-auto">
                            Menu <ChevronDownIcon className="ml-2 h-4 w-4" />
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
                                            await createMonthBalances( getCalculatedMonth(setting.accountingDate, 1), balances)
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