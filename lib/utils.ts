import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { currencyType } from "@/lib/definitions"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

//Date
const parseTimeZoneOffsetMinutes = (value: string) => {
  const match = value.match(/(?:GMT|UTC)([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) {
    return 0;
  }

  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2]);
  const minutes = Number(match[3] ?? "0");
  return sign * (hours * 60 + minutes);
};

const getTimeZoneOffsetMinutes = (date: Date, timeZone = APP_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const offset = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+0";
  return parseTimeZoneOffsetMinutes(offset);
};

const createDateAtStartOfDayInTimeZone = (
  year: number,
  monthIndex: number,
  day: number,
  timeZone = APP_TIME_ZONE,
) => {
  let result = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0));
  for (let index = 0; index < 2; index += 1) {
    const offsetMinutes = getTimeZoneOffsetMinutes(result, timeZone);
    result = new Date(Date.UTC(year, monthIndex, day, 0, 0, 0) - offsetMinutes * 60_000);
  }
  return result;
};

const daysInMonth = (year: number, monthIndex: number) =>
  new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

export const lastDateOfMonth = (date: Date) => {
  const parts = getDatePartsInTimeZone(date);
  return createDateAtStartOfDayInTimeZone(
    parts.year,
    parts.month - 1,
    daysInMonth(parts.year, parts.month - 1),
  );
};

export const firstDateOfMonth = (date: Date) => {
  const parts = getDatePartsInTimeZone(date);
  return createDateAtStartOfDayInTimeZone(parts.year, parts.month - 1, 1);
};

export const getLastMonth = (date: Date) => {
  return getCalculatedMonth(firstDateOfMonth(date), -1);
}

export const getCalculatedMonth = (date: Date, addMonth: number) => {
  const parts = getDatePartsInTimeZone(date);
  const sourceMonthIndex = parts.month - 1;
  const rawMonthIndex = sourceMonthIndex + addMonth;
  const normalizedMonthIndex = ((rawMonthIndex % 12) + 12) % 12;
  const normalizedYear = parts.year + Math.floor(rawMonthIndex / 12);
  const day = Math.min(parts.day, daysInMonth(normalizedYear, normalizedMonthIndex));

  return createDateAtStartOfDayInTimeZone(normalizedYear, normalizedMonthIndex, day);
}

export const getUTCDateString = (date: Date) => {
  const year = date.getUTCFullYear().toString();
  const month = (date.getUTCMonth() +1).toString().padStart(2,'0');
  const day = date.getUTCDate().toString().padStart(2,'0');
  return `${year}-${month}-${day}`
}

export const APP_TIME_ZONE = process.env.APP_TIME_ZONE || 'Asia/Taipei';
export type MonthKey = `${number}-${string}`;

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

export const getMonthKey = (date: Date, timeZone = APP_TIME_ZONE): MonthKey => {
  const parts = getDatePartsInTimeZone(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}` as MonthKey;
}

export const isMonthKey = (value?: string | null): value is MonthKey =>
  typeof value === "string" && /^\d{4}-\d{2}$/.test(value);

export const monthKeyToDate = (monthKey: MonthKey, timeZone = APP_TIME_ZONE) => {
  const [yearString, monthString] = monthKey.split("-");
  const year = Number(yearString);
  const month = Number(monthString);

  return createDateAtStartOfDayInTimeZone(year, month - 1, 1, timeZone);
};

export const addMonthsToMonthKey = (monthKey: MonthKey, addMonth: number): MonthKey =>
  getMonthKey(getCalculatedMonth(monthKeyToDate(monthKey), addMonth));

export const resolveMonthKey = (params: {
  month?: string | null;
  date?: string | null;
  fallback: Date;
}) => {
  if (isMonthKey(params.month)) {
    return params.month;
  }

  if (params.date) {
    const parsedDate = new Date(params.date);
    if (!Number.isNaN(parsedDate.getTime())) {
      return getMonthKey(parsedDate);
    }
  }

  return getMonthKey(params.fallback);
};

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
