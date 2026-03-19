'use client'

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { minYear } from "@/lib/data";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { MonthKey, addMonthsToMonthKey, cn, getCalculatedMonth, getLastMonth, getMonthKey } from "@/lib/utils";
import { MonthPicker } from "./ui/month-picker";
import { useTransition } from "react";


export default function Search({
    queryDate,
    queryMonthKey,
    onPendingChange,
}:{
    queryDate: Date,
    queryMonthKey: MonthKey,
    onPendingChange?: (pending: boolean) => void,
}){
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const previousMonth = addMonthsToMonthKey(queryMonthKey, -1);
    const nextMonth = addMonthsToMonthKey(queryMonthKey, 1);
    const minMonth = getMonthKey(new Date(minYear,1,1));
    const maxMonth = getMonthKey(getLastMonth(new Date()));

    const handleDateSearch = (date: Date) => {
        const nextMonthKey = getMonthKey(date);
        if (nextMonthKey === queryMonthKey) {
            return;
        }

        const currentSearch =
            typeof window === "undefined" ? searchParams.toString() : window.location.search;
        const params = new URLSearchParams(currentSearch);
        params.set('month', nextMonthKey);
        params.delete('date');
        onPendingChange?.(true);
        startTransition(() => {
            router.replace(`${pathname}?${params.toString()}`);
        });
    }

    return(
        <div className="flex flex-row gap-1 justify-center w-full items-center sm:justify-start sm:w-72">
            <Button 
                    className="min-w-12"
                    variant="outline" 
                    size="icon"
                    onClick={()=>handleDateSearch(getCalculatedMonth(queryDate,-1))}
                    disabled={isPending || previousMonth < minMonth}
                > 
                <ChevronLeft/>
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        variant={"outline"}
                        disabled={isPending}
                        className={cn("w-full justify-start text-left font-normal", !queryDate && "text-muted-foreground")}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {queryDate ? format(queryDate, "MMM yyyy") : <span>Pick a month</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <MonthPicker
                        onMonthSelect={handleDateSearch} 
                        selectedMonth={queryDate}
                        maxDate={getLastMonth(new Date())}
                        minDate={new Date(minYear,1,1)} />
                </PopoverContent>
            </Popover>
            <Button 
                className="min-w-12"
                variant="outline" 
                size="icon"
                onClick={()=>handleDateSearch(getCalculatedMonth(queryDate,1))}
                disabled={isPending || nextMonth > maxMonth}
            > 
                <ChevronRight/>
            </Button>
        </div>
    )
}
