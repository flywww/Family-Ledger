import { fetchMonthlyBalance } from "@/lib/actions";
import { BalanceRecord } from "@/lib/definitions";
import { DataTable } from "../data-table";
import { columns } from "./balance-columns";
import { ColumnDef } from "@tanstack/react-table";

export default async function BalanceTable({
    date,
}:{
    date:Date;
}){

    //TODO: fetch with user id
    const balanceData = await fetchMonthlyBalance(date);
    

    return(
        <>
            <div>Table</div>
            <DataTable columns={columns as ColumnDef<BalanceRecord | null, any>[]} data={balanceData}></DataTable>
        </>
    )
}