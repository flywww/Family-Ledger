'use client'

import { fetchSetting } from "@/lib/actions";
import { Setting, SettingUpdateType } from "@/lib/definitions";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { updateSetting } from "@/lib/actions";

export function useSetting() {
    const { data:session } = useSession();
    const [setting, setSetting] = useState<Setting>();
    
    useEffect(()=>{
        (async function () {
            if(session){
                const setting = await fetchSetting(session?.user.id);
                if(setting) setSetting(setting);
            }
            console.log(`\n\n\nfetchSetting in useSetting\n\n\n`);
            
        })();
    }, [])

    const updateUserSetting = async (setting: SettingUpdateType) => {
        if(session){
            const newSetting = await updateSetting(session.user.id, setting);
            newSetting && setSetting(newSetting);
        }
    }

    return [setting, updateUserSetting];
}