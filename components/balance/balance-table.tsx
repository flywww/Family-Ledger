'use client'

import { balanceAnalysisViewType, FlattedBalanceType, MonthlyRefreshOverview } from "@/lib/definitions";
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
import { useContext, useEffect, useMemo, useState } from "react";
import { MonthBalanceContext } from "@/context/monthBalanceContext";
import { SettingContext } from "@/context/settingContext";
import BalanceTableSkeleton from "./skeleton/balance-table-skeleton";
import { MonthKey } from "@/lib/utils";
import { applyBalanceAnalysisView } from "@/lib/balance-analysis";
import { getPriceStatusMeta } from "./balance-columns";

const getPercentageClassName = (holdingTypeName: FlattedBalanceType["holdingTypeName"]) =>
    holdingTypeName === "Liabilities" ? "text-rose-600" : "text-white";

export default function BalanceTable({
    queryDate,
    queryMonthKey,
    queryView,
    refreshState,
    currentMonthCreationState,
}:{
    queryDate:Date,
    queryMonthKey: MonthKey,
    queryView: balanceAnalysisViewType,
    refreshState?: MonthlyRefreshOverview,
    currentMonthCreationState?: {
        canCreateLaggedMonthBalance: boolean,
        targetMonthKey: MonthKey,
        sourceMonthKey: MonthKey,
    },
}){

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [isMonthChangePending, setIsMonthChangePending] = useState(false);
    const [selectedView, setSelectedView] = useState<balanceAnalysisViewType>(queryView);
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

    useEffect(() => {
        setIsMonthChangePending(false);
    }, [queryDate]);

    useEffect(() => {
        setSelectedView(queryView);
    }, [queryView]);

    const analyzedMonthBalanceData = useMemo(
        () => applyBalanceAnalysisView(monthBalanceData, selectedView),
        [monthBalanceData, selectedView],
    );

    const table: Table<FlattedBalanceType> = useReactTable({
        data: analyzedMonthBalanceData,
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
                queryMonthKey={queryMonthKey}
                queryView={selectedView}
                table={table}
                refreshState={refreshState}
                currentMonthCreationState={currentMonthCreationState}
                onMonthChangePending={setIsMonthChangePending}
                onViewChange={setSelectedView}
            />
            {isMonthChangePending ? (
                <BalanceTableSkeleton showToolbar={false} />
            ) : (
                <>
            <div className="w-full hidden sm:block">
                <DataTable
                    columns={columns as ColumnDef<FlattedBalanceType | null, any>[]} 
                    data={analyzedMonthBalanceData}
                    table={table}
                />
            </div>
            <div className="w-full sm:hidden">
                {
                    analyzedMonthBalanceData.map((balance) => (
                        <div key={balance.id} className="rounded-md border my-2">
                            <div className="flex flex-row justify-between gap-2 p-2">
                                <div className="flex flex-col justify-center items-start w-52">
                                    <span className="text-xs font-medium text-muted-foreground">
                                        <span className={getPercentageClassName(balance.holdingTypeName)}>
                                            {new Intl.NumberFormat("en-US", {
                                                style: "percent",
                                                minimumFractionDigits: 0,
                                                maximumFractionDigits: 0,
                                            }).format(balance.percentage)}
                                        </span>
                                    </span>
                                    <span className="text-lg font-semibold">{balance.holdingSymbol}</span>
                                    <span className="text-xs text-muted-foreground">{balance.holdingName}</span>
                                    {(() => {
                                        const { icon: Icon, label, className } = getPriceStatusMeta(balance.priceStatus);
                                        return (
                                            <span
                                                title={label}
                                                aria-label={label}
                                                className={`mt-1 inline-flex items-center justify-center ${className}`}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </span>
                                        );
                                    })()}
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
