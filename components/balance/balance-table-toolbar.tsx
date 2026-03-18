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
import { createCurrentMonthBalance } from "@/lib/actions";
import { FlattedBalanceType, MonthlyRefreshOverview } from "@/lib/definitions";
import Link from "next/link"
import { useContext, Suspense, useTransition } from "react";
import { SettingContext } from "@/context/settingContext";
import { useRouter } from "next/navigation";
import { MonthKey } from "@/lib/utils";

export default function BalanceTableToolbar({ 
    table, 
    queryDate,
    queryMonthKey,
    refreshState,
    currentMonthCreationState,
    onMonthChangePending,
}:{
    table: Table<FlattedBalanceType>,
    queryDate: Date,
    queryMonthKey: MonthKey,
    refreshState?: MonthlyRefreshOverview,
    currentMonthCreationState?: {
        canCreateCurrentMonthBalance: boolean,
        currentMonthKey: MonthKey,
        previousMonthKey: MonthKey,
    },
    onMonthChangePending?: (pending: boolean) => void,
}){
    const settingContext = useContext(SettingContext);
    const router = useRouter();
    const [isCreatingMonth, startCreateMonthTransition] = useTransition();
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }

    return(
            <div className="flex items-center justify-between ">
                <div className="w-full flex flex-col justify-start items-center gap-2 sm:flex-row">
                    <Suspense>
                        <Search
                            queryDate={queryDate}
                            queryMonthKey={queryMonthKey}
                            onPendingChange={onMonthChangePending}
                        />
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
                <div className="ml-auto hidden items-center gap-2 sm:flex">
                    {currentMonthCreationState?.canCreateCurrentMonthBalance && (
                        <Button
                            type="button"
                            variant="secondary"
                            disabled={isCreatingMonth}
                            onClick={() => {
                                startCreateMonthTransition(async () => {
                                    const result = await createCurrentMonthBalance();
                                    if (result?.error) {
                                        window.alert(result.error);
                                        return;
                                    }

                                    if (result?.message) {
                                        window.alert(
                                            `Created monthly balance. ${result.message} Remaining estimated: ${result.remainingEstimated ?? 0}.`,
                                        );
                                    }

                                    router.push(`/balance/?month=${result?.targetMonthKey ?? currentMonthCreationState.currentMonthKey}`);
                                    router.refresh();
                                });
                            }}
                        >
                            {isCreatingMonth ? "Creating monthly balance..." : "Create monthly balance"}
                        </Button>
                    )}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default">
                            More <ChevronDownIcon className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Link href={`/balance/create?month=${queryMonthKey}`}> New balance </Link>
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
            </div>
    )
}
