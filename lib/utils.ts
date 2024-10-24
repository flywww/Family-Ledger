import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { currencyType } from "@/lib/definitions"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//Date
export const lastDateOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const firstDateOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() , 1);

//Currency
const exchangeRate = new Map([
  ['TWD', 32],
  ['USD', 1],
  ['EUR', 0.93]
])

export const convertCurrency = ( from:currencyType, to:currencyType, amount:number, date:Date ) => {
  //TODO: get rate with date
  //https://app.currencyapi.com/subscription
//https://app.exchangerate-api.com/dashboard/confirmed
  const fromRate = exchangeRate.get(from) ;
  const toRate = exchangeRate.get(to);
  let convertedResult = 0;
  
  if(fromRate !== undefined && toRate !== undefined){
    convertedResult = amount * toRate / fromRate;
  }else{
    convertedResult = -1;
  }
  return convertedResult;
}