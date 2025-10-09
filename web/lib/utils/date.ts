import { format, parseISO, startOfDay, endOfDay, addDays, subDays } from "date-fns";

/**
 * Formats a date for API calls (ISO 8601)
 */
export function formatDateForAPI(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx");
}

/**
 * Formats a date for display
 */
export function formatDateDisplay(date: Date | string, formatStr: string = "PPP"): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, formatStr);
}

/**
 * Gets the start of day for a date
 */
export function getStartOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return startOfDay(d);
}

/**
 * Gets the end of day for a date
 */
export function getEndOfDay(date: Date | string): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return endOfDay(d);
}

/**
 * Adds days to a date
 */
export function addDaysToDate(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return addDays(d, days);
}

/**
 * Subtracts days from a date
 */
export function subDaysFromDate(date: Date | string, days: number): Date {
  const d = typeof date === "string" ? parseISO(date) : date;
  return subDays(d, days);
}

/**
 * Gets the user's timezone
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Formats time in 12-hour format
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "h:mm a");
}

/**
 * Formats time in 24-hour format
 */
export function formatTime24(date: Date | string): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "HH:mm");
}
