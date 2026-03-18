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
import { createNextMonthBalancesFromMonth } from "@/lib/actions";
import { FlattedBalanceType, MonthlyRefreshOverview } from "@/lib/definitions";
import Link from "next/link"
import { useContext, Suspense, useTransition } from "react";
import { SettingContext } from "@/context/settingContext";
import { useRouter } from "next/navigation";
import { getCalculatedMonth } from "@/lib/utils";

export default function BalanceTableToolbar({ 
    table, 
    queryDate,
    refreshState,
    onMonthChangePending,
}:{
    table: Table<FlattedBalanceType>,
    queryDate: Date,
    refreshState?: MonthlyRefreshOverview,
    onMonthChangePending?: (pending: boolean) => void,
}){
    const settingContext = useContext(SettingContext);
    const router = useRouter();
    const [isCreatingMonth, startCreateMonthTransition] = useTransition();
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }

    const nextMonth = getCalculatedMonth(queryDate, 1);

    return(
            <div className="flex items-center justify-between ">
                <div className="w-full flex flex-col justify-start items-center gap-2 sm:flex-row">
                    <Suspense>
                        <Search queryDate={queryDate} onPendingChange={onMonthChangePending} />
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
                        <DropdownMenuItem
                            disabled={isCreatingMonth}
                            onSelect={(event) => {
                                event.preventDefault();
                                startCreateMonthTransition(async () => {
                                    const result = await createNextMonthBalancesFromMonth(queryDate);
                                    if (result?.error) {
                                        window.alert(result.error);
                                        return;
                                    }
                                    const targetMonth = result?.targetMonth
                                        ? new Date(result.targetMonth)
                                        : nextMonth;
                                    router.push(`/balance/?date=${targetMonth.toUTCString()}`);
                                    router.refresh();
                                });
                            }}
                        >
                            {isCreatingMonth ? "Creating next month..." : "Create next month"}
                        </DropdownMenuItem>
                        {refreshState && refreshState.status !== 'idle' && (
                            <DropdownMenuItem disabled>
                                {refreshState.status === 'partial_complete' ? 'Partial Complete' : 'Monthly refresh active'}
                            </DropdownMenuItem>
                        )}
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
