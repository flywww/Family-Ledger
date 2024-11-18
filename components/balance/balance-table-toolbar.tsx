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
import Search from "@/components/balance/search";
import { fetchSetting } from "@/lib/actions";
import { FlattedBalanceType } from "@/lib/definitions";
import Link from "next/link"


export default function BalanceTableToolbar(
    { 
        table, 
        queryDate 
    }:{
        table: Table<FlattedBalanceType>, //TODO: find table type
        queryDate: Date
    }){

    return(
            <div className="flex items-center py-4 justify-between">
                <div className="flex items-center gap-3 justify-between">
                    <Search/>
                    <Input
                        placeholder="Filter balances"
                        value={(table.getColumn("holdingName")?.getFilterValue() as string) ?? ""}
                        onChange={(event) => 
                            table.getColumn("holdingName")?.setFilterValue(event.target.value)
                        }
                        className="min-w-40"
                    />
                </div>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="default" className="ml-auto">
                            Menu <ChevronDownIcon className="ml-2 h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                <Link href={`/balance/create?date=${queryDate}`}> New balance </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                New month balance
                            </DropdownMenuItem>
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
                                            )
                                    })}
                                    </DropdownMenuSubContent>
                                </DropdownMenuPortal>
                            </DropdownMenuSub>
                        </DropdownMenuContent>
                </DropdownMenu>
            </div>
    )
}