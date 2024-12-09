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
import { useState } from "react";

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
    const table: Table<FlattedBalanceType> = useReactTable({
        data,
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
            columnVisibility
        },
    })

    return(
        <>
            <BalanceTableToolbar 
                queryDate={queryDate}
                table={table}
            />
            <DataTable 
                columns={columns as ColumnDef<FlattedBalanceType | null, any>[]} 
                data={data}
                table={table}
            />
        </>
    )
}