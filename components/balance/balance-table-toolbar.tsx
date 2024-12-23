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
import { createMonthBalances, fetchMonthlyBalance, fetchSetting } from "@/lib/actions";
import { FlattedBalanceType, Setting } from "@/lib/definitions";
import Link from "next/link"
import { useEffect, useState } from "react";
import { firstDateOfMonth, getLastMonth, getCalculatedMonth } from "@/lib/utils";
import { useSession } from "next-auth/react";

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
    const { data: session } = useSession();

    useEffect(() => {
        const getSettingData = async () => {
            if(session){
                const data: Setting | undefined = await fetchSetting(session.user.id);
                if(data){
                    setSetting(data);
                    setIsOutdated(data.accountingDate < lastMonth)
                }
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
                        value={(table.getState().globalFilter as string) ?? ""}
                        onChange={(event) => 
                            table.setGlobalFilter(String(event.target.value))
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