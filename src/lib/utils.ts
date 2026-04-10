import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseOrderDate(date?: string | null, createdAt?: string | null) {
  if (createdAt) {
    const createdDate = new Date(createdAt);
    if (!Number.isNaN(createdDate.getTime())) {
      return createdDate;
    }
  }

  if (!date) {
    return null;
  }

  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.exec(date);
  if (dateOnlyMatch) {
    const [year, month, day] = date.split("-");
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
