import { Skeleton } from "@/components/ui/skeleton"

export default function SummarySectionSkeleton (){
    return(
        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-3 w-full">
            <Skeleton className="hidden w-full h-48 sm:block"/>
            <Skeleton className="hidden w-full h-48 sm:block"/>
            <Skeleton className="hidden w-full h-48 sm:block" />
        </div>
    )
}