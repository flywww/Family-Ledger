'use client'

import { fetchCurrencyExchangeRates, getConvertedCurrency } from "@/lib/actions";
import { Button } from "../ui/button";
import Link from "next/link";
import { Separator } from "../ui/separator";


export default function AdminActions (){
    return(
        <div className="flex flex-col gap-4 justify-start items-center">
            <Button className="min-w-64" onClick={()=>{
                fetch('/api/create-valueData', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'value' }) // Adjust payload as needed
                })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error(error));
            }}> Create valueData </Button>
            <Button className="min-w-64" onClick={()=>{
                fetch('/api/update-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'value' })
                })
                .then(response => response.json())
                .then(data => console.log(data))
                .catch(error => console.error(error))
                }}> Update Password </Button>
            
            <Button className="min-w-64" onClick={
                async ()=>{
                    const convertedCurrency = await getConvertedCurrency('JPY','TWD',100,new Date('2025-01-04 18:00:00'))
                    console.log(`convertedCurrency: ${convertedCurrency}`)
                }}
                >
                Test button
            </Button>

            <Button className="min-w-64" onClick={
                async ()=>{
                    const result = await fetchCurrencyExchangeRates(new Date('2025-01-04 00:00:00'))
                    console.log(`Currency Exchange rate: ${JSON.stringify(result)}`)
                }
                }>
                Currency API test
            </Button>
            <Separator />
            <Link href='https://app.currencyapi.com/dashboard' target="_blank" rel="noopener noreferrer">
                CURRENCYAPI API dashboard
            </Link>
            <Link href='https://pro.coinmarketcap.com/account' target="_blank" rel="noopener noreferrer">
                Coinmarketcap API dashboard
            </Link>
        </div>
    )
}