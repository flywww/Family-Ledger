'use client'

import { FlattedBalanceType } from "@/lib/definitions";
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
import { useContext, useEffect, useState } from "react";
import { MonthBalanceContext } from "@/context/monthBalanceContext";

export default function BalanceTable({
    queryDate,
    data,
}:{
    queryDate:Date,
    data: FlattedBalanceType[]
}){

    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const monthBalanceContext = useContext(MonthBalanceContext);
    if(!monthBalanceContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { monthBalanceData, updateMonthBalanceData } = monthBalanceContext;  
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
    
    useEffect(()=>{
        updateMonthBalanceData(data);
    }, [data,updateMonthBalanceData])

    return(
        <>
            <BalanceTableToolbar 
                queryDate={queryDate}
                table={table}
            />
            <DataTable 
                columns={columns as ColumnDef<FlattedBalanceType | null, any>[]} 
                data={monthBalanceData}
                table={table}
            />
        </>
    )
}