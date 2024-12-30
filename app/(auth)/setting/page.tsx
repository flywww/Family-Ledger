'use client'

import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import ChangePasswordForm from "@/components/setting/change-password-form";
import { getConvertedCurrency } from "@/lib/actions";
import { Separator } from "@/components/ui/separator";

export default function Page() {
  const { data:session } = useSession();
  

  return (
      <div className="flex flex-col gap-4 justify-start items-center">
        <div className="flex flex-col gap-1 items-center">
          <h1 className="text-3xl max-w-40">{session?.user.account}</h1>
          <p className="text-sm text-slate-500">{session?.user.id}</p>
        </div>
        <ChangePasswordForm/>
        { session && session.user && session.user.id === 'cm4qh5eyz0000dh7ccntzdddz' &&
            
            <div className="flex flex-col gap-3 items-center">
            <Separator className="my-4 min-w-64"/>
            <p>Admin feature</p>
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
                const convertedCurrency = await getConvertedCurrency('JPY','TWD',100,new Date('2024-12-23 23:59:59'))
                console.log(`convertedCurrency: ${convertedCurrency}`)
            }}
            >
              Test button
            </Button>
          </div>
        }
      </div>
      
    );
  }