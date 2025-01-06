import { Skeleton } from "@/components/ui/skeleton"

export default function BalanceTableSkeleton(){
    const rows = 20;
    
    return(
        <div className="w-full">
            {Array.from({ length: rows }).map((_, index) => (
                <Skeleton key={index} className="h-4 w-full"/>
            ))}
        </div>
    )
}