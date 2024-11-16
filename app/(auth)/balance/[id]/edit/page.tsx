import { Balance } from "@/lib/definitions";
import EditBalanceForm from "@/components/balance/balance-edit-form";
import { fetchBalance } from "@/lib/actions";

export default async function Page({
    params
}:{
    params: {id: string}
}){ 
    const balance = await fetchBalance(parseInt(params.id));

    return(
        <div>
            <h1>update page</h1>
            {balance && <EditBalanceForm balance={balance}></EditBalanceForm>}

        </div>
    )
}
