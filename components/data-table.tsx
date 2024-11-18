"use client"

import { 
    ColumnDef, 
    flexRender, 
} from "@tanstack/react-table";
import { 
    Table, 
    TableBody, 
    TableCell,
    TableHead, 
    TableHeader, 
    TableRow 
} from "@/components/ui/table";
import { Table as TableType } from "@tanstack/react-table";
import { FlattedBalanceType } from "@/lib/definitions";

interface DataTableProps<TData, TValue>{
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    table: TableType<FlattedBalanceType>
}

export function DataTable<TData, TValue>({
    columns,
    data,
    table,
}: DataTableProps<TData, TValue>){
    

    return(
        <div className="w-full">
            
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return(
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "Selected"}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell  colSpan={columns.length} className="h-24 text-center">
                                    No Results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
        
    )
}