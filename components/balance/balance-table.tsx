'use client'

import { FlattedBalanceType, MonthlyRefreshOverview } from "@/lib/definitions";
import { DataTable } from "../data-table";
import { columns } from "./balance-columns";
import BalanceTableToolbar from "@/components/balance/balance-table-toolbar";
import { 
    ColumnDef, 
    getCoreRowModel, 
    useReactTable,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    VisibilityState,
} from "@tanstack/react-table";
import { Table } from "@tanstack/react-table";
import { useContext, useState } from "react";
import { MonthBalanceContext } from "@/context/monthBalanceContext";
import { SettingContext } from "@/context/settingContext";
import BalanceTableSkeleton from "./skeleton/balance-table-skeleton";

export default function BalanceTable({
    queryDate,
    refreshState,
}:{
    queryDate:Date,
    refreshState?: MonthlyRefreshOverview,
}){

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [isMonthChangePending, setIsMonthChangePending] = useState(false);
    const monthBalanceContext = useContext(MonthBalanceContext);
    if(!monthBalanceContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { monthBalanceData } = monthBalanceContext;  
    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { setting } = settingContext;
    const table: Table<FlattedBalanceType> = useReactTable({
        data: monthBalanceData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        state:{
            sorting,
            columnFilters,
            columnVisibility,
        },
    })

    return(
        <div className="flex flex-col gap-4">
            <BalanceTableToolbar 
                queryDate={queryDate}
                table={table}
                refreshState={refreshState}
                onMonthChangePending={setIsMonthChangePending}
            />
            {isMonthChangePending ? (
                <BalanceTableSkeleton />
            ) : (
                <>
            <div className="w-full hidden sm:block">
                <DataTable
                    columns={columns as ColumnDef<FlattedBalanceType | null, any>[]} 
                    data={monthBalanceData}
                    table={table}
                />
            </div>
            <div className="w-full sm:hidden">
                {
                    monthBalanceData.map((balance) => (
                        <div key={balance.id} className="rounded-md border my-2">
                            <div className="flex flex-row justify-between gap-2 p-2">
                                <div className="flex flex-col justify-center items-start w-52">
                                    <span className="text-lg font-semibold">{balance.holdingSymbol}</span>
                                    <span className="text-xs text-muted-foreground">{balance.holdingName}</span>
                                    {balance.priceStatus !== 'success' && (
                                        <span className="mt-1 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700">
                                            {balance.priceStatus === 'failed' ? 'Price failed' : 'Estimated'}
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col justify-center items-end">
                                    <span className="text-sm font-semibold">{`${balance.quantity}`}</span>
                                    <span className="text-xs text-muted-foreground">{`${Math.round(balance.value*100)/100} ${setting?.displayCurrency}`}</span>
                                </div>
                            </div>
                        </div>))
                }
            </div>
                </>
            )}
        </div>
    )
}
