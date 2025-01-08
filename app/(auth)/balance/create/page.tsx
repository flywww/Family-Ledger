import  CreateBalanceForm  from "@/components/balance/balance-create-form"
import { firstDateOfMonth } from "@/lib/utils";

export default async function Page(
    props:{
        searchParams?: Promise<{
            date?: string
        }>
    }
) {
    const searchParams = await props.searchParams;
    let initialDate = firstDateOfMonth(new Date());
    if(searchParams?.date) initialDate = new Date(searchParams.date);
    const backURL = `/balance?date=${initialDate}`

    return(
        <div className="flex flex-col gap-3 ml-6">
            <h1 className="text-xl">Create Balance</h1>
            <CreateBalanceForm 
                initialDate={initialDate}
                backURL={backURL}   
            />
        </div>
    )
}