import { fetchMonthlyBalance } from "@/lib/actions";
import { Balance } from "@/lib/definitions";
import { DataTable } from "../data-table";
import { columns } from "./balance-columns";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../ui/button";

export default async function BalanceTable({
    date,
}:{
    date:Date;
}){

    //TODO: fetch with user id
    const balanceData = await fetchMonthlyBalance(date);
    

    return(
        <>
            
            <DataTable columns={columns as ColumnDef<Balance | null, any>[]} data={balanceData}></DataTable>
        </>
    )
}