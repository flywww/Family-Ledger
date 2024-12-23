'use client'

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { getYearList, minYear } from "@/lib/data";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { cn, getLastMonth, getCalculatedMonth } from "@/lib/utils";
import { MonthPicker } from "./ui/month-picker";


export default function Search({
    queryDate
}:{
    queryDate: Date
}){
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const handleDateSearch = (date: Date) => {
        const params = new URLSearchParams(searchParams);
        params.set('date', date.toUTCString());
        replace(`${pathname}?${params.toString()}`);   
    }

    return(
        <div className="flex flex-row gap-1">
            <Button 
                    variant="outline" 
                    size="icon"
                    onClick={()=>handleDateSearch(getCalculatedMonth(queryDate,-1))}
                > 
                <ChevronLeft/>
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("min-w-40 justify-start text-left font-normal", !queryDate && "text-muted-foreground")}>
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
                variant="outline" 
                size="icon"
                onClick={()=>handleDateSearch(getCalculatedMonth(queryDate,1))}
                disabled={getCalculatedMonth(queryDate,1) > getLastMonth(new Date())}
            > 
                <ChevronRight/>
            </Button>
        </div>
    )
}