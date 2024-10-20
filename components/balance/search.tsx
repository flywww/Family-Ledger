'use client'

import { useSearchParams, usePathname, useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { getYearList, monthList } from "@/lib/data";

export default function Search(){
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const yearList = getYearList();
    const currentYear = new Date().getFullYear().toString();
    const currentMonth = monthList[new Date().getMonth()].toString();

    console.log('search component timezone:',Intl.DateTimeFormat().resolvedOptions().timeZone)
    
    const handleYearSearch = (value:string) => {
        const params = new URLSearchParams(searchParams);
        params.set('year',value)
        if(!params.get('month')) params.set('month',monthList[new Date().getMonth()].toString());
        replace(`${pathname}?${params.toString()}`);   
    }

    const handleMonthSearch = (value:string) => {
        const params = new URLSearchParams(searchParams);
        params.set('month',value)
        if(!params.get('year')) params.set('year',new Date().getFullYear().toString());
        replace(`${pathname}?${params.toString()}`);   
    }

    return(
        <div>
            <Select name="year" value={searchParams.get('year')||currentYear} onValueChange={(value)=>{handleYearSearch(value)}}>
                <SelectTrigger>
                    <SelectValue/>
                </SelectTrigger>
                    <SelectContent>
                        {yearList.map( (year) => {
                        return (<SelectItem key={year} value={year}> {year} </SelectItem>)
                        })}
                    </SelectContent>
            </Select>

            <Select name="month" value={searchParams.get('month')||currentMonth } onValueChange={(value)=>{handleMonthSearch(value)}}>
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