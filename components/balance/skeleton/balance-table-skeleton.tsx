import { Skeleton } from "@/components/ui/skeleton"

export default function BalanceTableSkeleton({
    showToolbar = true,
}:{
    showToolbar?: boolean,
}){
    const rows = 20;
    
    return(
        <div className="flex flex-col gap-4">
            {showToolbar && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                            <div className="flex flex-row gap-1 justify-center w-full items-center sm:justify-start sm:w-72">
                                <Skeleton className="min-w-12 h-9"/>
                                <Skeleton className="w-full justify-start h-9"/>
                                <Skeleton className="min-w-12 h-9"/>
                            </div>
                            <Skeleton className="w-full h-9 sm:w-48"/>
                            <div className="flex flex-row flex-wrap gap-2">
                                <Skeleton className="h-9 w-20"/>
                                <Skeleton className="h-9 w-20"/>
                                <Skeleton className="h-9 w-32"/>
                                <Skeleton className="h-9 w-20"/>
                            </div>
                        </div>
                        <div className="hidden items-center gap-2 sm:flex">
                            <Skeleton className="h-9 w-40"/>
                            <Skeleton className="h-9 w-24"/>
                        </div>
                    </div>
                    <div className="flex flex-row gap-2 sm:hidden">
                        <Skeleton className="min-w-12 h-9"/>
                        <Skeleton className="w-24 h-9"/>
                    </div>
                </div>
            )}
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



                        
