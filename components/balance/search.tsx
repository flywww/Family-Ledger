'use client'

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { getYearList, monthList } from "@/lib/data";

export default function Search(){
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const yearList = getYearList();
    const UTCDateString: string|null = searchParams.get('date') || new Date().toUTCString();
    const queryDate = new Date(UTCDateString);

    console.log('search component - queryDate: ', queryDate);
    console.log('search component - UTCDateString: ', UTCDateString);
    console.log('search component timezone:',Intl.DateTimeFormat().resolvedOptions().timeZone)

    const handleYearSearch = (value:string) => {
        const params = new URLSearchParams(searchParams);
        const newQueryDate = new Date(Number(value), queryDate.getMonth(), 1)
        params.set('date', newQueryDate.toUTCString())
        replace(`${pathname}?${params.toString()}`);   
    }

    const handleMonthSearch = (value:string) => {
        const params = new URLSearchParams(searchParams);
        const newQueryDate = new Date(queryDate.getFullYear(), Number(value)-1, 1)
        params.set('date', newQueryDate.toUTCString());
        replace(`${pathname}?${params.toString()}`);   
    }

    return(
        <div>
            <Select 
                name="year" 
                value={ queryDate.getFullYear().toString() } 
                onValueChange={ (value)=>{handleYearSearch(value)} }>
                <SelectTrigger>
                    <SelectValue/>
                </SelectTrigger>
                    <SelectContent>
                        {yearList.map( (year) => {
                        return (<SelectItem key={year} value={year}> {year} </SelectItem>)
                        })}
                    </SelectContent>
            </Select>

            <Select 
                name="month" 
                value={ monthList[queryDate.getMonth()] } 
                onValueChange={(value)=>{handleMonthSearch(value)}}>
                <SelectTrigger>
                    <SelectValue/>
                </SelectTrigger>
                    <SelectContent>
                        {monthList.map( (month) => {
                        return (<SelectItem key={month} value={month}> {month} </SelectItem>)
                        })}
                    </SelectContent>
            </Select>
        </div>
    )
}