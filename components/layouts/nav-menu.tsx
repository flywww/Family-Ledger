'use client'

import { useTheme } from "next-themes";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuItem,
    
} from "@/components/ui/dropdown-menu"
import { signOut} from "next-auth/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useEffect, useState } from "react";
import { updateSetting } from "@/lib/actions";
import { currencyType } from "@/lib/definitions";
import { SettingContext } from "@/context/settingContext";

export default function NavMenu(){
    const { theme, setTheme } = useTheme();
    const [currency, setCurrency] = useState('USD');
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter()
    const settingContext = useContext(SettingContext);
    if(!settingContext){
        throw Error ("Setting must be used within a setting provider")
    }
    const { setting, updateUserSetting } = settingContext;         
    const router = useRouter();

    const updateCurrency = (value:string) => {
        updateUserSetting({displayCurrency:(value as currencyType)})
        setCurrency(value);
        const params = new URLSearchParams(searchParams);
        params.set('currency',value);
        replace(`${pathname}?${params.toString()}`)
    }

    useEffect(()=>{
        if(setting) setCurrency(setting.displayCurrency);
    },[setting])

    return(
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Menu</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Display</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={theme} onValueChange={setTheme}>
                                <DropdownMenuRadioItem value="light">Light</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="dark">Dark</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="system">System</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Currency</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                            <DropdownMenuRadioGroup value={currency} onValueChange={updateCurrency}>
                                <DropdownMenuRadioItem value="USD">USD</DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value="TWD">TWD</DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onClick={ () => router.push('/setting') }>
                    Setting
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={ () => signOut()}>
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}