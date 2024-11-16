import { fetchMonthlyBalance } from "@/lib/actions";
import { FlattedBalanceType } from "@/lib/definitions";
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
    const flattedBalanceData = balanceData.map( (balance) => ({
        ...balance,
        holdingName: balance?.holding?.name,
        holdingSymbol: balance?.holding?.symbol,
        holdingCategoryName: balance?.holding?.category?.name,
        holdingTypeName: balance?.holding?.type?.name,
    } as FlattedBalanceType)) 

    return(
        <>
            
            <DataTable columns={columns as ColumnDef<FlattedBalanceType | null, any>[]} data={flattedBalanceData}></DataTable>
        </>
    )
}