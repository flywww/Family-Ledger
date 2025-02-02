import EditBalanceForm from "@/components/balance/balance-edit-form";
import { fetchBalance } from "@/lib/actions";

export default async function Page(
    props:{
        params: Promise<{id: string}>
    }
) {
    const params = await props.params;
    const balance = await fetchBalance(parseInt(params.id));

    return(
        <div className="flex flex-col gap-3 ml-6">
            <h1 className="text-xl">Edit Balance</h1>
            {balance && <EditBalanceForm balance={balance}></EditBalanceForm>}
        </div>
    )
}
