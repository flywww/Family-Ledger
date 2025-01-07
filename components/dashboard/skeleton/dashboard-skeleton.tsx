import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardSkeleton (){
    return(
        <div className="flex flex-col gap-3 justify-stretch">
            <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex flex-row gap-1 justify-center w-full items-center sm:justify-start sm:w-72">
                    <Skeleton className="min-w-12 h-9"/>
                    <Skeleton className="w-full justify-start h-9"/>
                    <Skeleton className="min-w-12  h-9"/>
                </div>
                <div>
                    <Skeleton className="w-full sm:w-32 h-9"/>
                </div>
            </div>
            <div className="flex flex-col gap-3 justify-center items-center w-full">
                <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 w-full">
                    <Skeleton className="hidden w-full h-36 sm:block"/>
                    <Skeleton className="hidden w-full h-36 sm:block"/>
                    <Skeleton className="hidden w-full h-36 sm:block" />
                </div>
                <div className="grid grid-cols-1 grid-rows-2 gap-3 w-full sm:grid-cols-3 sm:grid-rows-1">
                    <Skeleton className="w-full h-80 col-span-1 row-span-1 sm:col-span-2 sm:row-span-1"/>
                    <Skeleton className="w-full h-80 col-span-1 row-span-2 sm:col-span-1 sm:row-span-1"/>
                </div>
            </div>
        </div>
    )
}

