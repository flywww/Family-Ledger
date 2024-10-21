import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const lastDateOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() + 1, 0);

export const firstDateOfMonth = (date = new Date()) =>
  new Date(date.getFullYear(), date.getMonth() , 1);