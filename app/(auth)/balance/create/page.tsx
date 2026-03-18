import  CreateBalanceForm  from "@/components/balance/balance-create-form"
import { firstDateOfMonth, monthKeyToDate, resolveMonthKey } from "@/lib/utils";

export default async function Page(
    props:{
        searchParams?: Promise<{
            month?: string
            date?: string
        }>
    }
) {
    const searchParams = await props.searchParams;
    const initialMonthKey = resolveMonthKey({
        month: searchParams?.month,
        date: searchParams?.date,
        fallback: firstDateOfMonth(new Date()),
    });
    const initialDate = monthKeyToDate(initialMonthKey);
    const backURL = `/balance?month=${initialMonthKey}`

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
