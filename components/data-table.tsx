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

const getFixedColumnStyle = (columnDef: ColumnDef<any, any>, size: number) => {
    if (typeof columnDef.size !== "number") {
        return undefined;
    }

    return {
        width: size,
        minWidth: typeof columnDef.minSize === "number" ? columnDef.minSize : size,
        maxWidth: typeof columnDef.maxSize === "number" ? columnDef.maxSize : size,
    };
};

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
                                            <TableHead
                                                key={header.id}
                                                style={getFixedColumnStyle(header.column.columnDef, header.getSize())}
                                            >
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
                                        <TableCell
                                            key={cell.id}
                                            style={getFixedColumnStyle(cell.column.columnDef, cell.column.getSize())}
                                        >
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
