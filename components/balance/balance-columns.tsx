'use client'

import { BalanceRecord } from "@/lib/definitions"
import { ColumnDef } from '@tanstack/react-table'
import { useMemo } from "react"

export const columns: ColumnDef<BalanceRecord>[] = [
    {
        accessorKey: "holdingName",
        header: "Name",
    },
    {
        accessorKey: "holdingSymbol",
        header: "Symbol",
    },
    {
        accessorKey: "categoryName",
        header: "Category",
    },
    {
        accessorKey: "typeName",
        header: "Type",
    },
    {
        accessorKey: "quantity",
        header: "Quantity",
    },
    {
        accessorKey: "price",
        header: "Price",
    },
    {
        accessorKey: "value",
        header: "Value",
    },
    {
        accessorKey: "note",
        header: "Note",
    },
] 