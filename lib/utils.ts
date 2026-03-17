import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { currencyType } from "@/lib/definitions"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//Date
export const lastDateOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const firstDateOfMonth = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth() , 1);

export const getLastMonth = (date: Date) => {
  return getCalculatedMonth(firstDateOfMonth(date), -1);
}

export const getCalculatedMonth = (date: Date, addMonth: number) => {
  const calculatedDate = new Date(date);
  const originalDate = calculatedDate.getDate();
  calculatedDate.setMonth(calculatedDate.getMonth() + addMonth );
  if(calculatedDate.getDate() !== originalDate){
    calculatedDate.setDate(0);
  }
  return calculatedDate;
}

export const getUTCDateString = (date: Date) => {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() +1).toString().padStart(2,'0');
  const day = date.getUTCDate().toString().padStart(2,'0');
  return `${year}-${month}-${day}`
}

export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Asia/Taipei';

export const getDatePartsInTimeZone = (date: Date, timeZone = APP_TIME_ZONE) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
  };
}

export const isSameMonth = (left: Date, right: Date) =>
  left.getUTCFullYear() === right.getUTCFullYear() &&
  left.getUTCMonth() === right.getUTCMonth();

//Timer
export function delay(ms: number){
  return new Promise( resolve => setTimeout(resolve, ms));
}

//Currency
const exchangeRate = new Map([
  ['TWD', 32],
  ['USD', 1],
  ['EUR', 0.93]
])

export const enUSNumberFormat = ( num: any ) => {
  return new Intl.NumberFormat('en-US').format(num);
}
