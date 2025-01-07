import { Skeleton } from "@/components/ui/skeleton"

export default function BalanceTableSkeleton(){
    const rows = 20;
    
    return(
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-row gap-1 justify-center w-full items-center sm:justify-start sm:w-72">
                    <Skeleton className="min-w-12 h-9"/>
                    <Skeleton className="w-full justify-start h-9"/>
                    <Skeleton className="min-w-12  h-9"/>
                </div>
                <div>
                    <Skeleton className="w-full sm:w-48 h-9 hidden sm:block"/>
                </div>
            </div>
            <div className="w-full h-[600px] hidden sm:block">
                {
                    Array.from({length: rows}).map((_, index) =>(
                        <Skeleton key={index} className="my-2 h-11"/>
                    ))
                }                
            </div>
            <div className="w-full sm:hidden">
                {
                    Array.from({length: rows}).map((_, index) =>(
                        <Skeleton key={index} className="my-2 h-14"/>
                    ))
                }
            </div>
        </div>
    )
}



                        