'use client'

import { fetchSetting } from "@/lib/actions";
import { Setting, SettingUpdateType } from "@/lib/definitions";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { updateSetting } from "@/lib/actions";
import { SettingContext } from "./settingContext";

export const SettingProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
    const { data:session } = useSession();
    const [setting, setSetting] = useState<Setting | undefined>();
    useEffect(()=>{
        (async function () {
            if(session){
                const setting = await fetchSetting(session?.user.id);
                if(setting) setSetting(setting);
            }
        })();
    }, [session])

    const updateUserSetting = async (setting: SettingUpdateType) => {
        if(session){
            const newSetting = await updateSetting(session.user.id, setting);
            newSetting && setSetting(newSetting);
        }
    }

    const updateDisplayCategories = async (categories:string) => {
        if(session){
            const newSetting = await updateSetting(session.user.id, {displayCategories:categories});
            newSetting && setSetting(newSetting);
        }
    }

    useEffect(() => {
        console.log(`!!!!!!!! setting changed!!! ${JSON.stringify(setting)}`);
        
    }, [setting])

    return (
        <SettingContext.Provider value={{setting, updateUserSetting, updateDisplayCategories}}>
            {children}
        </SettingContext.Provider>
    )
}