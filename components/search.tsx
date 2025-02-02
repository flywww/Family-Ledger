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
    const router = useRouter();

    const handleDateSearch = (date: Date) => {
        const params = new URLSearchParams(searchParams);
        params.set('date', date.toUTCString());
        router.replace(`${pathname}?${params.toString()}`);   
    }

    return(
        <div className="flex flex-row gap-1 justify-center w-full items-center sm:justify-start sm:w-72">
            <Button 
                    className="min-w-12"
                    variant="outline" 
                    size="icon"
                    onClick={()=>handleDateSearch(getCalculatedMonth(queryDate,-1))}
                    disabled={getCalculatedMonth(queryDate,-1) < new Date(minYear,1,1)}
                > 
                <ChevronLeft/>
            </Button>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant={"outline"} className={cn("w-full  justify-start text-left font-normal", !queryDate && "text-muted-foreground")}>
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
                disabled={getCalculatedMonth(queryDate,1) > getLastMonth(new Date())}
            > 
                <ChevronRight/>
            </Button>
        </div>
    )
}