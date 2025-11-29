import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const mapStatus = (statusIdx: number): string => {
  const statuses = ["Open", "In-Progress", "Resolved", "Closed"];
  return statuses[statusIdx] || "Open";
};