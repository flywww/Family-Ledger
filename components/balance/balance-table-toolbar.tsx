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
import { balanceAnalysisViewType, FlattedBalanceType, MonthlyRefreshOverview } from "@/lib/definitions";
import Link from "next/link"
import { useContext, Suspense, useTransition } from "react";
import { SettingContext } from "@/context/settingContext";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { MonthKey } from "@/lib/utils";
import { BALANCE_ANALYSIS_VIEW_LABELS } from "@/lib/balance-analysis";

export default function BalanceTableToolbar({ 
    table, 
    queryDate,
    queryMonthKey,
    queryView,
    refreshState,
    currentMonthCreationState,
    onMonthChangePending,
    onViewChange,
}:{
    table: Table<FlattedBalanceType>,
    queryDate: Date,
    queryMonthKey: MonthKey,
    queryView: balanceAnalysisViewType,
    refreshState?: MonthlyRefreshOverview,
    currentMonthCreationState?: {
        canCreateCurrentMonthBalance: boolean,
        currentMonthKey: MonthKey,
        previousMonthKey: MonthKey,
    },
    onMonthChangePending?: (pending: boolean) => void,
    onViewChange?: (view: balanceAnalysisViewType) => void,
}){
    const settingContext = useContext(SettingContext);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isCreatingMonth, startCreateMonthTransition] = useTransition();
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }

    const handleViewChange = (view: balanceAnalysisViewType) => {
        if (view === queryView) {
            return;
        }

        const params = new URLSearchParams(searchParams);
        params.set("view", view);
        window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
        onViewChange?.(view);
    };

    return(
            <div className="flex items-start justify-between gap-2">
                <div className="w-full flex flex-col justify-start items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
                        className="w-full text-base sm:max-w-48 sm:text-sm"
                    /> 
                    <div className="flex flex-row flex-wrap gap-2 sm:ml-2">
                        {Object.entries(BALANCE_ANALYSIS_VIEW_LABELS).map(([view, label]) => (
                            <Button
                                key={view}
                                type="button"
                                variant={queryView === view ? "default" : "outline"}
                                className="text-sm"
                                onClick={() => handleViewChange(view as balanceAnalysisViewType)}
                            >
                                {label}
                            </Button>
                        ))}
                    </div>
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

                                    const params = new URLSearchParams(searchParams);
                                    params.set("month", result?.targetMonthKey ?? currentMonthCreationState.currentMonthKey);
                                    params.set("view", queryView);
                                    params.delete("date");
                                    router.push(`/balance/?${params.toString()}`);
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
