import  CreateBalanceForm  from "@/components/balance/balance-create-form"
import { firstDateOfMonth } from "@/lib/utils";


export default function Page({
    searchParams 
}:{
    searchParams?: {
        date?: string
    }
}){

    let initialDate = firstDateOfMonth(new Date());
    if(searchParams?.date) initialDate = new Date(searchParams.date);
    const backURL = `/balance?date=${initialDate}`    

    return(
        <div>
            <CreateBalanceForm 
                initialDate={initialDate}
                backURL={backURL}   
            />
        </div>
    )
}