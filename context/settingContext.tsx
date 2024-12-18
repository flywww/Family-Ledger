'use client'

import { createContext } from "react";
import { Setting, SettingUpdateType } from '../lib/definitions'

export interface SettingContextType {
    setting: Setting | undefined;
    updateUserSetting: (setting: SettingUpdateType) => void;
}

export const SettingContext = createContext<SettingContextType | undefined>(undefined)